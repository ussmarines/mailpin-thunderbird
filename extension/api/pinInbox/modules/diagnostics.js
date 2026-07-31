(function(scope) {
  "use strict";
  const ADDRESS_RE = /(?:[a-z0-9.!#$%&'*+/=?^_`{|}~-]+)@(?:[a-z0-9-]+\.)+[a-z]{2,}/gi;
  const PATH_RE = /(?:[a-z]:\\|\/Users\/|\/home\/|\/var\/folders\/)[^\s"']+/gi;

  function redact(value, maxLength = 900) {
    return String(value ?? "")
      .replace(ADDRESS_RE, "<email>")
      .replace(PATH_RE, "<local-path>")
      .replace(/\b(?:imap|mailbox|news|moz-extension):\/\/[^\s"']+/gi, "<internal-uri>")
      .replace(/\b(?:sk|pk|rk)_(?:live|test)_[a-z0-9_-]{12,}\b/gi, "<secret>")
      .replace(/\beyJ[a-z0-9_-]{8,}\.[a-z0-9_-]{8,}\.[a-z0-9_-]{8,}\b/gi, "<token>")
      .slice(0, maxLength);
  }

  function event(type, message, details = "", context = {}) {
    return {
      time: Date.now(),
      type: ["debug", "info", "warning", "error"].includes(type) ? type : "info",
      message: redact(message, 300),
      details: redact(details, 900),
      component: redact(context.component || "core", 64),
      action: redact(context.action || "", 80),
      windowId: redact(context.windowId || "", 80)
    };
  }

  function summary(events = []) {
    const counts = {debug: 0, info: 0, warning: 0, error: 0};
    for (const item of events) counts[item?.type] = (counts[item?.type] || 0) + 1;
    return {counts, total: events.length, lastError: [...events].reverse().find(item => item?.type === "error") || null};
  }

  scope.PinDiagnostics = Object.freeze({redact, event, summary});
})(this);
