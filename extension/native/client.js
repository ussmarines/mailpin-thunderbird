"use strict";
// Explicit local RPC; no private Thunderbird namespace or generated executable code.
(() => {
  const api = globalThis.messenger || globalThis.browser;
  const methods = ["getConfiguration", "setConfiguration", "exportConfiguration", "importConfiguration",
    "resetConfiguration", "cleanupBroken", "rescanPinned", "undoLast", "repairReferences", "resetInterface",
    "importNativeStars", "getDiagnosticReport", "exportDiagnosticBundle", "clearDiagnostics", "getHealthReport",
    "repairHealthIssues", "runProviderCompatibilityCheck", "previewImport", "restoreConfiguration", "setNoReplyTracking",
    "getDashboardData", "openReference", "performReferenceAction", "mergeRelatedReferences", "getCalendars",
    "createCalendarItem", "createCaseCalendarItem", "snoozeReminder", "runCompatibilityCheck", "getPerformanceReport",
    "checkStorageIntegrity", "runBackup", "getBackupStatus", "chooseBackupDirectory", "simulateRules", "clearRuleLog",
    "getCases", "getTemplates", "getHistory", "updateReferenceDetails", "createSavedView", "updateSavedView",
    "deleteSavedView", "syncTags", "setWorkflowStatus", "createCase", "updateCase", "deleteCase", "createTemplate",
    "updateTemplate", "deleteTemplate", "applyTemplate", "syncCalendarLinks", "runRules", "openDashboard"];
  const call = async (method, args) => {
    const action = method === "performReferenceAction" ? args[1] : "";
    const permission = action === "archive" ? "messagesMove" : action === "delete" ? "messagesDelete" : action === "reply" ? "compose" : "";
    if (permission && !await api.permissions.request({permissions: [permission]})) throw new Error("Permission refused");
    // UI option objects may contain optional undefined fields. Only send the
    // JSON data contract accepted by the bounded backend, never object wrappers.
    const response = await api.runtime.sendMessage({type: "mailpin:native", method, args: JSON.parse(JSON.stringify(args))});
    if (!response?.ok) throw new Error(response?.error || "MailPin background unavailable");
    return response.result;
  };
  globalThis.MailPinNative = Object.freeze(Object.fromEntries(methods.map(method => [method, (...args) => call(method, args)])));
})();
