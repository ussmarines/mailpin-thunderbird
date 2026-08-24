/* Thunderbird Mochitest blueprint.
 * Run in the Thunderbird source test harness after importing this add-on.
 */
"use strict";

add_task(async function test_pin_does_not_change_native_folder_counters() {
  const inbox = await createSubfolder("Counter Guard Inbox");
  await createMessages(inbox, 3);
  const before = {
    unread: inbox.getNumUnread(false),
    total: inbox.getTotalMessages(false),
    newCount: inbox.numNewMessages,
    hasNew: inbox.hasNewMessages,
  };
  const hdr = inbox.messages.getNext();
  // The packaged integration test replaces this callback with pinInbox.toggleSelected.
  await triggerPinForHeader(hdr);
  Assert.deepEqual({
    unread: inbox.getNumUnread(false),
    total: inbox.getTotalMessages(false),
    newCount: inbox.numNewMessages,
    hasNew: inbox.hasNewMessages,
  }, before, "pinning must not alter Thunderbird counters");
});
