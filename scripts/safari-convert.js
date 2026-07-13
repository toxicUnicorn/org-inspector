/* eslint-env node */
// Wraps the built Safari extension (target/safari/dist) into an Xcode container app and builds
// it. Safari has no "load unpacked" — an extension only reaches the browser from inside a
// signed container app.
//
// The Xcode project itself is disposable and regenerated under target/ (gitignored) on every
// run. Everything that must be customised and version-controlled lives in platforms/safari/ and
// is OVERLAID onto the generated project here: the container-app UI (App Store guideline 4.2
// wants real content, not the converter's on/off stub), the app icons, the sandbox entitlements,
// and the static Info.plist keys. That keeps the project reproducible while nothing hand-authored
// is ever wiped.
//
// Modes (first CLI arg):
//   build              Debug build for local sideloading (default). See npm run safari-xcode.
//   archive-appstore   Release archive + export a .pkg for the Mac App Store.
//   archive-developerid  Release archive + export a notarisable Developer ID .app.
//
// Prerequisites: full Xcode (the Command Line Tools do not ship the converter). Signing modes
// need SAFARI_TEAM_ID; the archive modes need the paid Apple Developer Program.

(function() {
  "use strict";

  const fs = require("fs-extra");
  const {execFileSync} = require("child_process");
  const path = require("path");

  const MODE = process.argv[2] || "build";

  // The converter names the app bundle from APP_NAME and the extension "<bundle id>.Extension".
  // If APP_NAME and the last bundle-id component differ (even in case), Xcode rejects the build
  // because the embedded binary's identifier is not prefixed by its parent's — so keep them equal.
  const APP_NAME = process.env.SAFARI_APP_NAME || "OrgInspector";
  const BUNDLE_ID = process.env.SAFARI_BUNDLE_ID || `com.example.${APP_NAME}`;
  // The Xcode target cannot contain a space, so the user-visible name comes from CFBundleDisplayName.
  const DISPLAY_NAME = process.env.SAFARI_DISPLAY_NAME || "Org Inspector";
  const TEAM_ID = process.env.SAFARI_TEAM_ID;
  // CFBundleVersion must strictly increase per App Store upload; default to a monotonic timestamp.
  const BUILD_NUMBER = process.env.SAFARI_BUILD_NUMBER || String(Math.floor(Date.now() / 1000));
  const DEPLOYMENT_TARGET = process.env.SAFARI_DEPLOYMENT_TARGET || "13.0";

  const EXTENSION_DIR = "target/safari/dist";
  const PROJECT_DIR = "target/safari/xcode";
  const BUILD_DIR = path.resolve("target/safari/build");
  const ARCHIVE_PATH = path.resolve("target/safari/OrgInspector.xcarchive");
  const EXPORT_DIR = path.resolve("target/safari/export");
  const OVERLAY = "platforms/safari";
  const projectRoot = path.join(PROJECT_DIR, APP_NAME);
  const xcodeproj = path.join(projectRoot, `${APP_NAME}.xcodeproj`);
  const pbxproj = path.join(xcodeproj, "project.pbxproj");

  const developerDir = process.env.DEVELOPER_DIR || "/Applications/Xcode.app/Contents/Developer";
  const env = {...process.env, DEVELOPER_DIR: developerDir};
  const run = (cmd, args) => execFileSync(cmd, args, {stdio: "inherit", env});

  const version = JSON.parse(fs.readFileSync("addon/manifest-safari.json", "utf8")).version;

  if (!fs.existsSync(EXTENSION_DIR)) {
    console.error(`Missing ${EXTENSION_DIR}. Run "npm run safari-release-build" first.`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(developerDir, "usr/bin/safari-web-extension-converter"))) {
    console.error(`safari-web-extension-converter not found under ${developerDir}. Install the full Xcode.`);
    process.exit(1);
  }
  if (MODE.startsWith("archive") && !TEAM_ID) {
    console.error("Archiving needs SAFARI_TEAM_ID (and the paid Apple Developer Program).");
    process.exit(1);
  }

  // 1. Generate the disposable Xcode project from the built extension.
  fs.emptyDirSync(PROJECT_DIR);
  run("xcrun", ["safari-web-extension-converter", EXTENSION_DIR,
    "--macos-only", "--no-open", "--no-prompt", "--force", "--copy-resources",
    "--project-location", PROJECT_DIR,
    "--app-name", APP_NAME,
    "--bundle-identifier", BUNDLE_ID]);

  // 2. Overlay the committed container-app UI over the converter's stub (same filenames, so no
  //    project change needed). The converter keeps Main.html localised under Base.lproj and its
  //    sibling assets one level up in Resources; match that. {{VERSION}} is stamped from the
  //    manifest version.
  const appResources = path.join(projectRoot, APP_NAME, "Resources");
  const overlayTargets = {
    "Main.html": path.join(appResources, "Base.lproj/Main.html"),
    "Style.css": path.join(appResources, "Style.css"),
    "Script.js": path.join(appResources, "Script.js"),
  };
  for (const [file, dest] of Object.entries(overlayTargets)) {
    const content = fs.readFileSync(path.join(OVERLAY, "app", file), "utf8").replace(/\{\{VERSION\}\}/g, version);
    fs.writeFileSync(dest, content);
  }
  // A crisp hero image for the container window.
  fs.copySync("addon/icon512.png", path.join(appResources, "Icon.png"));

  // 3. Overlay the real AppIcon set (the converter's is an upscale of the 128px icon).
  const overlayIconset = path.join(OVERLAY, "app/Assets.xcassets/AppIcon.appiconset");
  const projectIconset = path.join(projectRoot, APP_NAME, "Assets.xcassets/AppIcon.appiconset");
  if (fs.existsSync(overlayIconset)) {
    fs.emptyDirSync(projectIconset);
    fs.copySync(overlayIconset, projectIconset);
  }

  // 4. Copy the sandbox entitlements into each target (a Mac App Store app must be sandboxed).
  const appEntitlements = path.join(projectRoot, APP_NAME, "OrgInspector.entitlements");
  const extEntitlements = path.join(projectRoot, `${APP_NAME} Extension`, "OrgInspector_Extension.entitlements");
  fs.copySync(path.join(OVERLAY, "entitlements/OrgInspector.entitlements"), appEntitlements);
  fs.copySync(path.join(OVERLAY, "entitlements/OrgInspector_Extension.entitlements"), extEntitlements);

  // 5. Patch the pbxproj: normalise the bundle identifiers (the converter can disagree with
  //    itself on case) and wire CODE_SIGN_ENTITLEMENTS per target. Build settings passed on the
  //    xcodebuild CLI apply to every target at once, so entitlements — which differ between the
  //    app and the appex — have to live in the project.
  const patched = fs.readFileSync(pbxproj, "utf8").replace(
    /PRODUCT_BUNDLE_IDENTIFIER = ([\w.]+?)(\.Extension)?;/g,
    (match, id, extension) => {
      const entitlements = extension
        ? `${APP_NAME} Extension/OrgInspector_Extension.entitlements`
        : `${APP_NAME}/OrgInspector.entitlements`;
      return `PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE_ID}${extension || ""};\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = "${entitlements}";`;
    }
  );
  fs.writeFileSync(pbxproj, patched);

  // Static settings shared by every build. INFOPLIST_KEY_* keys land in the generated Info.plist.
  const commonSettings = [
    `MARKETING_VERSION=${version}`,
    `CURRENT_PROJECT_VERSION=${BUILD_NUMBER}`,
    `MACOSX_DEPLOYMENT_TARGET=${DEPLOYMENT_TARGET}`,
    `INFOPLIST_KEY_CFBundleDisplayName=${DISPLAY_NAME}`,
    "INFOPLIST_KEY_ITSAppUsesNonExemptEncryption=NO",
    "INFOPLIST_KEY_LSApplicationCategoryType=public.app-category.developer-tools",
    `INFOPLIST_KEY_NSHumanReadableCopyright=Copyright © 2023 Thomas Prouvot. Fork modifications © 2026. MIT License.`,
  ];

  if (MODE === "build") {
    // Local Debug build for sideloading. With SAFARI_TEAM_ID it is signed with your Apple
    // Development cert (Safari keeps it listed across restarts; a free profile expires in 7 days).
    // Without a team it falls back to ad-hoc (only visible while "Allow Unsigned Extensions" is on).
    const signing = TEAM_ID
      ? ["-allowProvisioningUpdates", "CODE_SIGN_STYLE=Automatic", `DEVELOPMENT_TEAM=${TEAM_ID}`]
      : ["CODE_SIGN_IDENTITY=-", "CODE_SIGN_STYLE=Manual", "DEVELOPMENT_TEAM=", "PROVISIONING_PROFILE_SPECIFIER="];

    fs.emptyDirSync(BUILD_DIR);
    run("xcodebuild", ["-project", xcodeproj, "-scheme", APP_NAME, "-configuration", "Debug",
      ...signing, ...commonSettings,
      `CONFIGURATION_BUILD_DIR=${BUILD_DIR}`, "build"]);

    // Launch Services registers every app bundle it sees; unregister this copy so Safari does not
    // list the extension twice (once from here, once from /Applications).
    const lsregister = "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister";
    try {
      execFileSync(lsregister, ["-u", path.join(BUILD_DIR, `${APP_NAME}.app`)], {stdio: "ignore"});
    } catch {
      // Not fatal: at worst the extension is listed twice until the copy is removed.
    }

    console.log(`\nBuilt ${BUILD_DIR}/${APP_NAME}.app`);
    console.log(`Install it:  cp -R "${BUILD_DIR}/${APP_NAME}.app" /Applications/ && open "/Applications/${APP_NAME}.app"`);
    return;
  }

  // Archive + export for distribution.
  const exportPlistName = MODE === "archive-appstore" ? "ExportOptions-appstore.plist" : "ExportOptions-developerid.plist";
  const exportPlistSrc = path.join(OVERLAY, exportPlistName);
  // Substitute the real team id into a temporary copy of the export options.
  const exportPlist = path.join(EXPORT_DIR, exportPlistName);
  fs.emptyDirSync(EXPORT_DIR);
  fs.writeFileSync(exportPlist,
    fs.readFileSync(exportPlistSrc, "utf8").replace("REPLACE_WITH_TEAM_ID", TEAM_ID));

  run("xcodebuild", ["-project", xcodeproj, "-scheme", APP_NAME, "-configuration", "Release",
    "-archivePath", ARCHIVE_PATH, "-allowProvisioningUpdates",
    "CODE_SIGN_STYLE=Automatic", `DEVELOPMENT_TEAM=${TEAM_ID}`, ...commonSettings,
    "archive"]);

  run("xcodebuild", ["-exportArchive", "-archivePath", ARCHIVE_PATH,
    "-exportOptionsPlist", exportPlist, "-exportPath", EXPORT_DIR,
    "-allowProvisioningUpdates"]);

  console.log(`\nExported to ${EXPORT_DIR}`);
  if (MODE === "archive-appstore") {
    console.log("Upload the .pkg with Transporter.app, or:");
    console.log(`  xcrun altool --upload-app -f "${EXPORT_DIR}/${APP_NAME}.pkg" -t macos --apiKey <KEYID> --apiIssuer <ISSUER>`);
  } else {
    console.log("Notarise the .app:");
    console.log(`  ditto -c -k --keepParent "${EXPORT_DIR}/${APP_NAME}.app" target/safari/OrgInspector.zip`);
    console.log(`  xcrun notarytool submit target/safari/OrgInspector.zip --apple-id <APPLE_ID> --team-id ${TEAM_ID} --password <APP_SPECIFIC_PW> --wait`);
    console.log(`  xcrun stapler staple "${EXPORT_DIR}/${APP_NAME}.app"`);
  }
})();
