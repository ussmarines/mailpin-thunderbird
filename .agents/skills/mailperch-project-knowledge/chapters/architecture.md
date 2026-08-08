# Architecture

## Product shape

MailPerch is a local Thunderbird Manifest V3 MailExtension that adds actionable pinned-message views without filtering, moving or replacing the native message list. Its extension ID is `pin-mails@MailPerch.local`; treat it as immutable across manifest, release metadata, current project state and tests.

The main dependency flow is:

```text
background.js and non-privileged Options/Dashboard pages
  -> structured pinInbox API from schema.json
  -> privileged implementation.js orchestrator
  -> pure business/storage modules
  -> PinCompatibility facade
     -> Messages adapter
     -> Tags adapter
     -> Agenda adapter
  -> Thunderbird internals, SQLite, preferences and local files
```

Dependencies point inward in one direction: business modules ask the compatibility facade for Thunderbird operations; adapters know native services. `implementation.js` still owns Experiment lifecycle and the coupled `about:3pane` DOM integration.

## Ownership map

- `extension/manifest.json`: identity, compatibility, permission and CSP truth.
- `extension/background.js`: public commands, menus and dashboard tab creation.
- `extension/api/pinInbox/schema.json`: public structured API surface.
- `extension/api/pinInbox/implementation.js`: privileged orchestration, lifecycle and panel injection.
- `extension/api/pinInbox/modules/`: business rules, storage, migrations and compatibility adapters.
- `extension/options/`: settings and Recommended/Advanced experience.
- `extension/dashboard/`: global views, search, Kanban, cases and health.
- `extension/styles/`: local tokens, panel and page styles.
- `tests/`: static, model, contract, browser and runtime guards.

## Current configuration anchors

The manifest currently declares only the `menus` permission, a self-only CSP with `connect-src 'none'`, and Thunderbird 128.0 through 153.*. These declarations are not proof of runtime behavior on every supported version.

Sources: `extension/manifest.json`, `docs/PROJECT_STATE.json`, `PROJECT_MEMORY.md`, `docs/ARCHITECTURE.md`, `docs/IDENTITY_MIGRATION_REQUIRED.md`.
