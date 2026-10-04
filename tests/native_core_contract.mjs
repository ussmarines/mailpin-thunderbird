import assert from "node:assert/strict";
import {NativeCore, STATE_KEY} from "../extension/native/core.js";
import {TAG_SPECS} from "../extension/native/tags.js";
import {PIN_MODULES} from "../extension/native/model.js";

const stored = {};
let failWrite = false;
const updates = [];
const notifications = [];
const definitions = [{key: "personal", tag: "Personal", color: "#123456"}];
const messages = [1, 2, 3].map(id => ({id, headerMessageId: `message-${id}@test`, author: "sender@test",
  subject: `Project ${id}`, date: new Date().toISOString(), read: false, tags: ["personal"],
  folder: {id: "folder-test", accountId: "account1", name: "Inbox"}}));
const api = {
  storage: {local: {get: async () => structuredClone(stored), set: async value => {
    if (failWrite) throw new Error("quota"); Object.assign(stored, structuredClone(value));
  }}},
  messages: {query: async query => ({messages: messages.filter(message => !query.headerMessageId || message.headerMessageId === query.headerMessageId)}),
    getHeaders: async id => ({references: id === 2 ? ["<message-1@test>"] : []}),
    get: async id => structuredClone(messages.find(message => message.id === id)),
    abortList: async () => {},
    update: async (id, value) => { updates.push({id, value}); Object.assign(messages.find(message => message.id === id), value); },
    tags: {list: async () => structuredClone(definitions), create: async (key, tag, color) => {
      if (definitions.some(item => item.key === key)) throw new Error("collision");
      definitions.push({key, tag, color}); return key;
    }, delete: async key => { definitions.splice(definitions.findIndex(item => item.key === key), 1); }}},
  accounts: {list: async () => [{id: "account1", name: "Local test", type: "none"}]},
  permissions: {contains: async () => true},
  mailTabs: {getSelectedMessages: async id => ({messages: [messages[id - 1]]})},
  messageDisplay: {getDisplayedMessages: async () => ({messages: []}), open: async value => value},
  tabs: {query: async () => []},
  action: {setBadgeText: async () => {}},
  alarms: {clearAll: async () => {}, create: async () => {}}, notifications: {create: async id => { notifications.push(id); }},
  i18n: {getMessage: key => key}
};
const core = new NativeCore(api);
await Promise.all([core.dispatch("toggleSelected", [1]), core.dispatch("toggleSelected", [2])]);
assert.equal(Object.keys(stored[STATE_KEY].data.refs).length, 2, "serialized concurrent pins");
assert.equal(messages[0].read, false); assert.equal(messages[1].read, false);
assert.ok(updates.every(update => Object.keys(update.value).every(key => key === "tags")), "pin changes tags only");
assert.ok(messages.every(message => message.tags.includes("personal")));
const key = "account1|mid:message-1@test";
await core.dispatch("updateReferenceDetails", [key, {note: "important project note", checklist: [{id: "one", text: "Call", done: false}]}]);
await core.dispatch("setWorkflowStatus", [[key], "waiting"]);
await core.dispatch("performReferenceAction", [[key], "snooze", {durationMs: 60000}]);
const data = await core.dispatch("getDashboardData", [{view: "list", smartView: "all", search: "important call"}]);
assert.equal(data.items.length, 1); assert.equal(data.items[0].checklistStats.pending, 1);
assert.equal(data.items[0].workflowStatus, "waiting"); assert.ok(data.items[0].snoozeUntil > Date.now());
const groupConfig = await core.dispatch("setConfiguration", [{groups: [{id: "project", name: "Project", color: "#123456"}]}]);
assert.equal(groupConfig.groups.length, 1);
const caseItem = await core.dispatch("createCase", [{name: "Case", color: "#123456"}]);
const template = await core.dispatch("createTemplate", [{name: "Template", workflowStatus: "planned", notePrefix: "Plan"}]);
await core.dispatch("performReferenceAction", [[key], "case", {caseId: caseItem.id}]);
await core.dispatch("applyTemplate", [[key], template.id]);
const view = await core.dispatch("createSavedView", [{name: "Projects", smartView: "all", search: "project"}]);
assert.ok(view.id);
await core.dispatch("performReferenceAction", [[key], "complete"]);
assert.ok((await core.dispatch("getHistory", [{}])).length);
await core.dispatch("setNoReplyTracking", [[key], {days: 3}]);
assert.equal(stored[STATE_KEY].data.refs[key].noReplyTracking, true);
const backup = await core.dispatch("exportConfiguration");
assert.equal((await core.dispatch("previewImport", [backup])).valid, true);
const bad = structuredClone(backup); bad.data.refs[key].note = "x".repeat(4001);
assert.equal((await core.dispatch("previewImport", [bad])).valid, false);
const corrupt = PIN_MODULES.PinStorageHelpers.backupEnvelope(backup.data, [], {schemaVersion: 7});
corrupt.checksum = "wrong";
assert.ok((await core.dispatch("previewImport", [corrupt])).errors.includes("checksum-mismatch"));
const prior = JSON.stringify(stored[STATE_KEY]);
failWrite = true;
await assert.rejects(core.dispatch("restoreConfiguration", [backup, "replace"]), /quota/);
assert.equal(JSON.stringify(stored[STATE_KEY]), prior, "safety backup failure preserves current state");
await assert.rejects(core.dispatch("updateReferenceDetails", [key, {note: "lost"}]), /quota/);
assert.equal(JSON.stringify(stored[STATE_KEY]), prior);
failWrite = false;
await core.dispatch("restoreConfiguration", [backup, "merge"]);
assert.ok(stored.mailpinNative220BeforeRestore);
assert.equal(stored[STATE_KEY].settings.enableAutomaticRules, false);
assert.equal(stored[STATE_KEY].settings.enableThunderbirdTagSync, false);
assert.equal(stored[STATE_KEY].data.refs[key].note, backup.data.refs[key].note);
await core.dispatch("setConfiguration", [{settings: {enableThunderbirdTagSync: true}}]);
const tag = definitions.find(item => item.key === TAG_SPECS.followup.key);
tag.tag = "Personal takeover";
await core.dispatch("setConfiguration", [{settings: {enableThunderbirdTagSync: false}}]);
assert.ok(definitions.some(item => item.key === tag.key && item.tag === "Personal takeover"));
assert.ok(messages[0].tags.includes(tag.key), "never removes a personal takeover key");
assert.ok(definitions.some(item => item.key === "personal"));
await assert.rejects(core.dispatch("notAnApi", []));
await assert.rejects(core.dispatch("setConfiguration", [JSON.parse('{"__proto__":{"polluted":true}}')]));
const snapshot = structuredClone(stored[STATE_KEY]); stored[STATE_KEY].checksum = "bad";
await assert.rejects(core.dispatch("getConfiguration"), /damaged/);
assert.equal(stored[STATE_KEY].checksum, "bad", "corrupted storage never overwritten");
stored[STATE_KEY] = snapshot;
// Rule matching is behavioral, not a source-token assertion.
await core.dispatch("setConfiguration", [{rules: [{id: "match", name: "Match", enabled: true, trigger: "messageAdded", subjectContains: "Project", action: "status", workflowStatus: "waiting"}]}]);
const simulation = await core.dispatch("simulateRules", [{trigger: "messageAdded"}]);
assert.ok(simulation.matched > 0); assert.equal(simulation.applied, 0);
const rules = await core.dispatch("runRules", [{trigger: "messageAdded"}]);
assert.ok(rules.applied > 0);
assert.equal((await core.dispatch("runRules", [{trigger: "messageAdded"}])).applied, 0, "anti-loop guard");
// Reproductions from the migration review, each starting with an empty store.
for (const name of Object.keys(stored)) delete stored[name];
definitions.splice(1);
messages.forEach(message => { message.tags = ["personal"]; });
await core.dispatch("toggleConversationSelected", [1]);
await core.dispatch("toggleSelected", [1]);
await core.dispatch("setWorkflowStatus", [[key], "completed"]);
assert.ok(messages[0].tags.includes(TAG_SPECS.followup.key), "active conversation owns a union of desired tags");
const linked = await core.dispatch("exportConfiguration");
linked.data.cases = [{id: "linked", name: "Linked case", calendarId: "cal1", calendarItemId: "item1"}];
await core.dispatch("restoreConfiguration", [linked, "replace"]);
assert.equal(stored[STATE_KEY].data.cases[0].calendarId, "cal1");
assert.equal(stored[STATE_KEY].data.cases[0].calendarItemId, "item1");
const legacy = await core.dispatch("exportConfiguration");
legacy.data.refs = {"account1|gmail:123": {...legacy.data.refs[key], stableKey: "account1|gmail:123"}};
legacy.data.manualOrder = ["account1|gmail:123"];
legacy.data.refs["account1|gmail:123"].accountKey = "legacy-internal-key";
legacy.data.refs["account1|gmail:123"].lastFolderURI = "imap://legacy-profile/inbox";
await core.dispatch("restoreConfiguration", [legacy, "replace"]);
assert.equal((await core.dispatch("getSelectionState", [1])).allPinned, true);
await core.dispatch("toggleSelected", [1, true]);
assert.deepEqual(Object.keys(stored[STATE_KEY].data.refs), ["account1|gmail:123"], "legacy strong identity preserves key and metadata");
const full = await core.dispatch("exportConfiguration");
full.data.groups = Array.from({length: 40}, (_, index) => ({id: `g${index}`, name: `Group ${index}`}));
await core.dispatch("restoreConfiguration", [full, "replace"]);
const incoming = structuredClone(full); incoming.data.groups = [{id: "new-group", name: "New"}];
const beforeMerge = JSON.stringify(stored[STATE_KEY]);
await assert.rejects(core.dispatch("restoreConfiguration", [incoming, "merge"]), /lossy-groups/);
assert.equal(JSON.stringify(stored[STATE_KEY]), beforeMerge, "merge overflow leaves current state intact");
const clearAll = api.alarms.clearAll;
api.alarms.clearAll = async () => { throw new Error("alarms unavailable"); };
await core.dispatch("updateReferenceDetails", ["account1|gmail:123", {note: "committed despite synchronization error"}]);
assert.equal(core._data.refs["account1|gmail:123"].note, stored[STATE_KEY].data.refs["account1|gmail:123"].note);
api.alarms.clearAll = clearAll;
await core.dispatch("quickCaptureSelected", [2, "noReply"]);
assert.equal(stored[STATE_KEY].data.refs["account1|mid:message-2@test"].rootMessageId, "message-1@test");
const pending = await core.dispatch("exportConfiguration");
pending.data.refs["account1|mid:message-2@test"].noReplyAt = Date.now() - 1000;
pending.data.refs["account1|mid:message-2@test"].followUpAt = Date.now() - 1000;
await core.dispatch("restoreConfiguration", [pending, "replace"]);
await core.dispatch("onAlarm");
await core.dispatch("onAlarm");
assert.equal(notifications.length, 1, "missed local reminder fires once and is persisted");
assert.ok(stored[STATE_KEY].data.refs["account1|mid:message-2@test"].reminderFiredAt);
await core.dispatch("performReferenceAction", [["account1|mid:message-2@test"], "snooze", {durationMs: 60000}]);
assert.equal(stored[STATE_KEY].data.refs["account1|mid:message-2@test"].reminderFiredAt, 0, "snooze explicitly re-arms reminder");
console.log("PASS native core: concurrency, metadata, search, workflow, import rollback/limits, personal and overlapping tags, legacy identity, rules, corruption, quick capture, post-commit consistency");
