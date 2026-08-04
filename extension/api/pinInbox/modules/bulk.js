(function(scope) {
  "use strict";

  const ACTIONS = Object.freeze({
    open: {single: true},
    reply: {single: true},
    toggleRead: {}, read: {}, unread: {},
    active: {}, waiting: {}, planned: {}, complete: {}, uncomplete: {},
    priority: {}, deadline: {}, group: {}, case: {}, template: {},
    trackNoReply: {}, cancelNoReply: {},
    archive: {destructive: true}, delete: {destructive: true}, unpin: {destructive: true},
    calendar: {single: true}, snooze: {}, wake: {}, dismissReminder: {}, setMetadata: {}
  });

  function normalizeKeys(value, maximum = 5000) {
    const source = Array.isArray(value) ? value : [value];
    const result = [];
    const seen = new Set();
    for (const raw of source) {
      const key = String(raw || "").trim().slice(0, 2048);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(key);
      if (result.length >= maximum) break;
    }
    return result;
  }

  function supported(action) {
    return Object.prototype.hasOwnProperty.call(ACTIONS, String(action || ""));
  }

  function isDestructive(action) {
    return Boolean(ACTIONS[String(action || "")]?.destructive);
  }

  function requiresSingle(action) {
    return Boolean(ACTIONS[String(action || "")]?.single);
  }

  function normalizeOptions(action, options = {}, context = {}) {
    const source = options && typeof options === "object" ? options : {};
    const result = {};
    switch (String(action || "")) {
      case "priority":
        result.priorityLevel = ["normal", "high", "urgent"].includes(source.priorityLevel) ? source.priorityLevel : "normal";
        break;
      case "deadline":
        result.dueAt = Math.max(0, Number(source.dueAt) || 0);
        break;
      case "group":
        result.groupId = String(source.groupId || "").slice(0, 64);
        break;
      case "case":
        result.caseId = String(source.caseId || "").slice(0, 64);
        break;
      case "template":
        result.templateId = String(source.templateId || "").slice(0, 64);
        break;
      case "trackNoReply":
        result.days = Math.max(1, Math.min(365, Number(source.days) || Number(context.defaultNoReplyDays) || 5));
        if (Number(source.at) > 0) result.at = Number(source.at);
        result.keepWaiting = Boolean(source.keepWaiting);
        break;
      case "cancelNoReply":
        result.keepWaiting = Boolean(source.keepWaiting);
        break;
      case "calendar":
        result.itemType = source.itemType === "event" ? "event" : "task";
        result.calendarId = String(source.calendarId || "").slice(0, 256);
        break;
      case "snooze":
        result.durationMs = Math.max(60_000, Math.min(30 * 86400000, Number(source.durationMs) || 3_600_000));
        if (Number(source.until) > 0) result.until = Number(source.until);
        break;
      default:
        break;
    }
    return result;
  }

  function summary(action, count) {
    const safeCount = Math.max(0, Number(count) || 0);
    return {action: String(action || ""), count: safeCount, destructive: isDestructive(action), single: requiresSingle(action)};
  }

  scope.PinBulk = Object.freeze({ACTIONS, normalizeKeys, supported, isDestructive, requiresSingle, normalizeOptions, summary});
})(this);
