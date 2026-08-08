# Data model and features

## Pinned reference

A reference stores message identities and location metadata, subject/author/date/size, message or conversation mode, notes, checklist, group/case/template/priority, deadlines, reminders, workflow and response timestamps, snooze state, Agenda linkage, tag-sync state and `updatedAt`. It never stores the message body or attachment contents.

Identity prefers Gmail ID, normalized Message-ID, account/folder/key, then a fallback fingerprint. Automatic merge suggestions are stricter: every item must share a strong Gmail thread, root Message-ID, Thunderbird `threadId`, or derived conversation key in the same account. Subject similarity alone is never enough.

## Storage

The SQLite file is historically named `pin-mails-v2.sqlite`. Physical schema is currently 5; settings/data schema is 7 because later fields live in JSON payloads and `state_data`. Writes stay incremental, transactional and serialized, with WAL, revisions, entity timestamps, atomic recovery and checksummed exports.

Migrations/imports validate and bound input, create a pre-write backup, preview counts/conflicts, then merge by identity/timestamp or explicitly replace. Imported automation, bidirectional sync, local paths and environmental links remain disabled until reviewed.

## Feature projections

- Today and Review are calculated from references; they are not duplicate task collections.
- Smart views and counters are derived at load time.
- Snooze hides work until `snoozeUntil` while retaining an explicit snoozed view.
- Reminder fired and acknowledged timestamps are separate so recurring reminders stay visible until acted upon.
- Rules can be simulated against a draft without persistence.
- Associated-item merge is manual, confirmed, bounded to 2-50 items and undoable.
- Global search uses local metadata, notes, checklist, tags, groups, cases and workflow; it never indexes bodies or attachments.
- Checklists are bounded to 50 items of 240 characters; notes to 4,000 characters; saved views to 30.

Response states such as `waitingForThem` and `needsReply` are deterministic local derivations from timestamps/workflow, not AI predictions.

Sources: `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `PROJECT_MEMORY.md`, `extension/api/pinInbox/modules/`, `extension/api/pinInbox/implementation.js`.
