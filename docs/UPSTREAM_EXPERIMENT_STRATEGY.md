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

## Why this is a better upstream fit

The candidate is high-level, reusable by unrelated extensions, hides Thunderbird implementation details, and creates a dedicated UI entry point rather than allowing arbitrary thread-pane DOM manipulation.

Potential users include follow-up tools, CRM extensions, triage tools, task integrations, bookmarking tools and custom message-state workflows.

## MailPin migration phases

1. **Upstream design:** open a design issue against `thunderbird/webext-experiments` using the prepared issue draft.
2. **Prototype:** adapt the candidate implementation to reviewer feedback and validate it against supported Thunderbird builds.
3. **Upstream PR:** submit the generic Experiment under MPL-2.0 with README metadata, sample add-on and lint-clean code.
4. **MailPin split:** move MailPin business state and orchestration out of `pinInbox`; consume `MessageListAction` only for the message-list UI primitive.
5. **Privileged-surface elimination:** replace or upstream any remaining privileged capability. MailPin is not ATN-ready while a private privileged API remains.
6. **ATN candidate:** cut a new version only after the packaged Experiment corresponds to an accepted/public upstream draft and all remaining Experiment usage has been reviewed.

## Non-goals

- Do not rename `pinInbox` and claim it is generic.
- Do not copy the current 29 KiB MailPin schema into the upstream repository.
- Do not upstream SQLite, backups, rules, templates, cases, reminders or MailPin-specific UI.
- Do not expose arbitrary Thunderbird DOM access.
- Do not resubmit 1.7.6 to ATN merely because this preparation branch exists.

## Repository policy for this workstream

The current 1.7.6 runtime remains unchanged until the upstream design has received feedback. The `upstream/webext-experiments/MessageListAction/` directory is a contribution staging area and is licensed separately under MPL-2.0 for upstream submission.

Status: **design/prototype preparation**. This is not evidence of upstream acceptance and not an ATN approval claim.
