"use strict";
(() => {
  const api = globalThis.messenger || globalThis.browser;
  const limit = api.i18n.getMessage("nativeLimitations");
  const notice = document.createElement("aside");
  notice.className = "info-box";
  notice.setAttribute("role", "note");
  const text = document.createElement("p");
  text.textContent = limit;
  const link = document.createElement("a");
  link.href = api.runtime.getURL("workbench/workbench.html");
  link.textContent = api.i18n.getMessage("nativeWorkbench");
  notice.append(text, link);
  (document.querySelector("main") || document.body).prepend(notice);
  const disable = () => {
    for (const id of ["enableCalendarIntegration", "enableBidirectionalCalendarSync", "calendarDeleteOnUnpin",
      "calendarCompleteOnPinComplete", "preferredCalendarId", "calendarItemType", "sync-calendar", "choose-backup",
      "backupDirectory", "enableAutomaticBackups", "backupIntervalHours", "backupRetention", "pinMode",
      "enableAutomaticNoReplyTracking", "autoUnpinOnArchive", "autoCompleteOnArchive", "autoUnpinOnDelete",
      "autoUnpinOnRead", "autoUnpinOnReply", "autoPinSenders", "autoPinTags", "autoCleanup",
      "completedRetentionDays", "autoRemoveCompleted", "panelScope", "panelPageSize", "panelVirtualizationThreshold",
      "compatibilityMode", "keepPinOnMove", "enableGlobalDashboard", "backupBeforeMigration", "backupIncludeHistory"]) {
      const control = document.getElementById(id);
      if (control) { control.disabled = true; control.title = limit; }
    }
    for (const option of document.querySelectorAll('option[value="reply"], option[value="archive"], option[value="delete"], option[value="calendar"]')) {
      // Automatic provider-specific triggers are preserved but unavailable in this prototype.
      if (option.closest("#rules-list")) option.disabled = true;
    }
  };
  disable();
  const observer = new MutationObserver(disable);
  observer.observe(document.body, {childList: true, subtree: true});
  window.addEventListener("pagehide", () => observer.disconnect(), {once: true});
})();
