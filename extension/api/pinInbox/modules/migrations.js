(function(scope) {
  "use strict";

  const SUPPORTED_FORMATS = new Set(["thunderbird-pin-mails", "pin-mails-backup", "legacy"]);
  const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);
  const MAX_IMPORT_REFS = 100000;
  const MAX_IMPORT_LIST = 20000;

  function safeObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }

  function safeKey(value) {
    const key = String(value || "");
    return Boolean(key && key.length <= 2048 && !UNSAFE_KEYS.has(key));
  }

  function sourceFor(configuration) {
    if (!safeObject(configuration)) return null;
    if (configuration.format === "pin-mails-backup") return safeObject(configuration.data) ? configuration.data : null;
    if (safeObject(configuration.data)) return configuration.data;
    return configuration;
  }

  function countList(data, name) {
    return Array.isArray(data?.[name]) ? data[name].length : 0;
  }

  function analyze(configuration, current = {}) {
    const data = sourceFor(configuration);
    const format = String(configuration?.format || "legacy");
    const version = Number(configuration?.version || configuration?.metadata?.schemaVersion || data?.schemaVersion || 0);
    const errors = [];
    const warnings = [];

    if (!data) errors.push("missing-data");
    if (!SUPPORTED_FORMATS.has(format)) errors.push("unsupported-format");
    if (!Number.isFinite(version) || version < 1 || version > 7) errors.push("unsupported-version");

    const refEntries = safeObject(data?.refs) ? Object.entries(data.refs) : [];
    if (data && !safeObject(data.refs)) errors.push("invalid-refs");
    if (refEntries.length > MAX_IMPORT_REFS) errors.push("too-many-refs");
    const unsafeKeys = refEntries.filter(([key]) => !safeKey(key)).map(([key]) => key).slice(0, 20);
    if (unsafeKeys.length) errors.push("unsafe-reference-keys");

    for (const name of ["groups", "rules", "cases", "templates", "savedViews", "history", "ruleLog", "activity"]) {
      if (data?.[name] !== undefined && !Array.isArray(data[name])) errors.push(`invalid-${name}`);
      if (countList(data, name) > MAX_IMPORT_LIST) errors.push(`too-many-${name}`);
    }

    const currentRefs = safeObject(current.refs) ? current.refs : {};
    const conflictKeys = refEntries
      .map(([key]) => key)
      .filter(key => safeKey(key) && Object.prototype.hasOwnProperty.call(currentRefs, key));
    const incomingNewer = conflictKeys.filter(key => Number(data.refs[key]?.updatedAt || 0) > Number(currentRefs[key]?.updatedAt || 0)).length;
    const currentNewer = conflictKeys.length - incomingNewer;
    if (version < 7) warnings.push("migration-required");
    if (conflictKeys.length) warnings.push("identifier-conflicts");

    return {
      valid: errors.length === 0,
      format,
      version,
      errors,
      warnings,
      unsafeKeys,
      incoming: {
        refs: refEntries.length,
        groups: countList(data, "groups"),
        rules: countList(data, "rules"),
        cases: countList(data, "cases"),
        templates: countList(data, "templates"),
        savedViews: countList(data, "savedViews"),
        history: countList(data, "history")
      },
      current: {refs: Object.keys(currentRefs).length},
      conflicts: conflictKeys.length,
      conflictResolution: {incomingNewer, currentNewer},
      strategies: ["replace", "merge"]
    };
  }

  function chooseByUpdatedAt(current, incoming) {
    const currentTime = Number(current?.updatedAt || current?.createdAt || 0);
    const incomingTime = Number(incoming?.updatedAt || incoming?.createdAt || 0);
    return incomingTime >= currentTime ? incoming : current;
  }

  function mergeRecord(current = {}, incoming = {}) {
    const result = Object.create(null);
    for (const [key, value] of Object.entries(current || {})) if (safeKey(key)) result[key] = value;
    for (const [key, value] of Object.entries(incoming || {})) {
      if (!safeKey(key)) continue;
      result[key] = Object.prototype.hasOwnProperty.call(result, key) ? chooseByUpdatedAt(result[key], value) : value;
    }
    return result;
  }

  function mergeList(current = [], incoming = []) {
    const map = new Map();
    for (const item of [...(Array.isArray(current) ? current : []), ...(Array.isArray(incoming) ? incoming : [])]) {
      const id = String(item?.id || "");
      if (!safeKey(id)) continue;
      map.set(id, map.has(id) ? chooseByUpdatedAt(map.get(id), item) : item);
      if (map.size >= MAX_IMPORT_LIST) break;
    }
    return [...map.values()];
  }

  function merge(current = {}, incoming = {}) {
    const merged = JSON.parse(JSON.stringify(current || {}));
    merged.refs = mergeRecord(current.refs, incoming.refs);
    for (const name of ["groups", "rules", "cases", "templates", "savedViews", "history", "ruleLog", "activity"]) {
      merged[name] = mergeList(current[name], incoming[name]);
    }
    merged.manualOrder = [...new Set([...(current.manualOrder || []), ...(incoming.manualOrder || [])].map(String).filter(safeKey))]
      .filter(key => Object.prototype.hasOwnProperty.call(merged.refs, key));
    merged.groupOrder = [...new Set([...(current.groupOrder || []), ...(incoming.groupOrder || [])].map(String).filter(safeKey))];
    merged.caseOrder = [...new Set([...(current.caseOrder || []), ...(incoming.caseOrder || [])].map(String).filter(safeKey))];
    merged.collapsedByInbox = {...(current.collapsedByInbox || {}), ...(incoming.collapsedByInbox || {})};
    merged.panelVisibleByInbox = {...(current.panelVisibleByInbox || {}), ...(incoming.panelVisibleByInbox || {})};
    merged.dashboard = {...(current.dashboard || {}), ...(incoming.dashboard || {})};
    merged.providerMatrix = incoming.providerMatrix || current.providerMatrix || {checkedAt: 0, accounts: [], providers: [], calendars: []};
    merged.schemaVersion = Math.max(7, Number(current.schemaVersion) || 0, Number(incoming.schemaVersion) || 0);
    return merged;
  }

  scope.PinMigrations = Object.freeze({SUPPORTED_FORMATS, sourceFor, analyze, merge, safeKey, mergeRecord, mergeList});
})(this);
