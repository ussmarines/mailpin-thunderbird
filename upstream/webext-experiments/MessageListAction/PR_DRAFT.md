# Add MessageListAction draft Experiment

## Summary

This proposes a narrow, high-level Experiment for an extension-owned action in Thunderbird's message list. The WebExtension supplies presentation state and receives a click event; Thunderbird-specific DOM integration remains private to the Experiment.

## Scope

- add a self-contained `MessageListAction` Experiment directory;
- add schema and parent implementation;
- add a minimal sample add-on;
- add README status/compatibility/tracking metadata;
- keep business logic, persistence and application-specific state out of privileged code.

## Design properties

- no arbitrary DOM/XUL objects cross the API boundary;
- no raw `nsIMsgDBHdr`, folder URI or native message key crosses the API boundary;
- standard WebExtension message IDs/objects are used at the public boundary;
- the action is additive and does not replace Thunderbird's message list;
- all inserted listeners/nodes/styles are removed on shutdown;
- code is offered under MPL-2.0.

## Before opening this PR

- [ ] Link the accepted/design-feedback issue.
- [ ] Rebase on current `thunderbird/webext-experiments` main.
- [ ] Align naming/API shape with maintainer feedback.
- [ ] Validate the exact message-ID conversion path against current Thunderbird source.
- [ ] Test table and card layouts on supported Thunderbird versions.
- [ ] Test virtualized row reuse and folder/tab changes.
- [ ] Test disable/update/uninstall cleanup.
- [ ] Run `npm install` and `npm run lint` in the upstream repository.
- [ ] Update upstream root README with the experiment entry.
- [ ] Set README `Tracking` to the real upstream issue / Bugzilla references.

## MailPin relationship

MailPin motivated the capability but is not part of the API contract. No MailPin workflow, storage or domain terms are included in the public schema.
