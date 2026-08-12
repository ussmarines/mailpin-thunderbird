import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({console, Date, Set, Map, Object, Array, String, Number, Boolean, Math, JSON});
for (const name of ["smart", "health", "providers", "migrations", "performance", "bulk", "localization"]) {
  const source = fs.readFileSync(path.join(root, "extension/api/pinInbox/modules", `${name}.js`), "utf8");
  vm.runInContext(source, context, {filename: `${name}.js`});
}

const now = new Date("2026-07-31T12:00:00Z").getTime();
const refs = [
  {stableKey: "overdue", dueAt: now - 1000, workflowStatus: "active"},
  {stableKey: "today", dueAt: now + 1000, workflowStatus: "active"},
  {stableKey: "waiting", workflowStatus: "waiting"},
  {stableKey: "reply", noReplyTracking: true, noReplyAt: now - 1000},
  {stableKey: "done", workflowStatus: "completed", completedAt: now - 1000},
];
assert.equal(context.PinSmartViews.matches("overdue", refs[0], {now}), true);
assert.equal(context.PinSmartViews.matches("today", refs[1], {now}), true);
assert.equal(context.PinSmartViews.matches("waiting", refs[2], {now}), true);
assert.equal(context.PinSmartViews.matches("noReply", refs[3], {now}), true);
assert.equal(context.PinSmartViews.counts(refs, now).all, 5);

const health = context.PinHealth.build({
  now,
  data: {refs: {missing: {missingSince: now - 1}, orphan: {groupId: "gone"}, late: {dueAt: now - 1}}, groups: [], cases: [], templates: []},
  integrity: {ok: true}, diagnostics: {counts: {error: 0}}, compatibility: {reduced: false}, performance: {lastRenderMs: 20}, backup: {stale: false}
});
assert.ok(health.score < 100);
assert.ok(health.issues.some(item => item.id === "missing-messages"));
assert.ok(health.issues.some(item => item.id === "orphan-links"));

assert.equal(context.PinProviders.providerFor({hostName: "imap.gmail.com", type: "imap"}), "gmail");
assert.equal(context.PinProviders.providerFor({hostName: "outlook.office365.com", type: "imap"}), "microsoft");
const matrix = context.PinProviders.matrix([{key: "a", name: "Gmail", server: {hostName: "imap.gmail.com", type: "imap"}, inboxes: [{}]}], [{id: "cal", writable: true, taskCompatible: true}]);
assert.equal(matrix.accounts[0].provider, "gmail");
assert.equal(matrix.calendars[0].writable, true);

const unsafe = JSON.parse('{"format":"pin-mails-backup","version":6,"data":{"refs":{"__proto__":{"updatedAt":2}}}}');
assert.equal(context.PinMigrations.analyze(unsafe, {}).valid, false);
const merged = context.PinMigrations.merge(
  {schemaVersion: 6, refs: {a: {updatedAt: 2, subject: "current"}}, groups: [], rules: [], cases: [], templates: [], history: [], ruleLog: [], activity: []},
  {schemaVersion: 6, refs: {a: {updatedAt: 1, subject: "old"}, b: {updatedAt: 3}}, groups: [], rules: [], cases: [], templates: [], history: [], ruleLog: [], activity: []}
);
assert.equal(merged.refs.a.subject, "current");
assert.ok(merged.refs.b);

assert.deepEqual([...context.PinBulk.normalizeKeys([" a ", "a", "b", ""])], ["a", "b"]);
assert.equal(context.PinBulk.isDestructive("delete"), true);
assert.equal(context.PinBulk.requiresSingle("calendar"), true);
assert.equal(context.PinBulk.normalizeOptions("trackNoReply", {days: 999}).days, 365);

assert.equal(context.PinLocalization.language("en-US"), "en");
assert.equal(context.PinLocalization.t("en", "moreActions", "fallback"), "More actions");
assert.equal(context.PinLocalization.interpolate("{count} items", {count: 3}), "3 items");

const tokenA = context.PinPerformance.cardToken({ref: {stableKey: "a", updatedAt: 1}}, {cardLines: 2});
const tokenB = context.PinPerformance.cardToken({ref: {stableKey: "a", updatedAt: 2}}, {cardLines: 2});
assert.notEqual(tokenA, tokenB);
assert.equal(context.PinPerformance.listSignature([], {mode: "panel"}).startsWith("panel"), true);

console.log("MailPin 3.2 model tests: OK");
