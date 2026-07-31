(function(scope) {
  "use strict";
  const DAY = 86400000;

  function addMonths(timestamp, months) {
    const date = new Date(timestamp);
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, last));
    return date.getTime();
  }

  function nextOccurrence(base, rule, interval = 1) {
    const safeBase = Number(base) || Date.now();
    const count = Math.max(1, Math.min(100, Number(interval) || 1));
    switch (rule) {
      case "daily": return safeBase + DAY * count;
      case "weekdays": {
        const date = new Date(safeBase);
        let remaining = count;
        while (remaining > 0) {
          date.setDate(date.getDate() + 1);
          if (![0, 6].includes(date.getDay())) remaining--;
        }
        return date.getTime();
      }
      case "weekly": return safeBase + DAY * 7 * count;
      case "monthly": return addMonths(safeBase, count);
      case "quarterly": return addMonths(safeBase, 3 * count);
      case "yearly": return addMonths(safeBase, 12 * count);
      default: return 0;
    }
  }

  function nextFutureOccurrence(base, rule, interval = 1, now = Date.now()) {
    const safeBase = Number(base) || Date.now();
    const count = Math.max(1, Math.min(100, Number(interval) || 1));
    let next = nextOccurrence(safeBase, rule, count);
    if (!next || next > now) return next;

    const fixedStep = rule === "daily" ? DAY * count : rule === "weekly" ? DAY * 7 * count : 0;
    if (fixedStep) {
      const jumps = Math.floor((now - safeBase) / fixedStep) + 1;
      return safeBase + jumps * fixedStep;
    }

    let guard = 0;
    while (next && next <= now && guard++ < 10000) {
      next = nextOccurrence(next, rule, count);
    }
    return next > now ? next : 0;
  }

  function statusForReference(ref) {
    if (ref?.completedAt || ref?.workflowStatus === "completed") return "completed";
    if (ref?.workflowStatus === "waiting") return "waiting";
    if (ref?.workflowStatus === "planned") return "planned";
    return "active";
  }

  function kanbanColumn(ref) {
    return statusForReference(ref);
  }

  function archiveRecord(ref, action, extra = {}) {
    const completedAt = Number(ref.completedAt || Date.now());
    return {
      ...extra,
      id: `history-${completedAt}-${Math.random().toString(36).slice(2, 9)}`,
      stableKey: String(ref.stableKey || ""),
      subject: String(ref.subject || ""),
      author: String(ref.author || ""),
      accountKey: String(ref.accountKey || ""),
      accountName: String(ref.accountName || ""),
      groupId: String(ref.groupId || ""),
      caseId: String(ref.caseId || ""),
      pinnedAt: Number(ref.pinnedAt || 0),
      completedAt,
      durationMs: Math.max(0, completedAt - Number(ref.pinnedAt || completedAt)),
      waitingSince: Number(ref.waitingSince || 0),
      followUpCount: Math.max(0, Number(ref.followUpCount || 0)),
      action: String(action || "completed")
    };
  }

  scope.PinWorkflow = Object.freeze({nextOccurrence, nextFutureOccurrence, statusForReference, kanbanColumn, archiveRecord});
})(this);
