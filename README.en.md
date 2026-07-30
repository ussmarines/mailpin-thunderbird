# Message Pins for Thunderbird

A development Thunderbird MailExtension that adds a separate pinned-message panel above the native message list, plus local workflows, reminders, groups, cases, Kanban, rules and Calendar integration.

> **Status: development build 3.1.0.** Static checks and model tests pass, and screenshot-derived issues have been addressed. A complete real-Thunderbird GUI validation is still required before release.

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
