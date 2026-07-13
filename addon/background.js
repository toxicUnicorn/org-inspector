
const isSafari = navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome");

let sfHost;

// The service worker is terminated when idle, which drops sfHost. Safari does this
// aggressively, so mirror it into session storage instead of relying on the global.
async function setSfHost(host) {
  sfHost = host;
  try {
    await chrome.storage.session?.set({sfHost: host});
  } catch (e) {
    console.error("Could not persist sfHost:", e);
  }
}

async function getSfHost() {
  if (sfHost) {
    return sfHost;
  }
  try {
    ({sfHost} = await chrome.storage.session?.get("sfHost") ?? {});
  } catch (e) {
    console.error("Could not read sfHost:", e);
  }
  return sfHost;
}

// Safari has no container tabs, so sender.tab.cookieStoreId is undefined there, and since
// Safari 18 the cookies API returns nothing unless an explicit storeId is passed. Enumerate
// the stores instead. Chrome/Firefox keep their existing behaviour: an undefined storeId
// selects the default store according to incognito split mode.
async function getCookieStoreIds(sender) {
  if (sender?.tab?.cookieStoreId) {
    return [sender.tab.cookieStoreId];
  }
  if (!isSafari) {
    return [undefined];
  }
  try {
    const stores = await chrome.cookies.getAllCookieStores();
    return stores.length ? stores.map(store => store.id) : [undefined];
  } catch (e) {
    console.error("Could not enumerate cookie stores:", e);
    return [undefined];
  }
}

async function getCookie(details, storeIds) {
  for (const storeId of storeIds) {
    const cookie = await chrome.cookies.get(storeId === undefined ? details : {...details, storeId});
    if (cookie) {
      return cookie;
    }
  }
  return null;
}

async function getAllCookies(details, storeIds) {
  let all = [];
  for (const storeId of storeIds) {
    all = all.concat(await chrome.cookies.getAll(storeId === undefined ? details : {...details, storeId}));
  }
  return all;
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  // btoa takes a binary string, and spreading a multi-megabyte array blows the argument
  // limit, so build it in chunks.
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Perform cookie operations in the background page, because not all foreground pages have access to the cookie API.
  if (request.message == "getSfHost") {
    const currentDomain = new URL(request.url).hostname;
    // When on a *.visual.force.com page, the session in the cookie does not have API access,
    // so we read the corresponding session from *.salesforce.com page.
    // The first part of the session cookie is the OrgID,
    // which we use as key to support being logged in to multiple orgs at once.
    // http://salesforce.stackexchange.com/questions/23277/different-session-ids-in-different-contexts
    // There is no straight forward way to unambiguously understand if the user authenticated against salesforce.com or cloudforce.com
    // (and thereby the domain of the relevant cookie) cookie domains are therefore tried in sequence.
    (async () => {
      const storeIds = await getCookieStoreIds(sender);
      const cookie = await getCookie({url: request.url, name: "sid"}, storeIds);
      if (!cookie || currentDomain.endsWith(".mcas.ms")) { //Domain used by Microsoft Defender for Cloud Apps, where sid exists but cannot be read
        sendResponse(currentDomain);
        return;
      }
      const [orgId] = cookie.value.split("!");
      const orderedDomains = ["salesforce.com", "cloudforce.com", "salesforce.mil", "cloudforce.mil", "sfcrmproducts.cn", "force.com"];

      for (const domain of orderedDomains) {
        const cookies = await getAllCookies({name: "sid", domain, secure: true}, storeIds);
        const sessionCookie = cookies.find(c => c.value.startsWith(orgId + "!") && c.domain != "help.salesforce.com");
        if (sessionCookie) {
          sendResponse(sessionCookie.domain);
          return;
        }
      }
      sendResponse(currentDomain);
    })();
    return true; // Tell Chrome that we want to call sendResponse asynchronously.
  }
  if (request.message == "getSession") {
    (async () => {
      await setSfHost(request.sfHost);
      const storeIds = await getCookieStoreIds(sender);
      const sessionCookie = await getCookie({url: "https://" + request.sfHost, name: "sid"}, storeIds);
      if (!sessionCookie) {
        sendResponse(null);
        return;
      }
      sendResponse({key: sessionCookie.value, hostname: sessionCookie.domain});
    })();
    return true; // Tell Chrome that we want to call sendResponse asynchronously.
  } else if (request.message == "apiFetch") {
    // Safari enforces CORS on requests made from extension pages, and Salesforce does not
    // send Access-Control-Allow-Origin for safari-web-extension:// origins, so every API call
    // from the popup is blocked. The service worker's host permissions are not subject to
    // CORS, so Safari routes its API traffic through here. See sfConn.rest in inspector.js.
    (async () => {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
        const buffer = await response.arrayBuffer();
        sendResponse({
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          // Messages are JSON-serialised, so binary bodies have to travel as base64.
          body: request.binary ? toBase64(buffer) : new TextDecoder().decode(buffer),
          binary: !!request.binary,
        });
      } catch (e) {
        // status 0 is what XMLHttpRequest reports for a failed request, and the callers
        // already treat it as "network error, offline or timeout".
        sendResponse({status: 0, statusText: "", headers: {}, body: "", error: e.message});
      }
    })();
    return true;
  } else if (request.message == "createWindow") {
    const brow = typeof browser === "undefined" ? chrome : browser;
    brow.windows.create({
      url: request.url,
      incognito: request.incognito ?? false
    });
  } else if (request.message == "reloadPage") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.reload(tabs[0].id);
    });
  }
  return false;
});
chrome.action.onClicked.addListener(async () => {
  chrome.runtime.sendMessage({
    msg: "shortcut_pressed", sfHost: await getSfHost(), command: "open-popup"
  });
});
chrome.commands?.onCommand.addListener(async (command) => {
  const host = await getSfHost();
  if (command.startsWith("link-")){
    let link;
    switch (command){
      case "link-setup":
        link = "/lightning/setup/SetupOneHome/home";
        break;
      case "link-home":
        link = "/";
        break;
      case "link-dev":
        link = "/_ui/common/apex/debug/ApexCSIPage";
        break;
    }
    chrome.tabs.create({
      url: `https://${host}${link}`
    });

  } else if (command.startsWith("open-")){
    chrome.runtime.sendMessage({
      msg: "shortcut_pressed", command, sfHost: host
    });
  } else {
    // getURL resolves to the right scheme per browser: chrome-, moz- or safari-web-extension://
    chrome.tabs.create({
      url: chrome.runtime.getURL(`${command}.html?host=${host}`)
    });
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: "https://tprouvot.github.io/Salesforce-Inspector-reloaded/welcome/"
    });
  } else if (details.reason === "update" && details.previousVersion?.startsWith("2.0")) {
    //TODO delete clearSobjectsListCache after 2.0.1 release, only for upgrade from 2.0.0 to 2.0.1
    await clearSobjectsListCache();
  }
});

async function clearSobjectsListCache() {
  try {
    const storage = (typeof chrome !== "undefined" && chrome.storage) ? chrome.storage : browser.storage;
    if (!storage?.local) return;
    const allData = await storage.local.get(null);
    const keysToRemove = Object.keys(allData || {}).filter(key =>
      key === "cache_sobjectsList"
    );
    if (keysToRemove.length > 0) {
      await storage.local.remove(keysToRemove);
    }
  } catch (e) {
    console.error("Error clearing sobjectsList cache on update:", e);
  }
}
// Safari implements setUninstallURL as a no-op, and older builds omit it entirely.
chrome.runtime.setUninstallURL?.("https://forms.gle/y7LbTNsFqEqSrtyc6");
