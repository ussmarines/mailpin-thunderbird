<div align="center">
  <img src="extension/icons/mailperch-icon.svg" width="128" height="128" alt="MailPerch logo">

# MailPerch

**Pin, organize and follow up on important email in Thunderbird.**

[![QA](https://github.com/ussmarines/mailperch-thunderbird/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ussmarines/mailperch-thunderbird/actions/workflows/ci.yml)
![Release](https://img.shields.io/badge/release-v1.5.2-0078D4)
![License](https://img.shields.io/badge/license-MailPerch%20Source--Available%201.1-6A5ACD)
</div>

MailPerch adds a dedicated pinned-message panel above Thunderbird’s native message list. It keeps important mail visible, supports follow-up planning, and organizes work without replacing Thunderbird’s normal workflow.

## Features

- pin a message or conversation independently from Thunderbird’s native star;
- scope the panel to the current folder, selected Thunderbird accounts, or all accounts;
- automatic reply follow-up, deadlines, interactive reminders, and snoozing;
- **Today** and **Review** views, bulk actions, and quick capture from a message;
- groups, cases, templates, local rules with preview, and smart views;
- Thunderbird calendar tasks and events where supported;
- personal notes and checklists/subtasks attached to messages and conversations;
- global MailPerch search, saved custom views, and a command palette;
- separate **Waiting for them** / **Needs reply** indicators and richer follow-up statistics;
- optional synchronization with Thunderbird tags owned exclusively by MailPerch;
- bidirectional synchronization with compatible Thunderbird Calendar tasks/events;
- dashboard, Kanban, history, and a local health center;
- backup, restore, and redacted diagnostics.

## Compatibility

- **MailPerch:** `1.5.2`;
- **Thunderbird:** `153.0` through `153.*`;
- **Format:** Manifest V3 MailExtension;
- **Languages:** French and English;
- **Target systems:** Windows, Linux, and macOS.

The manifest declares this compatibility range, but the full Windows/Linux/macOS matrix and the range endpoints still require manual validation before store submission.

MailPerch includes a privileged Experiment API to integrate its panel into Thunderbird, manage its local SQLite storage, and access required Calendar features. Thunderbird therefore displays the full-access warning during installation.

Internal Messages, Tags, and Calendar access is isolated behind a dedicated compatibility layer to reduce coupling to Thunderbird internals. The `about:3pane` DOM integration remains deliberately incremental.

## Installation

### From a GitHub release

1. Download `MailPerch_v1.5.2.xpi` from release `v1.5.2`.
2. In Thunderbird, open **Add-ons and Themes**.
3. From the gear menu, select **Install Add-on From File**.
4. Select the XPI and restart Thunderbird if required.

> Internal `3.2.x` development builds used a version number higher than the current public versions. To test `1.5.2` after a development build, use a clean test profile or uninstall the previous build after exporting your MailPerch data.

### From source

Requirements: Python 3.11+ and Node.js 20+. No third-party npm or Python dependency is downloaded.

```bash
npm run ci
```

Reproducible release artifacts are generated in `dist/`: XPI, source archive, and SHA-256 checksums.

## Privacy and security

MailPerch is local-first: no network calls, telemetry, advertising, or remotely loaded code. Metadata required for pinned messages remains in the Thunderbird profile; complete message bodies and attachment contents are not copied into the MailPerch database.

- [Privacy policy](PRIVACY.md)
- [Security policy](SECURITY.md)
- [1.5.2 security audit](SECURITY_AUDIT_1.5.2.md)
- [1.5.2 validation report](VALIDATION_REPORT_1.5.2.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md)

## Documentation and support

- [Architecture guide](docs/ARCHITECTURE.md)
- [Thunderbird compatibility layer](docs/THUNDERBIRD_COMPATIBILITY.md)
- [Thunderbird test bench](docs/THUNDERBIRD_TEST_BENCH.md)
- [Manual test plan](docs/MANUAL_TEST_PLAN.md)
- [Reviewer build instructions](release/BUILD_INSTRUCTIONS.md)
- [Thunderbird Add-ons submission preparation](STORE_RELEASE.md)
- [Report an issue](https://github.com/ussmarines/mailperch-thunderbird/issues)

MailPerch is maintained by [ussmarines](https://github.com/ussmarines). Donations through [PayPal](https://paypal.me/ussmarinesdot) are optional and do not unlock features.

## License

MailPerch is distributed under the **MailPerch Source-Available License 1.1**. The public repository may be inspected and any rights granted directly by GitHub remain applicable; the MailPerch license grants no additional right to sell, redistribute, publish a fork, continue the project independently, or exploit it commercially without written permission. See [LICENSE](LICENSE).
