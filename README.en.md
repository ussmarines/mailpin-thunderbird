# MailPerch

**MailPerch — Email Pins & Follow-up**

> **Pin, organize and follow up on your emails in Thunderbird.**
> *Keep important mail within reach.*

MailPerch is a Thunderbird extension that adds a separate pinned-message panel above the native message list, plus local workflows, reminders, groups, cases, Kanban, rules and Calendar integration.

> **Status: development build 3.1.5.** Static checks, model tests and regression guards run automatically. A complete real-Thunderbird GUI validation is still required before release.

## Main features

- pins independent from Thunderbird stars;
- a separate panel that does not hide the native message list;
- account colours, groups, notes, priorities and deadlines;
- active, waiting, planned and completed workflows;
- conversations, reminders and recurring follow-ups;
- cases, Kanban and bulk actions;
- local rules with simulation and loop protection;
- Thunderbird Calendar tasks and events;
- local SQLite storage, backups, repair and diagnostics;
- a context menu on the whole pinned card;
- visible success, busy and error feedback in settings and dashboard.

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
