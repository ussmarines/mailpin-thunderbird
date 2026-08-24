(function(scope) {
  "use strict";

  const MAX_VIEWS = 30;
  const ID_RE = /^[a-z0-9_-]{1,80}$/i;
  const SMART = new Set(["all", "active", "today", "overdue", "week", "waiting", "waitingForThem", "needsReply", "checklistPending", "planned", "noReply", "snoozed", "noDue", "unread", "missing", "calendarError", "recentCompleted", "completed"]);
  const PRIORITY = new Set(["", "normal", "high", "urgent"]);
  const RESPONSE = new Set(["", "none", "waitingForThem", "needsReply"]);
  const CHECKLIST = new Set(["", "pending", "complete", "none"]);

  function normalize(value, index = 0) {
    if (!value || typeof value !== "object") return null;
    const fallbackId = `view-${index + 1}`;
    const rawId = String(value.id || fallbackId).replace(/[^a-z0-9_-]/gi, "-").slice(0, 80);
    const id = ID_RE.test(rawId) ? rawId : fallbackId;
    const name = String(value.name || "").trim().slice(0, 100);
    if (!name) return null;
    return {
      id,
      name,
      smartView: SMART.has(value.smartView) ? value.smartView : "all",
      search: String(value.search || "").slice(0, 500),
      groupId: String(value.groupId || "").slice(0, 48),
      caseId: String(value.caseId || "").slice(0, 64),
      priority: PRIORITY.has(value.priority) ? value.priority : "",
      responseState: RESPONSE.has(value.responseState) ? value.responseState : "",
      checklist: CHECKLIST.has(value.checklist) ? value.checklist : "",
      createdAt: Math.max(0, Number(value.createdAt) || Date.now()),
      updatedAt: Math.max(0, Number(value.updatedAt) || Date.now())
    };
  }

  function normalizeList(values) {
    const source = Array.isArray(values) ? values : [];
    const result = [];
    const ids = new Set();
    for (let index = 0; index < source.length && result.length < MAX_VIEWS; index += 1) {
      const item = normalize(source[index], index);
      if (!item || ids.has(item.id)) continue;
      ids.add(item.id);
      result.push(item);
    }
    return result;
  }

  function checklistMatches(mode, stats) {
    if (!mode) return true;
    if (mode === "none") return !stats.total;
    if (mode === "pending") return stats.pending > 0;
    if (mode === "complete") return stats.total > 0 && stats.pending === 0;
    return true;
  }

  function matches(view, item, helpers = {}) {
    if (!view || !item) return true;
    if (view.smartView && view.smartView !== "all" && !helpers.smartMatches?.(view.smartView, item)) return false;
    if (view.groupId && item.groupId !== view.groupId) return false;
    if (view.caseId && item.caseId !== view.caseId) return false;
    if (view.priority && item.priorityLevel !== view.priority) return false;
    if (view.responseState && item.responseState !== view.responseState) return false;
    if (view.checklist && !checklistMatches(view.checklist, item.checklistStats || {total: 0, pending: 0})) return false;
    if (view.search) {
      const normalizeText = helpers.normalizeText || (value => String(value || "").toLowerCase());
      const haystack = normalizeText(item.searchText || "");
      const tokens = normalizeText(view.search).split(/\s+/).filter(Boolean);
      if (tokens.some(token => !haystack.includes(token))) return false;
    }
    return true;
  }

  scope.PinSavedViews = Object.freeze({MAX_VIEWS, normalize, normalizeList, matches});
})(this);
