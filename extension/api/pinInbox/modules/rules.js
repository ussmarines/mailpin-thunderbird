(function(scope) {
  "use strict";

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function matches(context, rule) {
    if (!context || !rule?.enabled) return {matched: false, reasons: ["disabled"]};
    const reasons = [];
    if (rule.accountKey && rule.accountKey !== context.accountKey) return {matched: false, reasons: ["account"]};
    if (rule.folderURI && rule.folderURI !== context.folderURI) return {matched: false, reasons: ["folder"]};
    if (rule.senderContains && !normalize(context.sender).includes(normalize(rule.senderContains))) return {matched: false, reasons: ["sender"]};
    if (rule.subjectContains && !normalize(context.subject).includes(normalize(rule.subjectContains))) return {matched: false, reasons: ["subject"]};
    if (rule.tagKey && !(context.tags || []).includes(rule.tagKey)) return {matched: false, reasons: ["tag"]};
    reasons.push("matched");
    return {matched: true, reasons};
  }

  function ordered(rules) {
    return [...(rules || [])].sort((a, b) => (Number(a.priority) || 100) - (Number(b.priority) || 100));
  }

  function rateAllowed(timestamps, maxPerMinute, now = Date.now()) {
    const recent = (timestamps || []).filter(time => now - time < 60000);
    return {allowed: recent.length < Math.max(1, Number(maxPerMinute) || 60), timestamps: recent};
  }

  scope.PinRules = Object.freeze({matches, ordered, rateAllowed});
})(this);
