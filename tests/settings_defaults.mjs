import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../extension/api/pinInbox/modules/settings.js", import.meta.url),
  "utf8"
);
const context = {console, JSON, Object, Array, Set, String, Number, Boolean, Math};
vm.runInNewContext(source, context, {filename: "settings.js"});

const settings = context.PinSettings;
assert.ok(settings, "The real shared settings module must load");

const plain = value => JSON.parse(JSON.stringify(value));
const recommended = plain(settings.DEFAULTS);
const normalize = value => plain(settings.normalize(value));

// Missing storage, `{}`, null and invalid root values all receive the same
// recommended profile from the single production source of truth.
for (const value of [undefined, null, {}, [], "invalid"]) {
  assert.deepEqual(normalize(value), recommended);
}

// A partial or older configuration is completed without changing choices
// that were explicitly persisted by the user.
const partial = normalize({schemaVersion: 2, showSearch: false, panelScope: "global"});
assert.equal(partial.showSearch, false);
assert.equal(partial.panelScope, "global");
assert.equal(partial.enableGlobalDashboard, true);
assert.equal(partial.schemaVersion, settings.SCHEMA_VERSION);

const previousVersion = normalize({
  schemaVersion: 5,
  enableCalendarIntegration: false,
  enableAutomaticBackups: false,
  enableHealthCenter: false
});
assert.equal(previousVersion.enableCalendarIntegration, false);
assert.equal(previousVersion.enableAutomaticBackups, false);
assert.equal(previousVersion.enableHealthCenter, false);
assert.equal(previousVersion.enableSmartViews, true);

const migratedScope = normalize({panelScope: "currentAccount", selectedAccountKeys: ["account-a", "account-a", "", "account-b"]});
assert.equal(migratedScope.panelScope, "currentInbox");
assert.deepEqual(migratedScope.selectedAccountKeys, ["account-a", "account-b"]);
assert.equal(normalize({panelScope: "selectedAccounts"}).panelScope, "selectedAccounts");
assert.deepEqual(normalize({selectedAccountKeys: ["account-a", "account-a", "user@example.invalid", "", 42]}).selectedAccountKeys, ["account-a"]);
assert.deepEqual(normalize({selectedAccountKeys: Array.from({length: 60}, (_, index) => `account-${index}`)}).selectedAccountKeys.length, 50);

// The runtime filter compares the same canonical Thunderbird account.key used
// by Options and persisted in selectedAccountKeys. An empty selection is empty,
// never an implicit fallback to all accounts.
const scopedRefs = [
  ...Array.from({length: 18}, (_, index) => ({stableKey: `account1-${index}`, accountKey: "account1", sourceInboxURI: "mailbox://a"})),
  ...Array.from({length: 16}, (_, index) => ({stableKey: `account2-${index}`, accountKey: "account2", sourceInboxURI: "mailbox://b"})),
  ...Array.from({length: 16}, (_, index) => ({stableKey: `account3-${index}`, accountKey: "account3", sourceInboxURI: "mailbox://c"}))
];
const selectedScope = selectedAccountKeys => ({panelScope: "selectedAccounts", selectedAccountKeys});
const visibleRefs = selectedAccountKeys => scopedRefs.filter(ref =>
  settings.matchesPanelScope(selectedScope(selectedAccountKeys), ref, "mailbox://a")
);
assert.equal(visibleRefs([]).length, 0);
assert.equal(visibleRefs(["account1"]).length, 18);
assert.equal(visibleRefs(["account2"]).length, 16);
assert.equal(visibleRefs(["account1", "account3"]).length, 34);
assert.equal(visibleRefs(["account1", "account2", "account3"]).length, 50);
assert.ok(visibleRefs(["account1", "account3"]).some(ref => ref.stableKey === "account1-0"));
assert.ok(visibleRefs(["account1", "account3"]).some(ref => ref.stableKey === "account3-0"));
assert.ok(visibleRefs(["account1", "account3"]).every(ref => ref.accountKey !== "account2"));

// Invalid values follow the declared strategy: invalid booleans and enums
// fall back to recommendations, while finite numeric values are clamped.
const invalid = normalize({
  showSearch: "false",
  pinMode: "unknown",
  panelMaxHeight: -500,
  diagnosticMaxEntries: Number.NaN,
  accountColors: {safe: "#ABCDEF", bad: "red", __proto__: {polluted: true}},
  inboxEnabled: {Inbox: false, Invalid: "false"},
  autoPinSenders: ["  synthetic-sender  ", "synthetic-sender"],
  autoPinTags: ["tag", "tag"]
});
assert.equal(invalid.showSearch, recommended.showSearch);
assert.equal(invalid.pinMode, recommended.pinMode);
assert.equal(invalid.panelMaxHeight, 160);
assert.equal(invalid.diagnosticMaxEntries, recommended.diagnosticMaxEntries);
assert.deepEqual(invalid.accountColors, {safe: "#abcdef"});
assert.deepEqual(invalid.inboxEnabled, {Inbox: false});
assert.deepEqual(invalid.autoPinSenders, ["synthetic-sender"]);
assert.deepEqual(invalid.autoPinTags, ["tag"]);

// Reset recommendations are fresh clones and cannot be modified through a
// previous caller.
const firstReset = settings.defaults();
firstReset.showSearch = false;
firstReset.accountColors.sample = "#000000";
const secondReset = settings.defaults();
assert.equal(secondReset.showSearch, true);
assert.deepEqual(plain(secondReset.accountColors), {});

for (const key of [
  "showSearch", "showQuickActions", "showNotes", "showDeadlines",
  "enableConversationPins", "enableCalendarIntegration", "enableGlobalDashboard",
  "enableSmartViews", "enableBulkActions", "enableHealthCenter", "enableDiagnostics",
  "enableCases", "enableKanban", "enableTemplates", "enableAutomaticBackups",
  "enableConcurrentWriteProtection", "enableCounterRegressionGuard"
]) {
  assert.equal(recommended[key], true, `${key} must be active in the recommended profile`);
}

for (const key of [
  "enableAutomaticRules", "autoUnpinOnArchive", "autoCompleteOnArchive",
  "autoUnpinOnRead", "autoUnpinOnReply", "moveToWaitingOnReply",
  "enableBidirectionalCalendarSync", "calendarDeleteOnUnpin",
  "calendarCompleteOnPinComplete", "enableAutomaticNoReplyTracking",
  "enableRecurringFollowUps", "autoCleanup", "safeMode"
]) {
  assert.equal(recommended[key], false, `${key} must remain opt-in`);
}
assert.equal(recommended.showFolderBadge, false, "Native folder counters remain untouched");

const schema = settings.describe();
assert.equal(schema.length, Object.keys(recommended).length);
assert.deepEqual(schema.map(item => item.key).sort(), Object.keys(recommended).sort());
for (const item of schema) {
  assert.equal(item.migration, settings.MIGRATION_STRATEGY);
  assert.ok(["boolean", "number", "string", "array", "record"].includes(item.type));
  assert.ok(Object.prototype.hasOwnProperty.call(item, "defaultValue"));
}

console.log("Shared settings defaults and migration scenarios: OK");
