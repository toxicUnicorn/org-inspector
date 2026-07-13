// Called by ViewController.swift after it queries SFSafariExtensionManager for the extension's
// enabled state. `enabled` is a boolean, or undefined when the state can't be determined.
// eslint-disable-next-line no-unused-vars
function show(enabled) {
    if (typeof enabled === "boolean") {
        document.body.classList.toggle("state-on", enabled);
        document.body.classList.toggle("state-off", !enabled);
    } else {
        document.body.classList.remove("state-on");
        document.body.classList.remove("state-off");
    }
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage("open-preferences");
}

document.querySelector("button.open-preferences").addEventListener("click", openPreferences);
