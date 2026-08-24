(function(scope) {
  "use strict";

  const MAX_NOTE_LENGTH = 1200;
  const PRIORITY_RANK = Object.freeze({normal: 0, high: 1, urgent: 2});

  function bounded(value, maximum) {
    return String(value || "").slice(0, maximum);
  }

  function identityKeys(ref) {
    const account = bounded(ref?.accountKey || "unknown", 256);
    const keys = [];
    for (const [kind, value, maximum] of [
      ["gmail-thread", ref?.gmThreadId, 256],
      ["root-message", ref?.rootMessageId, 2048],
      ["thread-id", Number(ref?.threadId || 0) > 0 ? String(ref.threadId) : "", 64]
    ]) {
      const normalized = bounded(value, maximum).trim();
      if (normalized) keys.push(`${kind}:${account}:${normalized}`);
    }
    const conversation = bounded(ref?.conversationKey, 4096).trim();
    if (/\|conv:(?:gm|root|thread):/i.test(conversation)) {
      keys.push(`conversation:${account}:${conversation}`);
    }
    return keys;
  }

  function detect(refs) {
    const byIdentity = new Map();
    for (const ref of Array.isArray(refs) ? refs : []) {
      if (!ref?.stableKey || ref.completedAt || ref.workflowStatus === "completed") continue;
      for (const identity of identityKeys(ref)) {
        const entry = byIdentity.get(identity) || [];
        entry.push(ref);
        byIdentity.set(identity, entry);
      }
    }

    const candidates = [];
    for (const [identity, refsForIdentity] of byIdentity) {
      const unique = [...new Map(refsForIdentity.map(ref => [String(ref.stableKey), ref])).values()];
      if (unique.length < 2) continue;
      const stableKeys = unique.map(ref => String(ref.stableKey)).sort();
      candidates.push({
        identity,
        stableKeys,
        count: stableKeys.length,
        subject: unique.find(ref => ref.subject)?.subject || "",
        accountKey: unique[0]?.accountKey || "",
        trackingModes: [...new Set(unique.map(ref => ref.trackingMode || "message"))]
      });
    }

    candidates.sort((left, right) => right.count - left.count || left.subject.localeCompare(right.subject));
    const accepted = [];
    for (const candidate of candidates) {
      const keys = new Set(candidate.stableKeys);
      const alreadyCovered = accepted.some(group => candidate.count <= group.count &&
        candidate.stableKeys.every(stableKey => group.keySet.has(stableKey)));
      if (alreadyCovered) continue;
      accepted.push({...candidate, keySet: keys});
    }
    return accepted.map((group, index) => ({
      id: `related-${index + 1}`,
      identity: group.identity,
      stableKeys: group.stableKeys,
      count: group.count,
      subject: group.subject,
      accountKey: group.accountKey,
      trackingModes: group.trackingModes
    }));
  }

  function positiveMinimum(values) {
    const candidates = values.map(Number).filter(value => Number.isFinite(value) && value > 0);
    return candidates.length ? Math.min(...candidates) : 0;
  }

  function mergeNotes(refs) {
    const notes = [];
    const seen = new Set();
    for (const ref of refs) {
      const note = String(ref?.note || "").trim();
      if (!note || seen.has(note)) continue;
      seen.add(note);
      notes.push(note);
    }
    return notes.join("\n\n—\n\n").slice(0, MAX_NOTE_LENGTH);
  }

  function mergeMetadata(refs) {
    const source = (Array.isArray(refs) ? refs : []).filter(Boolean);
    if (!source.length) return null;
    const primary = [...source].sort((left, right) => Number(left.pinnedAt || 0) - Number(right.pinnedAt || 0))[0];
    const priorityLevel = source.reduce((best, ref) =>
      (PRIORITY_RANK[ref.priorityLevel] || 0) > (PRIORITY_RANK[best] || 0) ? ref.priorityLevel : best,
    primary.priorityLevel || "normal");
    const sharedValue = key => {
      const values = [...new Set(source.map(ref => String(ref?.[key] || "")))];
      return values.length === 1 ? values[0] : String(primary?.[key] || "");
    };
    return {
      primaryStableKey: String(primary.stableKey),
      note: mergeNotes(source),
      priorityLevel,
      pinnedAt: positiveMinimum(source.map(ref => ref.pinnedAt)) || Date.now(),
      dueAt: positiveMinimum(source.map(ref => ref.dueAt)),
      reminderAt: positiveMinimum(source.map(ref => ref.reminderAt)),
      followUpAt: positiveMinimum(source.map(ref => ref.followUpAt)),
      snoozeUntil: positiveMinimum(source.map(ref => ref.snoozeUntil)),
      groupId: sharedValue("groupId"),
      caseId: sharedValue("caseId"),
      noReplyTracking: source.some(ref => ref.noReplyTracking),
      noReplyAt: positiveMinimum(source.map(ref => ref.noReplyAt)),
      noReplyStartedAt: positiveMinimum(source.map(ref => ref.noReplyStartedAt)),
      workflowStatus: source.some(ref => ref.workflowStatus === "active") ? "active" : (primary.workflowStatus || "active"),
      updatedAt: Math.max(...source.map(ref => Number(ref.updatedAt || 0)), Date.now())
    };
  }

  scope.PinRelated = Object.freeze({identityKeys, detect, mergeMetadata});
})(this);
