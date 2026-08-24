(function(scope) {
  "use strict";

  const DAY = 86_400_000;

  function isCompleted(ref) {
    return Boolean(ref?.completedAt || ref?.workflowStatus === "completed");
  }

  function responseState(ref) {
    if (!ref || isCompleted(ref)) return "none";
    const outgoing = Math.max(0, Number(ref.lastOutgoingAt) || 0);
    const incoming = Math.max(0, Number(ref.lastReplyAt) || 0);
    if (incoming > outgoing) return "needsReply";
    if (outgoing > incoming) return "waitingForThem";
    if (ref.workflowStatus === "waiting" || ref.noReplyTracking) return "waitingForThem";
    return "none";
  }

  function ageMs(ref, now = Date.now()) {
    if (!ref || isCompleted(ref)) return 0;
    const start = Math.max(0, Number(ref.pinnedAt) || Number(ref.updatedAt) || 0);
    return start ? Math.max(0, Number(now) - start) : 0;
  }

  function waitingAgeMs(ref, now = Date.now()) {
    if (responseState(ref) !== "waitingForThem") return 0;
    const start = Math.max(0, Number(ref.waitingSince) || 0, Number(ref.lastOutgoingAt) || 0) || Math.max(0, Number(ref.updatedAt) || Number(ref.pinnedAt) || 0);
    return start ? Math.max(0, Number(now) - start) : 0;
  }

  function average(values) {
    const numbers = values.map(Number).filter(Number.isFinite).filter(value => value >= 0);
    return numbers.length ? Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length) : 0;
  }

  function build(refs = [], history = [], now = Date.now(), checklistStats = () => ({pending: 0})) {
    const activeRefs = refs.filter(ref => !isCompleted(ref));
    const completedHistory = history.filter(item => Number(item?.completedAt || 0) > 0);
    const openAges = activeRefs.map(ref => ageMs(ref, now));
    const waitingAges = activeRefs.map(ref => waitingAgeMs(ref, now)).filter(Boolean);
    const completionDurations = completedHistory.map(item => Math.max(0, Number(item.durationMs) || 0)).filter(Boolean);
    const last7Days = Number(now) - 7 * DAY;
    return {
      waitingForThem: activeRefs.filter(ref => responseState(ref) === "waitingForThem").length,
      needsReply: activeRefs.filter(ref => responseState(ref) === "needsReply").length,
      checklistPending: activeRefs.filter(ref => Number(checklistStats(ref.checklist).pending || 0) > 0).length,
      checklistPendingItems: activeRefs.reduce((sum, ref) => sum + Number(checklistStats(ref.checklist).pending || 0), 0),
      averageOpenAgeMs: average(openAges),
      longestOpenAgeMs: openAges.length ? Math.max(...openAges) : 0,
      averageWaitingAgeMs: average(waitingAges),
      averageCompletionMs: average(completionDurations),
      completedLast7Days: completedHistory.filter(item => Number(item.completedAt) >= last7Days).length
    };
  }

  scope.PinAnalytics = Object.freeze({DAY, isCompleted, responseState, ageMs, waitingAgeMs, build});
})(this);
