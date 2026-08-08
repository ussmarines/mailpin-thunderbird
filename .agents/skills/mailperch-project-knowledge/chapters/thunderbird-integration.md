# Thunderbird integration

## Compatibility facade

`PinCompatibility.create(dependencies)` receives native services explicitly and builds three small adapters. The injection makes privileged dependencies visible and lets Node contract tests use deterministic fakes.

### Messages

Owns account/folder enumeration, bounded header resolution, folder notifications, message display, reply and archive operations. Message lookup must never become an unbounded profile scan.

### Tags

Owns Thunderbird tag definitions and message keywords. It checks every collision before the first creation, treats a key with the wrong label as a blocking collision, groups operations by folder, and removes only tags whose key and label prove MailPerch ownership. Tag sync is optional and disabled by default.

### Agenda

Owns calendar discovery, date conversion, events/tasks, ACL/capability checks and observers. Agenda is optional: missing constructors or a read-only provider disable only affected operations, not MailPerch core.

## Orchestrator boundary

`implementation.js` keeps lifecycle, coordination and `_setupAbout3Pane()` because the DOM is coupled to `ThreadCard`, windows, `tabmail` and native menus. Extract this surface progressively, with runtime evidence, rather than rewriting it together with service boundaries.

`background.js` opens the dashboard with `tabs.create` after the Experiment emits `onDashboardRequested`; a privileged principal must not directly open the extension page.

## Degradation and cleanup

- Missing core Messages services are a diagnosed blocking incompatibility.
- Missing Tags or Agenda capabilities degrade only those features.
- Changed `about:3pane` structures must avoid double injection, clean owned nodes and provide sanitized diagnostics.
- Every listener, observer, timer, style, popup and injected node needs idempotent cleanup.

Contract tests reduce regressions but do not prove graphics, providers or full version compatibility. Current runtime evidence is limited to the scenario recorded in current validation documents.

Sources: `docs/THUNDERBIRD_COMPATIBILITY.md`, `docs/ARCHITECTURE.md`, `extension/background.js`, `extension/api/pinInbox/implementation.js`, `extension/api/pinInbox/modules/compatibility.js`, `thunderbird-*.js`.
