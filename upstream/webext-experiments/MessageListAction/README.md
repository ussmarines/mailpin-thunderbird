# MessageListAction

| Item | Value |
| --- | --- |
| Description | High-level WebExtension action for messages shown in Thunderbird's message list |
| Status | Draft |
| Compatibility | Prototype target: Thunderbird 153–154 |
| Tracking | Prepared locally; upstream issue not opened yet |

## Objective

`MessageListAction` is a generic Experiment proposal for adding one extension-owned action to Thunderbird's message list (thread pane) without exposing Thunderbird DOM/XUL internals to the WebExtension.

It is intentionally application-agnostic. The API does not know about MailPin, pinning, follow-up workflows, storage, reminders, tags, calendars or cases.

## Proposed API

An extension registers an action and supplies presentation state for messages identified through the standard WebExtension `messages` API identifiers.

```js
await browser.MessageListAction.register({
  title: "Track message",
  icons: {
    "16": "icons/track-16.svg",
    "32": "icons/track-32.svg"
  }
});

await browser.MessageListAction.setState(message.id, {
  active: true,
  title: "Stop tracking message"
});

browser.MessageListAction.onClicked.addListener(async (message, tab) => {
  // Business behavior belongs here, in the WebExtension.
});
```

## Design constraints

- no arbitrary DOM/XUL access in the public API;
- no Thunderbird internal message keys or folder URIs in the public API;
- no application storage or business state in the Experiment;
- no mutation of read/unread state or folder counters;
- no replacement of Thunderbird's native message list;
- deterministic cleanup on disable/update/uninstall;
- standard WebExtension message and tab objects at the API boundary;
- presentation state is ephemeral and owned by the calling extension.

## Repository layout

- `manifest.json`: sample add-on registration;
- `background.js`: minimal consumer example;
- `experiments/MessageListAction/schema/message-list-action.json`: proposed public contract;
- `experiments/MessageListAction/parent/ext-message-list-action.js`: prototype parent implementation;
- `ISSUE_DRAFT.md`: upstream design issue ready for review/editing;
- `PR_DRAFT.md`: upstream PR body checklist.

## Prototype status

The schema and parent implementation are a review prototype. They must be validated against the exact Thunderbird internals selected by upstream maintainers before an upstream PR is presented as runnable. The design issue should be opened first, as requested by `thunderbird/webext-experiments` contribution guidance.

## License

All code in this staging directory is offered for upstream contribution under the Mozilla Public License 2.0. SPDX headers are included in source files.
