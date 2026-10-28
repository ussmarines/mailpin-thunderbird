<div align="center">
  <img src="assets/brand/mailpin-hero.svg" width="100%" alt="MailPin — Email Follow-up & Productivity">

# MailPin

**Email Follow-up & Productivity for Thunderbird**

[![QA](https://github.com/ussmarines/mailpin-thunderbird/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ussmarines/mailpin-thunderbird/actions/workflows/ci.yml)
![Release](https://img.shields.io/badge/release-v1.7.11-4F7F75)
![Source](https://img.shields.io/badge/candidate-v1.7.12-3D536B)
![Thunderbird](https://img.shields.io/badge/Thunderbird-153.x--159.x-3D536B)
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

Candidate **1.7.12** targets Thunderbird 159.0, pending a fresh real-runtime smoke on the official binary. No permission, schema, storage, runtime dependency or network behavior changes.

## Compatibility

- **Source version:** `1.7.12` — candidate
- **Latest public release:** `1.7.11`
- **Thunderbird:** `153.0` to `159.*` (candidate)
- **Format:** MailExtension Manifest V3
- **Locales:** French and English
- **Public ID:** `ussmarines.mailpin@addons.thunderbird.net`
- **Add-ons for Thunderbird listing:** [MailPin](https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/) — the ATN submission/review cycle remains separate from the GitHub release

MailPin uses a privileged Thunderbird Experiment for `about:3pane`, local SQLite and selected Messages/Tags/Calendar integration behind `PinCompatibility`. Published target `fce07e98e2a056f38bfc7143766a71d1f7923e44` passed QA, CodeQL and real Thunderbird 158.0 smoke before publication. Detailed evidence is in [the validation report](VALIDATION_REPORT_1.7.12.md).

## Install

### Add-ons for Thunderbird

The [MailPin listing on Add-ons for Thunderbird](https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/) exists. GitHub release 1.7.11 is separate from the Add-ons for Thunderbird review cycle.

### GitHub release

1. Download `MailPin_v1.7.11.xpi` from release `v1.7.11`.
2. Thunderbird → **Add-ons and Themes** → gear menu → **Install Add-on From File**.
3. Select the XPI.

### From source

Requires Python 3.11+ and Node.js 20+.

```bash
npm run ci
```

Reproducible outputs from the published source:

- `dist/MailPin_v1.7.12.xpi`
- `dist/MailPin_GitHub_Repository_v1.7.12.zip`
- `dist/SHA256SUMS.txt`

## Privacy & security

MailPin has no runtime network call, telemetry, advertising or remote code. Full message bodies and attachment contents are not copied into the MailPin database.

- [Privacy](PRIVACY.md)
- [Security](SECURITY.md)
- [Source security audit 1.7.11](SECURITY_AUDIT_1.7.12.md)
- [Source validation report 1.7.11](VALIDATION_REPORT_1.7.12.md)
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

Candidate 1.7.12 targets Thunderbird 153.0–159.*; Thunderbird 159 testing is pending. Public release 1.7.11 remains validated through 158.*. See [validation and remaining limits](VALIDATION_REPORT_1.7.12.md). The lower supported versions and macOS were not retested for this maintenance.
