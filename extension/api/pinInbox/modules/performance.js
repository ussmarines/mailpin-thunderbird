(function(scope) {
  "use strict";
  function headerToken(hdr) {
    if (!hdr) return "missing";
    return [hdr.messageKey || 0, hdr.flags || 0, hdr.date || 0, hdr.messageSize || 0, hdr.priority || 0].join(":");
  }

  function cardToken(entry, settings = {}) {
    const ref = entry?.ref || {};
    return [
      ref.stableKey, ref.updatedAt || 0, ref.completedAt || 0, ref.workflowStatus || "active",
      ref.dueAt || 0, ref.followUpAt || 0, ref.noReplyAt || 0, ref.groupId || "", ref.caseId || "",
      ref.calendarItemId || "", ref.missingSince || 0, headerToken(entry?.hdr),
      settings.cardLines, settings.density, settings.showNotes, settings.showDeadlines,
      settings.showGroups, settings.showQuickActions, settings.showAttachments, settings.showTags,
      settings.showFolder, settings.showPriority, settings.safeMode
    ].join("|");
  }

  function listSignature(entries = [], context = {}) {
    return [
      context.mode || "", context.search || "", context.limit || 0,
      context.scope || "", context.sort || "", context.grouping || "",
      ...entries.map(entry => cardToken(entry, context.settings || {}))
    ].join("\n");
  }

  scope.PinPerformance = Object.freeze({headerToken, cardToken, listSignature});
})(this);
