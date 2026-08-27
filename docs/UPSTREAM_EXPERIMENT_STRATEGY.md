# Thunderbird Experiment upstream strategy

## Goal

MailPin 1.7.6 currently depends on the private `pinInbox` Experiment. The ATN rejection of 1.7.5 showed that resubmitting the same private API is not a viable path. The objective of this workstream is to extract the smallest generic Thunderbird capability needed by MailPin, propose it publicly in `thunderbird/webext-experiments`, and migrate MailPin only after the upstream API shape is accepted.

## Current boundary

`pinInbox` is a MailPin application layer, not a reusable WebExtension API. It currently combines:

- `about:3pane` integration and thread-pane row decoration;
- MailPin pin/workflow state;
- configuration and migration logic;
- local SQLite storage and backup;
- diagnostics and health reporting;
- rules, cases, templates and saved views;
- Messages/Tags/Calendar compatibility adapters.

That surface is intentionally **not** proposed upstream.

## Upstream candidate

Working name: **MessageListAction**.

The candidate provides one generic UI primitive: a WebExtension-owned action in Thunderbird's message list, with a per-message state and a click event delivered back to the WebExtension.

The Experiment must not know what a "pin", "follow-up", "case", "workflow", or MailPin is. It must not persist extension business state. It must not expose DOM nodes, XPCOM objects, `gDBView`, folder URIs, message keys, or other Thunderbird implementation details through the public schema.

### Proposed public surface

- register/update/remove a message-list action;
- set or clear presentation state for a WebExtension message identifier;
- receive `onClicked` when a user invokes the action;
- allow a small stable state: visible, enabled, active, title and icon.

All application behavior remains in the WebExtension background context.

## Upstream feedback from issue #72

The design issue is open at `thunderbird/webext-experiments#72`.

Maintainer feedback on 2026-08-25 changed the architectural direction:

1. Thunderbird already exposes `ThreadPaneColumns.addCustomColumn()` as the established native primitive for add-on-defined message-list columns in table view. Existing add-ons/Experiments already wrap it, including XNote-style `customColumn` implementations.
2. The unresolved platform problem is the cards layout. A useful extension-facing API should ideally work in both table and cards views without requiring add-on authors to implement two Thunderbird-specific integrations.
3. Thunderbird's future API design is coupled to the new message database, so maintainers may defer an official core API until that work settles.

### Consequence

`MessageListAction` should no longer be framed as a replacement for `ThreadPaneColumns`.

The preferred direction to discuss is a **cross-layout high-level contract** whose implementation can:

- use `ThreadPaneColumns` as the table-view backend where its model is sufficient;
- isolate any cards-view adapter behind the same public contract;
- keep message/database internals private;
- remain explicitly transitional until Thunderbird's new message database/API design stabilizes.

The current prototype remains useful as runtime evidence because it passed Thunderbird 154.0 smoke tests in both native table and cards layouts. Its direct DOM implementation is **not** considered the final upstream architecture.

## Existing ThreadPaneColumns evidence

Current `ThreadPaneColumns` exposes `addCustomColumn`, `removeCustomColumn`, `refreshCustomColumn`, `getColumn`, and `getCustomColumns`. `addCustomColumn` accepts native `nsIMsgDBHdr` callbacks and supports text/icon/sort behavior for table columns.

Known limitations relevant to this workstream:

- custom columns are table-view oriented;
- cards view does not automatically render custom columns;
- therefore a thin `ThreadPaneColumns` wrapper alone cannot satisfy the cross-layout requirement raised in issue #72.

This supports using the existing mechanism where possible rather than duplicating it, while keeping the proposal focused on the missing layout-independent abstraction.

## Why this is still a useful upstream fit

The candidate remains high-level, reusable by unrelated extensions, hides Thunderbird implementation details, and creates a dedicated UI entry point rather than allowing arbitrary thread-pane DOM manipulation.

Potential users include follow-up tools, CRM extensions, triage tools, task integrations, bookmarking tools and custom message-state workflows.

The upstream value is now specifically the **single extension-facing contract across table/cards**, not custom-column registration itself.

## MailPin migration phases

1. **Upstream design:** issue #72 is open; incorporate maintainer direction before changing the public API shape.
2. **Backend redesign:** evaluate a `ThreadPaneColumns`-backed table implementation plus a contained cards adapter under the same high-level contract.
3. **Prototype:** adapt the candidate only if maintainers consider a transitional Experiment useful; validate all supported Thunderbird builds/layouts.
4. **Upstream PR:** submit only after maintainers indicate that a transitional Experiment is welcome and all lint/runtime gates are green.
5. **MailPin split:** move MailPin business state and orchestration out of `pinInbox`; consume the generic primitive only for message-list UI.
6. **Privileged-surface elimination:** replace or upstream any remaining privileged capability. MailPin is not ATN-ready while a private privileged API remains.
7. **ATN candidate:** cut a new version only after the packaged Experiment corresponds to an accepted/public upstream draft and all remaining Experiment usage has been reviewed.

## Non-goals

- Do not rename `pinInbox` and claim it is generic.
- Do not copy the current MailPin schema into the upstream repository.
- Do not upstream SQLite, backups, rules, templates, cases, reminders or MailPin-specific UI.
- Do not expose arbitrary Thunderbird DOM access.
- Do not duplicate `ThreadPaneColumns` functionality merely to create a new namespace.
- Do not claim the current direct-DOM prototype is the preferred final implementation.
- Do not resubmit 1.7.6 to ATN merely because this preparation branch exists.

## Repository policy for this workstream

The current 1.7.6 runtime remains unchanged while the upstream design discussion is active. The `upstream/webext-experiments/MessageListAction/` directory is a contribution staging area and is licensed separately under MPL-2.0 for upstream submission.

Status: **design issue open; architecture being aligned with ThreadPaneColumns/new-message-database feedback**. This is not evidence of upstream acceptance and not an ATN approval claim.
