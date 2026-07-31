(function(scope) {
  "use strict";
  const DAY = 86400000;
  const VIEWS = Object.freeze([
    {id: "all", labelKey: "smartViewAll", fallback: "Toutes"},
    {id: "today", labelKey: "smartViewToday", fallback: "Aujourd’hui"},
    {id: "overdue", labelKey: "smartViewOverdue", fallback: "En retard"},
    {id: "week", labelKey: "smartViewWeek", fallback: "Cette semaine"},
    {id: "waiting", labelKey: "smartViewWaiting", fallback: "En attente"},
    {id: "noReply", labelKey: "smartViewNoReply", fallback: "Relances sans réponse"},
    {id: "noDue", labelKey: "smartViewNoDue", fallback: "Sans échéance"},
    {id: "unread", labelKey: "smartViewUnread", fallback: "Non lus"},
    {id: "missing", labelKey: "smartViewMissing", fallback: "Messages introuvables"},
    {id: "calendarError", labelKey: "smartViewCalendarError", fallback: "Agenda à vérifier"},
    {id: "recentCompleted", labelKey: "smartViewRecentCompleted", fallback: "Récemment terminés"}
  ]);

  function boundaries(now = Date.now()) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const tomorrow = start.getTime() + DAY;
    const week = start.getTime() + DAY * 7;
    const recent = start.getTime() - DAY * 7;
    return {today: start.getTime(), tomorrow, week, recent};
  }

  function dueFor(ref) {
    return Number(ref?.followUpAt || ref?.dueAt || 0);
  }

  function sectionFor(ref, context = {}) {
    const now = Number(context.now) || Date.now();
    const due = dueFor(ref);
    const {tomorrow, week} = boundaries(now);
    if (ref?.completedAt || ref?.workflowStatus === "completed") return "recentCompleted";
    if (ref?.missingSince || context.missing) return "missing";
    if (ref?.calendarSyncError || context.calendarError) return "calendarError";
    if (ref?.noReplyTracking && ref?.noReplyAt && ref.noReplyAt <= now) return "noReply";
    if (due && due < now) return "overdue";
    if (due && due < tomorrow) return "today";
    if (due && due < week) return "week";
    if (ref?.workflowStatus === "waiting") return "waiting";
    if (!due) return "noDue";
    return "later";
  }

  function matches(view, ref, context = {}) {
    const id = String(view || "all");
    if (id === "all") return true;
    const now = Number(context.now) || Date.now();
    const due = dueFor(ref);
    const {tomorrow, week, recent} = boundaries(now);
    const completed = Boolean(ref?.completedAt || ref?.workflowStatus === "completed");
    switch (id) {
      case "active": return !completed && (ref?.workflowStatus || "active") === "active";
      case "completed": return completed;
      case "waiting": return !completed && ref?.workflowStatus === "waiting";
      case "planned": return !completed && ref?.workflowStatus === "planned";
      case "today": return !completed && due >= boundaries(now).today && due < tomorrow;
      case "overdue": return !completed && due > 0 && due < now;
      case "week": return !completed && due >= tomorrow && due < week;
      case "noReply": return !completed && Boolean(ref?.noReplyTracking) && Number(ref?.noReplyAt || 0) > 0 && ref.noReplyAt <= now;
      case "noDue": return !completed && !due;
      case "unread": return Boolean(context.unread);
      case "missing": return Boolean(ref?.missingSince || context.missing);
      case "calendarError": return Boolean(ref?.calendarSyncError || context.calendarError);
      case "recentCompleted": return completed && Number(ref?.completedAt || 0) >= recent;
      default: return sectionFor(ref, context) === id;
    }
  }

  function counts(items, now = Date.now()) {
    const result = Object.fromEntries(VIEWS.map(view => [view.id, 0]));
    result.active = 0;
    result.completed = 0;
    result.planned = 0;
    for (const item of items || []) {
      const ref = item.ref || item;
      const context = {now, unread: Boolean(item.unread), missing: Boolean(item.missing), calendarError: Boolean(item.calendarError)};
      for (const view of VIEWS) if (matches(view.id, ref, context)) result[view.id]++;
      if (matches("active", ref, context)) result.active++;
      if (matches("completed", ref, context)) result.completed++;
      if (matches("planned", ref, context)) result.planned++;
    }
    return result;
  }

  scope.PinSmartViews = Object.freeze({VIEWS, boundaries, dueFor, sectionFor, matches, counts});
})(this);
