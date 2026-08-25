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
- current Thunderbird message conversion contract checked against `mail/components/extensions/ExtensionMessages.sys.mjs` revision shown by Searchfox on 2026-08-25: `MessageManager.get(id)` returns the privileged `nsIMsgDBHdr`, and `MessageManager.convert(msgHdr)` returns the WebExtension `MessageHeader`;
- current Gecko tab conversion contract checked against `toolkit/components/extensions/parent/ext-tabs-base.js` on 2026-08-25: `TabManagerBase.convert(nativeTab)` delegates to `getWrapper(nativeTab).convert()`.

The `messageId -> nsIMsgDBHdr -> MessageHeader` and `nativeTab -> tabs.Tab` calls used by the parent prototype therefore match the current implementation contracts. This is source-level validation, not a substitute for a runtime Thunderbird smoke.

## Must pass before opening an upstream PR

1. Copy/rebase the staging directory into a current fork or checkout of `thunderbird/webext-experiments`.
2. Run upstream:

   ```bash
   npm install
   npm run lint
   ```

3. Validate the remaining parent integration against a real Thunderbird runtime, especially:
   - mail tab/window enumeration and `about:3pane` lifecycle;
   - table and card thread layouts;
   - virtualized row reuse, folder changes, tab changes and window closure;
   - extension disable, update and uninstall cleanup;
   - absence of mutation of read/unread state, native stars and folder counters.
4. Record the exact upstream repository commit, Thunderbird version and runtime/lint results in the upstream README/PR.

## Public-submission order

1. Open the design issue from `ISSUE_DRAFT.md` once the proposal text has been checked against the current upstream repository.
2. Incorporate maintainer feedback into naming and API shape.
3. Re-run all applicable gates after any material API or parent change.
4. Open the upstream PR using `PR_DRAFT.md` only after lint and runtime validation are green.
5. Do not claim `Accepted` until Thunderbird maintainers actually accept the Experiment for core.

## MailPin ATN gate

Even an accepted `MessageListAction` draft would cover only the generic message-list UI primitive. MailPin must still remove, replace or upstream every remaining private privileged capability before a new ATN candidate can be described as compliant with the reviewer requirement that blocked 1.7.5.
