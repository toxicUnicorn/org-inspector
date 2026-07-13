# Mac App Store submission checklist — Org Inspector

Everything needed to fill in App Store Connect, plus the build/release commands. Fill the
bracketed placeholders once the Developer Program is active.

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
| Privacy Policy URL | https://echekan.github.io/org-inspector/privacy/ |
| Support URL | https://github.com/echekan/org-inspector |
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
