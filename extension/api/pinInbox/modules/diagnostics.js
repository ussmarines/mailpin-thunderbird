(function(scope) {
  "use strict";
  const ADDRESS_RE = /(?:[a-z0-9.!#$%&'*+/=?^_`{|}~-]+)@(?:[a-z0-9-]+\.)+[a-z]{2,}/gi;
  const PATH_RE = /(?:[a-z]:\\|\\\\[^\\\s]+\\|\/(?:Users|home|tmp|private\/var|var\/folders)\/)[^\s"']+/gi;

  function redact(value, maxLength = 900) {
    return String(value ?? "")
      .replace(/\b(?:https?|ssh|git):\/\/[^\s/:]+:[^\s/@]+@/gi, "<credential-url>")
      .replace(ADDRESS_RE, "<email>")
      .replace(PATH_RE, "<local-path>")
      .replace(/\b(?:imap|mailbox|news|moz-extension):\/\/[^\s"']+/gi, "<internal-uri>")
      .replace(/\b(?:gh[pousr]_[a-z0-9_]{30,}|github_pat_[a-z0-9_]{40,})\b/gi, "<secret>")
      .replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, "<secret>")
      .replace(/\bAIza[0-9a-z_-]{30,}\b/gi, "<secret>")
      .replace(/\bsk-(?:proj-)?[a-z0-9_-]{20,}\b/gi, "<secret>")
      .replace(/\b(?:sk|pk|rk)_(?:live|test)_[a-z0-9_-]{12,}\b/gi, "<secret>")
      .replace(/\bxox[baprs]-[a-z0-9-]{20,}\b/gi, "<secret>")
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
