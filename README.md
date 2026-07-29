<img src="addon/icon128.png" align="right">

# Org Inspector

A Safari extension for macOS that adds a metadata layer on top of the standard Salesforce UI to
improve the productivity of Salesforce configuration, development, and integration work.

Org Inspector is an independent tool and is **not affiliated with, endorsed by, or sponsored by
Salesforce, Inc.** Salesforce is a trademark of Salesforce, Inc.

It is a Safari port and fork of [Salesforce Inspector Reloaded](https://github.com/tprouvot/Salesforce-Inspector-reloaded)
by Thomas Prouvot (MIT licensed), itself originally created by
[Søren Krabbe and Jesper Kristensen](https://github.com/sorenkrabbe/Chrome-Salesforce-inspector).

- [Features](#features)
- [Privacy](#privacy)
- [Installation](#installation)
- [Use with a Connected App](#use-with-a-connected-app)
- [Support](#support)
- [Building from source](#building-from-source)
- [Design principles](#design-principles)
- [Third-party libraries](#third-party-libraries)
- [License](#license)

## Features

Org Inspector runs entirely inside your browser and talks to Salesforce on your behalf, using the
session you are already logged in with. Highlights:

- **Show All Data** — inspect any record's fields and metadata, edit values inline, analyze field
  usage, and jump back to the record.
- **Data Export** — build and run SOQL with autocompletion, multiple query tabs, list-view context,
  performance metrics, and per-column filtering.
- **Data Import** — insert, update, upsert, and delete records from CSV/JSON/Excel, with SObject
  auto-detection and SOAP header options (assignment/duplicate rules, owner change).
- **REST Explorer** — call Salesforce REST APIs directly, with request templates and history.
- **Dependencies Explorer** — see what depends on a piece of metadata and what it depends on.
- **Field Creator** — create fields on standard/custom objects, platform events, and custom metadata
  types, with bulk import.
- **Flow Scanner** — analyze Flows against best-practice rules.
- **Debug Logs Viewer** — view, filter, and manage debug logs.
- **Event Monitor** — subscribe to and display Platform Events, including Change Events.
- **Metadata Retrieve** — retrieve and deploy metadata with `package.xml` generation.
- **Org Limits** and **API Statistics** — monitor org limits and API usage in real time.
- **Popup shortcuts** — org/instance info, setup navigation search, and user actions (reset password,
  unfreeze, copy id).

Feature guides live in the [documentation site](https://toxicunicorn.github.io/org-inspector/).

## Privacy

Org Inspector collects nothing. There is no analytics, telemetry, tracking, advertising, or
third-party SDK. All traffic goes directly between your browser and Salesforce-operated domains —
your own org, plus Salesforce's public status service. API calls re-use your existing Salesforce
session and only ever reach data your user is already permitted to see.

Full policy: [PRIVACY.md](./PRIVACY.md).

## Installation

Org Inspector is distributed for Safari on macOS through the Mac App Store. Once installed, enable it
in **Safari ▸ Settings ▸ Extensions**, grant it access to your Salesforce domains, and open any
Salesforce org — the inspector arrow appears on the right edge of the page.

To run an unreleased build yourself, see [Building from source](#building-from-source).

## Use with a Connected App

In orgs where **API Access Control** is enabled you must configure a Connected App and generate an
access token. Follow the steps in the
[how-to documentation](https://toxicunicorn.github.io/org-inspector/how-to/#use-org-inspector-with-a-connected-app).

## Support

Found a bug or have a feature request? Open an issue at
[github.com/toxicUnicorn/org-inspector/issues](https://github.com/toxicUnicorn/org-inspector/issues).

## Building from source

Requirements: macOS with Xcode, and Node.js with npm.

1. `npm install`
2. `npm run safari-xcode` — builds the web extension, runs `safari-web-extension-converter`, and
   opens the generated Xcode project so you can sign and run it locally.

For a Mac App Store archive, use `npm run safari-archive-appstore` (see
[platforms/safari/APP_STORE.md](./platforms/safari/APP_STORE.md) for the full submission checklist).

**Project structure**

- `addon/` — the extension source code.
- `addon/inspector.js` — Salesforce connection and API calls.
- `addon/background.js` — the service worker (also proxies API traffic to satisfy Safari's CORS).
- `addon/utils.js` — common utility functions.
- `addon/components/` — React components (SLDS-based).
- `scripts/safari-convert.js` — the Safari conversion/build/archive driver.

## Design principles

(we don't live up to all of them — pull requests welcome)

- Stay completely inactive until the user explicitly interacts with it. The tool relies on internal
  APIs, so having it installed must never break Salesforce on its own.
- For manual, ad-hoc tasks only. Enabling automation is a non-goal.
- User experience matters: intuitive and discoverable, but efficiency beats discoverability, and
  performance is key.
- Provide as much contextual information as possible without overwhelming the user.
- Provide easy access to the raw Salesforce API, and degrade gracefully when our enhancements fail
  (e.g. still show export results even if we cannot parse the SOQL).
- Work for as many users as possible — admins, standard users, person accounts, multi-currency,
  large data volumes, slow networks, etc.
- Be conservative about the number and complexity of Salesforce API requests.
- Focus on system administrators, developers, and integrators.

## Third-party libraries

- [Lightning Flow Scanner Core](https://github.com/Flow-Scanner/lightning-flow-scanner) — Flow
  metadata analysis engine (MIT License)
- [PrismJS](https://prismjs.com/) — lightweight syntax highlighter (MIT License)

For full license details, see [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## License

[MIT](./LICENSE)
