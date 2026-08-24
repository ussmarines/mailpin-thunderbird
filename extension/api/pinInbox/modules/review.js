(function(scope) {
  "use strict";

  const DAY = 86_400_000;
  const REVIEW_BUCKETS = Object.freeze([
    {id: "overdue", labelKey: "reviewOverdue", fallback: "En retard"},
    {id: "today", labelKey: "reviewToday", fallback: "À faire aujourd’hui"},
    {id: "noReply", labelKey: "reviewNoReply", fallback: "Sans réponse"},
    {id: "waking", labelKey: "reviewWaking", fallback: "Réveillés aujourd’hui"},
    {id: "waiting", labelKey: "reviewWaiting", fallback: "En attente"},
    {id: "stale", labelKey: "reviewStale", fallback: "Sans activité récente"},
    {id: "upcoming", labelKey: "reviewUpcoming", fallback: "À venir"}
  ]);

  function startOfDay(now = Date.now()) {
    const date = new Date(Number(now) || Date.now());
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  function positiveMinimum(values) {
    const candidates = values.map(Number).filter(value => Number.isFinite(value) && value > 0);
    return candidates.length ? Math.min(...candidates) : 0;
  }

  function dueFor(ref) {
    return positiveMinimum([ref?.followUpAt, ref?.dueAt, ref?.noReplyAt]);
  }

  function isCompleted(ref) {
    return Boolean(ref?.completedAt || ref?.workflowStatus === "completed");
  }

  function isSnoozed(ref, now = Date.now()) {
    return !isCompleted(ref) && Number(ref?.snoozeUntil || 0) > Number(now || Date.now());
  }

  function bucketFor(ref, context = {}) {
    const now = Number(context.now) || Date.now();
    const today = startOfDay(now);
    const tomorrow = today + DAY;
    const horizon = context.mode === "weekly" ? today + DAY * 7 : tomorrow;
    const staleDays = Math.max(1, Math.min(365, Number(context.staleDays) || 14));
    const due = dueFor(ref);
    const snoozeUntil = Number(ref?.snoozeUntil || 0);

    if (isCompleted(ref)) return "completed";
    if (snoozeUntil > now) return snoozeUntil < horizon ? "waking" : "snoozed";
    if (ref?.noReplyTracking && Number(ref.noReplyAt || 0) > 0 && ref.noReplyAt <= now) return "noReply";
    if (due && due < now) return "overdue";
    if (due && due < tomorrow) return "today";
    if (ref?.workflowStatus === "waiting") return "waiting";
    if (due && due < horizon) return "upcoming";
    const lastActivity = Math.max(Number(ref?.updatedAt || 0), Number(ref?.lastReplyAt || 0), Number(ref?.lastOutgoingAt || 0), Number(ref?.pinnedAt || 0));
    if (!due && lastActivity > 0 && now - lastActivity >= staleDays * DAY) return "stale";
    return "later";
  }

  function sortTimestamp(ref) {
    return positiveMinimum([ref?.snoozeUntil, ref?.noReplyAt, ref?.followUpAt, ref?.dueAt]) || Number(ref?.updatedAt || ref?.pinnedAt || 0);
  }

  function build(items, options = {}) {
    const now = Number(options.now) || Date.now();
    const mode = options.mode === "weekly" ? "weekly" : "daily";
    const staleDays = Math.max(1, Math.min(365, Number(options.staleDays) || 14));
    const buckets = Object.fromEntries(REVIEW_BUCKETS.map(bucket => [bucket.id, []]));

    for (const raw of Array.isArray(items) ? items : []) {
      const item = raw?.ref || raw;
      const bucket = bucketFor(item, {now, mode, staleDays});
      if (buckets[bucket]) buckets[bucket].push(raw);
    }
    for (const entries of Object.values(buckets)) {
      entries.sort((left, right) => sortTimestamp(left?.ref || left) - sortTimestamp(right?.ref || right));
    }
    const counts = Object.fromEntries(Object.entries(buckets).map(([id, entries]) => [id, entries.length]));
    return {
      mode,
      generatedAt: now,
      staleDays,
      buckets,
      counts,
      actionable: counts.overdue + counts.today + counts.noReply + counts.waking,
      total: Object.values(counts).reduce((sum, value) => sum + value, 0)
    };
  }

  function pendingReminders(items, options = {}) {
    const now = Number(options.now) || Date.now();
    const windowMs = Math.max(60_000, Math.min(30 * DAY, Number(options.windowMs) || 7 * DAY));
    return (Array.isArray(items) ? items : [])
      .filter(item => !isCompleted(item) && Number(item?.reminderFiredAt || 0) > Number(item?.reminderAcknowledgedAt || 0) && now - Number(item.reminderFiredAt) <= windowMs)
      .sort((left, right) => Number(right.reminderFiredAt || 0) - Number(left.reminderFiredAt || 0));
  }

  scope.PinReview = Object.freeze({DAY, REVIEW_BUCKETS, startOfDay, dueFor, isCompleted, isSnoozed, bucketFor, build, pendingReminders});
})(this);
