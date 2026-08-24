(function(scope) {
  "use strict";

  const DEFINITIONS = Object.freeze([
    {key: "mailperch-active", label: "MailPin / Active", color: "#0f6cbd", test: ref => !ref?.completedAt && (ref?.workflowStatus || "active") === "active"},
    {key: "mailperch-waiting", label: "MailPin / Waiting", color: "#8a3700", test: ref => !ref?.completedAt && ref?.workflowStatus === "waiting"},
    {key: "mailperch-planned", label: "MailPin / Planned", color: "#5c2d91", test: ref => !ref?.completedAt && ref?.workflowStatus === "planned"},
    {key: "mailperch-completed", label: "MailPin / Completed", color: "#0e700e", test: ref => Boolean(ref?.completedAt || ref?.workflowStatus === "completed")},
    {key: "mailperch-important", label: "MailPin / Important", color: "#c239b3", test: ref => ["high", "urgent"].includes(ref?.priorityLevel)},
    {key: "mailperch-follow-up", label: "MailPin / Follow-up", color: "#d83b01", test: ref => Boolean(ref?.noReplyTracking || ref?.followUpAt)}
  ]);
  const KEYS = Object.freeze(DEFINITIONS.map(item => item.key));

  function desiredKeys(ref) {
    return DEFINITIONS.filter(item => item.test(ref)).map(item => item.key);
  }

  scope.PinTagSync = Object.freeze({DEFINITIONS, KEYS, desiredKeys});
})(this);
