/* SPDX-License-Identifier: MPL-2.0 */

const trackedMessageIds = new Set();

async function registerAction() {
  await browser.MessageListAction.register({
    title: "Track message"
  });
}

browser.MessageListAction.onClicked.addListener(async message => {
  if (trackedMessageIds.has(message.id)) {
    trackedMessageIds.delete(message.id);
  } else {
    trackedMessageIds.add(message.id);
  }

  const active = trackedMessageIds.has(message.id);
  await browser.MessageListAction.setState(message.id, {
    active,
    title: active ? "Stop tracking message" : "Track message"
  });
});

registerAction().catch(console.error);
