# Security model

## Trust boundary

MailPin has no server, application account or administrator role. Messages, imported JSON and user/page input are untrusted. Non-privileged WebExtension pages cross the structured `pinInbox` API into the privileged Experiment, which validates and normalizes before Thunderbird, SQLite, Agenda, preferences or file operations.

The local profile owner and Browser Toolbox user already control the process and are outside an application-level authorization boundary. Do not invent `admin`, master tokens, hidden roles or DOM-based permission checks.

## Durable security properties

- No runtime network, telemetry, ads, CDN or remote code.
- No `eval`, `new Function`, or HTML sinks built from mail metadata.
- No message body or attachment content in storage or search.
- API inputs are recursively bounded; prototype-pollution keys and oversized/deep objects are rejected.
- File paths change only through the privileged native picker; imports cannot set them.
- Imported automation and environmental links remain inert until reviewed.
- UI confirmations complement, but never replace, privileged validation.
- Diagnostics anonymize accounts/calendars and remove sensitive paths/content.
- New persistent data participates in uninstall cleanup.

## Destructive and lifecycle behavior

On uninstall, early AddonManager state and the awaited Gecko Management event stop new writes, clean injected resources, flush/close SQLite, and remove MailPin databases, journals, recovery, managed backups and preferences. In external folders, only checksummed MailPin envelopes are eligible; user-downloaded exports remain untouched.

A native storage sentinel detects a normal uninstall/reinstall and purges residue before SQLite/preferences load. Updates remove listeners without purging data.

## Compatibility boundary

Adapters reduce the number of modules that know Thunderbird internals; they do not make page input trusted. Tags retain exact ownership checks, Messages retain bounded searches, Agenda retains ACL/capability checks, and optional failures remain local.

Sources: `docs/SECURITY_BOUNDARY.md`, `docs/ARCHITECTURE.md`, `extension/manifest.json`, `schema.json`, `implementation.js`, compatibility adapters.
