# MailPerch

**MailPerch — Email Pins & Follow-up**

> **Pin, organize and follow up on your emails in Thunderbird.**
> *Keep important mail within reach.*

MailPerch is a Thunderbird extension that adds a separate pinned-message panel above the native message list, together with local workflows, reminders, groups, cases, Kanban, rules, and Calendar integration.

> **Status: development build 3.1.0.** Static checks and model tests pass, and screenshot-derived issues have been addressed. A complete real-Thunderbird GUI validation is still required before release. See [AUDIT_REPORT_3.1.0.md](AUDIT_REPORT_3.1.0.md).

## Main features

- pins independent from Thunderbird stars;
- a separate panel that keeps the native message list visible;
- customizable account colors, groups, notes, and priorities;
- To do / Waiting / Planned / Completed workflows;
- conversations, due dates, reminders, and recurrence;
- cases and a Kanban dashboard;
- local rules with simulation and loop protection;
- Thunderbird Calendar tasks and events;
- local SQLite storage, backups, repair, and diagnostics;
- an accessible context menu for pinned cards;
- a global dashboard supporting light and dark themes.

## Development

Requires Python 3.11+ and Node.js 20+. There are no npm dependencies.

```bash
npm run check
npm test
npm run build
npm run ci
```

Build artifacts are named:

```text
MailPerch_v<VERSION>.xpi
MailPerch_GitHub_Repository_v<VERSION>.zip
```

The contents of `extension/` are packaged at the XPI root. See `AGENTS.md`, `BRANDING.md`, and `docs/CODEX_HANDOFF.md` before changing privileged code.

## Privacy and security

MailPerch contains no network calls or telemetry. Structured pin metadata is stored locally. It uses a privileged Thunderbird Experiment API, which grants full access and depends on internal Thunderbird interfaces. See `PRIVACY.md`, `SECURITY.md`, and `docs/THREAT_MODEL.md`.

## License

This repository is source-available, not open source. Commercial use and public redistribution are prohibited except with the copyright holder’s written permission. See `LICENSE`.

## Branding and compatibility identifiers

The public product name is **MailPerch**. Historical internal identifiers such as `pin-mails-*` and the development ID `pin-mails@MailPerch.local` remain unchanged to preserve upgrades and existing local data. See `BRANDING.md`.

Thunderbird is a trademark of MZLA Technologies Corporation. MailPerch is an independent project and is not affiliated with or endorsed by MZLA or the Thunderbird project.
