(function(scope) {
  "use strict";

  function text(value) {
    return String(value || "").trim().toLowerCase();
  }

  function hash(value) {
    let result = 2166136261;
    for (const char of String(value || "")) {
      result ^= char.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(16);
  }

  function stringProperty(hdr, name) {
    try {
      return String(hdr?.getStringProperty(name) || "").trim();
    } catch {
      return "";
    }
  }

  function references(hdr) {
    const values = [];
    try {
      const count = Number(hdr?.numReferences || 0);
      for (let index = 0; index < count; index++) {
        const value = String(hdr.getStringReference(index) || "").trim();
        if (value && !values.includes(value)) {
          values.push(value);
        }
      }
    } catch {}
    const raw = stringProperty(hdr, "references");
    for (const match of raw.match(/<[^>]+>|[^\s]+/g) || []) {
      const value = match.replace(/^<|>$/g, "").trim();
      if (value && !values.includes(value)) {
        values.push(value);
      }
    }
    return values;
  }

  function messageId(hdr) {
    return String(hdr?.messageId || "").replace(/^<|>$/g, "").trim();
  }

  function rootMessageId(hdr) {
    const refs = references(hdr);
    return refs[0] || stringProperty(hdr, "in-reply-to").replace(/^<|>$/g, "") || messageId(hdr);
  }

  function gmThreadId(hdr) {
    return stringProperty(hdr, "x-gm-thrid") || stringProperty(hdr, "x-gm-threadid");
  }

  function normalizeSubject(subject) {
    return String(subject || "")
      .replace(/^\s*((re|fw|fwd|tr|aw|sv)\s*:\s*)+/gi, "")
      .replace(/^\s*\[[^\]]{1,40}\]\s*/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function conversationIdentity(hdr, accountKey, subject) {
    const gm = gmThreadId(hdr);
    const root = rootMessageId(hdr);
    const threadId = Number(hdr?.threadId || 0);
    const normalizedSubject = normalizeSubject(subject);
    let discriminator;
    if (gm) {
      discriminator = `gm:${gm}`;
    } else if (root) {
      discriminator = `root:${hash(text(root))}`;
    } else if (threadId) {
      discriminator = `thread:${threadId}`;
    } else {
      // No subject-only conversation identity: unrelated mail routinely shares
      // generic subjects. This local key identifies only the concrete header.
      const folderURI = text(hdr?.folder?.URI);
      const messageKey = Number(hdr?.messageKey || 0);
      const date = Number(hdr?.date || 0);
      const size = Number(hdr?.messageSize || 0);
      discriminator = `local:${hash(`${folderURI}|${messageKey}|${date}|${size}|${normalizedSubject}`)}`;
    }
    return `${String(accountKey || "unknown")}|conv:${discriminator}`;
  }

  function strongConversationKey(value) {
    return /\|conv:(?:gm|root|thread):/i.test(String(value || ""));
  }

  function genericTrackingMode(settings = {}) {
    return settings.defaultPinTarget === "conversation" && settings.enableConversationPins === true
      ? "conversation"
      : "message";
  }

  function pinKeyPlan(trackingMode, messageKey, conversationKey) {
    const conversation = trackingMode === "conversation";
    return Object.freeze({
      targetKey: conversation ? String(conversationKey || "") : String(messageKey || ""),
      oppositeKey: conversation ? String(messageKey || "") : String(conversationKey || "")
    });
  }

  function signature(hdr, accountKey, subject, author) {
    return {
      accountKey: String(accountKey || "unknown"),
      gmThreadId: gmThreadId(hdr),
      rootMessageId: rootMessageId(hdr),
      messageId: messageId(hdr),
      threadId: Number(hdr?.threadId || 0),
      references: references(hdr),
      normalizedSubject: normalizeSubject(subject),
      author: text(author),
      date: Number(hdr?.date || 0),
      size: Number(hdr?.messageSize || 0)
    };
  }

  function sameConversation(left, right) {
    if (!left || !right || left.accountKey !== right.accountKey) {
      return false;
    }
    if (left.gmThreadId && right.gmThreadId) {
      return left.gmThreadId === right.gmThreadId;
    }
    if (left.rootMessageId && right.rootMessageId && text(left.rootMessageId) === text(right.rootMessageId)) {
      return true;
    }
    if (left.messageId && right.references?.some(value => text(value) === text(left.messageId))) {
      return true;
    }
    if (right.messageId && left.references?.some(value => text(value) === text(right.messageId))) {
      return true;
    }
    if (left.threadId && right.threadId && left.threadId === right.threadId) {
      return true;
    }
    // When two real root IDs exist and disagree, never merge solely because
    // the subjects happen to be identical.
    if (left.rootMessageId && right.rootMessageId) {
      return false;
    }
    return false;
  }

  function fingerprint(hdr, accountKey, subject, author) {
    const sig = signature(hdr, accountKey, subject, author);
    return [
      sig.accountKey,
      text(sig.messageId),
      sig.gmThreadId,
      sig.rootMessageId,
      sig.threadId,
      sig.date,
      sig.size,
      hash(`${sig.author}|${sig.normalizedSubject}`)
    ].join("|");
  }

  scope.PinIdentity = Object.freeze({
    references,
    rootMessageId,
    gmThreadId,
    normalizeSubject,
    conversationIdentity,
    strongConversationKey,
    genericTrackingMode,
    pinKeyPlan,
    signature,
    sameConversation,
    fingerprint
  });
})(this);
