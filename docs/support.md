# Support

Need help with **Org Inspector**? You're in the right place. This page explains how to get answers,
report a problem, and what to expect.

## Contact us

**Email: [edwardchekanua@protonmail.com](mailto:edwardchekanua@protonmail.com)**

Write in English or Ukrainian. We read every message and normally reply within **2 business days**.

To help us solve your problem on the first reply, please include:

- what you were trying to do, and what happened instead;
- the macOS and Safari versions (Safari ▸ About Safari);
- the Org Inspector version (Safari ▸ Settings ▸ Extensions ▸ Org Inspector);
- the type of Salesforce org (Production, Sandbox, Developer Edition, Scratch);
- a screenshot, if the problem is visible on screen.

Please **never** send us your Salesforce password, session id, or any customer records. We never
ask for them, and we cannot access your org.

## Solve it yourself

Most questions already have an answer here:

| I want to… | Go to |
| --- | --- |
| Install the extension and see the toolbar arrow | [Welcome](welcome.md) |
| Fix a blank popup, a missing arrow, or an "Unauthorized" error | [Troubleshooting](troubleshooting.md) |
| Export records with SOQL | [Data Export](data-export.md) |
| Insert, update, upsert or delete records in bulk | [Data Import](data-import.md) |
| Use your own Connected App instead of the bundled one | [How-To](how-to.md#use-org-inspector-with-a-connected-app) |
| Change keyboard shortcuts | [How-To](how-to.md) |
| See what changed in this release | [Release Notes](release-note.md) |
| Understand what data the extension touches | [Privacy Policy](privacy.md) |

## Frequently asked

### The arrow does not appear after I restart Safari

Reload the Salesforce tab once. Safari does not re-run extension content scripts in tabs that were
restored from a previous session — this is a Safari platform behaviour, not a bug we can fix from
inside the extension.

### The popup is blank

Enable third-party cookies in Safari ▸ Settings ▸ Privacy. Org Inspector reads your existing
Salesforce session cookie, and a blocked cookie leaves it with nothing to work with. See
[Troubleshooting](troubleshooting.md).

### Nothing happens on a Salesforce page

Open Safari ▸ Settings ▸ Extensions ▸ Org Inspector and make sure website access is set to
**Allow on Every Website** (or at least allow your Salesforce and `*.force.com` domains).

### Does Org Inspector send my data anywhere?

No. It talks only to your own Salesforce org, reusing the session you are already logged in with.
There is no analytics, tracking, or telemetry, and nothing is sent to the developer or any third
party. The full details are in the [Privacy Policy](privacy.md).

### Which Salesforce orgs are supported?

Any org you can log in to in Safari — Production, Sandbox, Developer Edition, Scratch orgs, and
Government Cloud domains. Org Inspector uses Salesforce's official REST, SOAP, Tooling, and Bulk
APIs, so your normal profile and permission-set restrictions still apply.

### System requirements

macOS 13 Ventura or later, with Safari 18 or later.

## Report a bug or request a feature

Public issue tracker:
**[github.com/toxicUnicorn/org-inspector/issues](https://github.com/toxicUnicorn/org-inspector/issues)**

Opening an issue is the fastest way to get a fix into a release, and it lets other users find the
answer later. If your report contains anything you'd rather not publish, email us instead.

## Security reports

Found a vulnerability? Please email
[edwardchekanua@protonmail.com](mailto:edwardchekanua@protonmail.com) with the subject line
**"Org Inspector security"** rather than filing a public issue, and give us a chance to ship a fix
before disclosure.

---

Org Inspector is an independent tool. It is not affiliated with, endorsed by, or sponsored by
Salesforce, Inc. Salesforce is a trademark of Salesforce, Inc.
