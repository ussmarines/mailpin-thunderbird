# Proposal: high-level message-list action API

## Problem

Thunderbird WebExtensions can interact with messages through standard APIs and can add context-menu entries, toolbar/action buttons and message-display UI. There is currently no standard high-level entry point for an extension-owned action attached directly to each visible message row in the thread pane.

Some add-ons therefore use privileged Experiments to manipulate `about:3pane` DOM structures directly. That couples add-ons to Thunderbird internals and makes review and long-term compatibility difficult.

## Proposed capability

Add a reusable `MessageListAction` Experiment draft that lets an extension:

1. register one message-list action with a title and extension icon;
2. provide ephemeral per-message presentation state (`visible`, `enabled`, `active`, optional title override);
3. receive a WebExtension event when the user invokes the action;
4. receive standard WebExtension message/tab objects rather than Thunderbird internals.

The implementation would own all thread-pane DOM integration. Extensions would not receive DOM nodes, `gDBView`, message headers, folder URIs or native message keys.

## Example uses

- follow-up / reminder extensions;
- CRM or ticket-linking extensions;
- bookmarking / triage tools;
- task integrations;
- custom message-state workflows.

## Proposed shape

```js
await browser.MessageListAction.register({
  title: "Track message",
  icons: {"16": "icons/track-16.svg", "32": "icons/track-32.svg"}
});

await browser.MessageListAction.setState(message.id, {
  active: true,
  title: "Stop tracking message"
});

browser.MessageListAction.onClicked.addListener((message, tab) => {
  // Extension business logic.
});
```

Additional methods proposed for discussion:

- `update(details)`
- `unregister()`
- `clearState(messageId)`
- `clearAllStates()`

## Design principles

The API is deliberately high-level and narrow. It does not expose arbitrary message-list customization, custom columns, raw DOM injection, XUL, internal message keys, persistence, or application-specific concepts.

The Experiment owns lifecycle cleanup. Presentation state is ephemeral; persistent state remains the extension's responsibility.

## Questions for maintainers

1. Is a dedicated row action an acceptable stable UI primitive for the message list?
2. Should the namespace follow an existing action API naming pattern instead of `MessageListAction`?
3. Should the first draft support one action per extension or a collection of actions?
4. Should state be push-based (`setState`) or requested lazily through an event/callback when rows render?
5. Which message identifier/conversion path should the Experiment use so the public boundary remains aligned with the standard `messages` API?
6. Should this be explored as a core API directly rather than maintained as a longer-lived Experiment?

## Prototype

A minimal schema/sample/prototype implementation has been prepared separately. It intentionally keeps application logic outside the Experiment and can be reshaped based on this design discussion before a PR is opened.
