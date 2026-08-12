# Testing and release knowledge

## Evidence levels

MailPin separates evidence rather than treating one green check as universal proof:

1. Static/source and model tests.
2. Compatibility contracts using fake services.
3. Browser flows using production assets with a synthetic extension API.
4. Runtime smoke on an official Thunderbird binary.
5. Manual provider, OS, accessibility and real-profile scenarios.

A contract test does not prove Thunderbird UI. A Chromium flow does not prove an extension tab. One Linux smoke does not prove all declared Thunderbird versions, providers or platforms.

The current repository declares Thunderbird 153.0-153.*. Current documents record a successful 153.0.1 ESR Linux synthetic Local Folders smoke for bootstrap, single injection, cleanup and reinstall; verify `docs/AI_VALIDATION_STATE.json` before reusing that evidence because branch, commit and invalidation paths matter.

## Known limits

- Internal Thunderbird APIs and `about:3pane` may change inside the declared range.
- Tags and Agenda depend on provider behavior and ACLs.
- Zoom, screen readers, high contrast, OS matrix and provider matrix still need observation beyond automated guards.
- Cross-platform ZIP containers may differ while extracted contents match; `MP-2026-018` tracks this.
- Test-only Thunderbird/geckodriver downloads do not alter the runtime no-network promise.

## Release model

The build is source-readable, unminified and dependency-light. The manifest currently requests only `menus` and blocks network via CSP. Release knowledge includes identity/version synchronization, deterministic XPI and reviewer source archive, hashes, privacy/security declarations, real installation checks and ATN portal acceptance.

Treat checked boxes in the release checklist as document claims tied to their commit, not permanent proof. Use current Git/GitHub state and the repository's release governance before any publication action.

This chapter does not prescribe test execution. Follow `AGENTS.md`, `MAILPERCH_AI_RULES.md`, current validation state and the smallest invalidated checks.

Sources: `docs/AI_VALIDATION_STATE.json`, `docs/THUNDERBIRD_TEST_BENCH.md`, `docs/KNOWN_LIMITATIONS.md`, `docs/ATN_RELEASE_CHECKLIST.md`, `docs/BUG_TRACKER.md`, `package.json`.
