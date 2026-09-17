<div align="center">
  <img src="assets/brand/mailpin-hero.svg" width="100%" alt="MailPin — Email Follow-up & Productivity">

# MailPin

**Email Follow-up & Productivity for Thunderbird**

[![QA](https://github.com/ussmarines/mailpin-thunderbird/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ussmarines/mailpin-thunderbird/actions/workflows/ci.yml)
![Release](https://img.shields.io/badge/release-v1.7.9-4F7F75)
![Source](https://img.shields.io/badge/release-v1.7.9-3D536B)
![Thunderbird](https://img.shields.io/badge/Thunderbird-153.x--156.x-3D536B)
![License](https://img.shields.io/badge/license-MailPin%20Source--Available%201.1-1A1D21)
</div>

MailPin turns important email into actionable follow-up **without replacing Thunderbird’s native inbox**. Pin a message, add notes or subtasks, schedule a reminder, organize saved views, and create Calendar items when the selected calendar supports them — all locally.

## Why MailPin

- **Pin without changing Thunderbird state** — pinning never marks messages read/unread and never mutates native counters.
- **Move follow-up forward** — Active, Waiting, Planned and Completed states, reminders, snooze and no-reply tracking.
- **Add context** — personal notes, subtasks, groups, cases, templates and local rules.
- **Find work quickly** — global search, saved views, Dashboard, Kanban and command palette.
- **Use Calendar safely** — events/tasks are offered only when Thunderbird reports the matching calendar capability.
- **Stay local-first** — no telemetry, ads, remote API, CDN or remote code.

## Brand & interface

Release **1.7.9** extends compatibility to Thunderbird 156 after real-runtime validation on the official 156.0 binary. No permission, schema, storage, runtime dependency or network behavior changes.

## Compatibility

- **Source version:** `1.7.9` — published
- **Latest public release:** `1.7.9`
- **Thunderbird:** `153.0` to `156.*`
- **Format:** MailExtension Manifest V3
- **Locales:** French and English
- **Public ID:** `ussmarines.mailpin@addons.thunderbird.net`
- **Add-ons for Thunderbird listing:** [MailPin](https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/) — the ATN submission/review cycle remains separate from the GitHub release

MailPin uses a privileged Thunderbird Experiment for `about:3pane`, local SQLite storage, and selected Messages/Tags/Calendar integration. Messages, Tags and Calendar internals remain isolated behind `PinCompatibility`. Exact candidate `da9d97a874f5043b43a212d09b9090ad0f77d681` passed QA `35224045803` and real Thunderbird 156.0 smoke `35224046106`; published target `46bb9fc27256cc143743e74e4a04fb48d48f6e85` reran QA `35224161719` and smoke `35224161877` before canonical Release run `35224299551` published v1.7.9.

## Install

### Add-ons for Thunderbird

The [MailPin listing on Add-ons for Thunderbird](https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/) exists. GitHub release 1.7.9 is separate from the Add-ons for Thunderbird review cycle.

### GitHub release

1. Download `MailPin_v1.7.9.xpi` from release `v1.7.9`.
2. Thunderbird → **Add-ons and Themes** → gear menu → **Install Add-on From File**.
3. Select the XPI.

### From source

Requires Python 3.11+ and Node.js 20+.

```bash
npm run ci
```

Reproducible outputs from the published source:

- `dist/MailPin_v1.7.9.xpi`
- `dist/MailPin_GitHub_Repository_v1.7.9.zip`
- `dist/SHA256SUMS.txt`

## Privacy & security

MailPin has no runtime network call, telemetry, advertising or remote code. Full message bodies and attachment contents are not copied into the MailPin database.

- [Privacy](PRIVACY.md)
- [Security](SECURITY.md)
- [Source security audit 1.7.9](SECURITY_AUDIT_1.7.9.md)
- [Source validation report 1.7.9](VALIDATION_REPORT_1.7.9.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md)

## Documentation & support

- [Architecture](docs/ARCHITECTURE.md)
- [Thunderbird compatibility](docs/THUNDERBIRD_COMPATIBILITY.md)
- [Thunderbird test bench](docs/THUNDERBIRD_TEST_BENCH.md)
- [Reviewer build instructions](release/BUILD_INSTRUCTIONS.md)
- [ATN preparation](STORE_RELEASE.md)
- [Support](SUPPORT.md)

Maintained by [ussmarines](https://github.com/ussmarines). [PayPal](https://paypal.me/ussmarinesdot) donations are optional and unlock no functionality.

## License

MailPin is distributed under the **MailPin Source-Available License 1.1**. See [LICENSE](LICENSE).
