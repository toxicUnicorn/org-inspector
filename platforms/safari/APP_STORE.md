# Mac App Store submission checklist — Org Inspector

Everything needed to fill in App Store Connect, plus the build/release commands. Fill the
bracketed placeholders once the Developer Program is active.

URLs below assume the fork is pushed to `github.com/toxicUnicorn/org-inspector`. If you name the repo
differently, update `mkdocs.yml` `site_url`, the links in `platforms/safari/app/Main.html`, and the
URLs in this file to match.

## Hosting the privacy policy (GitHub Pages)

**Done — the policy is already live at https://toxicunicorn.github.io/org-inspector/privacy/.**

`.github/workflows/deploy-docs.yml` builds the MkDocs site (`docs/privacy.md` includes the root
`PRIVACY.md`) and publishes it straight to Pages on every push to `safari` that touches the docs.
Pages is configured with `build_type=workflow`, so there is no `gh-pages` branch to point at.

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
| Support URL | https://toxicunicorn.github.io/org-inspector/support/ |
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

## Rejection history — read before resubmitting

**2026-08-05, build 2.1.0 (1785330719), submission `108484d6-da31-4565-a635-800bb265fbf2`:**

- **Guideline 1.5 — Support URL.** A GitHub repository URL is *not* accepted as a support page.
  Apple wants "a functional webpage with support information" — a contact address and answers to
  common questions. Fixed by adding `docs/support.md`, served at
  https://toxicunicorn.github.io/org-inspector/support/, and pointing the Support URL there.
- **Guideline 2.1(a) — verification code.** The reviewer still hit Salesforce's identity challenge,
  so the Apple `17.0.0.0/8` trusted range did not cover the machine they logged in from
  (review device: MacBook Air 15" M3). See the next section for how to find the IP they actually
  used — do not guess a second time.

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

1. **Trusted IP Ranges** — this is the only setting that actually suppresses the emailed code, and
   it is matched on the *login IP*, so it has to cover the machine App Review signs in from:
   Setup ▸ quick find `Network Access` ▸ Trusted IP Ranges ▸ New.

   **Do not guess the range.** Apple owns `17.0.0.0/8`, but the 2026-08-05 review proves reviewers
   do not always sign in from it. After any review attempt, read the IP they actually used:

   > Setup ▸ quick find `Login History` ▸ filter by the reviewer's username and the review date
   > from Apple's message. The **Source IP** column shows the real address; **Status** will read
   > something like *"Failed: Computer activation required"*. Export to CSV if the list is long.

   Then trust a range around that address (a /16 — e.g. `a.b.0.0`–`a.b.255.255` — absorbs the churn
   inside one datacentre without burning the quota).

   Two hard constraints: a *single* range is capped at 33,554,432 addresses (a /7), and rejected
   with "The range specified is too large" above that; and the org has a *cumulative* quota, so a
   single `17.0.0.0/8` entry (16.7M) consumes essentially all of it and every later range fails
   with "You reached the IP address limit". If you need room, **delete the /8 first** and add
   several targeted /16s instead — coverage of the observed IPs beats coverage of a guess.
2. **Profile login IP ranges**: Setup ▸ Users ▸ Profiles ▸ (reviewer's profile) ▸ Login IP Ranges ▸
   New → `0.0.0.0`–`255.255.255.255`. Profile ranges accept the full space. Note this only controls
   *who may log in from where* — it does not remove the verification challenge, so it is not a
   substitute for step 1.
3. **Waive MFA** for that user: Setup ▸ Permission Sets ▸ New, enable the system permission
   `Waive Multi-Factor Authentication for Exempt Users` (search "Waive Multi-Factor"), then assign
   the permission set to the reviewer's user. Salesforce enforces MFA on direct logins otherwise.
4. **Password must not expire**: Setup ▸ Security ▸ Password Policies → *User passwords expire in* =
   **Never expires**. Review can happen weeks later, and again for each update.
5. **No login-hours restriction** on the profile — Apple reviews across time zones.
6. Optional but helpful: Setup ▸ Session Settings → untick *Lock sessions to the IP address from
   which they originated*, so the reviewer's session survives a network change.

Then **sanity-check it**: open a private window on a VPN in another country and sign in with the
reviewer credentials. You cannot test from Apple's own network, so this only proves the account,
password and MFA waiver are fine — a challenge from a non-Apple IP is expected and not a problem,
as long as step 1 covers `17.0.0.0/8`.

Because that last bit cannot be verified from outside, add a fallback line to the review notes
offering to supply a code on request (see the notes below). It costs nothing and turns a silent
rejection into a question.

### When the reviewer is challenged anyway

Salesforce lets an admin mint a code that works without access to the org's mailbox:
Setup ▸ Users ▸ (reviewer's user) ▸ **Generate** next to *Temporary Verification Code* → pick an
expiry of **24 hours** (the maximum) → Generate. It can be used repeatedly until it expires, and it
satisfies the device-activation challenge, not just MFA.

24 hours is shorter than a typical review window, so it is a *response* tool, not a preventative
one. Use it like this:

- **Reply in Resolution Center** (App Store Connect ▸ the rejected submission ▸ Messages) — no
  resubmit is needed for a 2.1(a) information request. Generate a fresh code, paste it with its
  expiry time, and offer to issue another on request.
- **Apple's phone-call option:** their message links an online form to have a representative call
  you and take the code live. Confirm the phone number in App Review Information first. Also stated
  in their message: resubmitting is not required for the call.
- Whichever route, fix the trusted range from Login History at the same time so the next update
  does not repeat this.

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
  >
  > VERIFICATION CODE: this demo org is configured to accept sign-in without an identity challenge.
  > If Salesforce asks for a verification code anyway, message us in Resolution Center or email
  > [your-support-email] and we will reply with a working code within a few hours — we monitor that
  > inbox specifically during review. We cannot pre-print a permanent code here because Salesforce
  > caps admin-issued codes at 24 hours, but we can issue one on demand at any time.

## Screenshots

macOS screenshots at an accepted size (**1280×800, 1440×900, 2560×1600, or 2880×1800**). 1–5 images:
the popup open on a record, Data Export with results, the metadata/field view, the container app
window. Capture at one of those exact resolutions or App Store Connect rejects the upload.

## Icon

Provided by the build: `platforms/safari/app/Assets.xcassets/AppIcon.appiconset` (16→1024, rendered
from the vector). App Store Connect pulls the 1024 marketing icon from the uploaded build.
