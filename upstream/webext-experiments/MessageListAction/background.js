/* SPDX-License-Identifier: MPL-2.0 */

async function registerAction() {
  await browser.MessageListAction.register({
    title: "Track message"
  });
}

browser.MessageListAction.onClicked.addListener(async message => {
  const current = await browser.storage?.local?.get?.("trackedMessageIds") || {};
  const tracked = new Set(current.trackedMessageIds || []);
  if (tracked.has(message.id)) {
    tracked.delete(message.id);
  } else {
    tracked.add(message.id);
  }
  if (browser.storage?.local) {
    await browser.storage.local.set({trackedMessageIds: [...tracked]});
  }
  await browser.MessageListAction.setState(message.id, {
    active: tracked.has(message.id),
    title: tracked.has(message.id) ? "Stop tracking message" : "Track message"
  });
});

registerAction().catch(console.error);
