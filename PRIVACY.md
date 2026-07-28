# Privacy Policy — Org Inspector

**Effective date:** 13 July 2026

Org Inspector is a Safari extension that helps Salesforce administrators and developers inspect
data and metadata from the Salesforce UI. This policy explains exactly what it touches.

## The short version

**Org Inspector collects nothing.** It sends no data to the developer, and no data to any third
party. There is no analytics, no telemetry, no tracking, no advertising, and no third-party SDK
of any kind. All traffic goes directly between your browser and Salesforce-operated domains — your
own Salesforce org, plus Salesforce's public status service (see below).

## What it accesses, and why

**Your Salesforce session.** Org Inspector reads the `sid` session cookie for Salesforce domains
so it can call the Salesforce API as you, reusing the session you are already logged in with.
That is why the extension asks for cookie access and for permission on Salesforce hosts. The
session identifier is held in memory for the length of the request and is never transmitted
anywhere except back to your own Salesforce org.

**Your org's data.** When you run a query, export records, or inspect metadata, Org Inspector
calls the official Salesforce APIs **on your behalf**. It can therefore only ever reach the data
and features your Salesforce user is already permitted to see. It grants no new access.

Because the Safari extension model applies CORS to extension pages, these API calls are issued by
the extension's own background script rather than the page. They still go only to your Salesforce
org's hosts.

**Salesforce's status service.** To show whether your org's instance is up or has planned
maintenance, Org Inspector queries Salesforce's public status API at `api.status.salesforce.com`.
The only thing sent is your org's instance name (for example `NA123`) — no session, no records, and
nothing that identifies you. This is a Salesforce-operated service, not a third party.

## What is stored on your device

Org Inspector stores the following locally, in your browser, on your machine:

- Query history and saved queries
- Environment type (Production or Sandbox) per org
- Client ID / session ID, **only** if you have configured a Connected App
- User-interface preferences (theme, button layout, shortcuts, API version)
- Optional local API call counters, used only to show you your own usage

None of this leaves your device. To erase it, clear your browser's website data or uninstall the
extension.

## What is not collected

- No personal information is collected, transmitted, or sold.
- No Salesforce record data is transmitted to the developer or anyone else.
- No usage analytics or crash reporting.
- No data is used for tracking across apps or websites.

## Verifying this

Org Inspector is open source. You can read the code, or watch the network traffic in Safari's Web
Inspector and confirm that the only hosts contacted are Salesforce-operated domains — your own
Salesforce org and Salesforce's public status service.

Source: https://github.com/ChekeEdd/org-inspector

## Children

Org Inspector is a professional developer tool. It is not directed at children under 13.

## Your rights (GDPR / CCPA)

Because Org Inspector performs no server-side processing and the developer receives no data, there
is nothing for us to hold, export, or delete. Any data the extension stores is on your own device
and under your control; clearing your browser data removes it entirely.

## Changes

Any change to this policy will be published at this URL with an updated effective date.

## Contact

Questions: open an issue at https://github.com/ChekeEdd/org-inspector/issues

---

Org Inspector is an independent tool and is not affiliated with, endorsed by, or sponsored by
Salesforce, Inc. Salesforce is a trademark of Salesforce, Inc.

Org Inspector is a fork of [Salesforce Inspector Reloaded](https://github.com/tprouvot/Salesforce-Inspector-reloaded)
by Thomas Prouvot, MIT licensed.
