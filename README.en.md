# MailPerch

MailPerch is a local-first Thunderbird extension for pinning, organizing, and following up on important email without replacing the native message list.

> **Status: development build 3.2.12.** Compatible with Thunderbird 128 through 153. Complete manual UI and Calendar validation is still required before publication.

## Main features

- a separate pinned-message panel above the native message list;
- local follow-ups, deadlines, reminders, groups, cases, and templates;
- local rules with simulation and loop protection;
- Calendar tasks and events based on compatible calendars;
- dashboard, smart views, and a redacted local diagnostic.

## Installation

1. Build the extension with `npm run build`.
2. In Thunderbird, open **Add-ons and Themes**, then **Install Add-on From File**.
3. Select `dist/MailPerch_v3.2.12.xpi`.
4. Restart Thunderbird and begin with a test profile.

MailPerch is not yet announced as available through Thunderbird Add-ons.

## Quick start

1. Open MailPerch settings.
2. Keep the recommended settings or adjust the display and follow-up options.
3. Pin a message from the list, context menu, or configured shortcut.
4. Use the panel or dashboard to organize follow-ups.

## Privacy and local operation

MailPerch makes no network calls, sends no telemetry, and loads no remote content. Tracking data stays in the Thunderbird profile; message bodies and attachment contents are not copied to its local database. See [PRIVACY.md](PRIVACY.md).

## Permissions and Experiment API

The extension contains a privileged Experiment API to integrate its panel with Thunderbird and access the required local features. This entails Thunderbird’s full-access warning and depends on internal Thunderbird interfaces. See [SECURITY.md](SECURITY.md), the [threat model](docs/THREAT_MODEL.md), and [known limitations](docs/KNOWN_LIMITATIONS.md).

## Development and tests

Requirements: Python 3.11+ and Node.js 20+. No npm dependencies are required.

```bash
npm run check
npm test
npm run build
npm run ci
```

Manual validation is described in [docs/MANUAL_TEST_PLAN.md](docs/MANUAL_TEST_PLAN.md). Contributors should also read [AGENTS.md](AGENTS.md) and [docs/CODEX_HANDOFF.md](docs/CODEX_HANDOFF.md).

## Documentation and issues

- [Architecture](docs/ARCHITECTURE.md)
- [Bug tracker](docs/BUG_TRACKER.md)
- [Debugging guide](docs/DEBUGGING.md)
- [Report an issue](https://github.com/ussmarines/mailperch-thunderbird/issues)

## Author and official links

- [ussmarines](https://github.com/ussmarines)
- [MailPerch repository](https://github.com/ussmarines/mailperch-thunderbird)

## Support MailPerch

Enjoying MailPerch? You can support its continued development with a donation.

[**Support the project via PayPal**](https://paypal.me/ussmarinesdot)

Donations are optional and do not unlock any features.

## License

This repository is provided under a restrictive source-available, non-commercial license with no right to public redistribution. See [LICENSE](LICENSE).
