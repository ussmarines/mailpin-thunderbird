# MailPerch

**MailPerch — Email Pins & Follow-up**

> **Pin, organize and follow up on your emails in Thunderbird.**
> *Keep important mail within reach.*

MailPerch is a Thunderbird extension that adds a separate pinned-message panel above the native message list, plus local workflows, reminders, groups, cases, Kanban, rules and Calendar integration.

> **Status: development build 3.2.9.** Static checks, model tests and regression guards run automatically. A complete real-Thunderbird GUI validation is still required before release.

## Main features

- pins independent from Thunderbird stars;
- a separate panel that does not hide the native message list;
- account colours, groups, notes, priorities and deadlines;
- active, waiting, planned and completed workflows;
- conversations, reminders and recurring follow-ups;
- cases, Kanban, smart views and bulk actions;
- automatic local no-reply follow-up tracking;
- local rules with simulation and loop protection;
- Thunderbird Calendar tasks and events with a compatibility matrix;
- protected migrations, previewed restores and local SQLite storage;
- a health center and an exportable redacted diagnostic log;
- a native context menu on the whole pinned card;
- guided, searchable settings with contextual help and unobtrusive feedback;
- incremental rendering and progressive loading for large pin collections.

## Test installation

Build with `npm run build`, then install `dist/MailPerch_v3.2.9.xpi` from Thunderbird’s Add-ons Manager. Restart Thunderbird completely and use a test profile for destructive actions.

## Development

Requires Python 3.11+ and Node.js 20+. There are no npm dependencies.

```bash
npm run check
npm test
npm run build
npm run ci
```

The contents of `extension/` are packaged at the XPI root. See `AGENTS.md` and `docs/CODEX_HANDOFF.md` before changing privileged code.

## Privacy and security

The add-on contains no network calls or telemetry. Structured pin metadata is stored locally. It uses a privileged Thunderbird Experiment API, which grants full access and depends on internal Thunderbird interfaces. See `PRIVACY.md`, `SECURITY.md` and `docs/THREAT_MODEL.md`.

## License

This repository is source-available, not open source. Commercial use and public redistribution are prohibited except with the copyright holder’s written permission. See `LICENSE`.
