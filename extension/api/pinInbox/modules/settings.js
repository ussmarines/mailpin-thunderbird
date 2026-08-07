(function(scope) {
  "use strict";

  const COLOR_RE = /^#[0-9a-f]{6}$/i;
  const GROUP_ID_RE = /^[a-z0-9_-]{1,48}$/i;
  const MAX_DIAGNOSTIC_EVENTS = 500;
  const UNSAFE_RECORD_KEYS = new Set(["__proto__", "prototype", "constructor"]);
  const MIGRATION_STRATEGY = "missing-or-invalid-to-recommended; explicit-values-preserved";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    for (const item of Object.values(value)) deepFreeze(item);
    return Object.freeze(value);
  }

  const DEFAULTS = deepFreeze({
    schemaVersion: 7,
    pinMode: "independent",
    panelScope: "currentInbox",
    sortMode: "manual",
    density: "normal",
    cardLines: 3,
    panelMaxHeight: 420,
    panelPageSize: 100,
    panelVirtualizationThreshold: 180,
    uiPreset: "balanced",
    settingsExperience: "guided",
    reduceMotion: "auto",
    groupByAccount: true,
    groupByCustomGroup: false,
    showAccountColor: true,
    showAttachments: true,
    showTags: true,
    showPriority: true,
    smartDates: true,
    showFolder: true,
    showSearch: true,
    showQuickActions: true,
    showNotes: true,
    showDeadlines: true,
    showGroups: true,
    showCounters: true,
    showFolderBadge: false,
    rememberCollapsed: true,
    allowPinOutsideInbox: true,
    showSmartSections: true,
    hideCompleted: true,
    completedRetentionDays: 30,
    autoRemoveCompleted: false,
    enableConversationPins: true,
    defaultPinTarget: "message",
    enableAdvancedReminders: true,
    reminderLeadMinutes: 0,
    missedReminderPolicy: "notify",
    enableAutomaticRules: false,
    autoUnpinOnArchive: false,
    autoCompleteOnArchive: false,
    autoUnpinOnDelete: true,
    autoUnpinOnRead: false,
    autoUnpinOnReply: false,
    moveToWaitingOnReply: false,
    waitingGroupId: "",
    keepPinOnMove: true,
    autoPinSenders: [],
    autoPinTags: [],
    enableCalendarIntegration: true,
    preferredCalendarId: "",
    calendarItemType: "task",
    enableGlobalDashboard: true,
    enableSmartViews: true,
    defaultSmartView: "today",
    enableBulkActions: true,
    confirmBulkDestructiveActions: true,
    enableHealthCenter: true,
    enableHealthNotifications: true,
    enableDiagnostics: true,
    diagnosticLevel: "warning",
    diagnosticMaxEntries: 500,
    compatibilityMode: "auto",
    enablePerformanceMetrics: true,
    enableBidirectionalCalendarSync: false,
    enableThunderbirdTagSync: false,
    calendarDeleteOnUnpin: false,
    calendarCompleteOnPinComplete: false,
    enableWaitingWorkflow: false,
    enableAutomaticNoReplyTracking: false,
    noReplyDefaultDays: 5,
    noReplyCancelOnIncomingReply: true,
    defaultFollowUpDays: 3,
    reopenOnConversationReply: false,
    enableCases: true,
    enableKanban: true,
    enableRecurringFollowUps: false,
    enableTemplates: true,
    enableHistory: true,
    enableAutomaticBackups: true,
    backupIntervalHours: 24,
    backupRetention: 10,
    backupDirectory: "",
    backupBeforeMigration: true,
    backupIncludeHistory: true,
    enableRuleSimulation: true,
    ruleErrorDisableThreshold: 5,
    ruleDefaultMaxPerMinute: 60,
    enableConcurrentWriteProtection: true,
    enableCounterRegressionGuard: true,
    autoCleanup: false,
    cleanupGraceDays: 7,
    animateChanges: true,
    enableUndo: true,
    undoTimeoutMs: 9000,
    enableDragFromInbox: true,
    enableMultiSelect: true,
    enableReminders: true,
    confirmDelete: true,
    safeMode: false,
    accountColors: {},
    inboxEnabled: {}
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function normalizeBoolean(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
  }

  function isSafeRecordKey(value, maxLength = 4096) {
    return typeof value === "string" && value.length > 0 && value.length <= maxLength &&
      !UNSAFE_RECORD_KEYS.has(value);
  }

  function normalizeRecord(value, {maxKeyLength = 4096} = {}) {
    const result = {};
    if (!value || typeof value !== "object" || Array.isArray(value)) return result;
    for (const [key, item] of Object.entries(value)) {
      if (isSafeRecordKey(key, maxKeyLength)) result[key] = item;
    }
    return result;
  }

  function boundedText(value, maxLength) {
    return String(value ?? "").slice(0, maxLength);
  }

  function uniqueStrings(values) {
    const result = [];
    const seen = new Set();
    for (const value of Array.isArray(values) ? values : []) {
      const text = String(value);
      if (!seen.has(text)) {
        seen.add(text);
        result.push(text);
      }
    }
    return result;
  }

  function enumValue(value, allowed, fallback) {
    return allowed.has(value) ? value : fallback;
  }

  function normalize(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const settings = clone(DEFAULTS);

    settings.pinMode = enumValue(source.pinMode, new Set(["independent", "nativeStar"]), settings.pinMode);
    settings.defaultPinTarget = enumValue(source.defaultPinTarget, new Set(["message", "conversation"]), settings.defaultPinTarget);
    settings.missedReminderPolicy = enumValue(source.missedReminderPolicy, new Set(["notify", "nextStart", "ignore"]), settings.missedReminderPolicy);
    settings.calendarItemType = enumValue(source.calendarItemType, new Set(["task", "event"]), settings.calendarItemType);
    settings.compatibilityMode = enumValue(source.compatibilityMode, new Set(["auto", "full", "reduced"]), settings.compatibilityMode);
    settings.uiPreset = enumValue(source.uiPreset, new Set(["compact", "balanced", "comfortable"]), settings.uiPreset);
    settings.settingsExperience = enumValue(source.settingsExperience, new Set(["guided", "advanced"]), settings.settingsExperience);
    settings.reduceMotion = enumValue(source.reduceMotion, new Set(["auto", "always", "never"]), settings.reduceMotion);
    settings.diagnosticLevel = enumValue(source.diagnosticLevel, new Set(["debug", "info", "warning", "error"]), settings.diagnosticLevel);
    settings.defaultSmartView = enumValue(source.defaultSmartView, new Set(["all", "today", "overdue", "week", "waiting", "noReply", "snoozed", "noDue", "unread", "missing", "calendarError", "recentCompleted"]), settings.defaultSmartView);
    settings.panelScope = enumValue(source.panelScope, new Set(["currentInbox", "currentAccount", "global"]), settings.panelScope);
    settings.sortMode = enumValue(source.sortMode, new Set(["manual", "pinnedAt", "messageDate", "sender", "account", "deadline", "priority"]), settings.sortMode);
    settings.density = enumValue(source.density, new Set(["compact", "normal", "comfortable"]), settings.density);
    settings.cardLines = [2, 3].includes(Number(source.cardLines)) ? Number(source.cardLines) : settings.cardLines;

    settings.panelMaxHeight = clampNumber(source.panelMaxHeight, 160, 900, settings.panelMaxHeight);
    settings.panelPageSize = clampNumber(source.panelPageSize, 20, 500, settings.panelPageSize);
    settings.panelVirtualizationThreshold = clampNumber(source.panelVirtualizationThreshold, 40, 2000, settings.panelVirtualizationThreshold);
    settings.diagnosticMaxEntries = clampNumber(source.diagnosticMaxEntries, 50, MAX_DIAGNOSTIC_EVENTS, settings.diagnosticMaxEntries);
    settings.noReplyDefaultDays = clampNumber(source.noReplyDefaultDays, 1, 365, settings.noReplyDefaultDays);
    settings.cleanupGraceDays = clampNumber(source.cleanupGraceDays, 0, 90, settings.cleanupGraceDays);
    settings.undoTimeoutMs = clampNumber(source.undoTimeoutMs, 3000, 20000, settings.undoTimeoutMs);
    settings.completedRetentionDays = clampNumber(source.completedRetentionDays, 0, 3650, settings.completedRetentionDays);
    settings.reminderLeadMinutes = clampNumber(source.reminderLeadMinutes, 0, 10080, settings.reminderLeadMinutes);
    settings.defaultFollowUpDays = clampNumber(source.defaultFollowUpDays, 0, 365, settings.defaultFollowUpDays);
    settings.backupIntervalHours = clampNumber(source.backupIntervalHours, 1, 24 * 365, settings.backupIntervalHours);
    settings.backupRetention = clampNumber(source.backupRetention, 1, 100, settings.backupRetention);
    settings.ruleErrorDisableThreshold = clampNumber(source.ruleErrorDisableThreshold, 1, 100, settings.ruleErrorDisableThreshold);
    settings.ruleDefaultMaxPerMinute = clampNumber(source.ruleDefaultMaxPerMinute, 1, 1000, settings.ruleDefaultMaxPerMinute);

    for (const key of [
      "groupByAccount", "groupByCustomGroup", "showAccountColor", "showAttachments",
      "showTags", "showPriority", "smartDates", "showFolder", "showSearch",
      "showQuickActions", "showNotes", "showDeadlines", "showGroups", "showCounters",
      "showFolderBadge", "rememberCollapsed", "autoCleanup", "animateChanges",
      "enableUndo", "enableDragFromInbox", "enableMultiSelect", "enableReminders",
      "confirmDelete", "safeMode", "allowPinOutsideInbox", "showSmartSections",
      "hideCompleted", "autoRemoveCompleted", "enableConversationPins",
      "enableAdvancedReminders", "enableAutomaticRules", "autoUnpinOnArchive",
      "autoCompleteOnArchive", "autoUnpinOnDelete", "autoUnpinOnRead",
      "autoUnpinOnReply", "moveToWaitingOnReply", "keepPinOnMove",
      "enableCalendarIntegration", "enableGlobalDashboard", "enablePerformanceMetrics",
      "enableBidirectionalCalendarSync", "enableThunderbirdTagSync", "calendarDeleteOnUnpin",
      "calendarCompleteOnPinComplete", "enableWaitingWorkflow",
      "reopenOnConversationReply", "enableCases", "enableKanban",
      "enableRecurringFollowUps", "enableTemplates", "enableHistory",
      "enableAutomaticBackups", "backupBeforeMigration", "backupIncludeHistory",
      "enableRuleSimulation", "enableConcurrentWriteProtection",
      "enableCounterRegressionGuard", "enableAutomaticNoReplyTracking",
      "noReplyCancelOnIncomingReply", "enableSmartViews", "enableBulkActions",
      "confirmBulkDestructiveActions", "enableHealthCenter", "enableHealthNotifications",
      "enableDiagnostics"
    ]) {
      settings[key] = normalizeBoolean(source[key], settings[key]);
    }

    settings.accountColors = {};
    for (const [key, color] of Object.entries(normalizeRecord(source.accountColors, {maxKeyLength: 256}))) {
      if (COLOR_RE.test(String(color))) settings.accountColors[key] = String(color).toLowerCase();
    }
    settings.inboxEnabled = {};
    for (const [uri, enabled] of Object.entries(normalizeRecord(source.inboxEnabled, {maxKeyLength: 4096}))) {
      if (typeof enabled === "boolean") settings.inboxEnabled[uri] = enabled;
    }
    settings.autoPinSenders = uniqueStrings(
      Array.isArray(source.autoPinSenders)
        ? source.autoPinSenders.map(item => boundedText(item, 320).trim().toLowerCase()).filter(Boolean)
        : []
    ).slice(0, 200);
    settings.autoPinTags = uniqueStrings(
      Array.isArray(source.autoPinTags)
        ? source.autoPinTags.map(item => boundedText(item, 128).trim()).filter(Boolean)
        : []
    ).slice(0, 100);
    settings.waitingGroupId = GROUP_ID_RE.test(String(source.waitingGroupId || "")) ? String(source.waitingGroupId) : "";
    settings.preferredCalendarId = String(source.preferredCalendarId || "").slice(0, 256);
    settings.backupDirectory = String(source.backupDirectory || "").slice(0, 2048);
    settings.showFolderBadge = false;
    settings.schemaVersion = 7;
    return settings;
  }

  function settingType(key) {
    const value = DEFAULTS[key];
    if (Array.isArray(value)) return "array";
    if (value && typeof value === "object") return "record";
    return typeof value;
  }

  function describe() {
    return Object.keys(DEFAULTS).map(key => ({
      key,
      type: settingType(key),
      defaultValue: clone(DEFAULTS[key]),
      migration: MIGRATION_STRATEGY
    }));
  }

  scope.PinSettings = Object.freeze({
    SCHEMA_VERSION: 7,
    MIGRATION_STRATEGY,
    DEFAULTS,
    defaults: () => clone(DEFAULTS),
    describe,
    normalize
  });
})(this);
