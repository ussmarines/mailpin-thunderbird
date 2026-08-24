(function(scope) {
  "use strict";

  function itemStableKey(item) {
    try { return String(item?.getProperty("X-PIN-MAILS-STABLE-KEY") || ""); } catch { return ""; }
  }

  function itemCaseId(item) {
    try { return String(item?.getProperty("X-PIN-MAILS-CASE-ID") || ""); } catch { return ""; }
  }

  function itemDueAt(item) {
    const date = item?.dueDate || item?.startDate || item?.entryDate;
    try { return date?.jsDate?.getTime?.() || 0; } catch { return 0; }
  }

  function itemCompleted(item) {
    try {
      return Boolean(item?.isCompleted || Number(item?.percentComplete || 0) >= 100 || String(item?.status || "").toUpperCase() === "COMPLETED");
    } catch {
      return false;
    }
  }

  scope.PinCalendarHelpers = Object.freeze({itemStableKey, itemCaseId, itemDueAt, itemCompleted});
})(this);
