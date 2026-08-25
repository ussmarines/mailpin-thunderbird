# MessageListAction validation gates

This file separates what is already structurally prepared from what must still be proven before public upstream submission.

## Prepared

- self-contained `MessageListAction` subdirectory;
- README metadata table with `Draft` status;
- MPL-2.0 source headers / contribution intent;
- sample manifest and minimal consumer;
- narrow schema with one namespace, six functions and one event;
- parent prototype with owned listener/node cleanup;
- issue and PR drafts;
- repository guard preventing MailPin-specific concepts from entering the public schema.

## Must pass before opening an upstream PR

1. `python scripts/check_upstream_experiment.py` from the MailPin repository.
2. `npm run ci` from the MailPin repository to prove the staging work did not regress the existing project.
3. Copy/rebase the staging directory into a current fork of `thunderbird/webext-experiments`.
4. Run upstream:

   ```bash
   npm install
   npm run lint
   ```

5. Validate the parent implementation against the exact Thunderbird internals selected by maintainers, especially:
   - conversion from WebExtension `messageId` to the privileged message header;
   - conversion back to `messages.MessageHeader` for `onClicked`;
   - conversion of the native mail tab to `tabs.Tab`;
   - mail tab/window enumeration and `about:3pane` lifecycle.
6. Exercise both table and card thread layouts.
7. Exercise virtualized row reuse, folder changes, tab changes and window closure.
8. Exercise extension disable, update and uninstall cleanup; no action button, observer or listener may survive shutdown.
9. Confirm the action never mutates read/unread state, native stars or folder counters.
10. Record exact Thunderbird versions, commit SHAs and results in the upstream README/PR.

## Public-submission order

1. Open the design issue from `ISSUE_DRAFT.md`.
2. Incorporate maintainer feedback into naming and API shape.
3. Re-run all gates above.
4. Open the upstream PR using `PR_DRAFT.md`.
5. Do not claim `Accepted` until Thunderbird maintainers actually accept the Experiment for core.

## MailPin ATN gate

Even an accepted `MessageListAction` draft would cover only the generic message-list UI primitive. MailPin must still remove, replace or upstream every remaining private privileged capability before a new ATN candidate can be described as compliant with the reviewer requirement that blocked 1.7.5.
