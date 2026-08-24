import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({console, Date, Set, Map, Object, Array, String, Number, Boolean, Math, JSON});
for (const name of ["smart", "bulk", "review", "related"]) {
  vm.runInContext(
    fs.readFileSync(path.join(root, "extension/api/pinInbox/modules", `${name}.js`), "utf8"),
    context,
    {filename: `${name}.js`}
  );
}

const now = new Date("2026-08-04T10:00:00Z").getTime();
const hour = 3_600_000;
const day = 86_400_000;
const refs = [
  {stableKey: "late", dueAt: now - hour, updatedAt: now - day, workflowStatus: "active"},
  {stableKey: "today", dueAt: now + hour, updatedAt: now, workflowStatus: "planned"},
  {stableKey: "reply", noReplyTracking: true, noReplyAt: now - hour, updatedAt: now, workflowStatus: "waiting"},
  {stableKey: "wake", snoozeUntil: now + hour, updatedAt: now - day, workflowStatus: "active"},
  {stableKey: "sleep", snoozeUntil: now + 3 * day, updatedAt: now, workflowStatus: "active"},
  {stableKey: "stale", updatedAt: now - 20 * day, workflowStatus: "active"},
];

assert.equal(context.PinSmartViews.matches("snoozed", refs[3], {now}), true);
assert.equal(context.PinSmartViews.matches("today", refs[3], {now}), false);
assert.equal(context.PinSmartViews.sectionFor(refs[4], {now}), "snoozed");

const daily = context.PinReview.build(refs, {now, mode: "daily", staleDays: 14});
assert.equal(daily.counts.overdue, 1);
assert.equal(daily.counts.today, 1);
assert.equal(daily.counts.noReply, 1);
assert.equal(daily.counts.waking, 1);
assert.equal(daily.counts.stale, 1);
assert.equal(daily.actionable, 4);

const reminders = context.PinReview.pendingReminders([
  {stableKey: "pending", reminderFiredAt: now - 1000, reminderAcknowledgedAt: 0},
  {stableKey: "done", reminderFiredAt: now - 1000, reminderAcknowledgedAt: now},
], {now});
assert.deepEqual([...reminders.map(item => item.stableKey)], ["pending"]);

const related = context.PinRelated.detect([
  {stableKey: "a", accountKey: "acc", rootMessageId: "root-1", subject: "Sujet"},
  {stableKey: "b", accountKey: "acc", rootMessageId: "root-1", subject: "Re: Sujet"},
  {stableKey: "c", accountKey: "acc", rootMessageId: "root-2", subject: "Sujet"},
]);
assert.equal(related.length, 1);
assert.deepEqual([...related[0].stableKeys], ["a", "b"]);

const relatedWithoutSubsets = context.PinRelated.detect([
  {stableKey: "a", accountKey: "acc", rootMessageId: "root-1", threadId: 42, subject: "Sujet"},
  {stableKey: "b", accountKey: "acc", rootMessageId: "root-1", threadId: 42, subject: "Re: Sujet"},
  {stableKey: "c", accountKey: "acc", rootMessageId: "root-1", subject: "Re: Sujet"},
]);
assert.equal(relatedWithoutSubsets.length, 1);
assert.deepEqual([...relatedWithoutSubsets[0].stableKeys], ["a", "b", "c"]);

const merged = context.PinRelated.mergeMetadata([
  {stableKey: "a", pinnedAt: now - day, note: "Première note", priorityLevel: "normal", dueAt: now + day, groupId: "g"},
  {stableKey: "b", pinnedAt: now, note: "Deuxième note", priorityLevel: "urgent", dueAt: now + 2 * day, groupId: "g"},
]);
assert.equal(merged.priorityLevel, "urgent");
assert.equal(merged.dueAt, now + day);
assert.match(merged.note, /Première note/);
assert.match(merged.note, /Deuxième note/);
assert.equal(merged.groupId, "g");

assert.equal(context.PinBulk.requiresSingle("snooze"), false);
assert.equal(context.PinBulk.supported("wake"), true);
assert.equal(context.PinBulk.normalizeOptions("snooze", {durationMs: 30_000}).durationMs, 60_000);
assert.equal(context.PinBulk.normalizeOptions("snooze", {until: now + day}).until, now + day);

console.log("MailPin productivity 1.1 model tests: OK");
