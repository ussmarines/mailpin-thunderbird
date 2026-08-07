import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({console, Date, Set, Map, Object, Array, String, Number, Boolean, Math, JSON});
for (const name of ["checklists", "analytics", "tag-sync", "smart", "saved-views"]) {
  vm.runInContext(
    fs.readFileSync(path.join(root, "extension/api/pinInbox/modules", `${name}.js`), "utf8"),
    context,
    {filename: `${name}.js`}
  );
}

const now = new Date("2026-08-07T12:00:00Z").getTime();
const day = 86_400_000;

const rawChecklist = Array.from({length: 55}, (_, index) => ({
  id: `task-${index + 1}`,
  text: `Sous-tâche ${index + 1}`,
  completed: index < 3,
  createdAt: now - day,
  completedAt: index < 3 ? now - 1000 : 0,
}));
const checklist = context.PinChecklists.normalize(rawChecklist);
assert.equal(checklist.length, 50);
assert.deepEqual({...context.PinChecklists.stats(checklist)}, {total: 50, completed: 3, pending: 47, progress: 3 / 50});
assert.match(context.PinChecklists.searchableText(checklist), /Sous-tâche 50/);

const waiting = {stableKey: "waiting", pinnedAt: now - 5 * day, lastOutgoingAt: now - 2 * day, lastReplyAt: now - 3 * day, workflowStatus: "waiting", checklist: [{id:"a",text:"Relancer",completed:false,createdAt:now-day}]};
const needsReply = {stableKey: "reply", pinnedAt: now - 2 * day, lastOutgoingAt: now - 2 * day, lastReplyAt: now - day, workflowStatus: "active", checklist: []};
const neutral = {stableKey: "neutral", pinnedAt: now - day, workflowStatus: "active", checklist: []};
assert.equal(context.PinAnalytics.responseState(waiting), "waitingForThem");
assert.equal(context.PinAnalytics.responseState(needsReply), "needsReply");
assert.equal(context.PinAnalytics.responseState({...needsReply, completedAt: now}), "none");
assert.equal(context.PinSmartViews.matches("waitingForThem", waiting, {now}), true);
assert.equal(context.PinSmartViews.matches("needsReply", needsReply, {now}), true);
assert.equal(context.PinSmartViews.matches("checklistPending", waiting, {now}), true);

const history = [
  {completedAt: now - day, durationMs: 3 * day},
  {completedAt: now - 8 * day, durationMs: 5 * day},
];
const analytics = context.PinAnalytics.build([waiting, needsReply, neutral], history, now, value => context.PinChecklists.stats(value));
assert.equal(analytics.waitingForThem, 1);
assert.equal(analytics.needsReply, 1);
assert.equal(analytics.checklistPending, 1);
assert.equal(analytics.checklistPendingItems, 1);
assert.equal(analytics.completedLast7Days, 1);
assert.equal(analytics.averageCompletionMs, 4 * day);
assert.equal(analytics.longestOpenAgeMs, 5 * day);

const saved = context.PinSavedViews.normalize({
  id: "client-follow-up",
  name: "Clients à relancer",
  smartView: "waitingForThem",
  search: "dupont devis",
  groupId: "clients",
  caseId: "case-1",
  priority: "high",
  responseState: "waitingForThem",
  checklist: "pending",
  createdAt: now,
  updatedAt: now,
});
assert.equal(saved.smartView, "waitingForThem");
assert.equal(context.PinSavedViews.matches(saved, {
  ...waiting,
  groupId: "clients",
  caseId: "case-1",
  priorityLevel: "high",
  responseState: "waitingForThem",
  checklistStats: {total: 1, completed: 0, pending: 1},
  searchText: "devis urgent pour dupont à relancer",
}, {
  normalizeText: value => String(value || "").toLowerCase(),
  smartMatches: view => view === "waitingForThem",
}), true);

assert.deepEqual([...context.PinTagSync.desiredKeys({workflowStatus:"active", priorityLevel:"urgent", noReplyTracking:true})], [
  "mailperch-active", "mailperch-important", "mailperch-follow-up"
]);
assert.deepEqual([...context.PinTagSync.desiredKeys({workflowStatus:"completed", completedAt:now})], ["mailperch-completed"]);

console.log("MailPerch productivity 1.2 model tests: OK");
