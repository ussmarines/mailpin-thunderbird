(function(scope) {
  "use strict";

  function stableStringify(value) {
    if (value === null || typeof value !== "object") {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map(stableStringify).join(",")}]`;
    }
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }

  function mapDiff(previous = {}, next = {}) {
    const upsert = [];
    const remove = [];
    for (const [key, value] of Object.entries(next || {})) {
      if (!(key in previous) || stableStringify(previous[key]) !== stableStringify(value)) {
        upsert.push([key, value]);
      }
    }
    for (const key of Object.keys(previous || {})) {
      if (!(key in next)) {
        remove.push(key);
      }
    }
    return {upsert, remove};
  }

  function listDiff(previous = [], next = [], keyOf = item => item?.id) {
    const prevMap = Object.fromEntries((previous || []).map(item => [String(keyOf(item) || ""), item]).filter(([key]) => key));
    const nextMap = Object.fromEntries((next || []).map(item => [String(keyOf(item) || ""), item]).filter(([key]) => key));
    return mapDiff(prevMap, nextMap);
  }

  function checksum(value) {
    const serialized = stableStringify(value);
    let hash = 2166136261;
    for (const char of serialized) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function backupEnvelope(data, undo, metadata = {}) {
    const createdAt = Date.now();
    const payload = {createdAt, metadata: {...metadata}, data, undo};
    return {
      format: "pin-mails-backup",
      formatVersion: 3,
      ...payload,
      checksum: checksum(payload)
    };
  }

  function verifyBackupEnvelope(envelope) {
    if (!envelope || envelope.format !== "pin-mails-backup") return false;
    if (!envelope.checksum) return true; // Backwards-compatible with 2.x backups.
    const payload = {
      createdAt: Number(envelope.createdAt) || 0,
      metadata: envelope.metadata || {},
      data: envelope.data,
      undo: envelope.undo
    };
    return checksum(payload) === String(envelope.checksum);
  }

  function sanitizeFilename(value) {
    return String(value || "backup")
      .normalize("NFKD")
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "backup";
  }

  scope.PinStorageHelpers = Object.freeze({stableStringify, mapDiff, listDiff, checksum, backupEnvelope, verifyBackupEnvelope, sanitizeFilename});
})(this);
