/* eslint-env node */
// Wraps the built Safari extension (target/safari/dist) into an Xcode project and builds
// a runnable .app. Safari has no "load unpacked" — an extension can only reach the browser
// from inside a signed container app.
//
// Prerequisites: full Xcode (the Command Line Tools do not ship the converter).
//
//   npm run safari-xcode
//
// Then: open the app once, and in Safari enable
//   Settings > Advanced > Show features for web developers
//   Develop > Allow Unsigned Extensions   (resets every time Safari quits)
//   Settings > Extensions > enable, then grant "Always Allow on Every Website"

(function() {
  "use strict";

  const fs = require("fs-extra");
  const {execFileSync} = require("child_process");
  const path = require("path");

  // The converter names the app bundle "<bundle id parent>.<app name>" but names the
  // extension "<bundle id>.Extension". If the app name and the last bundle-id component
  // differ (including in case), Xcode rejects the build because the embedded binary's
  // identifier is not prefixed by its parent's. Keeping them identical avoids that.
  const APP_NAME = process.env.SAFARI_APP_NAME || "OrgInspector";
  const BUNDLE_ID = process.env.SAFARI_BUNDLE_ID || `com.example.${APP_NAME}`;
  const EXTENSION_DIR = "target/safari/dist";
  const PROJECT_DIR = "target/safari/xcode";
  const BUILD_DIR = path.resolve("target/safari/build");

  const developerDir = process.env.DEVELOPER_DIR || "/Applications/Xcode.app/Contents/Developer";
  const env = {...process.env, DEVELOPER_DIR: developerDir};
  const run = (cmd, args) => execFileSync(cmd, args, {stdio: "inherit", env});

  if (!fs.existsSync(EXTENSION_DIR)) {
    console.error(`Missing ${EXTENSION_DIR}. Run "npm run safari-release-build" first.`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(developerDir, "usr/bin/safari-web-extension-converter"))) {
    console.error(`safari-web-extension-converter not found under ${developerDir}.`);
    console.error("Install the full Xcode (not just the Command Line Tools).");
    process.exit(1);
  }

  fs.emptyDirSync(PROJECT_DIR);

  run("xcrun", ["safari-web-extension-converter", EXTENSION_DIR,
    "--macos-only", "--no-open", "--no-prompt", "--force", "--copy-resources",
    "--project-location", PROJECT_DIR,
    "--app-name", APP_NAME,
    "--bundle-identifier", BUNDLE_ID]);

  // Belt and braces: repair the identifiers in case the converter still disagrees with itself.
  const pbxproj = path.join(PROJECT_DIR, APP_NAME, `${APP_NAME}.xcodeproj/project.pbxproj`);
  const patched = fs.readFileSync(pbxproj, "utf8").replace(
    /PRODUCT_BUNDLE_IDENTIFIER = ([\w.]+?)(\.Extension)?;/g,
    (match, id, extension) => `PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE_ID}${extension || ""};`
  );
  fs.writeFileSync(pbxproj, patched);

  fs.emptyDirSync(BUILD_DIR);

  // Ad-hoc signing ("-") is enough to run locally with "Allow Unsigned Extensions".
  // Distributing to anyone else needs a real Developer ID and the paid Apple program.
  run("xcodebuild", ["-project", path.join(PROJECT_DIR, APP_NAME, `${APP_NAME}.xcodeproj`),
    "-scheme", APP_NAME, "-configuration", "Debug",
    "CODE_SIGN_IDENTITY=-", "CODE_SIGN_STYLE=Manual",
    "DEVELOPMENT_TEAM=", "PROVISIONING_PROFILE_SPECIFIER=",
    `CONFIGURATION_BUILD_DIR=${BUILD_DIR}`, "build"]);

  console.log(`\nBuilt ${BUILD_DIR}/${APP_NAME}.app`);
  console.log(`Install it with:  cp -R "${BUILD_DIR}/${APP_NAME}.app" /Applications/ && open "/Applications/${APP_NAME}.app"`);
})();
