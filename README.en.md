<div align="center">
  <img src="assets/brand/mailpin-hero.svg" width="100%" alt="MailPin — Email Follow-up & Productivity for Thunderbird">

# MailPin

**Email Follow-up & Productivity for Thunderbird**

[![QA](https://github.com/ussmarines/mailpin-thunderbird/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ussmarines/mailpin-thunderbird/actions/workflows/ci.yml)
![Release](https://img.shields.io/badge/release-v1.7.3-4F7F75)
![Source](https://img.shields.io/badge/release-v1.7.3-3D536B)
![Thunderbird](https://img.shields.io/badge/Thunderbird-153.x-3D536B)
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

**Organic Workspace** is consolidated directly in its canonical stylesheet. Release 1.7.3 removes the `interaction-stability.css` overlay, folds the fixes into `workspace.css`, increases structural spacing between settings groups, and gives the **Cancel** action explicit semantic contrast in the save bar, including dark theme. No remote assets, fonts or runtime UI dependency are added.

## Compatibility

- **Source version:** `1.7.3` — published
- **Latest public release:** `1.7.3`
- **Thunderbird:** `153.0` to `153.*`
- **Format:** MailExtension Manifest V3
- **Locales:** French and English
- **Public ID:** `ussmarines.mailpin@addons.thunderbird.net`

MailPin uses a privileged Thunderbird Experiment for `about:3pane`, local SQLite storage, and selected Messages/Tags/Calendar integration. Messages, Tags and Calendar internals remain isolated behind `PinCompatibility`.

## Install

### GitHub release

1. Download `MailPin_v1.7.3.xpi` from release `v1.7.3`.
2. Thunderbird → **Add-ons and Themes** → gear menu → **Install Add-on From File**.
3. Select the XPI.

### From source

Requires Python 3.11+ and Node.js 20+.

```bash
npm run ci
```

Reproducible outputs from the published source:

- `dist/MailPin_v1.7.3.xpi`
- `dist/MailPin_GitHub_Repository_v1.7.3.zip`
- `dist/SHA256SUMS.txt`

## Privacy & security

MailPin has no runtime network call, telemetry, advertising or remote code. Full message bodies and attachment contents are not copied into the MailPin database.

- [Privacy](PRIVACY.md)
- [Security](SECURITY.md)
- [Source security audit 1.7.3](SECURITY_AUDIT_1.7.3.md)
- [Source validation report 1.7.3](VALIDATION_REPORT_1.7.3.md)
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
