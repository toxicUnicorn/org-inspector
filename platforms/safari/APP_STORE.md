# Mac App Store submission checklist — Org Inspector

Everything needed to fill in App Store Connect, plus the build/release commands. Fill the
bracketed placeholders once the Developer Program is active.

URLs below assume the fork is pushed to `github.com/toxicUnicorn/org-inspector`. If you name the repo
differently, update `mkdocs.yml` `site_url`, the links in `platforms/safari/app/Main.html`, and the
URLs in this file to match.

## Hosting the privacy policy (GitHub Pages)

App Store Connect requires a public Privacy Policy URL. This repo already builds one with MkDocs
(`docs/privacy.md` includes the root `PRIVACY.md`), and `.github/workflows/ci.yml` deploys it on a
push to `safari`. One-time setup:

1. Create the repo `org-inspector` under your account and push the `safari` branch:
   `git remote add origin https://github.com/toxicUnicorn/org-inspector.git && git push -u origin safari`
2. The `ci` workflow runs `mkdocs gh-deploy`, publishing to the `gh-pages` branch.
3. In the repo: Settings ▸ Pages ▸ Source = "Deploy from a branch", branch `gh-pages` / root
   (GitHub often enables this automatically after the first deploy).
4. The policy is then live at **https://toxicunicorn.github.io/org-inspector/privacy/**.

## Prerequisites (do once)

- Apple Developer Program active (membership shows **Active**, not Pending).
- In the Developer portal, register two App IDs:
  - `com.echekan.OrgInspector`
  - `com.echekan.OrgInspector.Extension`
- In App Store Connect, create a new **macOS app** record with bundle id `com.echekan.OrgInspector`.
- Replace `REPLACE_WITH_TEAM_ID` in `ExportOptions-appstore.plist` / `ExportOptions-developerid.plist`
  with your team id (`2GL7FWJDW5`), or rely on the value injected by `safari-convert.js`.

## Build & upload

```bash
export SAFARI_APP_NAME=OrgInspector
export SAFARI_BUNDLE_ID=com.echekan.OrgInspector
export SAFARI_TEAM_ID=2GL7FWJDW5
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer

# App Store: archive + export a signed .pkg into target/safari/export/
npm run safari-archive-appstore

# then upload (or drag the .pkg into Transporter.app):
xcrun altool --upload-app -f target/safari/export/OrgInspector.pkg -t macos \
  --apiKey <KEYID> --apiIssuer <ISSUER>
```

Developer ID (usable immediately, no App Review):

```bash
npm run safari-archive-developerid
# then notarise as printed by the script (notarytool + stapler)
```

`CURRENT_PROJECT_VERSION` defaults to a unix timestamp so each upload strictly increases. Override
with `SAFARI_BUILD_NUMBER` if you want sequential build numbers.

## App Store Connect metadata

| Field | Value |
| --- | --- |
| Name | **Org Inspector** (never lead with "Salesforce") |
| Subtitle | Data & metadata tools for Salesforce |
| Category | Developer Tools |
| Secondary category | (optional) Productivity |
| Age rating | 4+ |
| Price | Free (or as you choose) |
| Privacy Policy URL | https://toxicunicorn.github.io/org-inspector/privacy/ |
| Support URL | https://github.com/toxicUnicorn/org-inspector |
| Marketing URL | (optional) |
| Copyright | © 2023 Thomas Prouvot; fork modifications © 2026 |

### Description (opens with the disclaimer)

> Org Inspector is an independent tool and is not affiliated with, endorsed by, or sponsored by
> Salesforce, Inc. Salesforce is a trademark of Salesforce, Inc.
>
> Org Inspector adds a metadata layer on top of the standard Salesforce UI to speed up
> configuration, development, and integration work. Inspect and edit any record's fields, run and
> export SOQL queries, import and update records, explore the REST and Tooling APIs, browse org
> limits and metadata — all reusing your existing Salesforce login.
>
> Org Inspector talks only to your own Salesforce org. It sends nothing to the developer or any
> third party: no analytics, no tracking, no telemetry.

### Keywords

`salesforce, soql, admin, developer, metadata, data export, apex, api, crm, inspector`

## App Privacy (nutrition labels)

- **Data collection:** select **"Data Not Collected."**
- Do **not** check any box under **"Data Used to Track You."**
- Rationale (for the App Review notes, if asked): the extension reads the Salesforce session
  cookie and org data only to call the user's own org on their behalf; nothing is transmitted to
  the developer or a third party, and there are no third-party SDKs.

## Export compliance

- `ITSAppUsesNonExemptEncryption` is set to **NO** in the build (Info.plist), so no encryption
  questionnaire appears. The app uses only the OS TLS stack and server-side PKCE; it bundles no
  cryptography.

## App Review Information → Sign-In Information (REQUIRED)

The extension does nothing until you are on a Salesforce page with a live session, so the reviewer
**must** be given a working org, or it is an automatic 2.1 rejection.

- Provide a free **Developer Edition** org (https://developer.salesforce.com/signup) login:
  - Username: `[reviewer-org-username]`
  - Password: `[reviewer-org-password]`

### Stop Salesforce from emailing the reviewer a verification code

By default Salesforce challenges every login from an unrecognised device or IP and mails a code to
the org's own address. App Review logs in from Apple's network, so **they get the challenge and the
code goes to you** — they cannot complete sign-in, and the submission is rejected under 2.1. Do all
of the following in the demo org before submitting.

1. **Trusted IP Ranges** (this is the setting that actually removes the emailed code):
   Setup ▸ quick find `Network Access` ▸ Trusted IP Ranges ▸ New →
   Start `0.0.0.0`, End `255.255.255.255`. Logins from a trusted range skip device activation.
2. **Profile login IP ranges**, as a second layer: Setup ▸ Users ▸ Profiles ▸ (reviewer's profile) ▸
   Login IP Ranges ▸ New → the same `0.0.0.0`–`255.255.255.255`.
3. **Waive MFA** for that user: Setup ▸ Permission Sets ▸ New, enable the system permission
   `Waive Multi-Factor Authentication for Exempt Users` (search "Waive Multi-Factor"), then assign
   the permission set to the reviewer's user. Salesforce enforces MFA on direct logins otherwise.
4. **Password must not expire**: Setup ▸ Security ▸ Password Policies → *User passwords expire in* =
   **Never expires**. Review can happen weeks later, and again for each update.
5. **No login-hours restriction** on the profile — Apple reviews across time zones.
6. Optional but helpful: Setup ▸ Session Settings → untick *Lock sessions to the IP address from
   which they originated*, so the reviewer's session survives a network change.

Then **verify it works**: open a private window on a VPN in another country and sign in with the
reviewer credentials. If no code is requested, App Review will get through.

Only ever do this in a throwaway demo org that holds no real data — it deliberately disables the
org's login protections. Also sign in to the org every couple of months so Salesforce does not
deactivate it for inactivity, and keep the credentials working for future updates.
- Review notes (paste this):

  > 1. Sign in to Safari, then open Safari ▸ Settings ▸ Extensions and enable "Org Inspector".
  > 2. Click "Edit Websites" (or the extension's permissions) and set access to "Allow on Every
  >    Website".
  > 3. Go to https://login.salesforce.com and sign in with the credentials above.
  > 4. On any record page, click the Org Inspector arrow on the right edge of the page to open the
  >    popup. Try "Show All Data" and "Data Export".
  >
  > Org Inspector reuses the logged-in Salesforce session cookie to call Salesforce's official APIs
  > on the user's behalf. No data is sent anywhere except the user's own Salesforce org.

## Screenshots

macOS screenshots at an accepted size (**1280×800, 1440×900, 2560×1600, or 2880×1800**). 1–5 images:
the popup open on a record, Data Export with results, the metadata/field view, the container app
window. Capture at one of those exact resolutions or App Store Connect rejects the upload.

## Icon

Provided by the build: `platforms/safari/app/Assets.xcassets/AppIcon.appiconset` (16→1024, rendered
from the vector). App Store Connect pulls the 1024 marketing icon from the uploaded build.
