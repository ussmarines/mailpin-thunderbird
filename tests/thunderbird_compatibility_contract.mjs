import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({console, Date, Set, Map, Object, Array, String, Number, Boolean, Math, JSON, Error});
for (const name of ["thunderbird-messages", "thunderbird-tags", "thunderbird-calendar", "compatibility"]) {
  vm.runInContext(
    fs.readFileSync(path.join(root, "extension/api/pinInbox/modules", `${name}.js`), "utf8"),
    context,
    {filename: `${name}.js`}
  );
}

const tagRegistry = new Map();
const tagColors = new Map();
const listeners = new Set();
const account = {key: "acc-1", incomingServer: {key: "server-1", prettyName: "Compte", rootFolder: null}};
const indexedAccount = {key: "acc-2", incomingServer: {key: "server-2", prettyName: "Compte indexé", rootFolder: null}};
const MailServices = {
  accounts: {
    accounts: [account],
    allIdentities: [{email: "Me@Example.test"}, {email: ""}],
    findAccountForServer(server) { return server?.account || null; },
  },
  folderLookup: {
    getFolderForURL(uri) { return uri === "mailbox://known" ? {URI: uri} : null; },
  },
  mfn: {
    msgAdded: 1, msgsDeleted: 2, msgsMoveCopyCompleted: 4, msgsClassified: 8,
    msgPropertyChanged: 16, msgKeyChanged: 32, folderRenamed: 64,
    addListener(listener, flags) { listeners.add(listener); this.lastFlags = flags; },
    removeListener(listener) { listeners.delete(listener); },
  },
  tags: {
    isValidKey(key) { return tagRegistry.has(key); },
    getTagForKey(key) { return tagRegistry.get(key) || ""; },
    getColorForKey(key) { return tagColors.get(key) || ""; },
    setColorForKey(key, color) { tagColors.set(key, color); },
    addTagForKey(key, label, color) { tagRegistry.set(key, label); tagColors.set(key, color); },
    deleteKey(key) { tagRegistry.delete(key); tagColors.delete(key); },
  },
  compose: {OpenComposeWindow() { MailServices.compose.opened = true; }},
};
const MailUtils = {
  displayMessageInFolderTab(header, foreground) { assert.equal(header.id, "msg-1"); assert.equal(foreground, true); },
  displayMessage(header) { assert.equal(header.id, "msg-1"); },
  getIdentityForHeader() { return [{email: "me@example.test"}]; },
};
class MessageArchiver {
  archiveMessages(headers) { this.headers = headers; this.oncomplete?.(); MessageArchiver.last = this; }
}
const Ci = {
  nsIMsgAccount: "nsIMsgAccount",
  nsIMsgFolder: "nsIMsgFolder",
  nsIMsgDBHdr: "nsIMsgDBHdr",
  nsIMsgCompType: {ReplyToSender: 1},
  nsIMsgCompFormat: {Default: 2},
};
const ChromeUtils = {generateQI: interfaces => function() { return interfaces; }};

function dateTime(value) {
  const jsDate = value instanceof Date ? value : new Date(value);
  return {jsDate};
}
class CalendarItem {
  constructor(type) { this.type = type; this.properties = new Map(); this.id = `${type}-id`; }
  setProperty(key, value) { this.properties.set(key, value); }
}
class CalEvent extends CalendarItem { constructor() { super("event"); } }
class CalTodo extends CalendarItem { constructor() { super("task"); } }
const writableCalendar = {
  id: "cal-1", name: "Local", type: "storage", readOnly: false,
  getProperty(name) {
    if (name === "disabled") return false;
    if (name === "capabilities.tasks.supported") return true;
    if (name === "capabilities.events.supported") return true;
    return null;
  },
};
const readOnlyCalendar = {
  id: "cal-ro", name: "Lecture seule", type: "caldav", readOnly: true,
  getProperty() { return false; },
};
const cal = {
  manager: {getCalendars() { return [writableCalendar, readOnlyCalendar]; }},
  acl: {isCalendarWritable(calendar) { return !calendar.readOnly; }},
  dtz: {jsDateToDateTime: dateTime},
};

const compatibility = context.PinCompatibility.create({
  MailServices, MailUtils, MessageArchiver, ChromeUtils, Ci, cal, CalEvent, CalTodo, ExtensionError: Error,
});
assert.ok(compatibility.messages);
assert.ok(compatibility.tags);
assert.ok(compatibility.calendar);

// Thunderbird may expose accounts as an XPCOM indexed collection rather than
// an iterable array. Options account selection must support both forms.
MailServices.accounts.accounts = {
  length: 1,
  queryElementAt(index, interfaceName) {
    assert.equal(index, 0);
    assert.equal(interfaceName, "nsIMsgAccount");
    return indexedAccount;
  }
};
assert.equal(compatibility.messages.accountList()[0]?.key, indexedAccount.key);
MailServices.accounts.accounts = [account];

// Messages: account/folder traversal, listener lifecycle and actions remain behind one adapter.
const child = {URI: "mailbox://child", QueryInterface() { return this; }, subFolders: []};
const rootFolder = {
  URI: "mailbox://root",
  server: {key: "server-1", prettyName: "Server"},
  subFolders: [child],
};
rootFolder.server.account = account;
account.incomingServer.rootFolder = rootFolder;
assert.deepEqual([...compatibility.messages.identityEmails()], ["me@example.test"]);
assert.equal(compatibility.messages.accountKeyForAccount(account), "acc-1");
assert.equal(compatibility.messages.accountForFolder(rootFolder), account);
assert.equal(compatibility.messages.accountKeyForFolder(rootFolder), "acc-1");
assert.equal(compatibility.messages.accountKeyForFolder({server: {key: "server-1"}}), "acc-1");
assert.equal(compatibility.messages.accountKeyForFolder({server: {key: "server-missing"}}), "unknown");
assert.equal(compatibility.messages.accountNameForFolder(rootFolder), "Compte");
assert.equal(Array.from(compatibility.messages.walkFolders(rootFolder), folder => folder.URI).join("|"), "mailbox://root|mailbox://child");
assert.equal(compatibility.messages.folderForURL("mailbox://known")?.URI, "mailbox://known");

let added = 0;
const registration = compatibility.messages.registerFolderListener({msgAdded() { added += 1; }});
assert.equal(registration.registered, true);
assert.equal(listeners.size, 1);
registration.listener.msgAdded({id: "x"});
assert.equal(added, 1);
registration.dispose();
registration.dispose();
assert.equal(listeners.size, 0);

const msgHeader = {id: "msg-1", folder: {getUriForMsg() { return "mailbox-message://1"; }}};
assert.equal(compatibility.messages.displayMessageInFolderTab(msgHeader), true);
assert.equal(compatibility.messages.displayMessage(msgHeader), true);
assert.equal(compatibility.messages.openReply(msgHeader), true);
let archiveCompleted = false;
assert.equal(compatibility.messages.archive([msgHeader], null, () => { archiveCompleted = true; }), true);
assert.equal(archiveCompleted, true);
assert.deepEqual(MessageArchiver.last.headers, [msgHeader]);

// Tags: collision validation is atomic, ownership is label-based, user tags are never removed.
const definitions = [
  {key: "mailperch-active", label: "MailPerch / Active", color: "#0f6cbd"},
  {key: "mailperch-waiting", label: "MailPerch / Waiting", color: "#8a3700"},
];
compatibility.tags.ensureDefinitions(definitions);
assert.deepEqual([...compatibility.tags.ownedKeys(definitions)].sort(), ["mailperch-active", "mailperch-waiting"]);
tagRegistry.set("personal", "Personnel");
tagColors.set("personal", "#123456");
const headerWithTags = {getStringProperty() { return "mailperch-active personal"; }};
assert.deepEqual([...compatibility.tags.keywordsForHeader(headerWithTags)].sort(), ["mailperch-active", "personal"]);
assert.equal(compatibility.tags.metadataForHeader(headerWithTags, 10).length, 2);
const folderOps = [];
const keywordFolder = {
  addKeywordsToMessages(headers, keys) { folderOps.push(["add", headers.length, keys]); },
  removeKeywordsFromMessages(headers, keys) { folderOps.push(["remove", headers.length, keys]); },
};
compatibility.tags.batchKeywords([{folder: keywordFolder}, {folder: keywordFolder}], ["mailperch-waiting"], true);
assert.deepEqual(folderOps, [["add", 2, "mailperch-waiting"]]);
compatibility.tags.removeDefinitions(definitions);
assert.equal(tagRegistry.get("personal"), "Personnel");

tagRegistry.set("mailperch-active", "Un autre tag");
assert.throws(() => compatibility.tags.ensureDefinitions(definitions), /n’appartient pas à MailPerch/);
assert.equal(tagRegistry.has("mailperch-waiting"), false, "collision validation must not partially create tags");
tagRegistry.delete("mailperch-active");

// Agenda: capability/ACL decisions and item construction are centralized.
const writable = compatibility.calendar.descriptor(writableCalendar);
assert.equal(writable.writable, true);
assert.equal(writable.taskCompatible, true);
assert.equal(writable.eventCompatible, true);
const readOnly = compatibility.calendar.descriptor(readOnlyCalendar);
assert.equal(readOnly.writable, false);
assert.equal(readOnly.taskCompatible, false);
assert.equal(compatibility.calendar.calendarById("cal-1"), writableCalendar);
const event = compatibility.calendar.createItem("event", {calendar: writableCalendar, title: "Réunion", startAt: 1_700_000_000_000, properties: {DESCRIPTION: "Test"}});
assert.equal(event.type, "event");
assert.equal(event.title, "Réunion");
assert.equal(event.calendar, writableCalendar);
assert.equal(event.properties.get("DESCRIPTION"), "Test");
assert.equal(event.endDate.jsDate.getTime() - event.startDate.jsDate.getTime(), 3_600_000);
const task = compatibility.calendar.createItem("task", {title: "Action", dueAt: 1_700_000_000_000});
compatibility.calendar.applyCompletion(task, 1_700_000_100_000);
assert.equal(task.percentComplete, 100);
assert.equal(task.status, "COMPLETED");
compatibility.calendar.applySchedule(task, "task", 0);
assert.equal(task.dueDate, null);

const snapshot = compatibility.snapshot();
assert.equal(snapshot.groups.messages.folderNotifications, true);
assert.equal(snapshot.groups.tags.registry, true);
assert.equal(snapshot.groups.calendar.manager, true);
assert.deepEqual([...snapshot.missing], []);

const degraded = context.PinCompatibility.create({MailServices: {}, MailUtils: {}, ChromeUtils: {}, Ci: {}}).snapshot();
assert.ok(degraded.missing.includes("messages.folderLookup"));
assert.ok(degraded.missing.includes("tags.registry"));
assert.ok(degraded.missing.includes("calendar.manager"));

console.log("Thunderbird compatibility adapter contracts: OK");
