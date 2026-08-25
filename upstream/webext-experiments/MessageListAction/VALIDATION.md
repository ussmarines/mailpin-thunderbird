# MessageListAction validation gates

This file separates what is already structurally prepared from what must still be proven before public upstream submission.

## Prepared and proven

- self-contained `MessageListAction` subdirectory;
- README metadata table with `Draft` status;
- MPL-2.0 source headers / contribution intent;
- sample manifest and minimal consumer;
- narrow schema with one namespace, six functions and one event;
- parent prototype with owned listener/node cleanup;
- issue and PR drafts;
- repository guard preventing MailPin-specific concepts from entering the public schema;
- `python scripts/check_upstream_experiment.py`: PASS on the owner machine on 2026-08-25;
- `npm run ci`: PASS on the owner machine on 2026-08-25, including checks, tests and reproducible build;
- current Thunderbird message conversion contract checked against `mail/components/extensions/ExtensionMessages.sys.mjs` on 2026-08-25: `MessageManager.get(id)` returns the privileged `nsIMsgDBHdr`, and `MessageManager.convert(msgHdr)` returns the WebExtension `MessageHeader`;
- current Gecko tab conversion contract checked against `toolkit/components/extensions/parent/ext-tabs-base.js` on 2026-08-25: `TabManagerBase.convert(nativeTab)` delegates to `getWrapper(nativeTab).convert()`;
- official upstream lint environment reproduced in GitHub Actions against `thunderbird/webext-experiments@b7f7cb3e76807903a785a03784d6e7df7b213f21`, using its own lockfile and `npm run lint`;
- lint run `32836541308` on the current parent implementation after the EventEmitter signature correction: PASS;
- dedicated real-runtime matrix run `32837227578` against the official Thunderbird 154.0 Linux binary: PASS in both native `table` and `cards` profiles;
- both runtime jobs verify a local-only synthetic message, exactly one injected action, `onClicked` delivery with WebExtension message/tab conversion, active-state refresh, unchanged message flags/total/unread counters, and removal of the action after temporary add-on uninstall;
- branch QA run `32837227261`: Linux full verification, security guard regression, and Windows source/model checks all PASS.

The `messageId -> nsIMsgDBHdr -> MessageHeader` and `nativeTab -> tabs.Tab` calls used by the parent prototype therefore match the current implementation contracts. The official upstream ESLint gate is green, and the generic action has been observed working in both Thunderbird 154 message-list layouts without changing native message state.

## Remaining before opening an upstream PR

The design issue may now be opened. A later upstream PR should still incorporate maintainer feedback and, if the parent implementation remains part of the proposal, expand lifecycle coverage for newly created mail tabs/windows and virtualized row reuse beyond the initial-pane smoke already proven.

Before opening an upstream PR:

1. incorporate the design-issue feedback into naming and API shape;
2. re-run all applicable gates after any material API or parent change;
3. keep the official upstream lint green;
4. preserve cleanup, message-state and layout invariants;
5. record any additional lifecycle validation required by maintainers.

## Public-submission order

1. Open the design issue from `ISSUE_DRAFT.md`.
2. Incorporate maintainer feedback into naming and API shape.
3. Re-run all applicable gates after any material API or parent change.
4. Open the upstream PR using `PR_DRAFT.md` only after the resulting implementation is green.
5. Do not claim `Accepted` until Thunderbird maintainers actually accept the Experiment for core.

## MailPin ATN gate

Even an accepted `MessageListAction` draft would cover only the generic message-list UI primitive. MailPin must still remove, replace or upstream every remaining private privileged capability before a new ATN candidate can be described as compliant with the reviewer requirement that blocked 1.7.5.
