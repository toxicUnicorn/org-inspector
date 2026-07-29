# Safari port — handoff notes

Transfer memory for moving this project to another Mac. This is a fork of
[Salesforce Inspector Reloaded](https://github.com/tprouvot/Salesforce-Inspector-reloaded) (MIT)
turned into a **Safari Web Extension** named **Org Inspector**, being prepared for the Mac App Store.

Working branch: **`safari`** (based on upstream `releaseCandidate` = v2.1.0; upstream `main` is stale).
Everything is committed — see `git log`. The extension works end-to-end on Safari 26 against a real org.

## Set up on the new Mac

1. Install **full Xcode** (from the App Store — the Command Line Tools alone lack the converter).
2. `npm install` (node_modules is not in the zip).
3. In Xcode ▸ Settings ▸ Accounts, sign in with the Apple ID that owns the Developer Program
   membership, so the signing certificate is available. The **Team ID is the same on every Mac** —
   it belongs to the account, not the machine. Only the Apple Development certificate is per-Mac,
   and Xcode issues it for you on first build.
4. Point the toolchain at Xcode:
   `export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`

## Build (local, for sideloading in Safari)

```bash
export SAFARI_APP_NAME=OrgInspector
export SAFARI_BUNDLE_ID=com.echekan.OrgInspector
export SAFARI_TEAM_ID=2GL7FWJDW5
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
npm run safari-xcode
cp -R target/safari/build/OrgInspector.app /Applications/ && open /Applications/OrgInspector.app
```

Then in Safari: Settings ▸ Extensions ▸ enable **Org Inspector** ▸ grant "Allow on Every Website".
Build with `SAFARI_TEAM_ID` set, or the app is only ad-hoc signed and Safari hides the extension
until you turn on Develop ▸ Allow Unsigned Extensions.

## Key facts

- **Repo:** https://github.com/toxicUnicorn/org-inspector, default branch `safari`. `upstream` still
  points at tprouvot/Salesforce-Inspector-reloaded. A fresh clone may be shallow — if a push fails
  with "index-pack failed", run `git fetch --unshallow upstream` first.
- **Bundle id:** `com.echekan.OrgInspector` (reverse-DNS; does NOT need to match the GitHub handle).
- **Team ID `2GL7FWJDW5`** — the paid Individual team, the same on every Mac.
- The demo-org login handed to App Review lives in `platforms/safari/app-review.local.md`, which is
  git-ignored. Never put those credentials in a tracked file.
- The Xcode project is disposable and regenerated under `target/` (gitignored) each build. All
  committed customisation lives in **`platforms/safari/`** (container-app UI, entitlements, icons,
  ExportOptions) and is overlaid by `scripts/safari-convert.js`.

## What is done

Code (branch `safari`, commits `d442047`…`d218464`):
- Cookie session works on Safari (enumerate cookie stores; `storeId` required since Safari 18).
- All REST/SOAP calls proxied through the background `apiFetch` handler to defeat Safari's
  CORS-on-extension-pages (this was the make-or-break). See `background.js` + `backgroundFetch` in
  `inspector.js`.
- Security: `sfHost` validated against a Salesforce host allowlist before it can drive a navigation;
  `apiFetch` restricted to extension-origin senders + allowlisted hosts; no ambient cookies.
- Real container app UI (App Store guideline 4.2), full icon set from the vector, sandbox
  entitlements, static Info.plist keys, LICENSE + THIRD_PARTY_NOTICES shipped in the build.
- OAuth "Generate Access Token" hidden on Safari (CORS-blocked there; cookie auth is the default).
- Privacy policy (`PRIVACY.md`) + App Store submission guide (`platforms/safari/APP_STORE.md`).

## What is left (in order)

Done since this file was written: the fork is pushed, GitHub Pages serves the docs and privacy
policy, the session/record flow is smoke-tested against a real org, and the docs and in-app links
are rebranded off upstream.

1. Register the two App IDs (`com.echekan.OrgInspector` and `…​.Extension`) in the Developer portal
   and create the macOS record in App Store Connect.
2. Fill App Review Information from `platforms/safari/app-review.local.md` (git-ignored).
3. `npm run safari-archive-appstore` with the env vars above, then upload the `.pkg` via Transporter.

Full checklist, including the demo-org settings that stop Salesforce emailing the reviewer a
verification code, is in `platforms/safari/APP_STORE.md`.
   Full field-by-field guide (metadata, nutrition labels = "Data Not Collected", reviewer sign-in) is
   in `platforms/safari/APP_STORE.md`.
4. Provide a free **Developer Edition** org login in App Store Connect ▸ App Review Information, or
   the session-gated extension is an automatic 2.1 rejection.

## Not yet tested on Safari

Event Monitor (CometD), Data Import, Download Metadata, Flow Scanner. REST and SOAP both go through
the proxy so they should work, but haven't been exercised.

## The three discoveries that made the port possible

- Safari 18+ CAN read the HttpOnly `sid` cookie, but `cookies.getAll` needs an explicit `storeId`
  from `getAllCookieStores()` (`sender.tab.cookieStoreId` is undefined on Safari).
- Safari applies CORS to extension *pages*; host permissions exempt only the background worker —
  hence the `apiFetch` proxy. (This is why Data Export worked but the popup didn't: one is a tab,
  the other an iframe in the page.)
- A Safari extension can only reach the browser from inside a signed container app.
