"use strict";

var { MailServices } = ChromeUtils.importESModule(
  "resource:///modules/MailServices.sys.mjs"
);
var { MailUtils } = ChromeUtils.importESModule(
  "resource:///modules/MailUtils.sys.mjs"
);
var { MessageArchiver } = ChromeUtils.importESModule(
  "resource:///modules/MessageArchiver.sys.mjs"
);

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  Sqlite: "resource://gre/modules/Sqlite.sys.mjs",
  cal: "resource:///modules/calendar/calUtils.sys.mjs",
  CalEvent: "resource:///modules/CalEvent.sys.mjs",
  CalTodo: "resource:///modules/CalTodo.sys.mjs"
});

const PIN_MODULES = {};
const MODULE_PATHS = ["identity.js", "storage.js", "workflow.js", "rules.js", "calendar.js"];

const STYLE_SHEET_SERVICE = "@mozilla.org/content/style-sheet-service;1";
const PREF_SETTINGS = "extensions.pinMails.settings";
const PREF_DATA = "extensions.pinMails.data"; // legacy migration source only
const PREF_STRUCTURED_MIGRATED = "extensions.pinMails.structuredMigrated";
const PREF_STORAGE_FALLBACK = "extensions.pinMails.storageFallback";
const PREF_LAST_BACKUP_AT = "extensions.pinMails.lastBackupAt";
const PREF_LAST_BACKUP_PATH = "extensions.pinMails.lastBackupPath";
const DB_FILENAME = "pin-mails-v2.sqlite";
const DB_SCHEMA_VERSION = 5;
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const STORAGE_WRITE_DELAY_MS = 250;
const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;
const MAX_SNAPSHOTS = 5;
const MAX_ACTIVITY = 1000;
const MAX_RULES = 200;
const MAX_CASES = 200;
const MAX_TEMPLATES = 100;
const MAX_HISTORY = 5000;
const MAX_RULE_LOG = 2000;
const DATA_CHANGED_TOPIC = "pin-mails-data-changed";
const DEFAULT_BACKUP_FOLDER = "pin-mails-backups";
const RECOVERY_FILENAME = "pin-mails-recovery.json";
const MAX_RECOVERY_PREF_BYTES = 256 * 1024;
const BACKUP_FORMAT_VERSION = 3;
const RULE_LOOP_GUARD_MS = 5000;
const CALENDAR_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const BACKUP_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const INBOX_ATTRIBUTE = "pin-mails-inbox";
const BUTTON_CLASS = "pin-mails-row-button";
const INDEPENDENT_BUTTON_CLASS = "pin-mails-independent-button";
const PANEL_TOGGLE_ID = "pin-mails-qfb-toggle";
const EDITOR_ID = "pin-mails-editor";
const GROUP_EDITOR_ID = "pin-mails-group-editor";
const TOAST_ID = "pin-mails-toast";
const PANEL_ID = "pin-mails-panel";
const ALL_HEADER_ID = "pin-mails-all-header";
const REFRESH_DELAY_MS = 160;
const READY_RETRIES = 50;
const READY_RETRY_DELAY_MS = 100;
const NONE_INDEX = 0xffffffff;
const DAY_MS = 86_400_000;
const COLOR_RE = /^#[0-9a-f]{6}$/i;
const GROUP_ID_RE = /^[a-z0-9_-]{1,48}$/i;
const MAX_NOTE_LENGTH = 1200;
const MAX_GROUPS = 40;
const MAX_UNDO = 20;
const RESOLVE_CACHE_MS = 30_000;
const CONVERSATION_CACHE_MS = 45_000;
const COMPATIBILITY_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

const DEFAULT_COLORS = [
  "#0f6cbd",
  "#5c2d91",
  "#107c10",
  "#c239b3",
  "#d83b01",
  "#038387",
  "#8e562e",
  "#8764b8",
  "#0078d4",
  "#ca5010"
];

const DEFAULT_SETTINGS = Object.freeze({
  schemaVersion: 5,
  pinMode: "independent",
  panelScope: "currentInbox",
  sortMode: "manual",
  density: "normal",
  cardLines: 3,
  panelMaxHeight: 420,
  panelPageSize: 100,
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
  autoCompleteOnArchive: true,
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
  compatibilityMode: "auto",
  enablePerformanceMetrics: true,
  enableBidirectionalCalendarSync: true,
  calendarDeleteOnUnpin: false,
  calendarCompleteOnPinComplete: true,
  enableWaitingWorkflow: true,
  defaultFollowUpDays: 3,
  reopenOnConversationReply: true,
  enableCases: true,
  enableKanban: true,
  enableRecurringFollowUps: true,
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
  autoCleanup: true,
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

const DEFAULT_DATA = Object.freeze({
  schemaVersion: 5,
  refs: {},
  manualOrder: [],
  groups: [],
  groupOrder: [],
  collapsedByInbox: {},
  panelVisibleByInbox: {},
  rules: [],
  cases: [],
  caseOrder: [],
  templates: [],
  history: [],
  ruleLog: [],
  activity: [],
  dashboard: {filter: "active", search: "", view: "list"},
  migration: {from: 0, to: 5, completedAt: 0},
  revision: 0
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseStored(prefName, fallback) {
  try {
    const raw = Services.prefs.getStringPref(prefName, "");
    if (!raw) {
      return clone(fallback);
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Épingles : préférence invalide ${prefName}`, error);
    return clone(fallback);
  }
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, number));
}

function normalizeBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? {...value}
    : {};
}

function normalizeSettings(value) {
  const source = value && typeof value === "object" ? value : {};
  const settings = clone(DEFAULT_SETTINGS);
  const scopes = new Set(["currentInbox", "currentAccount", "global"]);
  const sorts = new Set(["manual", "pinnedAt", "messageDate", "sender", "account", "deadline", "priority"]);
  const densities = new Set(["compact", "normal", "comfortable"]);
  const pinModes = new Set(["independent", "nativeStar"]);
  const pinTargets = new Set(["message", "conversation"]);
  const missedPolicies = new Set(["notify", "nextStart", "ignore"]);
  const calendarTypes = new Set(["task", "event"]);
  const compatibilityModes = new Set(["auto", "full", "reduced"]);

  settings.pinMode = pinModes.has(source.pinMode) ? source.pinMode : settings.pinMode;
  settings.defaultPinTarget = pinTargets.has(source.defaultPinTarget) ? source.defaultPinTarget : settings.defaultPinTarget;
  settings.missedReminderPolicy = missedPolicies.has(source.missedReminderPolicy) ? source.missedReminderPolicy : settings.missedReminderPolicy;
  settings.calendarItemType = calendarTypes.has(source.calendarItemType) ? source.calendarItemType : settings.calendarItemType;
  settings.compatibilityMode = compatibilityModes.has(source.compatibilityMode) ? source.compatibilityMode : settings.compatibilityMode;
  settings.panelScope = scopes.has(source.panelScope) ? source.panelScope : settings.panelScope;
  settings.sortMode = sorts.has(source.sortMode) ? source.sortMode : settings.sortMode;
  settings.density = densities.has(source.density) ? source.density : settings.density;
  settings.cardLines = [2, 3].includes(Number(source.cardLines)) ? Number(source.cardLines) : settings.cardLines;
  settings.panelMaxHeight = clampNumber(source.panelMaxHeight, 160, 900, settings.panelMaxHeight);
  settings.panelPageSize = clampNumber(source.panelPageSize, 20, 500, settings.panelPageSize);
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
    "enableBidirectionalCalendarSync", "calendarDeleteOnUnpin",
    "calendarCompleteOnPinComplete", "enableWaitingWorkflow",
    "reopenOnConversationReply", "enableCases", "enableKanban",
    "enableRecurringFollowUps", "enableTemplates", "enableHistory",
    "enableAutomaticBackups", "backupBeforeMigration", "backupIncludeHistory",
    "enableRuleSimulation", "enableConcurrentWriteProtection",
    "enableCounterRegressionGuard"
  ]) {
    settings[key] = normalizeBoolean(source[key], settings[key]);
  }

  settings.accountColors = {};
  for (const [key, color] of Object.entries(normalizeRecord(source.accountColors))) {
    if (typeof key === "string" && COLOR_RE.test(String(color))) {
      settings.accountColors[key] = String(color).toLowerCase();
    }
  }
  settings.inboxEnabled = {};
  for (const [uri, enabled] of Object.entries(normalizeRecord(source.inboxEnabled))) {
    if (typeof uri === "string" && typeof enabled === "boolean") {
      settings.inboxEnabled[uri] = enabled;
    }
  }
  settings.autoPinSenders = Array.isArray(source.autoPinSenders)
    ? source.autoPinSenders.map(value => String(value).trim().toLowerCase()).filter(Boolean).slice(0, 200)
    : [];
  settings.autoPinTags = Array.isArray(source.autoPinTags)
    ? source.autoPinTags.map(value => String(value).trim()).filter(Boolean).slice(0, 100)
    : [];
  settings.waitingGroupId = GROUP_ID_RE.test(String(source.waitingGroupId || "")) ? String(source.waitingGroupId) : "";
  settings.preferredCalendarId = String(source.preferredCalendarId || "").slice(0, 256);
  settings.backupDirectory = String(source.backupDirectory || "").slice(0, 2048);
  // This legacy option is intentionally forced off. Pin counts must never be
  // presented as Thunderbird unread/new-message counters in the folder tree.
  settings.showFolderBadge = false;
  settings.schemaVersion = 5;
  return settings;
}

function normalizeGroup(value, fallbackIndex = 0) {
  if (!value || typeof value !== "object") {
    return null;
  }
  let id = String(value.id || `group-${fallbackIndex + 1}`).trim().toLowerCase();
  id = id.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  if (!GROUP_ID_RE.test(id)) {
    return null;
  }
  const name = String(value.name || "Groupe").trim().slice(0, 80) || "Groupe";
  const color = COLOR_RE.test(String(value.color || "")) ? String(value.color).toLowerCase() : "#6264a7";
  return {id, name, color, updatedAt: Math.max(0, Number(value.updatedAt) || Date.now())};
}

function normalizeCase(value, fallbackIndex = 0) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || `case-${fallbackIndex + 1}`).replace(/[^a-z0-9_-]/gi, "-").slice(0, 64);
  if (!id) return null;
  return {
    id,
    name: String(value.name || `Affaire ${fallbackIndex + 1}`).slice(0, 120),
    color: COLOR_RE.test(String(value.color || "")) ? String(value.color).toLowerCase() : "#0f6cbd",
    note: String(value.note || "").slice(0, 4000),
    dueAt: Math.max(0, Number(value.dueAt) || 0),
    status: ["active", "waiting", "planned", "completed"].includes(value.status) ? value.status : "active",
    createdAt: Math.max(0, Number(value.createdAt) || Date.now()),
    updatedAt: Math.max(0, Number(value.updatedAt) || Date.now()),
    calendarId: String(value.calendarId || ""),
    calendarItemId: String(value.calendarItemId || "")
  };
}

function normalizeTemplate(value, fallbackIndex = 0) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || `template-${fallbackIndex + 1}`).replace(/[^a-z0-9_-]/gi, "-").slice(0, 64);
  if (!id) return null;
  return {
    id,
    name: String(value.name || `Modèle ${fallbackIndex + 1}`).slice(0, 120),
    groupId: GROUP_ID_RE.test(String(value.groupId || "")) ? String(value.groupId) : "",
    caseId: String(value.caseId || "").slice(0, 64),
    priorityLevel: ["normal", "high", "urgent"].includes(value.priorityLevel) ? value.priorityLevel : "normal",
    workflowStatus: ["active", "waiting", "planned"].includes(value.workflowStatus) ? value.workflowStatus : "active",
    dueOffsetDays: clampNumber(value.dueOffsetDays, 0, 3650, 0),
    reminderLeadMinutes: clampNumber(value.reminderLeadMinutes, 0, 10080, 0),
    followUpDelayDays: clampNumber(value.followUpDelayDays, 0, 365, 0),
    recurrenceRule: ["", "daily", "weekdays", "weekly", "monthly", "quarterly", "yearly"].includes(value.recurrenceRule) ? value.recurrenceRule : "",
    recurrenceInterval: clampNumber(value.recurrenceInterval, 1, 100, 1),
    notePrefix: String(value.notePrefix || "").slice(0, 500),
    updatedAt: Math.max(0, Number(value.updatedAt) || Date.now())
  };
}

function normalizeHistory(value) {
  if (!value || typeof value !== "object") return null;
  return {
    id: String(value.id || `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).slice(0, 100),
    stableKey: String(value.stableKey || "").slice(0, 1024),
    subject: String(value.subject || "").slice(0, 1000),
    author: String(value.author || "").slice(0, 1000),
    accountKey: String(value.accountKey || "").slice(0, 256),
    accountName: String(value.accountName || "").slice(0, 500),
    groupId: String(value.groupId || "").slice(0, 64),
    caseId: String(value.caseId || "").slice(0, 64),
    pinnedAt: Math.max(0, Number(value.pinnedAt) || 0),
    completedAt: Math.max(0, Number(value.completedAt) || Date.now()),
    durationMs: Math.max(0, Number(value.durationMs) || 0),
    followUpCount: Math.max(0, Number(value.followUpCount) || 0),
    action: String(value.action || "completed").slice(0, 80)
  };
}

function normalizeReference(key, value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const groupId = String(value.groupId || "");
  return {
    stableKey: String(value.stableKey || key),
    headerMessageId: String(value.headerMessageId || ""),
    accountKey: String(value.accountKey || "unknown"),
    sourceInboxURI: String(value.sourceInboxURI || ""),
    lastFolderURI: String(value.lastFolderURI || ""),
    lastMessageKey: Number.isInteger(value.lastMessageKey) ? value.lastMessageKey : Number(value.lastMessageKey) || 0,
    pinnedAt: Number(value.pinnedAt) || Date.now(),
    lastSeen: Number(value.lastSeen) || Date.now(),
    missingSince: Number(value.missingSince) || 0,
    subject: String(value.subject || ""),
    author: String(value.author || ""),
    date: Number(value.date) || 0,
    accountName: String(value.accountName || ""),
    folderName: String(value.folderName || ""),
    note: String(value.note || "").slice(0, MAX_NOTE_LENGTH),
    dueAt: Math.max(0, Number(value.dueAt) || 0),
    reminderAt: Math.max(0, Number(value.reminderAt) || 0),
    reminderFiredAt: Math.max(0, Number(value.reminderFiredAt) || 0),
    priorityLevel: ["normal", "high", "urgent"].includes(value.priorityLevel) ? value.priorityLevel : "normal",
    groupId: GROUP_ID_RE.test(groupId) ? groupId : "",
    trackingMode: value.trackingMode === "conversation" ? "conversation" : "message",
    conversationKey: String(value.conversationKey || ""),
    identityFingerprint: String(value.identityFingerprint || ""),
    completedAt: Math.max(0, Number(value.completedAt) || 0),
    snoozeUntil: Math.max(0, Number(value.snoozeUntil) || 0),
    repeatRule: ["", "daily", "weekdays", "weekly", "monthly"].includes(value.repeatRule) ? value.repeatRule : "",
    reminderLeadMinutes: clampNumber(value.reminderLeadMinutes, 0, 10080, 0),
    calendarId: String(value.calendarId || ""),
    calendarItemId: String(value.calendarItemId || ""),
    calendarItemType: value.calendarItemType === "event" ? "event" : "task",
    conversationCount: Math.max(0, Number(value.conversationCount) || 0),
    conversationUnread: Math.max(0, Number(value.conversationUnread) || 0),
    nativeStarImported: Boolean(value.nativeStarImported),
    rootMessageId: String(value.rootMessageId || ""),
    gmThreadId: String(value.gmThreadId || ""),
    threadId: Math.max(0, Number(value.threadId) || 0),
    workflowStatus: ["active", "waiting", "planned", "completed"].includes(value.workflowStatus) ? value.workflowStatus : (value.completedAt ? "completed" : "active"),
    waitingSince: Math.max(0, Number(value.waitingSince) || 0),
    followUpAt: Math.max(0, Number(value.followUpAt) || 0),
    lastReplyAt: Math.max(0, Number(value.lastReplyAt) || 0),
    lastOutgoingAt: Math.max(0, Number(value.lastOutgoingAt) || 0),
    followUpCount: Math.max(0, Number(value.followUpCount) || 0),
    caseId: String(value.caseId || "").slice(0, 64),
    templateId: String(value.templateId || "").slice(0, 64),
    recurrenceRule: ["", "daily", "weekdays", "weekly", "monthly", "quarterly", "yearly"].includes(value.recurrenceRule) ? value.recurrenceRule : "",
    recurrenceInterval: clampNumber(value.recurrenceInterval, 1, 100, 1),
    calendarLastSyncedAt: Math.max(0, Number(value.calendarLastSyncedAt) || 0),
    calendarSyncHash: String(value.calendarSyncHash || ""),
    createdFromRuleId: String(value.createdFromRuleId || "").slice(0, 64),
    updatedAt: Math.max(0, Number(value.updatedAt) || Date.now())
  };
}

function normalizeData(value) {
  const source = value && typeof value === "object" ? value : {};
  const data = clone(DEFAULT_DATA);
  for (const [key, ref] of Object.entries(normalizeRecord(source.refs))) {
    const normalized = normalizeReference(key, ref);
    if (normalized) {
      data.refs[normalized.stableKey] = normalized;
    }
  }
  data.manualOrder = Array.isArray(source.manualOrder)
    ? source.manualOrder.map(String).filter(key => key in data.refs)
    : [];
  for (const key of Object.keys(data.refs)) {
    if (!data.manualOrder.includes(key)) {
      data.manualOrder.push(key);
    }
  }
  const seenGroups = new Set();
  data.groups = [];
  for (const [index, item] of (Array.isArray(source.groups) ? source.groups : []).entries()) {
    const group = normalizeGroup(item, index);
    if (group && !seenGroups.has(group.id)) {
      seenGroups.add(group.id);
      data.groups.push(group);
    }
  }
  data.groupOrder = Array.isArray(source.groupOrder)
    ? source.groupOrder.map(String).filter(id => seenGroups.has(id))
    : data.groups.map(group => group.id);
  for (const group of data.groups) {
    if (!data.groupOrder.includes(group.id)) {
      data.groupOrder.push(group.id);
    }
  }
  data.collapsedByInbox = normalizeRecord(source.collapsedByInbox);
  data.panelVisibleByInbox = normalizeRecord(source.panelVisibleByInbox);
  data.rules = [];
  for (const [index, item] of (Array.isArray(source.rules) ? source.rules : []).slice(0, MAX_RULES).entries()) {
    const rule = normalizeRule(item, index);
    if (rule && !data.rules.some(existing => existing.id === rule.id)) data.rules.push(rule);
  }
  data.cases = (Array.isArray(source.cases) ? source.cases : []).slice(0, MAX_CASES).map(normalizeCase).filter(Boolean);
  data.caseOrder = Array.isArray(source.caseOrder) ? source.caseOrder.map(String).filter(id => data.cases.some(item => item.id === id)) : data.cases.map(item => item.id);
  for (const item of data.cases) if (!data.caseOrder.includes(item.id)) data.caseOrder.push(item.id);
  data.templates = (Array.isArray(source.templates) ? source.templates : []).slice(0, MAX_TEMPLATES).map(normalizeTemplate).filter(Boolean);
  const caseIds = new Set(data.cases.map(item => item.id));
  const templateIds = new Set(data.templates.map(item => item.id));
  for (const ref of Object.values(data.refs)) {
    if (ref.groupId && !seenGroups.has(ref.groupId)) ref.groupId = "";
    if (ref.caseId && !caseIds.has(ref.caseId)) ref.caseId = "";
    if (ref.templateId && !templateIds.has(ref.templateId)) ref.templateId = "";
  }
  data.history = (Array.isArray(source.history) ? source.history : []).map(normalizeHistory).filter(Boolean).slice(-MAX_HISTORY);
  data.ruleLog = (Array.isArray(source.ruleLog) ? source.ruleLog : []).filter(item => item && typeof item === "object").slice(-MAX_RULE_LOG);
  data.activity = (Array.isArray(source.activity) ? source.activity : [])
    .map(normalizeActivity).filter(Boolean).slice(-MAX_ACTIVITY);
  data.dashboard = {
    filter: ["active", "all", "overdue", "today", "week", "completed", "unread", "waiting", "planned"].includes(source.dashboard?.filter)
      ? source.dashboard.filter : "active",
    search: String(source.dashboard?.search || "").slice(0, 500),
    view: ["list", "kanban", "cases", "history"].includes(source.dashboard?.view) ? source.dashboard.view : "list"
  };
  data.migration = {
    from: Number(source.migration?.from) || Number(source.schemaVersion) || 1,
    to: 5,
    completedAt: Number(source.migration?.completedAt) || 0
  };
  data.revision = Math.max(0, Number(source.revision) || 0);
  data.schemaVersion = 5;
  return data;
}

function hashString(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getDefaultColor(accountKey) {
  return DEFAULT_COLORS[hashString(accountKey) % DEFAULT_COLORS.length];
}

function getFolderChildren(folder) {
  const result = [];
  try {
    for (const child of folder.subFolders) {
      result.push(child.QueryInterface(Ci.nsIMsgFolder));
    }
    return result;
  } catch {
    // Fallback for older XPCOM enumerators.
  }
  try {
    const children = folder.subFolders;
    while (children.hasMoreElements()) {
      result.push(children.getNext().QueryInterface(Ci.nsIMsgFolder));
    }
  } catch {
    // Folder has no readable children.
  }
  return result;
}

function walkFolders(root) {
  const result = [];
  const stack = [root];
  const seen = new Set();
  while (stack.length) {
    const folder = stack.pop();
    if (!folder || seen.has(folder.URI)) {
      continue;
    }
    seen.add(folder.URI);
    result.push(folder);
    for (const child of getFolderChildren(folder)) {
      stack.push(child);
    }
  }
  return result;
}

function getAccountForFolder(folder) {
  if (!folder?.server) {
    return null;
  }
  try {
    return MailServices.accounts.findAccountForServer(folder.server);
  } catch {
    return null;
  }
}

function accountKeyForFolder(folder) {
  return getAccountForFolder(folder)?.key || folder?.server?.key || "unknown";
}

function accountNameForFolder(folder) {
  return (
    getAccountForFolder(folder)?.incomingServer?.prettyName ||
    folder?.server?.prettyName ||
    "Compte inconnu"
  );
}

function messageStableKey(hdr) {
  const accountKey = accountKeyForFolder(hdr?.folder);
  const messageId = String(hdr?.messageId || "").trim().toLowerCase();
  let gmMsgId = "";
  try { gmMsgId = String(hdr?.getStringProperty("x-gm-msgid") || "").trim(); } catch {}
  if (gmMsgId) return `${accountKey}|gmail:${gmMsgId}`;
  if (messageId) return `${accountKey}|mid:${messageId}`;
  return `${accountKey}|fp:${hashString(messageIdentityFingerprint(hdr)).toString(16)}`;
}

function formatAuthor(hdr) {
  return hdr?.mime2DecodedAuthor || hdr?.author || "Expéditeur inconnu";
}

function formatSubject(hdr) {
  return hdr?.mime2DecodedSubject || hdr?.subject || "(sans objet)";
}

function getCachedPreview(hdr) {
  for (const property of ["preview", "snippet", "gloda-preview"]) {
    try {
      const value = hdr.getStringProperty(property);
      if (value) {
        return value.replace(/\s+/g, " ").trim().slice(0, 280);
      }
    } catch {
      // Optional cached property.
    }
  }
  return "";
}

function getTagMetadata(hdr) {
  let keywords = "";
  try {
    keywords = hdr.getStringProperty("keywords") || "";
  } catch {
    return [];
  }
  const tags = [];
  for (const key of keywords.split(/\s+/).filter(Boolean)) {
    try {
      const name = MailServices.tags.getTagForKey(key);
      if (!name) {
        continue;
      }
      tags.push({
        key,
        name,
        color: MailServices.tags.getColorForKey(key) || "currentColor"
      });
    } catch {
      // Ignore unknown keywords which are not Thunderbird tags.
    }
  }
  return tags.slice(0, 3);
}

function hasAttachment(hdr) {
  return Boolean(hdr?.flags & Ci.nsMsgMessageFlags.Attachment);
}

function isHighPriority(hdr) {
  try {
    return Number(hdr.priority) <= Number(Ci.nsMsgPriority.high);
  } catch {
    try {
      const priority = String(hdr.getStringProperty("priority") || "").toLowerCase();
      return ["1", "2", "high", "highest", "urgent"].includes(priority);
    } catch {
      return false;
    }
  }
}

function getMessageDateMs(hdr) {
  if (hdr?.dateInSeconds) {
    return Number(hdr.dateInSeconds) * 1000;
  }
  return Math.floor(Number(hdr?.date || 0) / 1000);
}

function findHeaderInFolder(folder, ref) {
  if (!folder) return null;
  try {
    const database = folder.msgDatabase;
    if (ref.headerMessageId) {
      const found = database?.getMsgHdrForMessageID(ref.headerMessageId);
      if (found && (!ref.identityFingerprint || messageIdentityFingerprint(found) === ref.identityFingerprint)) return found;
      if (found && ref.headerMessageId) return found;
    }
    if (ref.lastMessageKey && database?.containsKey(ref.lastMessageKey)) {
      const found = database.getMsgHdrForKey(ref.lastMessageKey);
      if (!ref.identityFingerprint || messageIdentityFingerprint(found) === ref.identityFingerprint) return found;
    }
    // Fallback for messages without Message-ID, copied messages, Gmail labels and
    // rebuilt IMAP databases. The scan is bounded to protect large folders.
    let inspected = 0;
    const messages = folder.messages;
    while (messages.hasMoreElements() && inspected++ < 20000) {
      const hdr = messages.getNext().QueryInterface(Ci.nsIMsgDBHdr);
      if (ref.identityFingerprint && messageIdentityFingerprint(hdr) === ref.identityFingerprint) return hdr;
      if (ref.headerMessageId && String(hdr.messageId || "") === ref.headerMessageId) return hdr;
    }
  } catch {
    // Database can be unavailable while a remote folder is loading.
  }
  return null;
}

function sanitizeSearchText(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function toLocalDateTimeValue(timestamp) {
  if (!timestamp) {
    return "";
  }
  const date = new Date(timestamp);
  const pad = value => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalDateTimeValue(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : 0;
}


function normalizeSubjectForConversation(subject) {
  return String(subject || "")
    .replace(/^\s*((re|fw|fwd|tr|rép|réponse)\s*:\s*)+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function conversationStableKey(hdr) {
  const accountKey = accountKeyForFolder(hdr?.folder);
  const subject = formatSubject(hdr);
  if (PIN_MODULES.PinIdentity) {
    return PIN_MODULES.PinIdentity.conversationIdentity(hdr, accountKey, subject);
  }
  const normalized = normalizeSubjectForConversation(subject);
  return `${accountKey}|conv:${hashString(normalized).toString(16)}`;
}

function messageIdentityFingerprint(hdr) {
  const accountKey = accountKeyForFolder(hdr?.folder);
  if (PIN_MODULES.PinIdentity) {
    return PIN_MODULES.PinIdentity.fingerprint(hdr, accountKey, formatSubject(hdr), formatAuthor(hdr));
  }
  const messageId = String(hdr?.messageId || "").trim().toLowerCase();
  const author = sanitizeSearchText(formatAuthor(hdr));
  const subject = sanitizeSearchText(formatSubject(hdr));
  const date = Number(hdr?.date || 0);
  const size = Number(hdr?.messageSize || 0);
  return `${accountKey}|${messageId}|${date}|${size}|${hashString(`${author}|${subject}`)}`;
}

function normalizeRule(value, index = 0) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || `rule-${index + 1}`).replace(/[^a-z0-9_-]/gi, "-").slice(0, 64) || `rule-${index + 1}`;
  const trigger = ["messageAdded", "read", "archive", "reply", "move", "delete", "complete", "calendar"].includes(value.trigger) ? value.trigger : "messageAdded";
  const action = ["pin", "unpin", "complete", "group", "keep", "status", "template", "case"].includes(value.action) ? value.action : "pin";
  return {
    id,
    name: String(value.name || `Règle ${index + 1}`).slice(0, 100),
    enabled: value.enabled !== false,
    trigger, action,
    priority: clampNumber(value.priority, 1, 10000, (index + 1) * 100),
    stopProcessing: value.stopProcessing !== false,
    maxPerMinute: clampNumber(value.maxPerMinute, 1, 1000, 60),
    errorCount: Math.max(0, Number(value.errorCount) || 0),
    disabledAt: Math.max(0, Number(value.disabledAt) || 0),
    lastError: String(value.lastError || "").slice(0, 500),
    senderContains: String(value.senderContains || "").trim().toLowerCase().slice(0, 256),
    subjectContains: String(value.subjectContains || "").trim().toLowerCase().slice(0, 256),
    tagKey: String(value.tagKey || "").trim().slice(0, 128),
    accountKey: String(value.accountKey || "").slice(0, 256),
    folderURI: String(value.folderURI || "").slice(0, 1024),
    groupId: GROUP_ID_RE.test(String(value.groupId || "")) ? String(value.groupId) : "",
    caseId: String(value.caseId || "").slice(0, 64),
    templateId: String(value.templateId || "").slice(0, 64),
    workflowStatus: ["active", "waiting", "planned", "completed"].includes(value.workflowStatus) ? value.workflowStatus : "active",
    trackingMode: value.trackingMode === "conversation" ? "conversation" : "message",
    updatedAt: Math.max(0, Number(value.updatedAt) || Date.now())
  };
}

function normalizeActivity(value) {
  if (!value || typeof value !== "object") return null;
  return {
    time: Math.max(0, Number(value.time) || Date.now()),
    type: String(value.type || "info").slice(0, 40),
    stableKey: String(value.stableKey || "").slice(0, 1024),
    label: String(value.label || "").slice(0, 300)
  };
}

function smartSectionForRef(ref, now = Date.now()) {
  if (ref.completedAt) return "completed";
  const due = ref.dueAt || ref.followUpAt || 0;
  if (!due) return "noDue";
  if (due < now) return "overdue";
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const week = new Date(today); week.setDate(week.getDate() + 7);
  if (due < tomorrow.getTime()) return "today";
  if (due < week.getTime()) return "week";
  return "later";
}

const SMART_SECTION_LABELS = Object.freeze({
  overdue: "En retard",
  today: "Aujourd’hui",
  week: "Cette semaine",
  later: "Plus tard",
  noDue: "Sans échéance",
  completed: "Terminés"
});

class PinStructuredStore {
  constructor(owner) {
    this.owner = owner;
    this.connection = null;
    this.available = false;
    this.pendingTimer = null;
    this.pendingSnapshot = null;
    this.writeChain = Promise.resolve();
    this.lastSnapshotAt = 0;
    this.lastPersisted = normalizeData(DEFAULT_DATA);
    this.lastUndo = [];
    this.revision = 0;
    this.lastOptimizeAt = 0;
  }

  async initialize(legacyData, legacyUndo = []) {
    try {
      this.connection = await lazy.Sqlite.openConnection({path: DB_FILENAME, sharedMemoryCache: false});
      await this._createSchema();
      const initialized = await this._getMeta("initialized");
      if (!initialized) {
        const initial = normalizeData(legacyData);
        await this._writeIncremental(initial, legacyUndo, "migration-legacy", true);
        await this._setMeta("initialized", String(Date.now()));
      }
      let loaded = await this.load();
      this.lastPersisted = clone(loaded.data);
      this.lastUndo = clone(loaded.undo || []);
      this.revision = Math.max(0, Number(await this._getMeta("revision")) || loaded.data.revision || 0);
      loaded.data.revision = this.revision;
      const recovery = await this._readEmergencyRecovery(null, []);
      const lastCommitAt = Math.max(0, Number(await this._getMeta("lastCommitAt")) || 0);
      const recoveryIsNewer = (recovery?.source === "file" && Number(recovery.createdAt || 0) > lastCommitAt) ||
        (recovery?.source === "preference" && Number(recovery.data?.revision || 0) > Number(loaded.data?.revision || 0));
      const recoveryDiffers = recovery?.data && this._json(normalizeData(recovery.data)) !== this._json(normalizeData(loaded.data));
      if (recoveryIsNewer && recoveryDiffers) {
        await this._writeIncremental(normalizeData(recovery.data), Array.isArray(recovery.undo) ? recovery.undo : [], "recovery-startup", true);
        loaded = await this.load();
        this.lastPersisted = clone(loaded.data);
        this.lastUndo = clone(loaded.undo || []);
        this.revision = Math.max(this.revision, Number(loaded.data.revision) || 0);
        this.owner._recordDiagnostic?.("warning", "Récupération d’une fermeture interrompue appliquée");
      }
      this.available = true;
      Services.prefs.setBoolPref(PREF_STRUCTURED_MIGRATED, true);
      try { Services.prefs.clearUserPref(PREF_STORAGE_FALLBACK); } catch {}
      try { await IOUtils.remove(this._recoveryPath(), {ignoreAbsent: true}); } catch {}
      return {...loaded, backend: "sqlite-incremental", revision: this.revision};
    } catch (error) {
      this.owner._recordDiagnostic?.("error", "Stockage SQLite indisponible", error);
      this.available = false;
      try { await this.connection?.close(); } catch {}
      this.connection = null;
      const recovery = await this._readEmergencyRecovery(legacyData || DEFAULT_DATA, legacyUndo || []);
      const fallback = normalizeData(recovery.data);
      return {data: fallback, undo: recovery.undo || legacyUndo || [], backend: recovery.source === "file" ? "file-recovery-fallback" : "preference-fallback", revision: fallback.revision || 0};
    }
  }

  _recoveryPath() {
    return PathUtils.join(PathUtils.profileDir, RECOVERY_FILENAME);
  }

  async _readEmergencyRecovery(fallbackData = DEFAULT_DATA, fallbackUndo = []) {
    try {
      const path = this._recoveryPath();
      if (await IOUtils.exists(path)) {
        const raw = await IOUtils.readUTF8(path);
        if (raw.length <= MAX_IMPORT_BYTES * 4) {
          const envelope = JSON.parse(raw);
          if (PIN_MODULES.PinStorageHelpers?.verifyBackupEnvelope(envelope)) {
            return {data: normalizeData(envelope.data), undo: Array.isArray(envelope.undo) ? envelope.undo.slice(-MAX_UNDO) : [], createdAt: Number(envelope.createdAt) || 0, source: "file"};
          }
          this.owner._recordDiagnostic?.("warning", "Fichier de récupération ignoré : somme de contrôle invalide");
        }
      }
    } catch (error) {
      this.owner._recordDiagnostic?.("warning", "Lecture du fichier de récupération impossible", error);
    }
    const prefData = parseStored(PREF_STORAGE_FALLBACK, fallbackData || DEFAULT_DATA);
    return {data: normalizeData(prefData), undo: Array.isArray(fallbackUndo) ? fallbackUndo.slice(-MAX_UNDO) : [], createdAt: 0, source: "preference"};
  }

  async writeEmergencyRecovery(data, undo = [], reason = "emergency") {
    const safeData = normalizeData(clone(data || DEFAULT_DATA));
    const envelope = PIN_MODULES.PinStorageHelpers?.backupEnvelope(safeData, (undo || []).slice(-MAX_UNDO), {
      reason, revision: Number(safeData.revision) || this.revision || 0, extensionVersion: this.owner?._extensionVersion || "0.0.0", schemaVersion: DB_SCHEMA_VERSION, emergency: true
    }) || {format: "pin-mails-backup", createdAt: Date.now(), data: safeData, undo: (undo || []).slice(-MAX_UNDO)};
    const raw = JSON.stringify(envelope);
    await IOUtils.writeUTF8(this._recoveryPath(), raw, {tmpPath: `${this._recoveryPath()}.tmp`});
    const prefRaw = JSON.stringify(safeData);
    if (prefRaw.length <= MAX_RECOVERY_PREF_BYTES) Services.prefs.setStringPref(PREF_STORAGE_FALLBACK, prefRaw);
    else { try { Services.prefs.clearUserPref(PREF_STORAGE_FALLBACK); } catch {} }
    return {written: true, path: this._recoveryPath(), bytes: raw.length};
  }

  async _columnExists(table, column) {
    try {
      const rows = await this.connection.execute(`PRAGMA table_info(${table})`);
      return rows.some(row => row.getResultByName("name") === column);
    } catch {
      return false;
    }
  }

  async _addColumn(table, definition) {
    const column = definition.trim().split(/\s+/)[0];
    if (!(await this._columnExists(table, column))) {
      await this.connection.execute(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
    }
  }

  async _createSchema() {
    const c = this.connection;
    await c.execute("PRAGMA journal_mode=WAL");
    await c.execute("PRAGMA foreign_keys=ON");
    await c.execute("PRAGMA synchronous=NORMAL");
    await c.execute("PRAGMA busy_timeout=5000");
    await c.execute("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    await c.execute("CREATE TABLE IF NOT EXISTS refs (stable_key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at INTEGER NOT NULL)");
    for (const definition of [
      "account_key TEXT NOT NULL DEFAULT ''", "due_at INTEGER NOT NULL DEFAULT 0",
      "completed_at INTEGER NOT NULL DEFAULT 0", "group_id TEXT NOT NULL DEFAULT ''",
      "case_id TEXT NOT NULL DEFAULT ''", "conversation_key TEXT NOT NULL DEFAULT ''",
      "workflow_status TEXT NOT NULL DEFAULT 'active'", "follow_up_at INTEGER NOT NULL DEFAULT 0"
    ]) await this._addColumn("refs", definition);
    await c.execute("CREATE TABLE IF NOT EXISTS groups_data (group_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL)");
    await c.execute("CREATE TABLE IF NOT EXISTS state_data (key TEXT PRIMARY KEY, payload TEXT NOT NULL)");
    await c.execute("CREATE TABLE IF NOT EXISTS undo_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL)");
    await c.execute("CREATE TABLE IF NOT EXISTS rules (rule_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL)");
    await c.execute("CREATE TABLE IF NOT EXISTS cases_data (case_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
    await c.execute("CREATE TABLE IF NOT EXISTS templates (template_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
    await c.execute("CREATE TABLE IF NOT EXISTS history (history_id TEXT PRIMARY KEY, stable_key TEXT NOT NULL, payload TEXT NOT NULL, completed_at INTEGER NOT NULL)");
    await c.execute("CREATE TABLE IF NOT EXISTS rule_log (log_id TEXT PRIMARY KEY, rule_id TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL)");
    await c.execute("CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT NOT NULL, ref_key TEXT NOT NULL, label TEXT NOT NULL, created_at INTEGER NOT NULL)");
    await c.execute("CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, reason TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL)");
    for (const sql of [
      "CREATE INDEX IF NOT EXISTS refs_updated_idx ON refs(updated_at)",
      "CREATE INDEX IF NOT EXISTS refs_account_idx ON refs(account_key)",
      "CREATE INDEX IF NOT EXISTS refs_due_idx ON refs(due_at)",
      "CREATE INDEX IF NOT EXISTS refs_completed_idx ON refs(completed_at)",
      "CREATE INDEX IF NOT EXISTS refs_group_idx ON refs(group_id)",
      "CREATE INDEX IF NOT EXISTS refs_case_idx ON refs(case_id)",
      "CREATE INDEX IF NOT EXISTS refs_conversation_idx ON refs(conversation_key)",
      "CREATE INDEX IF NOT EXISTS refs_workflow_idx ON refs(workflow_status)",
      "CREATE INDEX IF NOT EXISTS refs_followup_idx ON refs(follow_up_at)",
      "CREATE INDEX IF NOT EXISTS activity_created_idx ON activity(created_at)",
      "CREATE INDEX IF NOT EXISTS history_completed_idx ON history(completed_at)",
      "CREATE INDEX IF NOT EXISTS rule_log_created_idx ON rule_log(created_at)"
    ]) await c.execute(sql);
    await this._setMeta("schemaVersion", String(DB_SCHEMA_VERSION));
  }

  async _getMeta(key) {
    const rows = await this.connection.execute("SELECT value FROM meta WHERE key = :key", {key});
    return rows.length ? rows[0].getResultByName("value") : "";
  }

  async _setMeta(key, value) {
    await this.connection.execute(
      "INSERT INTO meta(key, value) VALUES(:key, :value) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      {key, value: String(value)}
    );
  }

  async load() {
    const data = clone(DEFAULT_DATA);
    try {
      for (const row of await this.connection.execute("SELECT stable_key, payload FROM refs")) {
        const key = row.getResultByName("stable_key");
        const ref = normalizeReference(key, JSON.parse(row.getResultByName("payload")));
        if (ref) data.refs[ref.stableKey] = ref;
      }
      for (const row of await this.connection.execute("SELECT payload FROM groups_data ORDER BY sort_order")) {
        const group = normalizeGroup(JSON.parse(row.getResultByName("payload")), data.groups.length);
        if (group) data.groups.push(group);
      }
      data.groupOrder = data.groups.map(group => group.id);
      for (const row of await this.connection.execute("SELECT key, payload FROM state_data")) {
        const key = row.getResultByName("key");
        const value = JSON.parse(row.getResultByName("payload"));
        if (key === "manualOrder") data.manualOrder = Array.isArray(value) ? value.map(String) : [];
        else if (key === "collapsedByInbox") data.collapsedByInbox = normalizeRecord(value);
        else if (key === "panelVisibleByInbox") data.panelVisibleByInbox = normalizeRecord(value);
        else if (key === "migration") data.migration = value;
        else if (key === "dashboard") data.dashboard = value;
        else if (key === "caseOrder") data.caseOrder = Array.isArray(value) ? value.map(String) : [];
      }
      for (const row of await this.connection.execute("SELECT payload FROM rules ORDER BY sort_order")) {
        const rule = normalizeRule(JSON.parse(row.getResultByName("payload")), data.rules.length);
        if (rule) data.rules.push(rule);
      }
      for (const row of await this.connection.execute("SELECT payload FROM cases_data ORDER BY sort_order")) {
        const item = normalizeCase(JSON.parse(row.getResultByName("payload")), data.cases.length);
        if (item) data.cases.push(item);
      }
      if (!data.caseOrder.length) data.caseOrder = data.cases.map(item => item.id);
      for (const row of await this.connection.execute("SELECT payload FROM templates ORDER BY sort_order")) {
        const item = normalizeTemplate(JSON.parse(row.getResultByName("payload")), data.templates.length);
        if (item) data.templates.push(item);
      }
      for (const row of await this.connection.execute("SELECT payload FROM history ORDER BY completed_at DESC LIMIT :limit", {limit: MAX_HISTORY})) {
        const item = normalizeHistory(JSON.parse(row.getResultByName("payload")));
        if (item) data.history.unshift(item);
      }
      for (const row of await this.connection.execute("SELECT payload FROM rule_log ORDER BY created_at DESC LIMIT :limit", {limit: MAX_RULE_LOG})) {
        try { data.ruleLog.unshift(JSON.parse(row.getResultByName("payload"))); } catch {}
      }
      for (const row of await this.connection.execute("SELECT event_type, ref_key, label, created_at FROM activity ORDER BY id DESC LIMIT :limit", {limit: MAX_ACTIVITY})) {
        data.activity.unshift({type: row.getResultByName("event_type"), stableKey: row.getResultByName("ref_key"), label: row.getResultByName("label"), time: row.getResultByName("created_at")});
      }
      const undo = [];
      for (const row of await this.connection.execute("SELECT label, payload, created_at FROM undo_actions ORDER BY id ASC LIMIT :limit", {limit: MAX_UNDO})) {
        try { undo.push({...JSON.parse(row.getResultByName("payload")), label: row.getResultByName("label"), time: row.getResultByName("created_at")}); } catch {}
      }
      data.revision = Math.max(0, Number(await this._getMeta("revision")) || 0);
      return {data: normalizeData(data), undo};
    } catch (error) {
      const rows = await this.connection.execute("SELECT payload FROM snapshots ORDER BY id DESC LIMIT 1");
      if (rows.length) {
        const snapshot = JSON.parse(rows[0].getResultByName("payload"));
        return {data: normalizeData(snapshot.data), undo: Array.isArray(snapshot.undo) ? snapshot.undo.slice(-MAX_UNDO) : []};
      }
      throw error;
    }
  }

  _enqueueWrite(pending) {
    if (!pending) return;
    this.writeChain = this.writeChain.catch(error => {
      this.owner._recordDiagnostic?.("warning", "Reprise après une écriture SQLite interrompue", error);
    }).then(async () => {
      try {
        await this._writeIncremental(pending.snapshot.data, pending.snapshot.undo, pending.reason);
      } catch (error) {
        try { await this.writeEmergencyRecovery(pending.snapshot.data, pending.snapshot.undo, `write-failure-${pending.reason}`); } catch {}
        this.owner._recordDiagnostic?.("error", "Fichier local de récupération utilisé", error);
      }
    });
  }

  scheduleSave(data, undo, reason = "update") {
    const snapshot = {data: clone(data), undo: clone(undo || [])};
    if (!this.available || !this.connection) {
      this.writeChain = this.writeChain.catch(() => {}).then(() => this.writeEmergencyRecovery(snapshot.data, snapshot.undo, `storage-unavailable-${reason}`));
      return;
    }
    this.pendingSnapshot = {snapshot, reason};
    if (this.pendingTimer) this.pendingTimer.cancel();
    this.pendingTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    this.pendingTimer.initWithCallback(() => {
      const pending = this.pendingSnapshot;
      this.pendingSnapshot = null;
      this.pendingTimer = null;
      this._enqueueWrite(pending);
    }, STORAGE_WRITE_DELAY_MS, Ci.nsITimer.TYPE_ONE_SHOT);
  }

  async flush() {
    if (this.pendingSnapshot) {
      this.pendingTimer?.cancel();
      const pending = this.pendingSnapshot;
      this.pendingSnapshot = null;
      this.pendingTimer = null;
      this._enqueueWrite(pending);
    }
    await this.writeChain;
  }

  _json(value) {
    return PIN_MODULES.PinStorageHelpers?.stableStringify(value) || JSON.stringify(value);
  }

  _normalizeListItem(table, value, index = 0) {
    if (table === "groups_data") return normalizeGroup(value, index);
    if (table === "rules") return normalizeRule(value, index);
    if (table === "cases_data") return normalizeCase(value, index);
    if (table === "templates") return normalizeTemplate(value, index);
    return value && typeof value === "object" ? value : null;
  }

  async _upsertList(table, idColumn, previous, next, keyOf, payloadColumns = (_item, _index) => ({}), concurrentWrite = false) {
    const diff = PIN_MODULES.PinStorageHelpers?.listDiff(previous, next, keyOf) || {upsert: [], remove: []};
    const previousOrder = new Map((previous || []).map((item, index) => [String(keyOf(item) || ""), index]));
    const previousByKey = new Map((previous || []).map(item => [String(keyOf(item) || ""), item]));
    const changedKeys = new Set(diff.upsert.map(([key]) => key));
    for (const key of diff.remove) {
      if (concurrentWrite) {
        const rows = await this.connection.execute(`SELECT payload FROM ${table} WHERE ${idColumn} = :id`, {id: key});
        if (rows.length) {
          try {
            const current = this._normalizeListItem(table, JSON.parse(rows[0].getResultByName("payload")), next.length);
            const base = previousByKey.get(key) || null;
            if (current && this._json(current) !== this._json(base)) {
              if (!(next || []).some(item => String(keyOf(item) || "") === key)) next.push(current);
              changedKeys.add(key);
              this.owner._recordDiagnostic?.("warning", `Suppression concurrente évitée (${table}) : ${current.name || key}`);
              continue;
            }
          } catch {}
        }
      }
      await this.connection.execute(`DELETE FROM ${table} WHERE ${idColumn} = :id`, {id: key});
    }
    for (const [index, originalItem] of (next || []).entries()) {
      const key = String(keyOf(originalItem) || "");
      const orderChanged = previousOrder.get(key) !== index;
      if (!key || (!changedKeys.has(key) && !orderChanged)) continue;
      let item = originalItem;
      if (concurrentWrite) {
        const rows = await this.connection.execute(`SELECT payload FROM ${table} WHERE ${idColumn} = :id`, {id: key});
        if (rows.length) {
          try {
            const current = this._normalizeListItem(table, JSON.parse(rows[0].getResultByName("payload")), index);
            const base = previousByKey.get(key) || null;
            const externallyChanged = current && this._json(current) !== this._json(base);
            if (externallyChanged && Number(current.updatedAt || 0) > Number(item.updatedAt || 0)) {
              next[index] = current;
              item = current;
              this.owner._recordDiagnostic?.("warning", `Modification concurrente conservée (${table}) : ${current.name || key}`);
            }
          } catch {}
        }
      }
      const extra = payloadColumns(item, index);
      if (table === "groups_data") await this.connection.execute("INSERT INTO groups_data(group_id,payload,sort_order) VALUES(:id,:payload,:sort) ON CONFLICT(group_id) DO UPDATE SET payload=excluded.payload,sort_order=excluded.sort_order", {id:key,payload:JSON.stringify(item),sort:index});
      else if (table === "rules") await this.connection.execute("INSERT INTO rules(rule_id,payload,sort_order) VALUES(:id,:payload,:sort) ON CONFLICT(rule_id) DO UPDATE SET payload=excluded.payload,sort_order=excluded.sort_order", {id:key,payload:JSON.stringify(item),sort:index});
      else if (table === "cases_data") await this.connection.execute("INSERT INTO cases_data(case_id,payload,sort_order,updated_at) VALUES(:id,:payload,:sort,:updated) ON CONFLICT(case_id) DO UPDATE SET payload=excluded.payload,sort_order=excluded.sort_order,updated_at=excluded.updated_at", {id:key,payload:JSON.stringify(item),sort:index,updated:Number(item.updatedAt)||Date.now(),...extra});
      else if (table === "templates") await this.connection.execute("INSERT INTO templates(template_id,payload,sort_order,updated_at) VALUES(:id,:payload,:sort,:updated) ON CONFLICT(template_id) DO UPDATE SET payload=excluded.payload,sort_order=excluded.sort_order,updated_at=excluded.updated_at", {id:key,payload:JSON.stringify(item),sort:index,updated:Number(item.updatedAt)||Date.now(),...extra});
    }
  }

  async _writeIncremental(data, undo, reason = "update", forceSnapshot = false) {
    if (!this.connection) return;
    const now = Date.now();
    const c = this.connection;
    const previous = this.lastPersisted || normalizeData(DEFAULT_DATA);
    await c.execute("BEGIN IMMEDIATE TRANSACTION");
    try {
      const databaseRevision=Math.max(0,Number(await this._getMeta("revision"))||0);
      const concurrentWrite=databaseRevision>this.revision;
      const refsDiff = PIN_MODULES.PinStorageHelpers?.mapDiff(previous.refs || {}, data.refs || {}) || {upsert: Object.entries(data.refs || {}), remove: []};
      for (const key of refsDiff.remove) {
        if (concurrentWrite) {
          const rows=await c.execute("SELECT payload FROM refs WHERE stable_key=:key",{key});
          if(rows.length){
            try{
              const current=normalizeReference(key,JSON.parse(rows[0].getResultByName("payload")));
              const base=previous.refs?.[key]||null;
              if(current&&this._json(current)!==this._json(base)){
                data.refs[key]=current;
                if(!data.manualOrder.includes(key))data.manualOrder.push(key);
                this.owner._recordDiagnostic?.("warning",`Suppression concurrente évitée : ${current.subject||key}`);
                continue;
              }
            }catch{}
          }
        }
        await c.execute("DELETE FROM refs WHERE stable_key = :key", {key});
      }
      for (const [key, localRef] of refsDiff.upsert) {
        let ref=localRef;
        if(concurrentWrite){
          const rows=await c.execute("SELECT payload FROM refs WHERE stable_key=:key",{key});
          if(rows.length){
            try{
              const current=normalizeReference(key,JSON.parse(rows[0].getResultByName("payload")));
              const base=previous.refs?.[key]||null;
              const externallyChanged=current&&this._json(current)!==this._json(base);
              if(externallyChanged&&Number(current.updatedAt||0)>Number(ref.updatedAt||0)){
                data.refs[key]=current;
                ref=current;
                this.owner._recordDiagnostic?.("warning",`Modification concurrente conservée : ${current.subject||key}`);
              }
            }catch{}
          }
        }
        await c.execute(`INSERT INTO refs(stable_key,payload,updated_at,account_key,due_at,completed_at,group_id,case_id,conversation_key,workflow_status,follow_up_at)
          VALUES(:key,:payload,:updated,:account,:due,:completed,:groupId,:caseId,:conversation,:workflow,:followUp)
          ON CONFLICT(stable_key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at,account_key=excluded.account_key,due_at=excluded.due_at,completed_at=excluded.completed_at,group_id=excluded.group_id,case_id=excluded.case_id,conversation_key=excluded.conversation_key,workflow_status=excluded.workflow_status,follow_up_at=excluded.follow_up_at`, {
          key, payload: JSON.stringify(ref), updated: now, account: ref.accountKey || "", due: ref.dueAt || 0,
          completed: ref.completedAt || 0, groupId: ref.groupId || "", caseId: ref.caseId || "",
          conversation: ref.conversationKey || "", workflow: ref.workflowStatus || "active", followUp: ref.followUpAt || 0
        });
      }
      await this._upsertList("groups_data", "group_id", previous.groups, data.groups, item => item.id, undefined, concurrentWrite);
      await this._upsertList("rules", "rule_id", previous.rules, data.rules, item => item.id, undefined, concurrentWrite);
      await this._upsertList("cases_data", "case_id", previous.cases, data.cases, item => item.id, undefined, concurrentWrite);
      await this._upsertList("templates", "template_id", previous.templates, data.templates, item => item.id, undefined, concurrentWrite);
      data.groupOrder = (data.groupOrder || []).filter(id => data.groups.some(item => item.id === id));
      for (const item of data.groups) if (!data.groupOrder.includes(item.id)) data.groupOrder.push(item.id);
      data.caseOrder = (data.caseOrder || []).filter(id => data.cases.some(item => item.id === id));
      for (const item of data.cases) if (!data.caseOrder.includes(item.id)) data.caseOrder.push(item.id);

      const states = {manualOrder:data.manualOrder||[],collapsedByInbox:data.collapsedByInbox||{},panelVisibleByInbox:data.panelVisibleByInbox||{},migration:data.migration||{},dashboard:data.dashboard||{},caseOrder:data.caseOrder||[]};
      const oldStates = {manualOrder:previous.manualOrder||[],collapsedByInbox:previous.collapsedByInbox||{},panelVisibleByInbox:previous.panelVisibleByInbox||{},migration:previous.migration||{},dashboard:previous.dashboard||{},caseOrder:previous.caseOrder||[]};
      for (const [key, value] of Object.entries(states)) if (this._json(value) !== this._json(oldStates[key])) await c.execute("INSERT INTO state_data(key,payload) VALUES(:key,:payload) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload", {key,payload:JSON.stringify(value)});

      const oldHistory = Object.fromEntries((previous.history||[]).map(item=>[item.id,item]));
      const nextHistory = Object.fromEntries((data.history||[]).map(item=>[item.id,item]));
      const historyDiff = PIN_MODULES.PinStorageHelpers?.mapDiff(oldHistory,nextHistory) || {upsert:Object.entries(nextHistory),remove:[]};
      for (const key of historyDiff.remove) await c.execute("DELETE FROM history WHERE history_id=:id",{id:key});
      for (const [key,item] of historyDiff.upsert) await c.execute("INSERT INTO history(history_id,stable_key,payload,completed_at) VALUES(:id,:stable,:payload,:completed) ON CONFLICT(history_id) DO UPDATE SET payload=excluded.payload,completed_at=excluded.completed_at",{id:key,stable:item.stableKey||"",payload:JSON.stringify(item),completed:item.completedAt||now});
      await c.execute("DELETE FROM history WHERE history_id NOT IN (SELECT history_id FROM history ORDER BY completed_at DESC LIMIT :limit)",{limit:MAX_HISTORY});

      const oldLogs = Object.fromEntries((previous.ruleLog||[]).map(item=>[item.id,item]));
      const nextLogs = Object.fromEntries((data.ruleLog||[]).map(item=>[item.id,item]));
      const logDiff = PIN_MODULES.PinStorageHelpers?.mapDiff(oldLogs,nextLogs) || {upsert:Object.entries(nextLogs),remove:[]};
      for (const key of logDiff.remove) await c.execute("DELETE FROM rule_log WHERE log_id=:id",{id:key});
      for (const [key,item] of logDiff.upsert) await c.execute("INSERT INTO rule_log(log_id,rule_id,payload,created_at) VALUES(:id,:rule,:payload,:created) ON CONFLICT(log_id) DO UPDATE SET payload=excluded.payload",{id:key,rule:item.ruleId||"",payload:JSON.stringify(item),created:item.time||now});
      await c.execute("DELETE FROM rule_log WHERE log_id NOT IN (SELECT log_id FROM rule_log ORDER BY created_at DESC LIMIT :limit)",{limit:MAX_RULE_LOG});

      if (this._json(previous.activity||[]) !== this._json(data.activity||[])) {
        const oldActivity=(previous.activity||[]).slice(-MAX_ACTIVITY),nextActivity=(data.activity||[]).slice(-MAX_ACTIVITY);
        let overlap=0;
        for(let length=Math.min(oldActivity.length,nextActivity.length);length>=0;length--){
          if(this._json(oldActivity.slice(oldActivity.length-length))===this._json(nextActivity.slice(0,length))){overlap=length;break;}
        }
        if(overlap===0&&oldActivity.length&&nextActivity.length){
          await c.execute("DELETE FROM activity");
          overlap=0;
        }
        for (const item of nextActivity.slice(overlap)) await c.execute("INSERT INTO activity(event_type,ref_key,label,created_at) VALUES(:type,:key,:label,:time)",{type:item.type,key:item.stableKey||"",label:item.label||"",time:item.time||now});
        await c.execute("DELETE FROM activity WHERE id NOT IN (SELECT id FROM activity ORDER BY id DESC LIMIT :limit)",{limit:MAX_ACTIVITY});
      }
      if (this._json(this.lastUndo) !== this._json(undo||[])) {
        await c.execute("DELETE FROM undo_actions");
        for (const action of (undo||[]).slice(-MAX_UNDO)) { const {label="Action",time=now,...payload}=action||{}; await c.execute("INSERT INTO undo_actions(label,payload,created_at) VALUES(:label,:payload,:time)",{label,payload:JSON.stringify(payload),time}); }
      }

      this.revision = Math.max(databaseRevision, this.revision, Number(data.revision)||0) + 1;
      data.revision = this.revision;
      await this._setMeta("revision", String(this.revision));
      await this._setMeta("schemaVersion", String(DB_SCHEMA_VERSION));
      await this._setMeta("lastCommitAt", String(now));
      if (forceSnapshot || now - this.lastSnapshotAt >= SNAPSHOT_INTERVAL_MS) {
        await c.execute("INSERT INTO snapshots(reason,payload,created_at) VALUES(:reason,:payload,:time)",{reason,payload:JSON.stringify({data,undo:(undo||[]).slice(-MAX_UNDO)}),time:now});
        await c.execute("DELETE FROM snapshots WHERE id NOT IN (SELECT id FROM snapshots ORDER BY id DESC LIMIT :limit)",{limit:MAX_SNAPSHOTS});
        this.lastSnapshotAt=now;
      }
      await c.execute("COMMIT TRANSACTION");
      this.lastPersisted=clone(data); this.lastUndo=clone(undo||[]);
      this.owner._onStorageCommitted?.(this.revision, reason);
      if (concurrentWrite) {
        Services.tm.dispatchToMainThread(() => {
          this.owner._reloadFromStorage?.(this.revision).catch(error => this.owner._recordDiagnostic?.("warning", "Fusion multi-fenêtres incomplète", error));
        });
      }
      await this._maybeOptimize(now);
      await this._maybeAutomaticBackup(data, undo, reason, now);
    } catch (error) {
      try { await c.execute("ROLLBACK TRANSACTION"); } catch {}
      this.owner._recordDiagnostic?.("error", "Écriture SQLite incrémentale annulée", error);
      throw error;
    }
  }

  async _maybeOptimize(now=Date.now()) {
    if (now-this.lastOptimizeAt < DAY_MS) return;
    this.lastOptimizeAt=now;
    try { await this.connection.execute("PRAGMA optimize"); await this.connection.execute("PRAGMA wal_checkpoint(PASSIVE)"); } catch (error) { this.owner._recordDiagnostic?.("warning","Optimisation SQLite incomplète",error); }
  }

  async integrityCheck() {
    if (!this.connection) return {ok:false,backend:"unavailable",rows:[]};
    const rows=await this.connection.execute("PRAGMA quick_check");
    const values=rows.map(row=>String(row.getResultByIndex(0)));
    const foreign=await this.connection.execute("PRAGMA foreign_key_check");
    return {ok:values.every(value=>value==="ok")&&!foreign.length,rows:values,foreignKeyErrors:foreign.length,revision:this.revision};
  }

  _backupDirectory() {
    return this.owner._settings?.backupDirectory || PathUtils.join(PathUtils.profileDir, DEFAULT_BACKUP_FOLDER);
  }

  async createFileBackup(data, undo, reason="manual") {
    const directory=this._backupDirectory();
    await IOUtils.makeDirectory(directory,{ignoreExisting:true});
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    const safeReason=PIN_MODULES.PinStorageHelpers?.sanitizeFilename(reason)||"backup";
    const path=PathUtils.join(directory,`pin-mails-${stamp}-${safeReason}.json`);
    const backupData=clone(data);
    if (!this.owner._settings?.backupIncludeHistory) {
      backupData.history=[];
      backupData.ruleLog=[];
      backupData.activity=[];
    }
    const metadata={reason,revision:this.revision,extensionVersion:this.owner?._extensionVersion||"0.0.0",schemaVersion:DB_SCHEMA_VERSION,settings:clone(this.owner._settings||DEFAULT_SETTINGS)};
    const envelope=PIN_MODULES.PinStorageHelpers?.backupEnvelope(backupData,undo,metadata)||{format:"pin-mails-backup",createdAt:Date.now(),metadata,data:backupData,undo};
    await IOUtils.writeUTF8(path,JSON.stringify(envelope,null,2),{tmpPath:`${path}.tmp`});
    const children=(await IOUtils.getChildren(directory))
      .filter(item => /^pin-mails-.*\.json$/i.test(PathUtils.filename(item)))
      .sort();
    const retention=this.owner._settings?.backupRetention||10;
    for (const obsolete of children.slice(0,Math.max(0,children.length-retention))) {
      try { await IOUtils.remove(obsolete); }
      catch (error) { this.owner._recordDiagnostic?.("warning", "Ancienne sauvegarde impossible à supprimer", error); }
    }
    const backupTime=Date.now();
    if(this.connection){await this._setMeta("lastBackupAt",String(backupTime));await this._setMeta("lastBackupPath",path);}
    else{Services.prefs.setStringPref(PREF_LAST_BACKUP_AT,String(backupTime));Services.prefs.setStringPref(PREF_LAST_BACKUP_PATH,path);}
    return {created:true,path,directory};
  }

  async _maybeAutomaticBackup(data,undo,reason,now=Date.now()) {
    if (!this.owner._settings?.enableAutomaticBackups) return;
    const last=Number(await this._getMeta("lastBackupAt"))||0;
    if (now-last < (this.owner._settings.backupIntervalHours||24)*3600000) return;
    try { await this.createFileBackup(data,undo,`auto-${reason}`); } catch(error) { this.owner._recordDiagnostic?.("warning","Sauvegarde automatique impossible",error); }
  }

  async getBackupStatus() {
    const lastBackupAt=this.connection?(Number(await this._getMeta("lastBackupAt"))||0):(Number(Services.prefs.getStringPref(PREF_LAST_BACKUP_AT,"0"))||0);
    const lastBackupPath=this.connection?await this._getMeta("lastBackupPath"):Services.prefs.getStringPref(PREF_LAST_BACKUP_PATH,"");
    const interval=(this.owner._settings?.backupIntervalHours||24)*3600000;
    return {directory:this._backupDirectory(),lastBackupAt,lastBackupPath,retention:this.owner._settings?.backupRetention||10,nextBackupAt:lastBackupAt?lastBackupAt+interval:Date.now(),stale:!lastBackupAt||Date.now()-lastBackupAt>interval*1.5};
  }

  async close() {
    try { await this.flush(); } catch {}
    try { await this.connection?.execute("PRAGMA wal_checkpoint(TRUNCATE)"); } catch {}
    try { await this.connection?.close(); } catch {}
    this.connection=null; this.available=false;
  }
}

var pinInbox = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    this._states ??= new Set();
    this._menuWindows ??= new Map();
    this._context = context;
    this._rootURI = context.extension.rootURI;
    this._extensionVersion = String(context.extension.manifest?.version || "0.0.0");
    if (!this._modulesLoaded) {
      for (const name of MODULE_PATHS) {
        Services.scriptloader.loadSubScript(context.extension.rootURI.resolve(`api/pinInbox/modules/${name}`), PIN_MODULES, "UTF-8");
      }
      this._modulesLoaded = true;
    }
    if (!this._readyPromise) {
    const rawSettings = parseStored(PREF_SETTINGS, DEFAULT_SETTINGS);
    const rawData = parseStored(PREF_DATA, DEFAULT_DATA);
    this._settings = normalizeSettings(rawSettings);
    this._data = normalizeData(rawData);
    this._undoStack = [];
    this._resolveCache = new Map();
    this._conversationCache = new Map();
    this._diagnosticEvents = [];
    this._performance = {renders: 0, totalRenderMs: 0, maxRenderMs: 0, resolves: 0, cacheHits: 0, ruleRuns: 0, lastRenderMs: 0};
    this._compatibility = {mode: "checking", missing: [], checkedAt: 0, reduced: false};
    this._instanceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this._ruleGuard = new Map();
    this._ruleRates = new Map();
    this._calendarObservers = new Map();
    this._pendingDeleteKeys = new Set();
    this._pendingDeleteTimers = new Set();
    this._lastCalendarSyncAt = 0;
    this._counterRegressionEvents = [];
    this._dashboardRequestPending = false;
    this._storage = new PinStructuredStore(this);
    this._readyPromise = this._storage.initialize(this._data, this._undoStack).then(result => {
      this._data = normalizeData(result.data);
      this._undoStack = Array.isArray(result.undo) ? result.undo.slice(-MAX_UNDO) : [];
      this._storageBackend = result.backend;
      this._data.revision = Math.max(Number(this._data.revision) || 0, Number(result.revision) || 0);
      return this._migrateFromLegacy(rawSettings, rawData).then(() => {
      this._registerStyleSheet(context);
      this._checkCompatibility(true);
      this._registerFolderListener();
      this._registerDataObserver();
      this._registerCalendarObservers();
      this._startReminderTimer();
      this._startCalendarSyncTimer();
      this._startBackupTimer();
      if (String(result.backend || "").startsWith("sqlite")) {
        try { Services.prefs.clearUserPref(PREF_DATA); } catch {}
      }
      return true;
      });
    }).catch(error => {
      this._recordDiagnostic("error", "Initialisation incomplète", error);
      this._storageBackend = "preference-fallback";
      this._registerStyleSheet(context);
      this._checkCompatibility(true);
      this._registerFolderListener();
      this._registerDataObserver();
      this._registerCalendarObservers();
      this._startReminderTimer();
      this._startCalendarSyncTimer();
      this._startBackupTimer();
      return false;
    });
    }

    const ready = callback => async (...args) => {
      await this._ensureReady();
      return callback(...args);
    };

    return {
      pinInbox: {
        onDashboardRequested: new ExtensionCommon.EventManager({
          context,
          name: "pinInbox.onDashboardRequested",
          register: fire => {
            const listener = () => fire.async();
            this._dashboardRequestListeners ??= new Set();
            this._dashboardRequestListeners.add(listener);
            if (this._dashboardRequestPending) {
              this._dashboardRequestPending = false;
              Services.tm.dispatchToMainThread(() => {
                if (this._dashboardRequestListeners?.has(listener)) listener();
              });
            }
            return () => this._dashboardRequestListeners?.delete(listener);
          }
        }).api(),
        setup: ready(tabId => this._setupTab(context, tabId)),
        toggleSelected: ready((tabId, forceState) => this._toggleSelectedByTab(context, tabId, forceState)),
        toggleConversationSelected: ready((tabId, forceState) => this._toggleConversationSelectedByTab(context, tabId, forceState)),
        toggleDisplayed: ready((tabId, forceState) => this._toggleDisplayedByTab(context, tabId, forceState)),
        getSelectionState: ready(tabId => this._getSelectionStateByTab(context, tabId)),
        performSelected: ready((tabId, action) => this._performSelectedByTab(context, tabId, action)),
        getConfiguration: ready(() => this._getConfiguration()),
        setConfiguration: ready(configuration => this._setConfiguration(configuration)),
        exportConfiguration: ready(() => this._exportConfiguration()),
        importConfiguration: ready(configuration => this._importConfiguration(configuration)),
        resetConfiguration: ready(() => this._resetConfiguration()),
        cleanupBroken: ready(() => this._cleanupBroken()),
        rescanPinned: ready(() => this._rescanPinned()),
        undoLast: ready(() => this._undoLast()),
        repairReferences: ready(() => this._repairReferences()),
        resetInterface: ready(() => this._resetInterface()),
        importNativeStars: ready(clearStars => this._importNativeStars(Boolean(clearStars))),
        getDiagnosticReport: ready(() => this._getDiagnosticReport()),
        getDashboardData: ready(options => this._getDashboardData(options || {})),
        openReference: ready(stableKey => this._openReference(stableKey)),
        performReferenceAction: ready((stableKeys, action, options) => this._performReferenceAction(stableKeys, action, options || {})),
        getCalendars: ready(() => this._getCalendars()),
        createCalendarItem: ready((stableKey, itemType, calendarId) => this._createCalendarItem(stableKey, itemType, calendarId)),
        createCaseCalendarItem: ready((caseId, itemType, calendarId) => this._createCaseCalendarItem(caseId, itemType, calendarId)),
        snoozeReminder: ready((stableKey, durationMs) => this._snoozeReminder(stableKey, durationMs)),
        runCompatibilityCheck: ready(() => this._checkCompatibility(true)),
        getPerformanceReport: ready(() => this._getPerformanceReport()),
        checkStorageIntegrity: ready(() => this._storage.integrityCheck()),
        runBackup: ready(reason => this._storage.createFileBackup(this._data, this._undoStack, reason || "manual")),
        getBackupStatus: ready(() => this._storage.getBackupStatus()),
        chooseBackupDirectory: ready(() => this._chooseBackupDirectory()),
        simulateRules: ready(options => this._simulateRules(options || {})),
        clearRuleLog: ready(() => this._clearRuleLog()),
        getCases: ready(() => clone(this._data.cases || [])),
        getTemplates: ready(() => clone(this._data.templates || [])),
        getHistory: ready(options => this._getHistory(options || {})),
        setWorkflowStatus: ready((stableKeys, status, options) => this._setWorkflowStatus(stableKeys, status, options || {})),
        createCase: ready(details => this._createCase(details || {})),
        updateCase: ready((caseId, details) => this._updateCase(caseId, details || {})),
        deleteCase: ready(caseId => this._deleteCase(caseId)),
        createTemplate: ready(details => this._createTemplate(details || {})),
        updateTemplate: ready((templateId, details) => this._updateTemplate(templateId, details || {})),
        deleteTemplate: ready(templateId => this._deleteTemplate(templateId)),
        applyTemplate: ready((stableKeys, templateId) => this._applyTemplate(stableKeys, templateId)),
        syncCalendarLinks: ready(() => this._syncCalendarLinks(true))
      }
    };
  }

  async _ensureReady() {
    if (this._readyPromise) await this._readyPromise;
  }


  _saveSettings() {
    Services.prefs.setStringPref(PREF_SETTINGS, JSON.stringify(this._settings));
  }

  _withoutUpdatedAt(value) {
    if (!value || typeof value !== "object") return value;
    const copy = {...value};
    delete copy.updatedAt;
    return copy;
  }

  _stampChangedEntities() {
    const previous = this._storage?.lastPersisted || DEFAULT_DATA;
    const stringify = value => PIN_MODULES.PinStorageHelpers?.stableStringify(value) || JSON.stringify(value);
    const now = Date.now();
    for (const [key, ref] of Object.entries(this._data.refs || {})) {
      const base = previous.refs?.[key];
      if (!base || stringify(this._withoutUpdatedAt(ref)) !== stringify(this._withoutUpdatedAt(base))) {
        if (!base || Number(ref.updatedAt || 0) <= Number(base.updatedAt || 0)) ref.updatedAt = now;
      }
    }
    for (const field of ["groups", "rules", "cases", "templates"]) {
      const baseById = new Map((previous[field] || []).map(item => [String(item.id || ""), item]));
      for (const item of this._data[field] || []) {
        const base = baseById.get(String(item.id || ""));
        if (!base || stringify(this._withoutUpdatedAt(item)) !== stringify(this._withoutUpdatedAt(base))) {
          if (!base || Number(item.updatedAt || 0) <= Number(base.updatedAt || 0)) item.updatedAt = now;
        }
      }
    }
  }

  _saveData(reason = "update") {
    this._stampChangedEntities();
    this._storage?.scheduleSave(this._data, this._undoStack, reason);
  }

  _applyRuntimeSettings() {
    if (this._settings.enableCalendarIntegration && this._settings.enableBidirectionalCalendarSync) {
      this._registerCalendarObservers();
    } else {
      this._unregisterCalendarObservers();
    }
    this._startCalendarSyncTimer();
    this._startBackupTimer();
    this._checkCompatibility(true);
  }

  _onStorageCommitted(revision, reason) {
    this._data.revision = Math.max(Number(this._data.revision) || 0, Number(revision) || 0);
    Services.obs.notifyObservers(null, DATA_CHANGED_TOPIC, JSON.stringify({source: this._instanceId, revision: this._data.revision, reason}));
  }

  _registerDataObserver() {
    if (this._dataObserverRegistered) return;
    Services.obs.addObserver(this, DATA_CHANGED_TOPIC);
    this._dataObserverRegistered = true;
  }

  _unregisterDataObserver() {
    if (!this._dataObserverRegistered) return;
    try { Services.obs.removeObserver(this, DATA_CHANGED_TOPIC); } catch {}
    this._dataObserverRegistered = false;
  }

  observe(_subject, topic, payload) {
    if (topic !== DATA_CHANGED_TOPIC) return;
    try {
      const event = JSON.parse(payload || "{}");
      if (event.source === this._instanceId || Number(event.revision) <= Number(this._data.revision || 0)) return;
      this._reloadFromStorage(event.revision);
    } catch (error) { this._recordDiagnostic("warning", "Synchronisation multi-fenêtres invalide", error); }
  }

  async _reloadFromStorage(expectedRevision = 0) {
    try {
      await this._storage.flush();
      const loaded = await this._storage.load();
      if (Number(loaded.data.revision || 0) < Number(expectedRevision || 0)) return;
      this._data = normalizeData(loaded.data);
      this._undoStack = Array.isArray(loaded.undo) ? loaded.undo.slice(-MAX_UNDO) : this._undoStack;
      this._refreshAllStates(true);
    } catch (error) { this._recordDiagnostic("warning", "Rechargement multi-fenêtres impossible", error); }
  }

  _t(key, fallback = "") {
    try { return this._context?.extension?.localeData?.localizeMessage(key) || fallback || key; } catch { return fallback || key; }
  }

  async _migrateFromLegacy(rawSettings, rawData) {
    const oldSettingsVersion = Number(rawSettings?.schemaVersion) || 1;
    const oldDataVersion = Number(rawData?.schemaVersion) || Number(this._data.schemaVersion) || 1;
    const oldVersion = Math.min(oldSettingsVersion, oldDataVersion);
    if (oldVersion < 5 || Number(this._data.migration?.to) < 5) {
      if (this._settings.backupBeforeMigration && this._storage?.available) {
        try {
          await this._storage.createFileBackup(clone(this._data), clone(this._undoStack), `before-migration-${oldVersion}-to-5`);
        } catch (error) {
          this._recordDiagnostic("warning", "Sauvegarde pré-migration impossible", error);
        }
      }
      this._settings.pinMode ||= "independent";
      this._settings.showFolderBadge = false;
      for (const ref of Object.values(this._data.refs)) {
        ref.workflowStatus = ref.completedAt ? "completed" : (ref.workflowStatus || "active");
        ref.updatedAt ||= Date.now();
        const hdr = this._resolveReference(ref, false);
        if (hdr && PIN_MODULES.PinIdentity) {
          const sig = PIN_MODULES.PinIdentity.signature(hdr, accountKeyForFolder(hdr.folder), formatSubject(hdr), formatAuthor(hdr));
          ref.rootMessageId ||= sig.rootMessageId; ref.gmThreadId ||= sig.gmThreadId; ref.threadId ||= sig.threadId;
          if (ref.trackingMode === "conversation") ref.conversationKey = PIN_MODULES.PinIdentity.conversationIdentity(hdr, ref.accountKey, formatSubject(hdr));
        }
      }
      this._data.cases ||= []; this._data.caseOrder ||= []; this._data.templates ||= []; this._data.history ||= []; this._data.ruleLog ||= [];
      this._data.dashboard = {...(this._data.dashboard || {}), view: this._data.dashboard?.view || "list"};
      this._data.migration = {from: oldVersion, to: 5, completedAt: Date.now()};
      this._settings.schemaVersion = 5; this._data.schemaVersion = 5;
      this._saveSettings(); this._saveData("migration-v3");
    }
  }

  _recordDiagnostic(type, message, details = "") {
    this._diagnosticEvents ??= [];
    this._diagnosticEvents.push({time: Date.now(), type, message: String(message), details: String(details || "").slice(0, 500)});
    if (this._diagnosticEvents.length > 100) {
      this._diagnosticEvents.splice(0, this._diagnosticEvents.length - 100);
    }
  }

  _recordActivity(type, stableKey = "", label = "") {
    this._data.activity ??= [];
    this._data.activity.push({time: Date.now(), type: String(type), stableKey: String(stableKey || ""), label: String(label || "").slice(0, 300)});
    if (this._data.activity.length > MAX_ACTIVITY) this._data.activity.splice(0, this._data.activity.length - MAX_ACTIVITY);
  }

  _pushUndo(label, flags = []) {
    if (!this._settings.enableUndo) {
      return;
    }
    this._undoStack ??= [];
    this._undoStack.push({
      label: String(label || "Action"),
      data: clone(this._data),
      settings: clone(this._settings),
      flags
    });
    if (this._undoStack.length > MAX_UNDO) {
      this._undoStack.shift();
    }
    this._saveData("undo-stack");
  }

  _undoLast() {
    const action = this._undoStack?.pop();
    if (!action) {
      return {undone: false, message: "Aucune action à annuler."};
    }
    this._data = normalizeData(action.data);
    this._settings = normalizeSettings(action.settings);
    for (const item of action.flags || []) {
      try {
        const hdr = this._resolveCapturedHeader(item);
        if (!hdr) continue;
        if (typeof item.flagged === "boolean") hdr.folder.markMessagesFlagged([hdr], item.flagged);
        if (typeof item.read === "boolean") hdr.folder.markMessagesRead([hdr], item.read);
      } catch (error) {
        this._recordDiagnostic("warning", "Restauration partielle d’une action", error);
      }
    }
    this._saveSettings();
    this._saveData("undo");
    this._applyRuntimeSettings();
    this._refreshAllStates(true);
    this._showToastAll(`${action.label} annulée.`, false);
    return {undone: true, message: `${action.label} annulée.`};
  }

  _showToastAll(message, allowUndo = true) {
    for (const state of this._states || []) {
      state.showToast?.(message, allowUndo && Boolean(this._undoStack?.length));
    }
  }

  _startReminderTimer() {
    if (this._reminderTimer) {
      return;
    }
    try {
      this._reminderTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
      this._reminderTimer.initWithCallback(
        () => this._checkReminders(),
        60_000,
        Ci.nsITimer.TYPE_REPEATING_SLACK
      );
      this._checkReminders();
    } catch (error) {
      this._recordDiagnostic("warning", "Rappels indisponibles", error);
    }
  }

  _nextRepeatedReminder(ref, base) {
    const next = new Date(base || Date.now());
    if (ref.repeatRule === "daily") next.setDate(next.getDate() + 1);
    else if (ref.repeatRule === "weekdays") {
      do { next.setDate(next.getDate() + 1); } while ([0, 6].includes(next.getDay()));
    } else if (ref.repeatRule === "weekly") next.setDate(next.getDate() + 7);
    else if (ref.repeatRule === "monthly") next.setMonth(next.getMonth() + 1);
    else return 0;
    return next.getTime();
  }

  _checkReminders() {
    this._applyCompletedRetention();
    if (!this._settings?.enableReminders || this._settings.safeMode) return;
    const now = Date.now();
    let changed = false;
    for (const ref of Object.values(this._data.refs || {})) {
      if (ref.completedAt) continue;
      const lead = (ref.reminderLeadMinutes || this._settings.reminderLeadMinutes || 0) * 60_000;
      const baseTrigger = ref.snoozeUntil || ref.reminderAt || (ref.workflowStatus === "waiting" && ref.followUpAt ? ref.followUpAt : (ref.dueAt ? ref.dueAt - lead : 0));
      if (!baseTrigger || baseTrigger > now || ref.reminderFiredAt >= baseTrigger) continue;
      if (this._settings.missedReminderPolicy === "ignore" && now - baseTrigger > DAY_MS) {
        ref.reminderFiredAt = now; changed = true; continue;
      }
      const title = ref.workflowStatus === "waiting" && ref.followUpAt && ref.followUpAt <= now ? "Relance à effectuer" : (ref.dueAt && ref.dueAt < now ? "Message épinglé en retard" : "Rappel de message épinglé");
      const text = `${ref.subject || "(sans objet)"} — ${ref.author || ref.accountName || ""}`;
      try {
        const listener = {
          observe: (_subject, topic) => {
            if (topic === "alertclickcallback") this._openReference(ref.stableKey);
          },
          QueryInterface: ChromeUtils.generateQI(["nsIObserver"])
        };
        Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService)
          .showAlertNotification("", title, text, true, ref.stableKey, listener, `pin-mails-${hashString(ref.stableKey)}`);
      } catch (error) {
        this._recordDiagnostic("warning", "Notification de rappel impossible", error);
      }
      ref.reminderFiredAt = now;
      ref.snoozeUntil = 0;
      if (ref.workflowStatus === "waiting" && ref.followUpAt && ref.followUpAt <= now) ref.followUpCount = (ref.followUpCount || 0) + 1;
      const next = this._nextRepeatedReminder(ref, ref.reminderAt || ref.dueAt || now);
      if (next) {
        if (ref.reminderAt) ref.reminderAt = next;
        if (ref.dueAt) ref.dueAt = next;
        ref.reminderFiredAt = 0;
      }
      this._recordActivity("reminder", ref.stableKey, title);
      changed = true;
    }
    if (changed) { this._saveData("reminders"); this._refreshAllStates(true); }
  }

  _registerStyleSheet(context) {
    if (this._styleSheetService && this._styleUri) {
      return;
    }
    const service = Cc[STYLE_SHEET_SERVICE].getService(Ci.nsIStyleSheetService);
    const uri = Services.io.newURI("styles/pin.css", null, context.extension.rootURI);
    if (!service.sheetRegistered(uri, service.AUTHOR_SHEET)) {
      service.loadAndRegisterSheet(uri, service.AUTHOR_SHEET);
    }
    this._styleSheetService = service;
    this._styleUri = uri;
  }

  _getAccountColor(accountKey) {
    return this._settings.accountColors[accountKey] || getDefaultColor(accountKey);
  }

  _getAccountsMetadata() {
    const accounts = [];
    try {
      for (const account of MailServices.accounts.accounts) {
        const server = account.incomingServer;
        if (!server?.rootFolder) {
          continue;
        }
        const inboxes = walkFolders(server.rootFolder)
          .filter(folder => Boolean(folder.flags & Ci.nsMsgFolderFlags.Inbox))
          .map(folder => ({
            uri: folder.URI,
            name: folder.prettyName || folder.name || "Courrier entrant",
            enabled: this._settings.inboxEnabled[folder.URI] !== false
          }));
        accounts.push({
          key: account.key,
          name: server.prettyName || account.key,
          email: account.defaultIdentity?.email || "",
          color: this._getAccountColor(account.key),
          defaultColor: getDefaultColor(account.key),
          inboxes
        });
      }
    } catch (error) {
      console.warn("Épingles : lecture des comptes incomplète", error);
    }
    return accounts;
  }

  _getConfiguration() {
    const broken = Object.values(this._data.refs).filter(ref => ref.missingSince).length;
    return {
      settings: clone(this._settings),
      groups: clone(this._data.groups),
      cases: clone(this._data.cases || []),
      templates: clone(this._data.templates || []),
      accounts: this._getAccountsMetadata(),
      stats: {
        pinned: Object.keys(this._data.refs).length,
        broken,
        unread: Object.values(this._data.refs).filter(ref => {
          const hdr = this._resolveReference(ref, false);
          return Boolean(hdr && !(hdr.flags & Ci.nsMsgMessageFlags.Read));
        }).length,
        overdue: Object.values(this._data.refs).filter(ref => !ref.completedAt && ((ref.dueAt && ref.dueAt < Date.now()) || (ref.followUpAt && ref.followUpAt < Date.now()))).length,
        waiting: Object.values(this._data.refs).filter(ref => ref.workflowStatus === "waiting").length,
        completed: Object.values(this._data.refs).filter(ref => ref.completedAt || ref.workflowStatus === "completed").length,
        history: (this._data.history || []).length,
        undoAvailable: Boolean(this._undoStack?.length)
      },
      shortcut: "Alt+P",
      rules: clone(this._data.rules || []),
      ruleLog: clone((this._data.ruleLog || []).slice(-100)),
      storage: {backend: this._storageBackend || "unknown", database: DB_FILENAME, schemaVersion: DB_SCHEMA_VERSION},
      compatibility: clone(this._compatibility || {}),
      performance: this._getPerformanceReport()
    };
  }

  _setConfiguration(configuration) {
    if (!configuration || typeof configuration !== "object") {
      throw new ExtensionError("Configuration invalide.");
    }
    this._pushUndo("Modification des paramètres");
    const previousPinMode = this._settings.pinMode;
    if (configuration.settings) {
      this._settings = normalizeSettings({...this._settings, ...configuration.settings});
      this._saveSettings();
    }
    if (previousPinMode !== this._settings.pinMode && this._settings.pinMode === "nativeStar") {
      const byFolder = new Map();
      for (const ref of Object.values(this._data.refs)) {
        const hdr = this._resolveReference(ref, true);
        if (!hdr) continue;
        const bucket = byFolder.get(hdr.folder) || [];
        bucket.push(hdr);
        byFolder.set(hdr.folder, bucket);
      }
      for (const [folder, headers] of byFolder) {
        folder.markMessagesFlagged(headers, true);
      }
    }
    if (Array.isArray(configuration.rules)) {
      this._data.rules = configuration.rules.slice(0, MAX_RULES).map(normalizeRule).filter(Boolean);
      this._saveData("rules");
    }
    if (Array.isArray(configuration.cases)) {
      this._data.cases = configuration.cases.slice(0, MAX_CASES).map(normalizeCase).filter(Boolean);
      this._data.caseOrder = this._data.cases.map(item => item.id);
      const ids = new Set(this._data.caseOrder);
      for (const ref of Object.values(this._data.refs)) if (ref.caseId && !ids.has(ref.caseId)) ref.caseId = "";
      this._saveData("cases");
    }
    if (Array.isArray(configuration.templates)) {
      this._data.templates = configuration.templates.slice(0, MAX_TEMPLATES).map(normalizeTemplate).filter(Boolean);
      const ids = new Set(this._data.templates.map(item => item.id));
      for (const ref of Object.values(this._data.refs)) if (ref.templateId && !ids.has(ref.templateId)) ref.templateId = "";
      this._saveData("templates");
    }
    if (Array.isArray(configuration.groups)) {
      const normalized = [];
      const seen = new Set();
      for (const [index, item] of configuration.groups.slice(0, MAX_GROUPS).entries()) {
        const group = normalizeGroup(item, index);
        if (group && !seen.has(group.id)) {
          seen.add(group.id);
          normalized.push(group);
        }
      }
      this._data.groups = normalized;
      this._data.groupOrder = normalized.map(group => group.id);
      for (const ref of Object.values(this._data.refs)) {
        if (ref.groupId && !seen.has(ref.groupId)) {
          ref.groupId = "";
        }
      }
      this._saveData();
    }
    this._applyRuntimeSettings();
    this._refreshAllStates(true);
    return this._getConfiguration();
  }

  _exportConfiguration() {
    return {
      format: "thunderbird-pin-mails",
      version: 5,
      exportedAt: new Date().toISOString(),
      settings: clone(this._settings),
      data: clone(this._data)
    };
  }

  _importConfiguration(configuration) {
    if (configuration?.format === "pin-mails-backup" &&
        !PIN_MODULES.PinStorageHelpers?.verifyBackupEnvelope(configuration)) {
      throw new ExtensionError("La sauvegarde est incomplète ou corrompue.");
    }
    if (configuration?.format === "pin-mails-backup" && configuration.data) {
      configuration = {
        format: "thunderbird-pin-mails",
        version: Number(configuration.metadata?.schemaVersion || configuration.data?.schemaVersion || 5),
        exportedAt: new Date(configuration.createdAt || Date.now()).toISOString(),
        settings: configuration.metadata?.settings || clone(this._settings),
        data: configuration.data,
        undo: configuration.undo || []
      };
    }
    if (
      !configuration ||
      configuration.format !== "thunderbird-pin-mails" ||
      ![1, 2, 3, 4, 5].includes(Number(configuration.version))
    ) {
      throw new ExtensionError("Ce fichier n’est pas une sauvegarde compatible.");
    }
    const serialized = JSON.stringify(configuration);
    if (serialized.length > MAX_IMPORT_BYTES) throw new ExtensionError("La sauvegarde dépasse la taille maximale autorisée.");
    this._pushUndo("Import de la sauvegarde");
    const importUndoAction=this._undoStack?.at(-1)||null;
    this._settings = normalizeSettings(configuration.settings);
    this._data = normalizeData(configuration.data);
    if (Array.isArray(configuration.undo)) {
      this._undoStack = configuration.undo.slice(-(MAX_UNDO - (importUndoAction ? 1 : 0)));
      if (importUndoAction) this._undoStack.push(importUndoAction);
    }
    this._data.migration = {
      from: Number(configuration.version) || 1,
      to: 5,
      completedAt: Date.now()
    };
    this._saveSettings();
    this._saveData("import");
    this._applyRuntimeSettings();
    this._refreshAllStates(true);
    return this._getConfiguration();
  }

  _resetConfiguration() {
    this._pushUndo("Réinitialisation des paramètres");
    this._settings = clone(DEFAULT_SETTINGS);
    this._data.manualOrder = Object.keys(this._data.refs);
    this._data.groups = [];
    this._data.groupOrder = [];
    this._data.cases = []; this._data.caseOrder = []; this._data.templates = []; this._data.rules = [];
    for (const ref of Object.values(this._data.refs)) {
      ref.groupId = "";
      ref.caseId = "";
      ref.templateId = "";
      ref.updatedAt = Date.now();
    }
    this._data.collapsedByInbox = {};
    this._data.panelVisibleByInbox = {};
    this._saveSettings();
    this._saveData("reset-configuration");
    this._applyRuntimeSettings();
    this._refreshAllStates(true);
    return this._getConfiguration();
  }

  _identityEmails() {
    if (this._cachedIdentityEmails) return this._cachedIdentityEmails;
    const emails = new Set();
    try { for (const identity of MailServices.accounts.allIdentities) if (identity?.email) emails.add(String(identity.email).toLowerCase()); } catch {}
    this._cachedIdentityEmails = emails;
    return emails;
  }

  _isOutgoingHeader(hdr) {
    const author = String(hdr?.author || formatAuthor(hdr) || "").toLowerCase();
    return [...this._identityEmails()].some(email => author.includes(email));
  }

  _referencesForHeader(hdr) {
    if (!hdr) return [];
    const direct = this._data.refs[messageStableKey(hdr)];
    const convKey = conversationStableKey(hdr);
    const accountKey = accountKeyForFolder(hdr.folder);
    const signature = PIN_MODULES.PinIdentity?.signature(hdr, accountKey, formatSubject(hdr), formatAuthor(hdr));
    const results = [];
    if (direct) results.push(direct);
    for (const ref of Object.values(this._data.refs)) {
      if (results.includes(ref)) continue;
      const refSignature = {
        accountKey: ref.accountKey,
        gmThreadId: ref.gmThreadId || "",
        rootMessageId: ref.rootMessageId || ref.headerMessageId || "",
        messageId: ref.headerMessageId || "",
        threadId: Number(ref.threadId || 0),
        references: [],
        normalizedSubject: PIN_MODULES.PinIdentity?.normalizeSubject(ref.subject) || sanitizeSearchText(ref.subject),
        author: sanitizeSearchText(ref.author)
      };
      if (ref.trackingMode === "conversation" && (ref.stableKey === convKey || ref.conversationKey === convKey)) results.push(ref);
      else if (ref.identityFingerprint && ref.identityFingerprint === messageIdentityFingerprint(hdr)) results.push(ref);
      else if (ref.headerMessageId && ref.headerMessageId === String(hdr.messageId || "")) results.push(ref);
      else if (signature && PIN_MODULES.PinIdentity?.sameConversation(refSignature, signature)) results.push(ref);
    }
    return results;
  }

  _isSentFolder(folder) {
    try { return Boolean(folder?.getFlag(Ci.nsMsgFolderFlags.SentMail)); } catch { return false; }
  }

  _captureFolderCounters(headers) {
    const snapshots = [];
    for (const folder of new Set((headers || []).map(hdr => hdr?.folder).filter(Boolean))) {
      try {
        snapshots.push({folder, uri: folder.URI, unread: folder.getNumUnread(false), total: folder.getTotalMessages(false), newCount: Number(folder.numNewMessages || 0), hasNew: Boolean(folder.hasNewMessages)});
      } catch {}
    }
    return snapshots;
  }

  _scheduleCounterRegressionCheck(before, label = "pin") {
    if (!this._settings.enableCounterRegressionGuard || !before?.length) return;
    Services.tm.dispatchToMainThread(() => {
      for (const snapshot of before) {
        try {
          const after = {unread:snapshot.folder.getNumUnread(false), total:snapshot.folder.getTotalMessages(false), newCount:Number(snapshot.folder.numNewMessages||0), hasNew:Boolean(snapshot.folder.hasNewMessages)};
          if (snapshot.unread !== after.unread || snapshot.total !== after.total || snapshot.newCount !== after.newCount || snapshot.hasNew !== after.hasNew) {
            const event = {time:Date.now(),label,folderURI:snapshot.uri,before:{unread:snapshot.unread,total:snapshot.total,newCount:snapshot.newCount,hasNew:snapshot.hasNew},after};
            this._counterRegressionEvents.push(event);
            if (this._counterRegressionEvents.length > 50) this._counterRegressionEvents.shift();
            this._recordDiagnostic("error", "Compteur natif Thunderbird modifié pendant une action d’épingle", JSON.stringify(event));
          }
        } catch {}
      }
    });
  }

  _archiveReferenceHistory(ref, action = "completed", extra = {}) {
    if (!this._settings.enableHistory || !ref) return null;
    const record = PIN_MODULES.PinWorkflow?.archiveRecord(ref, action, extra) || normalizeHistory({...ref, action});
    if (!record) return null;
    this._data.history ||= [];
    this._data.history.push(record);
    if (this._data.history.length > MAX_HISTORY) this._data.history.splice(0, this._data.history.length - MAX_HISTORY);
    return record;
  }

  _getHistory(options = {}) {
    const search = sanitizeSearchText(options.search || "");
    const caseId = String(options.caseId || "");
    const limit = clampNumber(options.limit, 1, MAX_HISTORY, 500);
    return (this._data.history || []).filter(item => (!caseId || item.caseId === caseId) && (!search || sanitizeSearchText([item.subject,item.author,item.accountName,item.action].join(" ")).includes(search))).slice(-limit).reverse();
  }

  _setWorkflowStatus(stableKeys, status, options = {}) {
    const allowed = new Set(["active", "waiting", "planned", "completed"]);
    const target = allowed.has(status) ? status : "active";
    const keys = Array.isArray(stableKeys) ? stableKeys.map(String) : [String(stableKeys || "")];
    const refs = keys.map(key => this._data.refs[key]).filter(Boolean);
    if (!refs.length) return {count:0,status:target};
    this._pushUndo(`Statut ${target}`);
    const now = Date.now();
    for (const ref of refs) {
      if (target === "completed") {
        ref.completedAt ||= now;
        ref.workflowStatus = "completed";
        this._archiveReferenceHistory(ref, options.action || "completed");
        if (this._settings.enableRecurringFollowUps && ref.recurrenceRule) {
          const base = ref.dueAt || now;
          ref.dueAt = PIN_MODULES.PinWorkflow?.nextFutureOccurrence(base, ref.recurrenceRule, ref.recurrenceInterval, now) || 0;
          ref.completedAt = 0;
          ref.workflowStatus = "active";
          ref.reminderAt = ref.dueAt ? Math.max(now, ref.dueAt - (ref.reminderLeadMinutes || 0) * 60000) : 0;
        }
      } else {
        ref.workflowStatus = target;
        ref.completedAt = 0;
        if (target === "waiting") {
          ref.waitingSince ||= now;
          ref.followUpAt = Number(options.followUpAt) || ref.followUpAt || now + (this._settings.defaultFollowUpDays || 3) * DAY_MS;
        } else if (target === "planned") {
          ref.waitingSince = 0;
          ref.followUpAt = Number(options.followUpAt) || ref.followUpAt || ref.dueAt || 0;
        } else {
          ref.waitingSince = 0;
          if (options.clearFollowUp !== false) ref.followUpAt = 0;
        }
      }
      ref.updatedAt = now;
      if (this._settings.enableBidirectionalCalendarSync && ref.calendarItemId) this._syncReferenceToCalendar(ref).catch(error => this._recordDiagnostic("warning","Synchronisation Agenda impossible",error));
    }
    this._saveData(`workflow-${target}`); this._refreshAllStates(true);
    return {count:refs.length,status:target};
  }

  _createCase(details = {}) {
    if (!this._settings.enableCases) throw new ExtensionError("Les affaires sont désactivées.");
    if ((this._data.cases || []).length >= MAX_CASES) throw new ExtensionError("Nombre maximal d’affaires atteint.");
    const item = normalizeCase({...details,id:details.id || `case-${Date.now().toString(36)}`}, (this._data.cases || []).length);
    if (!item) throw new ExtensionError("Affaire invalide.");
    this._data.cases.push(item); this._data.caseOrder.push(item.id); this._saveData("case-create");
    return clone(item);
  }

  _updateCase(caseId, details = {}) {
    const index=(this._data.cases||[]).findIndex(item=>item.id===String(caseId));
    if(index<0) throw new ExtensionError("Affaire introuvable.");
    const item=normalizeCase({...this._data.cases[index],...details,id:this._data.cases[index].id,updatedAt:Date.now()},index);
    this._data.cases[index]=item; this._saveData("case-update"); this._refreshAllStates(true); return clone(item);
  }

  _deleteCase(caseId) {
    const id=String(caseId||""); const before=(this._data.cases||[]).length;
    const removedCase=(this._data.cases||[]).find(item=>item.id===id)||null;
    if (removedCase?.calendarItemId && this._settings.calendarDeleteOnUnpin) {
      this._deleteLinkedCaseCalendarItem(removedCase).catch(error=>this._recordDiagnostic("warning","Suppression Agenda de l’affaire impossible",error));
    }
    this._data.cases=(this._data.cases||[]).filter(item=>item.id!==id); this._data.caseOrder=(this._data.caseOrder||[]).filter(item=>item!==id);
    for(const ref of Object.values(this._data.refs)) if(ref.caseId===id) ref.caseId="";
    if(before!==this._data.cases.length){this._saveData("case-delete");this._refreshAllStates(true);}
    return {deleted:before!==this._data.cases.length};
  }

  _createTemplate(details = {}) {
    if (!this._settings.enableTemplates) throw new ExtensionError("Les modèles sont désactivés.");
    if ((this._data.templates || []).length >= MAX_TEMPLATES) throw new ExtensionError("Nombre maximal de modèles atteint.");
    const item=normalizeTemplate({...details,id:details.id||`template-${Date.now().toString(36)}`},(this._data.templates||[]).length);
    if(!item) throw new ExtensionError("Modèle invalide.");
    this._data.templates.push(item);this._saveData("template-create");return clone(item);
  }

  _updateTemplate(templateId, details = {}) {
    const index=(this._data.templates||[]).findIndex(item=>item.id===String(templateId));
    if(index<0) throw new ExtensionError("Modèle introuvable.");
    const item=normalizeTemplate({...this._data.templates[index],...details,id:this._data.templates[index].id},index);
    this._data.templates[index]=item;this._saveData("template-update");return clone(item);
  }

  _deleteTemplate(templateId) {
    const id=String(templateId||"");const before=(this._data.templates||[]).length;
    this._data.templates=(this._data.templates||[]).filter(item=>item.id!==id);
    for(const ref of Object.values(this._data.refs)) if(ref.templateId===id) ref.templateId="";
    if(before!==this._data.templates.length)this._saveData("template-delete");
    return {deleted:before!==this._data.templates.length};
  }

  _applyTemplate(stableKeys, templateId, {pushUndo=true, save=true, refresh=true} = {}) {
    const template=(this._data.templates||[]).find(item=>item.id===String(templateId));
    if(!template) throw new ExtensionError("Modèle introuvable.");
    const keys=Array.isArray(stableKeys)?stableKeys.map(String):[String(stableKeys||"")];const refs=keys.map(key=>this._data.refs[key]).filter(Boolean);const now=Date.now();
    if (pushUndo) this._pushUndo(`Application du modèle ${template.name}`);
    for(const ref of refs){
      ref.templateId=template.id;ref.groupId=template.groupId||ref.groupId;ref.caseId=template.caseId||ref.caseId;ref.priorityLevel=template.priorityLevel;ref.workflowStatus=template.workflowStatus;ref.completedAt=0;
      if(template.workflowStatus==="waiting")ref.waitingSince=ref.waitingSince||now;else if(template.workflowStatus==="active")ref.waitingSince=0;
      if(template.dueOffsetDays)ref.dueAt=now+template.dueOffsetDays*DAY_MS;
      ref.reminderLeadMinutes=template.reminderLeadMinutes;
      if(ref.dueAt)ref.reminderAt=Math.max(now,ref.dueAt-template.reminderLeadMinutes*60000);
      if(template.followUpDelayDays)ref.followUpAt=now+template.followUpDelayDays*DAY_MS;
      ref.recurrenceRule=template.recurrenceRule;ref.recurrenceInterval=template.recurrenceInterval;
      if(template.notePrefix&&!ref.note.startsWith(template.notePrefix))ref.note=`${template.notePrefix}${ref.note?`\n${ref.note}`:""}`.slice(0,MAX_NOTE_LENGTH);
      ref.updatedAt=now;
    }
    if (save) this._saveData("template-apply");
    if (refresh) this._refreshAllStates(true);
    return {count:refs.length,template:clone(template)};
  }

  async _chooseBackupDirectory() {
    const win=Services.wm.getMostRecentWindow("mail:3pane");
    const picker=Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    picker.init(win, "Choisir le dossier des sauvegardes MailPerch", Ci.nsIFilePicker.modeGetFolder);
    const result=await new Promise(resolve=>picker.open(resolve));
    if(result===Ci.nsIFilePicker.returnCancel||!picker.file)return {selected:false};
    this._settings.backupDirectory=picker.file.path;this._saveSettings();
    return {selected:true,path:picker.file.path};
  }

  _ensureReference(hdr, sourceInboxURI, trackingMode = "message") {
    const conversationKey = conversationStableKey(hdr);
    const stableKey = trackingMode === "conversation" ? conversationKey : messageStableKey(hdr);
    const existing = this._data.refs[stableKey];
    const accountKey = accountKeyForFolder(hdr.folder);
    const now = Date.now();
    const ref = existing || {
      stableKey,
      headerMessageId: String(hdr.messageId || ""),
      accountKey,
      sourceInboxURI: sourceInboxURI || hdr.folder?.URI || "",
      lastFolderURI: hdr.folder?.URI || "",
      lastMessageKey: Number(hdr.messageKey) || 0,
      pinnedAt: now,
      lastSeen: now,
      missingSince: 0,
      subject: formatSubject(hdr),
      author: formatAuthor(hdr),
      date: Number(hdr.date) || 0,
      accountName: accountNameForFolder(hdr.folder),
      folderName: hdr.folder?.prettyName || hdr.folder?.name || "",
      note: "",
      dueAt: 0,
      reminderAt: 0,
      reminderFiredAt: 0,
      priorityLevel: "normal",
      groupId: "",
      trackingMode: trackingMode === "conversation" ? "conversation" : "message",
      conversationKey,
      identityFingerprint: messageIdentityFingerprint(hdr),
      completedAt: 0,
      snoozeUntil: 0,
      repeatRule: "",
      reminderLeadMinutes: this._settings.reminderLeadMinutes || 0,
      calendarId: "",
      calendarItemId: "",
      calendarItemType: this._settings.calendarItemType || "task",
      conversationCount: 1,
      conversationUnread: (hdr.flags & Ci.nsMsgMessageFlags.Read) ? 0 : 1,
      nativeStarImported: false,
      rootMessageId: PIN_MODULES.PinIdentity?.rootMessageId(hdr) || "",
      gmThreadId: PIN_MODULES.PinIdentity?.gmThreadId(hdr) || "",
      threadId: Number(hdr.threadId) || 0,
      workflowStatus: "active", waitingSince: 0, followUpAt: 0, lastReplyAt: 0, lastOutgoingAt: 0, followUpCount: 0,
      caseId: "", templateId: "", recurrenceRule: "", recurrenceInterval: 1,
      calendarLastSyncedAt: 0, calendarSyncHash: "", createdFromRuleId: "", updatedAt: now
    };
    ref.headerMessageId = String(hdr.messageId || ref.headerMessageId || "");
    ref.accountKey = accountKey;
    ref.sourceInboxURI ||= sourceInboxURI || hdr.folder?.URI || "";
    ref.trackingMode = trackingMode === "conversation" ? "conversation" : (ref.trackingMode || "message");
    ref.conversationKey = conversationKey;
    ref.identityFingerprint = messageIdentityFingerprint(hdr);
    ref.rootMessageId = PIN_MODULES.PinIdentity?.rootMessageId(hdr) || ref.rootMessageId || "";
    ref.gmThreadId = PIN_MODULES.PinIdentity?.gmThreadId(hdr) || ref.gmThreadId || "";
    ref.threadId = Number(hdr.threadId) || ref.threadId || 0;
    ref.updatedAt = now;
    ref.lastFolderURI = hdr.folder?.URI || ref.lastFolderURI;
    ref.lastMessageKey = Number(hdr.messageKey) || ref.lastMessageKey;
    ref.lastSeen = now;
    ref.missingSince = 0;
    ref.subject = formatSubject(hdr);
    ref.author = formatAuthor(hdr);
    ref.date = Number(hdr.date) || ref.date;
    ref.accountName = accountNameForFolder(hdr.folder);
    ref.folderName = hdr.folder?.prettyName || hdr.folder?.name || ref.folderName;
    this._data.refs[stableKey] = ref;
    if (!this._data.manualOrder.includes(stableKey)) {
      this._data.manualOrder.push(stableKey);
    }
    return ref;
  }

  _removeReferenceByKey(stableKey, {archiveAction="", deleteCalendar=this._settings.calendarDeleteOnUnpin} = {}) {
    const ref=this._data.refs[stableKey];if(!ref)return false;
    if(archiveAction)this._archiveReferenceHistory(ref,archiveAction);
    if(deleteCalendar&&ref.calendarItemId){this._deleteLinkedCalendarItem(ref).catch(error=>this._recordDiagnostic("warning","Suppression de l’élément Agenda impossible",error));}
    delete this._data.refs[stableKey];this._data.manualOrder=this._data.manualOrder.filter(key=>key!==stableKey);return true;
  }

  async _deleteLinkedCalendarItem(ref) {
    const {calendar,item}=await this._calendarItemForRef(ref);if(calendar&&item)await calendar.deleteItem(item);
    ref.calendarId="";ref.calendarItemId="";
  }

  _resolveReference(ref, searchAll = true) {
    this._performance.resolves++;
    const cached = this._resolveCache?.get(ref.stableKey);
    if (cached && Date.now() - cached.time < RESOLVE_CACHE_MS) {
      this._performance.cacheHits++;
      return cached.header;
    }
    let folder = null;
    if (ref.lastFolderURI) {
      try {
        folder = MailServices.folderLookup.getFolderForURL(ref.lastFolderURI);
      } catch {
        folder = null;
      }
      const header = findHeaderInFolder(folder, ref);
      if (header) {
        this._updateResolvedReference(ref, header);
        this._resolveCache?.set(ref.stableKey, {time: Date.now(), header});
        return header;
      }
    }

    if (!searchAll) {
      return null;
    }

    let account = null;
    try {
      account = [...MailServices.accounts.accounts].find(
        candidate => candidate.key === ref.accountKey
      );
    } catch {
      account = null;
    }
    if (!account?.incomingServer?.rootFolder) {
      return null;
    }

    for (const candidate of walkFolders(account.incomingServer.rootFolder)) {
      if (candidate.URI === ref.lastFolderURI) {
        continue;
      }
      const header = findHeaderInFolder(candidate, ref);
      if (header) {
        this._updateResolvedReference(ref, header);
        this._resolveCache?.set(ref.stableKey, {time: Date.now(), header});
        return header;
      }
    }
    return null;
  }

  _updateResolvedReference(ref, hdr) {
    ref.lastFolderURI = hdr.folder?.URI || ref.lastFolderURI;
    ref.lastMessageKey = Number(hdr.messageKey) || ref.lastMessageKey;
    ref.lastSeen = Date.now();
    ref.missingSince = 0;
    ref.subject = formatSubject(hdr);
    ref.author = formatAuthor(hdr);
    ref.date = Number(hdr.date) || ref.date;
    ref.folderName = hdr.folder?.prettyName || hdr.folder?.name || ref.folderName;
    ref.accountName = accountNameForFolder(hdr.folder);
    ref.identityFingerprint = messageIdentityFingerprint(hdr);
    ref.conversationKey ||= conversationStableKey(hdr);
  }

  _markMissing(ref) {
    ref.missingSince ||= Date.now();
  }

  _isPinnedHeader(hdr) {
    if (!hdr) {
      return false;
    }
    if (this._settings.pinMode === "nativeStar") {
      return Boolean(hdr.flags & Ci.nsMsgMessageFlags.Marked);
    }
    return (messageStableKey(hdr) in this._data.refs) ||
      (this._settings.enableConversationPins && conversationStableKey(hdr) in this._data.refs);
  }

  _captureFlags(headers, includeStar = this._settings.pinMode === "nativeStar") {
    return headers.map(hdr => ({
      folderURI: hdr.folder?.URI || "",
      messageKey: Number(hdr.messageKey) || 0,
      flagged: includeStar ? Boolean(hdr.flags & Ci.nsMsgMessageFlags.Marked) : null,
      read: Boolean(hdr.flags & Ci.nsMsgMessageFlags.Read),
      stableKey: messageStableKey(hdr),
      headerMessageId: String(hdr.messageId || ""),
      accountKey: accountKeyForFolder(hdr.folder),
      identityFingerprint: messageIdentityFingerprint(hdr)
    }));
  }

  _setHeadersPinned(headers, newState, sourceInboxURI, label = "Épinglage", trackingMode = "message") {
    const usable = headers.filter(Boolean);
    if (!usable.length) {
      return 0;
    }
    const counterSnapshot = this._captureFolderCounters(usable);
    this._pushUndo(label, this._captureFlags(usable));
    const byFolder = new Map();
    for (const hdr of usable) {
      if (newState) {
        this._ensureReference(hdr, sourceInboxURI || hdr.folder?.URI || "", trackingMode);
      } else {
        this._removeReferenceByKey(trackingMode === "conversation" ? conversationStableKey(hdr) : messageStableKey(hdr));
        // If the row is active only because its whole conversation is pinned,
        // clicking its visible pin must actually clear that state.
        if (trackingMode === "conversation" || conversationStableKey(hdr) in this._data.refs) this._removeReferenceByKey(conversationStableKey(hdr));
      }
      if (this._settings.pinMode === "nativeStar") {
        const list = byFolder.get(hdr.folder) || [];
        list.push(hdr);
        byFolder.set(hdr.folder, list);
      }
    }
    if (this._settings.pinMode === "nativeStar") {
      for (const [folder, list] of byFolder) {
        folder.markMessagesFlagged(list, Boolean(newState));
      }
    }
    for (const hdr of usable) this._recordActivity(newState ? "pin" : "unpin", trackingMode === "conversation" ? conversationStableKey(hdr) : messageStableKey(hdr), formatSubject(hdr));
    this._saveData(newState ? "pin" : "unpin");
    this._resolveCache?.clear();
    this._refreshAllStates(true);
    this._showToastAll(newState ? `${usable.length} message(s) épinglé(s).` : `${usable.length} message(s) désépinglé(s).`, true);
    this._scheduleCounterRegressionCheck(counterSnapshot, newState ? "pin" : "unpin");
    return usable.length;
  }

  _syncInbox(folder) {
    if (!folder || !(folder.flags & Ci.nsMsgFolderFlags.Inbox)) {
      return false;
    }
    let changed = false;
    if (this._settings.pinMode === "independent") {
      // Ne pas parcourir toute la boîte à chaque rendu : seules les références
      // connues sont vérifiées, ce qui reste fluide avec de grosses boîtes.
      for (const ref of Object.values(this._data.refs)) {
        if (ref.lastFolderURI !== folder.URI && ref.sourceInboxURI !== folder.URI) {
          continue;
        }
        const hdr = findHeaderInFolder(folder, ref);
        if (hdr) {
          this._updateResolvedReference(ref, hdr);
          this._resolveCache?.set(ref.stableKey, {time: Date.now(), header: hdr});
        }
      }
      return false;
    }
    try {
      const messages = folder.messages;
      while (messages.hasMoreElements()) {
        const hdr = messages.getNext().QueryInterface(Ci.nsIMsgDBHdr);
        const key = messageStableKey(hdr);
        const flagged = Boolean(hdr.flags & Ci.nsMsgMessageFlags.Marked);
        if (flagged) {
          const existed = key in this._data.refs;
          this._ensureReference(hdr, folder.URI);
          changed ||= !existed;
        } else if (this._data.refs[key]?.sourceInboxURI === folder.URI) {
          changed = this._removeReferenceByKey(key) || changed;
        }
      }
    } catch (error) {
      this._recordDiagnostic("warning", "Synchronisation partielle de la boîte", error);
    }
    if (changed) {
      this._saveData();
    }
    return changed;
  }

  _rescanPinned() {
    let changed = false;
    for (const account of this._getAccountsMetadata()) {
      for (const inbox of account.inboxes) {
        try {
          const folder = MailServices.folderLookup.getFolderForURL(inbox.uri);
          changed = this._syncInbox(folder) || changed;
        } catch {
          // Ignore unavailable inboxes.
        }
      }
    }
    if (changed) {
      this._saveData();
    }
    this._refreshAllStates(true);
    return this._getConfiguration();
  }

  _cleanupBroken() {
    this._pushUndo("Nettoyage des références");
    let changed = false;
    for (const [key, ref] of Object.entries(this._data.refs)) {
      if (!this._resolveReference(ref, true)) {
        changed = this._removeReferenceByKey(key) || changed;
      }
    }
    if (changed) {
      this._saveData();
    }
    this._refreshAllStates(true);
    return this._getConfiguration();
  }

  _applyAutomaticCleanup() {
    if (!this._settings.autoCleanup) {
      return false;
    }
    const threshold = this._settings.cleanupGraceDays * DAY_MS;
    const now = Date.now();
    let changed = false;
    for (const [key, ref] of Object.entries(this._data.refs)) {
      if (ref.missingSince && now - ref.missingSince >= threshold) {
        changed = this._removeReferenceByKey(key) || changed;
      }
    }
    if (changed) {
      this._saveData();
    }
    return changed;
  }

  _getSelectedHeaders(about3Pane) {
    try {
      return [...(about3Pane.gDBView?.getSelectedMsgHdrs() || [])];
    } catch {
      return [];
    }
  }

  _selectionState(about3Pane) {
    const folder = about3Pane.gFolder;
    if (!folder || (!(folder.flags & Ci.nsMsgFolderFlags.Inbox) && !this._settings.allowPinOutsideInbox)) {
      return {count: 0, allPinned: false, anyPinned: false};
    }
    const headers = this._getSelectedHeaders(about3Pane);
    const pinnedCount = headers.filter(hdr => this._isPinnedHeader(hdr)).length;
    return {
      count: headers.length,
      allPinned: Boolean(headers.length && pinnedCount === headers.length),
      anyPinned: pinnedCount > 0
    };
  }

  async _getSelectionStateByTab(context, tabId) {
    const about3Pane = this._about3PaneForTab(context, tabId);
    return about3Pane
      ? this._selectionState(about3Pane)
      : {count: 0, allPinned: false, anyPinned: false};
  }

  async _toggleSelectedInPane(about3Pane, forceState) {
    if (!about3Pane) {
      return {count: 0};
    }
    const folder = about3Pane.gFolder;
    if (!folder || (!(folder.flags & Ci.nsMsgFolderFlags.Inbox) && !this._settings.allowPinOutsideInbox)) {
      return {count: 0};
    }
    const headers = this._getSelectedHeaders(about3Pane);
    if (!headers.length) {
      return {count: 0};
    }
    const allPinned = headers.every(hdr => this._isPinnedHeader(hdr));
    const newState = typeof forceState === "boolean" ? forceState : !allPinned;
    this._setHeadersPinned(headers, newState, folder.URI, newState ? "Épinglage" : "Désépinglage");
    return {count: headers.length, pinned: newState};
  }

  async _toggleSelectedByTab(context, tabId, forceState) {
    return this._toggleSelectedInPane(
      this._about3PaneForTab(context, tabId),
      forceState
    );
  }

  async _performSelectedByTab(context, tabId, action) {
    const pane = this._about3PaneForTab(context, tabId);
    const headers = pane ? this._getSelectedHeaders(pane) : [];
    if (!headers.length) return {count: 0};
    if (["complete", "uncomplete", "unpin", "active", "waiting", "planned"].includes(action)) {
      const keys = [];
      for (const hdr of headers) {
        const conversationKey = conversationStableKey(hdr);
        const key = conversationKey in this._data.refs ? conversationKey : messageStableKey(hdr);
        if (key in this._data.refs && !keys.includes(key)) keys.push(key);
      }
      return this._performReferenceAction(keys, action, {});
    }
    this._performMessageAction(action, headers, pane);
    return {count: headers.length};
  }

  _about3PaneForTab(context, tabId) {
    try {
      const tab = context.extension.tabManager.get(tabId);
      if (!tab || tab.type !== "mail") {
        return null;
      }
      return tab.nativeTab?.chromeBrowser?.contentWindow || null;
    } catch {
      return null;
    }
  }

  async _setupTab(context, tabId) {
    const about3Pane = this._about3PaneForTab(context, tabId);
    if (!about3Pane) {
      return;
    }
    await this._waitUntilReady(about3Pane);
    this._setupAbout3Pane(about3Pane);
  }

  async _waitUntilReady(about3Pane) {
    for (let attempt = 0; attempt < READY_RETRIES; attempt++) {
      if (
        about3Pane.location?.href === "about:3pane" &&
        about3Pane.document?.getElementById("threadTree") &&
        about3Pane.gViewWrapper &&
        about3Pane.quickFilterBar
      ) {
        return;
      }
      await new Promise(resolve =>
        about3Pane.setTimeout(resolve, READY_RETRY_DELAY_MS)
      );
    }
    throw new Error("L’onglet Courrier n’est pas prêt.");
  }

  _refreshAllStates(immediate = false) {
    for (const state of this._states || []) {
      state.applySettings();
      state.scheduleRefresh(immediate);
    }
  }

  _reorderReferences(dragKey, targetKey, before) {
    if (!dragKey || !targetKey || dragKey === targetKey) {
      return;
    }
    this._pushUndo("Réorganisation des épingles");
    const order = this._data.manualOrder.filter(key => key !== dragKey);
    const targetIndex = order.indexOf(targetKey);
    if (targetIndex < 0) {
      order.push(dragKey);
    } else {
      order.splice(targetIndex + (before ? 0 : 1), 0, dragKey);
    }
    this._data.manualOrder = order;
    this._saveData();
    this._refreshAllStates(true);
  }

  _setPanelPreference(folderURI, name, value) {
    if (!folderURI) {
      return;
    }
    this._data[name][folderURI] = value;
    this._saveData();
  }

  _formatDate(about3Pane, hdr, ref) {
    const milliseconds = hdr ? getMessageDateMs(hdr) : Math.floor(Number(ref.date || 0) / 1000);
    if (!milliseconds) {
      return "";
    }
    const date = new Date(milliseconds);
    if (!this._settings.smartDates) {
      return new about3Pane.Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(date);
    }
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const difference = Math.round((todayStart - dateStart) / DAY_MS);
    const time = new about3Pane.Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
    if (difference === 0) {
      return time;
    }
    if (difference === 1) {
      return `Hier ${time}`;
    }
    if (difference > 1 && difference < 7) {
      const weekday = new about3Pane.Intl.DateTimeFormat(undefined, {
        weekday: "short"
      }).format(date);
      return `${weekday} ${time}`;
    }
    return new about3Pane.Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: date.getFullYear() === now.getFullYear() ? undefined : "numeric"
    }).format(date);
  }

  _sortEntries(entries) {
    const mode = this._settings.sortMode;
    const manualIndex = new Map(
      this._data.manualOrder.map((key, index) => [key, index])
    );
    const compareText = (left, right) =>
      String(left || "").localeCompare(String(right || ""), undefined, {
        sensitivity: "base"
      });
    entries.sort((left, right) => {
      if (mode === "manual") {
        return (
          (manualIndex.get(left.ref.stableKey) ?? Number.MAX_SAFE_INTEGER) -
          (manualIndex.get(right.ref.stableKey) ?? Number.MAX_SAFE_INTEGER)
        );
      }
      if (mode === "pinnedAt") {
        return right.ref.pinnedAt - left.ref.pinnedAt;
      }
      if (mode === "messageDate") {
        return Number(right.ref.date) - Number(left.ref.date);
      }
      if (mode === "sender") {
        return compareText(left.ref.author, right.ref.author);
      }
      if (mode === "account") {
        return compareText(left.ref.accountName, right.ref.accountName) || Number(right.ref.date) - Number(left.ref.date);
      }
      if (mode === "deadline") {
        return (left.ref.dueAt || Number.MAX_SAFE_INTEGER) - (right.ref.dueAt || Number.MAX_SAFE_INTEGER);
      }
      if (mode === "priority") {
        const rank = {urgent: 0, high: 1, normal: 2};
        return rank[left.ref.priorityLevel] - rank[right.ref.priorityLevel] || Number(right.ref.date) - Number(left.ref.date);
      }
      return 0;
    });
    return entries;
  }

  _entriesForFolder(folder) {
    const scope = this._settings.panelScope;
    const currentAccountKey = accountKeyForFolder(folder);
    const entries = [];
    let dataChanged = false;

    for (const ref of Object.values(this._data.refs)) {
      const inScope =
        scope === "global" ||
        (scope === "currentAccount" && ref.accountKey === currentAccountKey) ||
        (scope === "currentInbox" && ref.sourceInboxURI === folder.URI);
      if (!inScope) continue;
      if (this._settings.hideCompleted && ref.completedAt) continue;
      let hdr = this._resolveReference(ref, true);
      if (hdr && ref.trackingMode === "conversation") hdr = this._updateConversationReference(ref, hdr);
      if (hdr) {
        if (this._settings.pinMode === "nativeStar" && !(hdr.flags & Ci.nsMsgMessageFlags.Marked)) {
          dataChanged = this._removeReferenceByKey(ref.stableKey) || dataChanged;
          continue;
        }
      } else {
        this._markMissing(ref);
      }
      entries.push({ref, hdr});
    }

    dataChanged = this._applyAutomaticCleanup() || dataChanged;
    if (dataChanged) {
      this._saveData();
    }
    return this._sortEntries(entries);
  }

  _groupForId(groupId) {
    return this._data.groups.find(group => group.id === groupId) || null;
  }

  _setReferenceMetadata(stableKey, patch) {
    const ref=this._data.refs[stableKey];if(!ref||!patch||typeof patch!=="object")return false;
    this._pushUndo("Modification du message épinglé");const now=Date.now();
    if("note" in patch)ref.note=String(patch.note||"").slice(0,MAX_NOTE_LENGTH);
    if("dueAt" in patch)ref.dueAt=Math.max(0,Number(patch.dueAt)||0);
    if("reminderAt" in patch){ref.reminderAt=Math.max(0,Number(patch.reminderAt)||0);ref.reminderFiredAt=0;}
    if("priorityLevel" in patch&&["normal","high","urgent"].includes(patch.priorityLevel))ref.priorityLevel=patch.priorityLevel;
    if("groupId" in patch)ref.groupId=this._groupForId(String(patch.groupId||""))?String(patch.groupId):"";
    if("caseId" in patch)ref.caseId=(this._data.cases||[]).some(item=>item.id===String(patch.caseId||""))?String(patch.caseId):"";
    if("workflowStatus" in patch&&["active","waiting","planned","completed"].includes(patch.workflowStatus))ref.workflowStatus=patch.workflowStatus;
    if("completed" in patch){ref.completedAt=patch.completed?(ref.completedAt||now):0;ref.workflowStatus=patch.completed?"completed":"active";if(patch.completed)this._archiveReferenceHistory(ref,"metadata-complete");}
    if("repeatRule" in patch&&["","daily","weekdays","weekly","monthly"].includes(patch.repeatRule))ref.repeatRule=patch.repeatRule;
    if("recurrenceRule" in patch&&["","daily","weekdays","weekly","monthly","quarterly","yearly"].includes(patch.recurrenceRule))ref.recurrenceRule=patch.recurrenceRule;
    if("recurrenceInterval" in patch)ref.recurrenceInterval=clampNumber(patch.recurrenceInterval,1,100,1);
    if("followUpAt" in patch)ref.followUpAt=Math.max(0,Number(patch.followUpAt)||0);
    if("reminderLeadMinutes" in patch)ref.reminderLeadMinutes=clampNumber(patch.reminderLeadMinutes,0,10080,0);
    if("snoozeUntil" in patch){ref.snoozeUntil=Math.max(0,Number(patch.snoozeUntil)||0);ref.reminderFiredAt=0;}
    ref.updatedAt=now;this._recordActivity("metadata",stableKey,ref.subject);this._saveData("metadata");this._refreshAllStates(true);this._showToastAll("Informations du message mises à jour.",true);
    if(this._settings.enableBidirectionalCalendarSync&&ref.calendarItemId)this._syncReferenceToCalendar(ref).catch(error=>this._recordDiagnostic("warning","Mise à jour Agenda impossible",error));
    return true;
  }

  _repairReferences() {
    this._pushUndo("Réparation des références");
    let repaired = 0;
    let missing = 0;
    for (const ref of Object.values(this._data.refs)) {
      const before = `${ref.lastFolderURI}|${ref.lastMessageKey}`;
      const hdr = this._resolveReference(ref, true);
      if (hdr) {
        const after = `${ref.lastFolderURI}|${ref.lastMessageKey}`;
        if (before !== after || ref.missingSince) repaired++;
      } else {
        this._markMissing(ref);
        missing++;
      }
    }
    this._saveData();
    this._refreshAllStates(true);
    return {repaired, missing, configuration: this._getConfiguration()};
  }

  _resetInterface() {
    this._pushUndo("Réinitialisation de l’interface");
    this._data.collapsedByInbox = {};
    this._data.panelVisibleByInbox = {};
    this._settings.safeMode = false;
    this._saveSettings();
    this._saveData();
    this._refreshAllStates(true);
    return this._getConfiguration();
  }

  _importNativeStars(clearStars = false) {
    const headers = [];
    for (const account of this._getAccountsMetadata()) {
      for (const inbox of account.inboxes) {
        try {
          const folder = MailServices.folderLookup.getFolderForURL(inbox.uri);
          const messages = folder.messages;
          while (messages.hasMoreElements()) {
            const hdr = messages.getNext().QueryInterface(Ci.nsIMsgDBHdr);
            if (hdr.flags & Ci.nsMsgMessageFlags.Marked) headers.push(hdr);
          }
        } catch {
          // Ignore les dossiers indisponibles.
        }
      }
    }
    this._pushUndo("Import des étoiles", this._captureFlags(headers, true));
    for (const hdr of headers) {
      const ref = this._ensureReference(hdr, hdr.folder?.URI || "");
      ref.nativeStarImported = true;
    }
    if (clearStars) {
      const byFolder = new Map();
      for (const hdr of headers) {
        const list = byFolder.get(hdr.folder) || [];
        list.push(hdr);
        byFolder.set(hdr.folder, list);
      }
      for (const [folder, list] of byFolder) folder.markMessagesFlagged(list, false);
    }
    this._saveData();
    this._refreshAllStates(true);
    this._showToastAll(`${headers.length} étoile(s) importée(s) comme épingle(s).`, true);
    return {imported: headers.length, configuration: this._getConfiguration()};
  }

  _getDiagnosticReport() {
    const refs = Object.values(this._data.refs);
    const accounts = this._getAccountsMetadata().map(account => ({
      keyHash: hashString(account.key).toString(16),
      inboxCount: account.inboxes.length,
      enabledInboxCount: account.inboxes.filter(inbox => inbox.enabled).length
    }));
    return {
      format: "thunderbird-pin-mails-diagnostic",
      version: 3,
      generatedAt: new Date().toISOString(),
      extension: {version: this._extensionVersion || "0.0.0", schemaSettings: this._settings.schemaVersion, schemaData: this._data.schemaVersion},
      environment: {appVersion: Services.appinfo.version, platform: Services.appinfo.OS},
      configuration: {
        pinMode: this._settings.pinMode,
        panelScope: this._settings.panelScope,
        sortMode: this._settings.sortMode,
        safeMode: this._settings.safeMode,
        reminders: this._settings.enableReminders,
        pageSize: this._settings.panelPageSize,
        storageBackend: this._storageBackend || "unknown",
        compatibility: this._compatibility?.mode || "unknown",
        calendarIntegration: this._settings.enableCalendarIntegration,
        automaticRules: this._settings.enableAutomaticRules
      },
      counts: {
        pinned: refs.length,
        broken: refs.filter(ref => ref.missingSince).length,
        withNotes: refs.filter(ref => ref.note).length,
        withDeadlines: refs.filter(ref => ref.dueAt).length,
        overdue: refs.filter(ref => ref.dueAt && ref.dueAt < Date.now()).length,
        groups: this._data.groups.length,
        rules: (this._data.rules || []).length,
        completed: refs.filter(ref => ref.completedAt).length,
        conversations: refs.filter(ref => ref.trackingMode === "conversation").length,
        calendarItems: refs.filter(ref => ref.calendarItemId).length,
        undoDepth: this._undoStack?.length || 0
      },
      accounts,
      migration: clone(this._data.migration),
      compatibility: clone(this._compatibility),
      performance: this._getPerformanceReport(),
      recentEvents: clone(this._diagnosticEvents || [])
    };
  }


  _resolveCapturedHeader(item) {
    if (!item) return null;
    try {
      const folder = item.folderURI ? MailServices.folderLookup.getFolderForURL(item.folderURI) : null;
      const direct = findHeaderInFolder(folder, item);
      if (direct) return direct;
    } catch {}
    let account = null;
    try { account = [...MailServices.accounts.accounts].find(candidate => candidate.key === item.accountKey); } catch {}
    if (!account?.incomingServer?.rootFolder) return null;
    for (const folder of walkFolders(account.incomingServer.rootFolder)) {
      const hdr = findHeaderInFolder(folder, item);
      if (hdr) return hdr;
    }
    return null;
  }

  _checkCompatibility(force = false) {
    const now = Date.now();
    if (!force && now - (this._compatibility?.checkedAt || 0) < COMPATIBILITY_CHECK_INTERVAL_MS) return clone(this._compatibility);
    const missing = [];
    if (!MailServices?.mfn?.addListener) missing.push("folder-notifications");
    if (!MailServices?.folderLookup?.getFolderForURL) missing.push("folder-lookup");
    if (!MailUtils?.displayMessageInFolderTab) missing.push("message-display");
    if (!lazy.Sqlite?.openConnection) missing.push("sqlite");
    const win = Services.wm.getMostRecentWindow("mail:3pane");
    if (win) {
      const about = win.document?.getElementById("tabmail")?.currentAbout3Pane;
      if (about && !about.document?.getElementById("threadTree")) missing.push("thread-tree");
      if (about && !about.messagePane?.displayMessage) missing.push("message-pane");
    }
    const requested = this._settings?.compatibilityMode || "auto";
    const reduced = requested === "reduced" || (requested === "auto" && missing.some(name => ["folder-lookup", "thread-tree", "message-pane"].includes(name)));
    this._compatibility = {mode: reduced ? "reduced" : "full", requested, missing, checkedAt: now, reduced};
    if (reduced) this._recordDiagnostic("warning", "Mode de compatibilité réduit activé", missing.join(", "));
    this._refreshAllStates?.(true);
    return clone(this._compatibility);
  }

  _getPerformanceReport() {
    const p = this._performance || {};
    return {
      enabled: Boolean(this._settings?.enablePerformanceMetrics),
      renders: p.renders || 0,
      averageRenderMs: p.renders ? Math.round((p.totalRenderMs || 0) / p.renders * 100) / 100 : 0,
      lastRenderMs: Math.round((p.lastRenderMs || 0) * 100) / 100,
      maxRenderMs: Math.round((p.maxRenderMs || 0) * 100) / 100,
      resolves: p.resolves || 0,
      cacheHits: p.cacheHits || 0,
      ruleRuns: p.ruleRuns || 0,
      storageBackend: this._storageBackend || "unknown",
      references: Object.keys(this._data?.refs || {}).length
    };
  }

  _registerFolderListener() {
    if (this._folderListener || !MailServices?.mfn?.addListener) return;
    const owner = this;
    this._folderListener = {
      QueryInterface: ChromeUtils.generateQI(["nsIMsgFolderListener"]),
      msgAdded(msg) { owner._onMsgAdded(msg); },
      msgsDeleted(msgs) { owner._onMsgsDeleted([...msgs]); },
      msgsMoveCopyCompleted(move, srcMsgs, destFolder, destMsgs) { owner._onMsgsMoveCopyCompleted(move, [...(srcMsgs || [])], destFolder, destMsgs ? [...destMsgs] : []); },
      msgsClassified(msgs) { for (const msg of msgs || []) owner._onMsgAdded(msg); },
      msgPropertyChanged(msg, property, oldValue, newValue) { owner._onMsgPropertyChanged(msg, property, oldValue, newValue); },
      msgKeyChanged(oldKey, newHdr) { owner._onMsgKeyChanged(oldKey, newHdr); },
      folderRenamed(oldFolder, newFolder) { owner._onFolderRenamed(oldFolder, newFolder); }
    };
    const flags = MailServices.mfn.msgAdded | MailServices.mfn.msgsDeleted |
      MailServices.mfn.msgsMoveCopyCompleted | MailServices.mfn.msgsClassified | MailServices.mfn.msgPropertyChanged |
      MailServices.mfn.msgKeyChanged | MailServices.mfn.folderRenamed;
    MailServices.mfn.addListener(this._folderListener, flags);
  }

  _unregisterFolderListener() {
    if (!this._folderListener) return;
    try { MailServices.mfn.removeListener(this._folderListener); } catch {}
    this._folderListener = null;
  }

  _ruleContext(hdr, trigger = "messageAdded") {
    let keywords = ""; try { keywords = hdr.getStringProperty("keywords") || ""; } catch {}
    return {
      trigger,
      accountKey: accountKeyForFolder(hdr?.folder),
      folderURI: hdr?.folder?.URI || "",
      sender: formatAuthor(hdr),
      subject: formatSubject(hdr),
      tags: keywords.split(/\s+/).filter(Boolean),
      stableKey: messageStableKey(hdr),
      conversationKey: conversationStableKey(hdr)
    };
  }

  _messageMatchesRule(hdr, rule, trigger = rule?.trigger || "messageAdded") {
    const context = this._ruleContext(hdr, trigger);
    return PIN_MODULES.PinRules?.matches(context, rule).matched ?? false;
  }

  _recordRuleLog(rule, hdr, trigger, result, details = "") {
    this._data.ruleLog ||= [];
    const item = {
      id: `rule-log-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      time: Date.now(), ruleId: rule?.id || "", ruleName: rule?.name || "",
      trigger, result, details: String(details || "").slice(0, 1000),
      stableKey: hdr ? messageStableKey(hdr) : "",
      subject: hdr ? formatSubject(hdr).slice(0, 300) : ""
    };
    this._data.ruleLog.push(item);
    if (this._data.ruleLog.length > MAX_RULE_LOG) this._data.ruleLog.splice(0, this._data.ruleLog.length - MAX_RULE_LOG);
    return item;
  }

  _clearRuleLog() {
    const count=(this._data.ruleLog||[]).length;this._data.ruleLog=[];this._saveData("rule-log-clear");return {cleared:count};
  }

  _ruleGuardKey(rule, hdr, trigger) {
    return `${rule.id}|${messageIdentityFingerprint(hdr)}|${trigger}`;
  }

  _ruleMayRun(rule, hdr, trigger) {
    const now=Date.now();const guardKey=this._ruleGuardKey(rule,hdr,trigger);const last=this._ruleGuard.get(guardKey)||0;
    if(now-last<RULE_LOOP_GUARD_MS)return {allowed:false,reason:"loop-guard"};
    const rate=this._ruleRates.get(rule.id)||[];const check=PIN_MODULES.PinRules?.rateAllowed(rate,rule.maxPerMinute||this._settings.ruleDefaultMaxPerMinute,now)||{allowed:true,timestamps:rate};
    this._ruleRates.set(rule.id,check.timestamps);
    if(!check.allowed)return {allowed:false,reason:"rate-limit"};
    this._ruleGuard.set(guardKey,now);check.timestamps.push(now);this._ruleRates.set(rule.id,check.timestamps);
    for(const [key,time] of this._ruleGuard)if(now-time>60000)this._ruleGuard.delete(key);
    return {allowed:true};
  }

  _executeRuleAction(rule, hdr) {
    const mode=rule.trackingMode||"message";
    const key=mode==="conversation"?conversationStableKey(hdr):messageStableKey(hdr);
    let ref=this._data.refs[key];
    if(rule.action==="pin") { ref=this._ensureReference(hdr,hdr.folder?.URI||"",mode); ref.createdFromRuleId=rule.id; return true; }
    if(rule.action==="unpin") return this._removeReferenceByKey(key);
    if(rule.action==="keep") return false;
    ref ||= this._ensureReference(hdr,hdr.folder?.URI||"",mode);
    if(rule.action==="complete") { ref.completedAt ||= Date.now(); ref.workflowStatus="completed"; this._archiveReferenceHistory(ref,"rule-complete",{ruleId:rule.id}); return true; }
    if(rule.action==="group" && this._groupForId(rule.groupId)) { ref.groupId=rule.groupId; return true; }
    if(rule.action==="case" && (this._data.cases||[]).some(item=>item.id===rule.caseId)) { ref.caseId=rule.caseId; return true; }
    if(rule.action==="status") {
      const now=Date.now();
      ref.workflowStatus=rule.workflowStatus;
      if(rule.workflowStatus==="completed"){
        ref.completedAt ||= now;
        this._archiveReferenceHistory(ref,"rule-complete",{ruleId:rule.id});
      } else {
        ref.completedAt=0;
        if(rule.workflowStatus==="waiting"){
          ref.waitingSince ||= now;
          ref.followUpAt ||= now+(this._settings.defaultFollowUpDays||3)*DAY_MS;
        } else if(rule.workflowStatus==="active") {
          ref.waitingSince=0;
        }
      }
      ref.updatedAt=now;
      return true;
    }
    if(rule.action==="template" && rule.templateId) { this._applyTemplate([ref.stableKey],rule.templateId,{pushUndo:false,save:false,refresh:false}); return true; }
    return false;
  }

  _applyCustomRules(trigger, hdr, {simulate=false} = {}) {
    if (!hdr || (simulate ? !this._settings.enableRuleSimulation : !this._settings.enableAutomaticRules)) return simulate ? [] : false;
    let changed=false,logged=false;const results=[];
    const ordered=PIN_MODULES.PinRules?.ordered(this._data.rules||[])||[...(this._data.rules||[])];
    for(const rule of ordered){
      if(rule.trigger!==trigger||!rule.enabled)continue;
      const match=PIN_MODULES.PinRules?.matches(this._ruleContext(hdr,trigger),rule)||{matched:this._messageMatchesRule(hdr,rule,trigger),reasons:[]};
      if(!match.matched)continue;
      if(simulate){results.push({ruleId:rule.id,ruleName:rule.name,action:rule.action,stableKey:messageStableKey(hdr),subject:formatSubject(hdr),reasons:match.reasons});if(rule.stopProcessing)break;continue;}
      const permission=this._ruleMayRun(rule,hdr,trigger);
      if(!permission.allowed){this._recordRuleLog(rule,hdr,trigger,"skipped",permission.reason);logged=true;if(rule.stopProcessing)break;continue;}
      try{
        this._performance.ruleRuns++;const didChange=this._executeRuleAction(rule,hdr);changed=didChange||changed;rule.errorCount=0;rule.lastError="";
        this._recordRuleLog(rule,hdr,trigger,didChange?"applied":"no-change",rule.action);logged=true;this._recordActivity("rule",messageStableKey(hdr),rule.name);
      }catch(error){
        rule.errorCount=(Number(rule.errorCount)||0)+1;rule.lastError=String(error);this._recordRuleLog(rule,hdr,trigger,"error",error);logged=true;
        if(rule.errorCount>=(this._settings.ruleErrorDisableThreshold||5)){rule.enabled=false;rule.disabledAt=Date.now();this._recordDiagnostic("error",`Règle désactivée automatiquement : ${rule.name}`,error);}
      }
      if(rule.stopProcessing)break;
    }
    if (!simulate && logged && !changed) this._saveData("rule-log");
    return simulate?results:changed;
  }

  async _simulateRules(options = {}) {
    const trigger=["messageAdded","read","archive","reply","move","delete","complete","calendar"].includes(options.trigger)?options.trigger:"messageAdded";
    const limit=clampNumber(options.limit,1,10000,1000);const matches=[];let scanned=0;
    for(const account of MailServices.accounts.accounts){
      const root=account?.incomingServer?.rootFolder;if(!root)continue;
      for(const folder of walkFolders(root)){
        if(options.accountKey&&account.key!==options.accountKey)continue;if(options.folderURI&&folder.URI!==options.folderURI)continue;
        try{
          const messages=folder.messages;
          while(messages.hasMoreElements()&&scanned<limit){
            const hdr=messages.getNext().QueryInterface(Ci.nsIMsgDBHdr);
            scanned++;
            const simulated=this._applyCustomRules(trigger,hdr,{simulate:true});
            if (Array.isArray(simulated)) matches.push(...simulated);
            if (scanned % 250 === 0) await new Promise(resolve=>Services.tm.dispatchToMainThread(resolve));
          }
        }catch{}
        if(scanned>=limit)break;
      }
      if(scanned>=limit)break;
    }
    return {trigger,scanned,matches:matches.slice(0,5000),truncated:matches.length>5000};
  }

  _applyBuiltInRule(trigger, hdr, destination = null) {
    if (!hdr) return false;
    let changed=this._applyCustomRules(trigger,hdr);
    const refs=this._referencesForHeader(hdr);const keys=refs.map(ref=>ref.stableKey);
    if(trigger==="messageAdded"){
      const sender=sanitizeSearchText(formatAuthor(hdr));let keywords="";try{keywords=hdr.getStringProperty("keywords")||"";}catch{}
      const senderMatch=this._settings.autoPinSenders.some(value=>sender.includes(sanitizeSearchText(value)));const tagMatch=this._settings.autoPinTags.some(value=>keywords.split(/\s+/).includes(value));
      if(senderMatch||tagMatch){this._ensureReference(hdr,hdr.folder?.URI||"",this._settings.defaultPinTarget);changed=true;}
      const outgoing=this._isOutgoingHeader(hdr)&&this._isSentFolder(hdr.folder);
      if(outgoing){
        changed=this._applyCustomRules("reply",hdr)||changed;
        if(this._settings.autoUnpinOnReply){
          for(const ref of refs){this._archiveReferenceHistory(ref,"reply-unpin");changed=this._removeReferenceByKey(ref.stableKey)||changed;}
        } else if(this._settings.enableWaitingWorkflow){
          for(const ref of refs){ref.workflowStatus="waiting";ref.completedAt=0;ref.waitingSince=Date.now();ref.lastOutgoingAt=Date.now();ref.followUpAt=Date.now()+(this._settings.defaultFollowUpDays||3)*DAY_MS;if(this._settings.moveToWaitingOnReply&&this._groupForId(this._settings.waitingGroupId))ref.groupId=this._settings.waitingGroupId;changed=true;this._recordActivity("reply-sent",ref.stableKey,formatSubject(hdr));}
        }
      } else if(this._settings.enableWaitingWorkflow){
        for(const ref of refs){if(ref.workflowStatus==="waiting"&&this._settings.reopenOnConversationReply){ref.workflowStatus="active";ref.lastReplyAt=Date.now();ref.followUpAt=0;ref.followUpCount=(ref.followUpCount||0)+1;changed=true;this._recordActivity("reply-received",ref.stableKey,formatSubject(hdr));}}
      }
    }
    if(trigger==="read"&&this._settings.autoUnpinOnRead)for(const key of keys)changed=this._removeReferenceByKey(key)||changed;
    if(trigger==="archive"||(trigger==="move"&&destination?.flags&Ci.nsMsgFolderFlags.Archive)){
      if(this._settings.autoUnpinOnArchive)for(const ref of refs){this._archiveReferenceHistory(ref,"archive-unpin");changed=this._removeReferenceByKey(ref.stableKey)||changed;}
      else if(this._settings.autoCompleteOnArchive)for(const ref of refs){ref.completedAt||=Date.now();ref.workflowStatus="completed";this._archiveReferenceHistory(ref,"archive-complete");changed=true;}
    }
    if(trigger==="reply"){
      if(this._settings.autoUnpinOnReply)for(const ref of refs){this._archiveReferenceHistory(ref,"reply-unpin");changed=this._removeReferenceByKey(ref.stableKey)||changed;}
      else if(this._settings.enableWaitingWorkflow){for(const ref of refs){ref.workflowStatus="waiting";ref.waitingSince=Date.now();ref.lastOutgoingAt=Date.now();ref.followUpAt=Date.now()+(this._settings.defaultFollowUpDays||3)*DAY_MS;if(this._settings.moveToWaitingOnReply&&this._groupForId(this._settings.waitingGroupId))ref.groupId=this._settings.waitingGroupId;changed=true;}}
    }
    if(trigger==="delete"&&this._settings.autoUnpinOnDelete)for(const ref of refs){this._archiveReferenceHistory(ref,"delete");changed=this._removeReferenceByKey(ref.stableKey)||changed;}
    if(trigger==="move"&&!this._settings.keepPinOnMove)for(const ref of refs)changed=this._removeReferenceByKey(ref.stableKey)||changed;
    if(changed){this._saveData(`rule-${trigger}`);this._refreshAllStates();}
    return changed;
  }

  _onMsgAdded(hdr) {
    if(!hdr)return;
    const signature=PIN_MODULES.PinIdentity?.signature(hdr,accountKeyForFolder(hdr.folder),formatSubject(hdr),formatAuthor(hdr));
    let conversationChanged=false;
    for(const ref of Object.values(this._data.refs)){
      if(ref.trackingMode!=="conversation")continue;
      const seed=this._resolveReference(ref,false);const seedSignature=seed&&PIN_MODULES.PinIdentity?.signature(seed,ref.accountKey,formatSubject(seed),formatAuthor(seed));
      const matches=ref.conversationKey===conversationStableKey(hdr)||(signature&&seedSignature&&PIN_MODULES.PinIdentity?.sameConversation(seedSignature,signature));
      if(!matches)continue;
      this._conversationCache.delete(ref.stableKey);this._updateConversationReference(ref,hdr);conversationChanged=true;
      this._recordActivity("conversation-update",ref.stableKey,formatSubject(hdr));
    }
    if(conversationChanged){this._saveData("conversation-update");this._refreshAllStates();}
    this._applyBuiltInRule("messageAdded",hdr);
  }
  _consumePendingDeleteForHeader(hdr) {
    let changed=false;
    for (const ref of this._referencesForHeader(hdr)) {
      if (!this._pendingDeleteKeys.has(ref.stableKey)) continue;
      this._pendingDeleteKeys.delete(ref.stableKey);
      this._archiveReferenceHistory(ref,"delete");
      changed=this._removeReferenceByKey(ref.stableKey)||changed;
    }
    return changed;
  }
  _onMsgsDeleted(headers) {
    let pendingChanged=false;
    for(const hdr of headers){
      pendingChanged=this._consumePendingDeleteForHeader(hdr)||pendingChanged;
      this._applyBuiltInRule("delete",hdr);
      for(const ref of this._referencesForHeader(hdr).filter(item=>item.trackingMode==="conversation")){Services.tm.dispatchToMainThread(()=>{if(!this._data.refs[ref.stableKey])return;this._conversationCache.delete(ref.stableKey);const remaining=this._conversationHeaders(hdr).filter(item=>item.folder?.msgDatabase?.containsKey(item.messageKey));if(remaining.length)this._updateConversationReference(ref,remaining[0]);else this._removeReferenceByKey(ref.stableKey);this._saveData("conversation-delete");this._refreshAllStates();});}
    }
    if(pendingChanged){this._saveData("delete-confirmed");this._refreshAllStates();}
  }
  _onMsgsMoveCopyCompleted(move,srcHeaders,destFolder,destHeaders){
    const sources=Array.from(srcHeaders||[]),targets=destHeaders?Array.from(destHeaders):[];
    const resolveDestination=src=>{
      if(!src||!destFolder)return null;
      try{return src.messageId?destFolder.msgDatabase.getMsgHdrForMessageID(src.messageId):null;}catch{return null;}
    };
    const triggerForDestination=()=>destFolder?.flags&Ci.nsMsgFolderFlags.Trash?"delete":destFolder?.flags&Ci.nsMsgFolderFlags.Archive?"archive":"move";
    for(let i=0;i<sources.length;i++){
      const src=sources[i],dest=targets[i]||resolveDestination(src);
      if(move&&dest){
        const sourceRefs=this._referencesForHeader(src);
        for(const ref of sourceRefs)this._updateResolvedReference(ref,dest);
        const trigger=triggerForDestination();
        let pendingChanged=false;
        if(trigger==="delete")pendingChanged=this._consumePendingDeleteForHeader(dest);
        this._applyBuiltInRule(trigger,dest,destFolder);
        if(pendingChanged)this._saveData("delete-move-confirmed");
      }
      else if(move&&src){Services.tm.dispatchToMainThread(()=>{const delayed=resolveDestination(src);if(!delayed)return;for(const ref of this._referencesForHeader(src))this._updateResolvedReference(ref,delayed);const trigger=triggerForDestination();let pendingChanged=false;if(trigger==="delete")pendingChanged=this._consumePendingDeleteForHeader(delayed);this._applyBuiltInRule(trigger,delayed,destFolder);this._saveData(pendingChanged?"delete-move-delayed":"move-delayed");this._refreshAllStates();});}
    }
    this._resolveCache.clear();this._saveData("move-copy");this._refreshAllStates();
  }
  _onMsgPropertyChanged(hdr,property,_oldValue,newValue){if(["read","Status","flags"].includes(property)&&(String(newValue)==="true"||hdr.flags&Ci.nsMsgMessageFlags.Read))this._applyBuiltInRule("read",hdr);}
  _onMsgKeyChanged(_oldKey,newHdr){for(const ref of Object.values(this._data.refs))if((ref.headerMessageId&&ref.headerMessageId===String(newHdr.messageId||""))||(ref.identityFingerprint&&ref.identityFingerprint===messageIdentityFingerprint(newHdr)))this._updateResolvedReference(ref,newHdr);this._saveData("key-change");}
  _onFolderRenamed(oldFolder,newFolder){for(const ref of Object.values(this._data.refs)){if(ref.lastFolderURI===oldFolder?.URI){ref.lastFolderURI=newFolder?.URI||ref.lastFolderURI;ref.folderName=newFolder?.prettyName||newFolder?.name||ref.folderName;}if(ref.sourceInboxURI===oldFolder?.URI)ref.sourceInboxURI=newFolder?.URI||ref.sourceInboxURI;}this._saveData("folder-rename");this._refreshAllStates();}

  _conversationHeaders(seed) {
    if(!seed)return[];const key=conversationStableKey(seed);const cached=this._conversationCache.get(key);if(cached&&Date.now()-cached.time<CONVERSATION_CACHE_MS)return cached.headers;
    const account=getAccountForFolder(seed.folder);const headers=[];const seedSignature=PIN_MODULES.PinIdentity?.signature(seed,accountKeyForFolder(seed.folder),formatSubject(seed),formatAuthor(seed));
    if(account?.incomingServer?.rootFolder){for(const folder of walkFolders(account.incomingServer.rootFolder)){try{let count=0;const messages=folder.messages;while(messages.hasMoreElements()&&count++<20000){const hdr=messages.getNext().QueryInterface(Ci.nsIMsgDBHdr);const candidate=PIN_MODULES.PinIdentity?.signature(hdr,accountKeyForFolder(hdr.folder),formatSubject(hdr),formatAuthor(hdr));if((seedSignature&&candidate&&PIN_MODULES.PinIdentity?.sameConversation(seedSignature,candidate))||conversationStableKey(hdr)===key)headers.push(hdr);}}catch{}}}
    headers.sort((a,b)=>Number(b.date||0)-Number(a.date||0));this._conversationCache.set(key,{time:Date.now(),headers});return headers;
  }

  _updateConversationReference(ref, seed) {
    const headers = this._conversationHeaders(seed);
    const latest = headers[0] || seed;
    this._updateResolvedReference(ref, latest);
    ref.conversationCount = headers.length || 1;
    ref.conversationUnread = headers.filter(hdr => !(hdr.flags & Ci.nsMsgMessageFlags.Read)).length;
    return latest;
  }

  async _toggleConversationSelectedByTab(context, tabId, forceState) {
    const pane = this._about3PaneForTab(context, tabId);
    const headers = pane ? this._getSelectedHeaders(pane) : [];
    if (!headers.length || !this._settings.enableConversationPins) return {count: 0};
    const unique = [...new Map(headers.map(h => [conversationStableKey(h), h])).values()];
    const allPinned = unique.every(h => conversationStableKey(h) in this._data.refs);
    const state = typeof forceState === "boolean" ? forceState : !allPinned;
    this._setHeadersPinned(unique, state, pane.gFolder?.URI || "", state ? "Épinglage de conversation" : "Désépinglage de conversation", "conversation");
    for (const hdr of unique) { const ref = this._data.refs[conversationStableKey(hdr)]; if (ref) this._updateConversationReference(ref, hdr); }
    this._saveData("conversation");
    return {count: unique.length, pinned: state};
  }

  _displayedHeaderForTab(context, tabId) {
    const pane = this._about3PaneForTab(context, tabId);
    const selected = pane ? this._getSelectedHeaders(pane) : [];
    if (selected.length === 1) return selected[0];
    try {
      const tab = context.extension.tabManager.get(tabId);
      const native = tab?.nativeTab;
      const direct = native?.message || native?.msgHdr || native?.chromeBrowser?.contentWindow?.gMessage ||
        native?.browser?.contentWindow?.gMessage;
      if (direct) return direct;
    } catch {}
    for (const type of ["mail:3pane", "mail:messageWindow"]) {
      try {
        const win = Services.wm.getMostRecentWindow(type);
        const aboutMessage = win?.document?.getElementById("tabmail")?.currentAboutMessage || win?.messageBrowser?.contentWindow;
        const hdr = aboutMessage?.gMessage || aboutMessage?.currentHeaderData?.messageHeader || null;
        if (hdr) return hdr;
      } catch {}
    }
    return null;
  }

  async _toggleDisplayedByTab(context, tabId, forceState) {
    const hdr = this._displayedHeaderForTab(context, tabId);
    if (!hdr) return {count: 0};
    const current = this._isPinnedHeader(hdr);
    const state = typeof forceState === "boolean" ? forceState : !current;
    const mode = this._settings.defaultPinTarget === "conversation" && this._settings.enableConversationPins ? "conversation" : "message";
    this._setHeadersPinned([hdr], state, hdr.folder?.URI || "", state ? "Épinglage" : "Désépinglage", mode);
    return {count: 1, pinned: state};
  }

  _serializeReference(ref, includeActivity = false) {
    const hdr=this._resolveReference(ref,false);const caseItem=(this._data.cases||[]).find(item=>item.id===ref.caseId);const group=this._groupForId(ref.groupId);
    return {
      stableKey:ref.stableKey,subject:hdr?formatSubject(hdr):ref.subject,author:hdr?formatAuthor(hdr):ref.author,accountKey:ref.accountKey,accountName:ref.accountName,
      folderName:ref.folderName,date:ref.date,pinnedAt:ref.pinnedAt,note:ref.note,dueAt:ref.dueAt,reminderAt:ref.reminderAt,followUpAt:ref.followUpAt,
      priorityLevel:ref.priorityLevel,groupId:ref.groupId,groupName:group?.name||"",caseId:ref.caseId,caseName:caseItem?.name||"",templateId:ref.templateId,
      completedAt:ref.completedAt,workflowStatus:PIN_MODULES.PinWorkflow?.statusForReference(ref)||ref.workflowStatus||"active",waitingSince:ref.waitingSince,lastReplyAt:ref.lastReplyAt,lastOutgoingAt:ref.lastOutgoingAt,followUpCount:ref.followUpCount,
      recurrenceRule:ref.recurrenceRule,recurrenceInterval:ref.recurrenceInterval,trackingMode:ref.trackingMode,conversationCount:ref.conversationCount,conversationUnread:ref.conversationUnread,
      unread:Boolean(hdr&&!(hdr.flags&Ci.nsMsgMessageFlags.Read)),missing:!hdr,smartSection:smartSectionForRef(ref),accountColor:this._getAccountColor(ref.accountKey),calendarItemId:ref.calendarItemId,calendarId:ref.calendarId,
      activity:includeActivity?(this._data.activity||[]).filter(item=>item.stableKey===ref.stableKey).slice(-20):undefined
    };
  }

  _getDashboardData(options = {}) {
    const filter=["active","all","overdue","today","week","completed","unread","waiting","planned"].includes(options.filter)?options.filter:(this._data.dashboard?.filter||"active");
    const search=sanitizeSearchText(options.search??this._data.dashboard?.search??"");const view=["list","kanban","cases","history"].includes(options.view)?options.view:(this._data.dashboard?.view||"list");
    const nextDashboard={filter,search:String(options.search??this._data.dashboard?.search??"").slice(0,500),view};
    if ((PIN_MODULES.PinStorageHelpers?.stableStringify(this._data.dashboard)||JSON.stringify(this._data.dashboard)) !==
        (PIN_MODULES.PinStorageHelpers?.stableStringify(nextDashboard)||JSON.stringify(nextDashboard))) {
      this._data.dashboard=nextDashboard;
      this._saveData("dashboard-state");
    }
    const items=[];
    for(const ref of Object.values(this._data.refs)){
      const item=this._serializeReference(ref);
      if(filter==="active"&&item.workflowStatus!=="active")continue;if(filter==="completed"&&item.workflowStatus!=="completed")continue;if(filter==="waiting"&&item.workflowStatus!=="waiting")continue;if(filter==="planned"&&item.workflowStatus!=="planned")continue;
      if(["overdue","today","week"].includes(filter)&&item.smartSection!==filter)continue;if(filter==="unread"&&!item.unread)continue;
      if(search&&!sanitizeSearchText([item.subject,item.author,item.note,item.accountName,item.folderName,item.groupName,item.caseName,item.workflowStatus].join(" ")).includes(search))continue;items.push(item);
    }
    items.sort((a,b)=>(a.dueAt||a.followUpAt||Number.MAX_SAFE_INTEGER)-(b.dueAt||b.followUpAt||Number.MAX_SAFE_INTEGER)||b.date-a.date);const refs=Object.values(this._data.refs),now=Date.now();
    return {items,filter,search:options.search||"",view,groups:clone(this._data.groups),cases:clone(this._data.cases||[]),templates:clone(this._data.templates||[]),history:this._getHistory({limit:200,search:options.historySearch||""}),ruleLog:clone((this._data.ruleLog||[]).slice(-200).reverse()),
      stats:{total:refs.length,active:refs.filter(r=>(r.workflowStatus||"active")==="active"&&!r.completedAt).length,waiting:refs.filter(r=>r.workflowStatus==="waiting").length,planned:refs.filter(r=>r.workflowStatus==="planned").length,completed:refs.filter(r=>r.completedAt||r.workflowStatus==="completed").length,overdue:refs.filter(r=>!r.completedAt&&((r.dueAt&&r.dueAt<now)||(r.followUpAt&&r.followUpAt<now))).length},
      activity:clone((this._data.activity||[]).slice(-100).reverse()),compatibility:clone(this._compatibility),performance:this._getPerformanceReport(),revision:this._data.revision||0,counterRegressionEvents:clone(this._counterRegressionEvents||[])};
  }

  _openReference(stableKey) {
    const ref = this._data.refs[String(stableKey || "")];
    if (!ref) return {opened: false};
    let hdr = this._resolveReference(ref, true);
    if (hdr && ref.trackingMode === "conversation") hdr = this._updateConversationReference(ref, hdr);
    if (!hdr) return {opened: false, missing: true};
    try { MailUtils.displayMessageInFolderTab(hdr, true); return {opened: true}; }
    catch (error) { this._recordDiagnostic("error", "Ouverture du message impossible", error); return {opened: false}; }
  }

  _performReferenceAction(stableKeys, action, options = {}) {
    const keys=Array.isArray(stableKeys)?stableKeys.map(String):[String(stableKeys||"")];const refs=keys.map(key=>this._data.refs[key]).filter(Boolean);if(!refs.length)return{count:0};
    if(action==="open")return this._openReference(refs[0].stableKey);
    if(["complete","uncomplete","active","waiting","planned"].includes(action))return this._setWorkflowStatus(keys,action==="uncomplete"?"active":action==="complete"?"completed":action,options);
    if(action==="unpin"){
      this._pushUndo("Désépinglage");for(const ref of refs)this._removeReferenceByKey(ref.stableKey,{archiveAction:"unpin"});this._saveData("unpin");this._refreshAllStates(true);return{count:refs.length};
    }
    if(action==="snooze")return this._snoozeReminder(refs[0].stableKey,Number(options.durationMs)||3600000);
    if(action==="calendar")return this._createCalendarItem(refs[0].stableKey,options.itemType,options.calendarId);
    if(action==="group"){this._pushUndo("Changement de groupe");const groupId=this._groupForId(String(options.groupId||""))?String(options.groupId):"";for(const ref of refs){ref.groupId=groupId;ref.updatedAt=Date.now();}this._saveData("group");this._refreshAllStates(true);return{count:refs.length};}
    if(action==="case"){this._pushUndo("Changement d’affaire");const caseId=(this._data.cases||[]).some(item=>item.id===String(options.caseId||""))?String(options.caseId):"";for(const ref of refs){ref.caseId=caseId;ref.updatedAt=Date.now();}this._saveData("case-assign");this._refreshAllStates(true);return{count:refs.length};}
    if(action==="template")return this._applyTemplate(keys,String(options.templateId||""));
    if(action==="setMetadata"){let count=0;for(const ref of refs)if(this._setReferenceMetadata(ref.stableKey,options))count++;return{count};}
    const headers=refs.map(ref=>this._resolveReference(ref,true)).filter(Boolean);
    if(["read","unread","toggleRead","archive","delete","reply"].includes(action)){this._performMessageAction(action,headers,Services.wm.getMostRecentWindow("mail:3pane")?.document?.getElementById("tabmail")?.currentAbout3Pane||null);return{count:headers.length};}
    return{count:0};
  }

  _registerCalendarObservers() {
    if (!this._settings.enableCalendarIntegration || !this._settings.enableBidirectionalCalendarSync) return;
    const calendars=lazy.cal.manager.getCalendars();
    const activeIds=new Set(calendars.map(calendar=>calendar.id));
    for (const [id, record] of this._calendarObservers) {
      if (activeIds.has(id)) continue;
      try { record.calendar.removeObserver(record.observer); } catch {}
      this._calendarObservers.delete(id);
    }
    for (const calendar of calendars) {
      if (this._calendarObservers.has(calendar.id)) continue;
      const owner=this;
      const observer={
        QueryInterface:ChromeUtils.generateQI(["calIObserver"]),
        onStartBatch(){},onEndBatch(){},onLoad(){},onError(){},onPropertyChanged(){},onPropertyDeleting(){},
        onAddItem(item){owner._onCalendarItemChanged(item,false);},
        onModifyItem(newItem,_oldItem){owner._onCalendarItemChanged(newItem,false);},
        onDeleteItem(item){owner._onCalendarItemChanged(item,true);}
      };
      try { calendar.addObserver(observer); this._calendarObservers.set(calendar.id,{calendar,observer}); } catch(error) { this._recordDiagnostic("warning",`Observateur Agenda impossible : ${calendar.name||calendar.id}`,error); }
    }
  }

  _unregisterCalendarObservers() {
    for(const {calendar,observer} of this._calendarObservers?.values()||[]){try{calendar.removeObserver(observer);}catch{}}
    this._calendarObservers?.clear();
  }

  _startCalendarSyncTimer() {
    if(this._calendarSyncTimer){try{this._calendarSyncTimer.cancel();}catch{} this._calendarSyncTimer=null;}
    if (!this._settings.enableCalendarIntegration || !this._settings.enableBidirectionalCalendarSync) return;
    this._calendarSyncTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    this._calendarSyncTimer.initWithCallback(()=>{this._registerCalendarObservers();this._syncCalendarLinks(false).catch(error=>this._recordDiagnostic("warning","Synchronisation Agenda périodique impossible",error));},CALENDAR_SYNC_INTERVAL_MS,Ci.nsITimer.TYPE_REPEATING_SLACK);
  }

  _startBackupTimer() {
    if(this._backupTimer){try{this._backupTimer.cancel();}catch{} this._backupTimer=null;}
    if (!this._settings.enableAutomaticBackups) return;
    this._backupTimer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    const check=async()=>{
      if(!this._settings.enableAutomaticBackups||!this._storage)return;
      try{
        const status=await this._storage.getBackupStatus();
        if(status.stale||Date.now()>=(status.nextBackupAt||0))await this._storage.createFileBackup(this._data,this._undoStack,"scheduled");
      }catch(error){this._recordDiagnostic("warning","Sauvegarde planifiée impossible",error);}
    };
    this._backupTimer.initWithCallback(check,BACKUP_CHECK_INTERVAL_MS,Ci.nsITimer.TYPE_REPEATING_SLACK);
    Services.tm.dispatchToMainThread(() => { check(); });
  }

  _calendarForRef(ref) {
    const calendars=lazy.cal.manager.getCalendars();
    return calendars.find(item=>item.id===ref.calendarId)||null;
  }

  async _calendarItemForRef(ref) {
    const calendar=this._calendarForRef(ref);if(!calendar||!ref.calendarItemId)return {calendar,item:null};
    try{return {calendar,item:await calendar.getItem(ref.calendarItemId)};}catch(error){this._recordDiagnostic("warning","Lecture de l’élément Agenda impossible",error);return {calendar,item:null};}
  }

  _onCalendarItemChanged(item, deleted=false) {
    if (!this._settings.enableCalendarIntegration || !this._settings.enableBidirectionalCalendarSync) return;
    const caseId=PIN_MODULES.PinCalendarHelpers?.itemCaseId(item)||"";
    if(caseId){
      const caseItem=(this._data.cases||[]).find(entry=>entry.id===caseId);if(!caseItem)return;
      if(deleted){caseItem.calendarId="";caseItem.calendarItemId="";caseItem.updatedAt=Date.now();this._saveData("case-calendar-delete");this._refreshAllStates(true);return;}
      const due=PIN_MODULES.PinCalendarHelpers?.itemDueAt(item)||0;const completed=PIN_MODULES.PinCalendarHelpers?.itemCompleted(item)||false;let changed=false;
      if(Math.abs((caseItem.dueAt||0)-due)>1000){caseItem.dueAt=due;changed=true;}
      const targetStatus=completed?"completed":(caseItem.status==="completed"?"active":caseItem.status);
      if(caseItem.status!==targetStatus){caseItem.status=targetStatus;changed=true;}
      if(changed){caseItem.updatedAt=Date.now();this._saveData("calendar-to-case");this._refreshAllStates(true);}return;
    }
    const stableKey=PIN_MODULES.PinCalendarHelpers?.itemStableKey(item)||"";if(!stableKey)return;
    const ref=this._data.refs[stableKey];if(!ref)return;
    if(deleted){ref.calendarId="";ref.calendarItemId="";ref.calendarLastSyncedAt=Date.now();this._recordActivity("calendar-delete",stableKey,ref.subject);this._saveData("calendar-delete");this._refreshAllStates(true);return;}
    const due=PIN_MODULES.PinCalendarHelpers?.itemDueAt(item)||0;const completed=PIN_MODULES.PinCalendarHelpers?.itemCompleted(item)||false;let changed=false;
    if(Math.abs((ref.dueAt||0)-due)>1000){
      ref.dueAt=due;
      ref.reminderAt=due&&ref.reminderLeadMinutes?Math.max(Date.now(),due-ref.reminderLeadMinutes*60000):0;
      changed=true;
    }
    if(completed&&!ref.completedAt){ref.completedAt=Date.now();ref.workflowStatus="completed";this._archiveReferenceHistory(ref,"calendar-complete");changed=true;}
    if(!completed&&ref.completedAt&&ref.workflowStatus==="completed"){ref.completedAt=0;ref.workflowStatus="active";changed=true;}
    ref.calendarLastSyncedAt=Date.now();
    if(changed){this._recordActivity("calendar-sync",stableKey,ref.subject);this._saveData("calendar-to-pin");this._refreshAllStates(true);}
  }

  async _syncReferenceToCalendar(ref) {
    if(!this._settings.enableCalendarIntegration||!this._settings.enableBidirectionalCalendarSync||!ref?.calendarItemId)return {synced:false};
    const {calendar,item}=await this._calendarItemForRef(ref);if(!calendar||!item)return {synced:false,missing:true};
    const cloneItem=item.clone();const due=ref.dueAt||ref.followUpAt||0;
    if(due){
      const date=lazy.cal.dtz.jsDateToDateTime(new Date(due));
      if(ref.calendarItemType==="event"){cloneItem.startDate=date;cloneItem.endDate=lazy.cal.dtz.jsDateToDateTime(new Date(due+3600000));}
      else cloneItem.dueDate=date;
    } else if (ref.calendarItemType !== "event") {
      cloneItem.dueDate=null;
    }
    if(ref.calendarItemType!=="event"&&this._settings.calendarCompleteOnPinComplete){try{cloneItem.percentComplete=ref.completedAt?100:0;cloneItem.status=ref.completedAt?"COMPLETED":"NEEDS-ACTION";cloneItem.completedDate=ref.completedAt?lazy.cal.dtz.jsDateToDateTime(new Date(ref.completedAt)):null;}catch{}}
    cloneItem.title=ref.subject||cloneItem.title;cloneItem.setProperty("X-PIN-MAILS-STABLE-KEY",ref.stableKey);
    const saved=await calendar.modifyItem(cloneItem,item);ref.calendarLastSyncedAt=Date.now();ref.calendarSyncHash=`${ref.dueAt}|${ref.completedAt}|${ref.subject}`;return {synced:true,itemId:saved?.id||item.id};
  }

  async _syncCalendarLinks(force=false) {
    if(!this._settings.enableCalendarIntegration||!this._settings.enableBidirectionalCalendarSync)return {synced:0,missing:0};
    if(!force&&Date.now()-this._lastCalendarSyncAt<CALENDAR_SYNC_INTERVAL_MS/2)return {synced:0,skipped:true};
    this._lastCalendarSyncAt=Date.now();let synced=0,missing=0,casesSynced=0;
    for(const ref of Object.values(this._data.refs)){
      if(!ref.calendarItemId)continue;
      const result=await this._syncReferenceToCalendar(ref);
      if(result.synced)synced++;
      if(result.missing){missing++;ref.calendarId="";ref.calendarItemId="";}
    }
    for (const caseItem of this._data.cases || []) {
      if (!caseItem.calendarItemId || !caseItem.calendarId) continue;
      try {
        const result = await this._createCaseCalendarItem(caseItem.id, "task", caseItem.calendarId, {save:false,refresh:false,createIfMissing:false});
        if (result.updated) casesSynced++;
      } catch (error) {
        missing++;
        this._recordDiagnostic("warning", `Synchronisation Agenda de l’affaire impossible : ${caseItem.name}`, error);
      }
    }
    if(missing||synced||casesSynced)this._saveData("calendar-sync");
    return {synced,missing,casesSynced};
  }

  _getCalendars() {
    if (!this._settings.enableCalendarIntegration) return [];
    try {
      return lazy.cal.manager.getCalendars().map(calendar => ({
        id: calendar.id, name: calendar.name || calendar.id,
        type: calendar.type || "", readOnly: Boolean(calendar.readOnly),
        disabled: Boolean(calendar.getProperty?.("disabled"))
      })).filter(calendar => !calendar.readOnly && !calendar.disabled);
    } catch (error) { this._recordDiagnostic("warning", "Calendriers indisponibles", error); return []; }
  }

  async _createCalendarItem(stableKey, itemType = "", calendarId = "") {
    if(!this._settings.enableCalendarIntegration)throw new ExtensionError("L’intégration Agenda est désactivée.");
    const ref=this._data.refs[String(stableKey||"")];if(!ref)throw new ExtensionError("Message épinglé introuvable.");
    if(ref.calendarItemId){const existing=await this._calendarItemForRef(ref);if(existing.item){await this._syncReferenceToCalendar(ref);return {created:false,updated:true,calendarId:ref.calendarId,itemId:ref.calendarItemId,itemType:ref.calendarItemType};}}
    const calendars=lazy.cal.manager.getCalendars();const wanted=String(calendarId||this._settings.preferredCalendarId||"");const calendar=calendars.find(item=>item.id===wanted)||calendars.find(item=>!item.readOnly&&!item.getProperty?.("disabled"));if(!calendar)throw new ExtensionError("Aucun calendrier modifiable n’est disponible.");
    const type=itemType==="event"?"event":(itemType==="task"?"task":this._settings.calendarItemType);const hdr=this._resolveReference(ref,true);const start=ref.dueAt||ref.followUpAt||Date.now()+3600000;
    const description=[ref.note,hdr?`Message : ${hdr.folder.getUriForMsg(hdr)}`:"",`Expéditeur : ${ref.author}`,ref.caseId?`Affaire : ${(this._data.cases||[]).find(item=>item.id===ref.caseId)?.name||ref.caseId}`:""].filter(Boolean).join("\n\n");
    let item;if(type==="event"){item=new lazy.CalEvent();item.title=ref.subject||"Message épinglé";item.startDate=lazy.cal.dtz.jsDateToDateTime(new Date(start));item.endDate=lazy.cal.dtz.jsDateToDateTime(new Date(start+3600000));}else{item=new lazy.CalTodo();item.title=ref.subject||"Message épinglé";item.entryDate=lazy.cal.dtz.jsDateToDateTime(new Date());item.dueDate=lazy.cal.dtz.jsDateToDateTime(new Date(start));}
    item.calendar=calendar;item.setProperty("DESCRIPTION",description);item.setProperty("X-PIN-MAILS-STABLE-KEY",ref.stableKey);item.setProperty("X-PIN-MAILS-VERSION","3");
    const saved=await calendar.addItem(item);ref.calendarId=calendar.id;ref.calendarItemId=saved?.id||item.id||"";ref.calendarItemType=type;ref.calendarLastSyncedAt=Date.now();
    this._registerCalendarObservers();this._recordActivity("calendar",ref.stableKey,`${type==="event"?"Événement":"Tâche"} créé`);this._saveData("calendar");this._refreshAllStates(true);return {created:true,calendarId:calendar.id,itemId:ref.calendarItemId,itemType:type};
  }


  async _deleteLinkedCaseCalendarItem(caseItem) {
    if (!caseItem?.calendarId || !caseItem?.calendarItemId) return {deleted:false};
    const calendar=lazy.cal.manager.getCalendars().find(item=>item.id===caseItem.calendarId);
    if (!calendar) return {deleted:false,missing:true};
    const item=await calendar.getItem(caseItem.calendarItemId);
    if (!item) return {deleted:false,missing:true};
    await calendar.deleteItem(item);
    return {deleted:true};
  }

  async _createCaseCalendarItem(caseId, itemType = "task", calendarId = "", {save=true,refresh=true,createIfMissing=true} = {}) {
    if(!this._settings.enableCalendarIntegration)throw new ExtensionError("L’intégration Agenda est désactivée.");
    const caseItem=(this._data.cases||[]).find(item=>item.id===String(caseId||""));if(!caseItem)throw new ExtensionError("Affaire introuvable.");
    const calendars=lazy.cal.manager.getCalendars();const wanted=String(calendarId||this._settings.preferredCalendarId||"");const calendar=calendars.find(item=>item.id===wanted)||calendars.find(item=>!item.readOnly&&!item.getProperty?.("disabled"));if(!calendar)throw new ExtensionError("Aucun calendrier modifiable n’est disponible.");
    if(caseItem.calendarItemId&&caseItem.calendarId){
      try{
        const existingCalendar=calendars.find(item=>item.id===caseItem.calendarId);
        const existing=await existingCalendar?.getItem(caseItem.calendarItemId);
        if(existing){
          const cloneItem=existing.clone();
          cloneItem.title=caseItem.name||"Affaire";
          cloneItem.setProperty("DESCRIPTION",caseItem.note||"");
          cloneItem.setProperty("X-PIN-MAILS-CASE-ID",caseItem.id);
          if(caseItem.dueAt){
            const date=lazy.cal.dtz.jsDateToDateTime(new Date(caseItem.dueAt));
            if(existing.type==="event"||cloneItem.startDate){cloneItem.startDate=date;cloneItem.endDate=lazy.cal.dtz.jsDateToDateTime(new Date(caseItem.dueAt+3600000));}
            else cloneItem.dueDate=date;
          } else if (!cloneItem.startDate) {
            cloneItem.dueDate=null;
          }
          try{cloneItem.percentComplete=caseItem.status==="completed"?100:0;cloneItem.status=caseItem.status==="completed"?"COMPLETED":"NEEDS-ACTION";}catch{}
          await existingCalendar.modifyItem(cloneItem,existing);
          caseItem.updatedAt=Date.now();
          if(save)this._saveData("case-calendar-update");
          if(refresh)this._refreshAllStates(true);
          return{created:false,updated:true,caseId:caseItem.id,itemId:caseItem.calendarItemId};
        }
        if (!createIfMissing) return {created:false,updated:false,missing:true,caseId:caseItem.id};
      }catch(error){
        this._recordDiagnostic("warning","Mise à jour Agenda de l’affaire impossible",error);
        if (!createIfMissing) return {created:false,updated:false,missing:true,caseId:caseItem.id};
      }
    }
    const type=itemType==="event"?"event":"task";const start=caseItem.dueAt||Date.now()+3600000;let item;
    if(type==="event"){item=new lazy.CalEvent();item.title=caseItem.name||"Affaire";item.startDate=lazy.cal.dtz.jsDateToDateTime(new Date(start));item.endDate=lazy.cal.dtz.jsDateToDateTime(new Date(start+3600000));}
    else{item=new lazy.CalTodo();item.title=caseItem.name||"Affaire";item.entryDate=lazy.cal.dtz.jsDateToDateTime(new Date());item.dueDate=lazy.cal.dtz.jsDateToDateTime(new Date(start));}
    item.calendar=calendar;item.setProperty("DESCRIPTION",caseItem.note||"");item.setProperty("X-PIN-MAILS-CASE-ID",caseItem.id);item.setProperty("X-PIN-MAILS-VERSION","3");
    const saved=await calendar.addItem(item);caseItem.calendarId=calendar.id;caseItem.calendarItemId=saved?.id||item.id||"";caseItem.updatedAt=Date.now();this._registerCalendarObservers();
    if(save)this._saveData("case-calendar");
    if(refresh)this._refreshAllStates(true);
    return{created:true,caseId:caseItem.id,calendarId:calendar.id,itemId:caseItem.calendarItemId,itemType:type};
  }

  _snoozeReminder(stableKey, durationMs) {
    const ref = this._data.refs[String(stableKey || "")];
    if (!ref) return {snoozed: false};
    const duration = clampNumber(durationMs, 60_000, 30 * DAY_MS, 3600000);
    this._pushUndo("Report du rappel"); ref.snoozeUntil = Date.now() + duration; ref.reminderFiredAt = 0;
    this._recordActivity("snooze", ref.stableKey, `${Math.round(duration / 60000)} min`);
    this._saveData("snooze"); this._refreshAllStates(true); return {snoozed: true, until: ref.snoozeUntil};
  }

  _applyCompletedRetention() {
    const retention = this._settings.completedRetentionDays * DAY_MS;
    if (!retention && !this._settings.autoRemoveCompleted) return false;
    let changed = false; const now = Date.now();
    for (const [key, ref] of Object.entries(this._data.refs)) {
      if (ref.completedAt && (this._settings.autoRemoveCompleted || now - ref.completedAt >= retention)) changed = this._removeReferenceByKey(key, {archiveAction:"retention"}) || changed;
    }
    if (changed) this._saveData("completed-retention");
    return changed;
  }

  _performMessageAction(action, headers, about3Pane) {
    const usable = headers.filter(Boolean);
    if (!usable.length) return;
    if (action === "read" || action === "unread" || action === "toggleRead") {
      this._pushUndo("Modification de l’état lu", this._captureFlags(usable, false));
      const targetRead = action === "read" ? true : action === "unread" ? false : !usable.every(hdr => hdr.flags & Ci.nsMsgMessageFlags.Read);
      const byFolder = new Map();
      for (const hdr of usable) {
        const list = byFolder.get(hdr.folder) || [];
        list.push(hdr);
        byFolder.set(hdr.folder, list);
      }
      for (const [folder, list] of byFolder) folder.markMessagesRead(list, targetRead);
      this._showToastAll(targetRead ? "Message(s) marqué(s) comme lu(s)." : "Message(s) marqué(s) comme non lu(s).", false);
      this._refreshAllStates(true);
      return;
    }
    if (action === "reply" && usable.length === 1) {
      const hdr = usable[0];
      const uri = hdr.folder.getUriForMsg(hdr);
      const [identity] = MailUtils.getIdentityForHeader(hdr);
      MailServices.compose.OpenComposeWindow(
        null, hdr, uri, Ci.nsIMsgCompType.ReplyToSender,
        Ci.nsIMsgCompFormat.Default, identity || null, "",
        about3Pane?.msgWindow || null, null, false
      );
      this._recordActivity("reply-compose", messageStableKey(hdr), formatSubject(hdr));
      return;
    }
    if (action === "archive") {
      const archiver = new MessageArchiver();
      archiver.msgWindow = about3Pane?.msgWindow || null;
      archiver.oncomplete = () => this._refreshAllStates(true);
      archiver.archiveMessages(usable);
      this._showToastAll(`${usable.length} message(s) archivé(s).`, false);
      return;
    }
    if (action === "delete") {
      if (this._settings.confirmDelete) {
        const accepted = about3Pane?.confirm
          ? about3Pane.confirm(`Supprimer ${usable.length} message(s) ?`)
          : Services.prompt.confirm(null, "MailPerch", `Supprimer ${usable.length} message(s) ?`);
        if (!accepted) return;
      }
      const byFolder = new Map();
      const pendingKeys=[];
      for (const hdr of usable) {
        const list = byFolder.get(hdr.folder) || [];
        list.push(hdr);
        byFolder.set(hdr.folder, list);
        for (const ref of this._referencesForHeader(hdr)) {
          this._pendingDeleteKeys.add(ref.stableKey);
          pendingKeys.push(ref.stableKey);
        }
      }
      if (pendingKeys.length) {
        const timer=Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        this._pendingDeleteTimers.add(timer);
        timer.initWithCallback(()=>{for(const key of pendingKeys)this._pendingDeleteKeys.delete(key);this._pendingDeleteTimers.delete(timer);},120000,Ci.nsITimer.TYPE_ONE_SHOT);
      }
      for (const [folder, list] of byFolder) {
        folder.deleteMessages(list, about3Pane?.msgWindow || null, false, false, null, true);
      }
      this._showToastAll(`${usable.length} suppression(s) demandée(s).`, false);
    }
  }

  _setupAbout3Pane(about3Pane) {
    const existing = [...this._states].find(state => state.about3Pane === about3Pane);
    if (existing) {
      existing.updateFolderMode();
      existing.scheduleRefresh(true);
      return;
    }

    const document = about3Pane.document;
    const threadTree = document.getElementById("threadTree");
    const nativeStarButton = document.getElementById("qfb-starred");
    const quickButtons = document.querySelector(".quickFilterButtons");
    if (!threadTree || !nativeStarButton || !quickButtons) {
      return;
    }

    let disposed = false;
    let refreshTimer = null;
    let panel = null;
    let allHeader = null;
    let panelToggle = null;
    let editor = null;
    let toastTimer = null;
    let searchText = "";
    let renderLimit = this._settings.panelPageSize;
    let selectedPanelKey = null;
    const selectedPanelKeys = new Set();
    let selectionAnchorKey = null;
    let cardDragKey = null;
    let inboxDragHeaders = [];
    let contextMenuKey = "";
    let contextMenu = null;
    let groupDialog = null;
    let groupAssignmentDialog = null;
    let onPanelContextMenu = null;

    const clearDropVisuals = () => {
      if (!panel) return;
      for (const node of panel.querySelectorAll("[data-dragging],[data-drop-before],[data-drop-after],[data-drop-target]")) {
        node.removeAttribute("data-dragging");
        node.removeAttribute("data-drop-before");
        node.removeAttribute("data-drop-after");
        node.removeAttribute("data-drop-target");
      }
    };
    const clearDropTargets = () => {
      if (!panel) return;
      for (const node of panel.querySelectorAll("[data-drop-before],[data-drop-after],[data-drop-target]")) {
        node.removeAttribute("data-drop-before");
        node.removeAttribute("data-drop-after");
        node.removeAttribute("data-drop-target");
      }
    };
    const clearDropFeedback = () => {
      cardDragKey = null;
      inboxDragHeaders = [];
      clearDropVisuals();
    };

    const isInbox = () => Boolean(
      about3Pane.gFolder && about3Pane.gFolder.flags & Ci.nsMsgFolderFlags.Inbox
    );
    const isEnabled = () => Boolean(about3Pane.gFolder) &&
      (isInbox() || this._settings.allowPinOutsideInbox) &&
      this._settings.inboxEnabled[about3Pane.gFolder.URI] !== false &&
      !this._compatibility?.reduced;
    const currentFolderURI = () => about3Pane.gFolder?.URI || "";
    const panelVisible = () => this._data.panelVisibleByInbox[currentFolderURI()] !== false;
    const panelCollapsed = () => this._settings.rememberCollapsed && Boolean(this._data.collapsedByInbox[currentFolderURI()]);

    const createNode = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };

    const cardFromEvent = event => {
      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      for (const node of path) {
        if (node instanceof about3Pane.Element && node.classList?.contains("pin-mails-card")) return node;
      }
      return event.target instanceof about3Pane.Element
        ? event.target.closest(".pin-mails-card")
        : null;
    };

    const headerForRow = row => {
      const index = Number(row?.index);
      if (!Number.isInteger(index) || index < 0 || index >= (about3Pane.gDBView?.rowCount || 0)) return null;
      try {
        return about3Pane.gDBView.getMsgHdrAt(index);
      } catch {
        return null;
      }
    };

    const setButtonLabel = (button, pinned) => {
      if (!button) return;
      const label = pinned ? "Désépingler le message" : "Épingler le message";
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", String(Boolean(pinned)));
    };

    const restoreNativeButton = button => {
      if (!button) return;
      button.classList.remove(BUTTON_CLASS);
      button.removeAttribute("title");
      button.removeAttribute("aria-label");
      button.removeAttribute("aria-pressed");
      button.removeAttribute("data-l10n-id");
      const row = button.closest("tr.card-layout");
      const originalContainer = row?.querySelector(".thread-card-icon-info");
      if (originalContainer && button.parentElement !== originalContainer) {
        originalContainer.appendChild(button);
      }
    };

    const ensureIndependentButton = (row, hdr) => {
      let button = row.querySelector(`.${INDEPENDENT_BUTTON_CLASS}`);
      if (!isEnabled() || this._settings.pinMode !== "independent" || !hdr) {
        button?.remove();
        row.removeAttribute("data-pin-mails-pinned");
        return;
      }
      if (!button) {
        button = createNode("button", `${INDEPENDENT_BUTTON_CLASS} button icon-button icon-only`);
        button.type = "button";
        button.dataset.pinMailsAction = "toggle-row-pin";
        if (row.classList.contains("card-layout")) {
          const headerRow = row.querySelector(".thread-card-row");
          const more = headerRow?.querySelector(".tree-button-more");
          headerRow?.insertBefore(button, more || null);
        } else {
          const host = row.querySelector("td.subjectcol-column") || row.lastElementChild;
          host?.classList.add("pin-mails-table-host");
          host?.appendChild(button);
        }
      }
      const pinned = this._isPinnedHeader(hdr);
      row.toggleAttribute("data-pin-mails-pinned", pinned);
      row.style.setProperty("--pin-row-account-color", this._getAccountColor(accountKeyForFolder(hdr.folder)));
      setButtonLabel(button, pinned);
      row.draggable = Boolean(this._settings.enableDragFromInbox && !this._settings.safeMode);
    };

    const patchRow = row => {
      if (!(row instanceof about3Pane.HTMLElement) || row.dataset.properties?.includes("dummy")) return;
      const hdr = headerForRow(row);
      const star = row.querySelector(".tree-button-flag");
      if (this._settings.pinMode === "nativeStar" && isEnabled()) {
        row.querySelector(`.${INDEPENDENT_BUTTON_CLASS}`)?.remove();
        if (star) {
          star.classList.add(BUTTON_CLASS);
          const pinned = this._isPinnedHeader(hdr);
          setButtonLabel(star, pinned);
          row.style.setProperty("--pin-row-account-color", this._getAccountColor(accountKeyForFolder(hdr?.folder || about3Pane.gFolder)));
          if (row.classList.contains("card-layout")) {
            const headerRow = row.querySelector(".thread-card-row");
            const more = headerRow?.querySelector(".tree-button-more");
            if (headerRow && star.parentElement !== headerRow) headerRow.insertBefore(star, more || null);
          }
        }
      } else {
        restoreNativeButton(star);
        ensureIndependentButton(row, hdr);
      }
    };

    const patchAllRows = () => {
      document.documentElement.toggleAttribute("pin-mails-native-star", this._settings.pinMode === "nativeStar");
      for (const row of document.querySelectorAll("#threadTree tr")) patchRow(row);
    };

    const ensurePanelToggle = () => {
      panelToggle = document.getElementById(PANEL_TOGGLE_ID);
      if (panelToggle) return panelToggle;
      panelToggle = createNode("button", "button collapsible-button icon-button check-button pin-mails-qfb-toggle");
      panelToggle.id = PANEL_TOGGLE_ID;
      panelToggle.type = "button";
      panelToggle.appendChild(createNode("span", "", "Épinglés"));
      nativeStarButton.after(panelToggle);
      panelToggle.addEventListener("click", event => {
        if (!isEnabled()) return;
        event.preventDefault();
        this._setPanelPreference(currentFolderURI(), "panelVisibleByInbox", !panelVisible());
        updatePanelToggle();
        renderPanel();
      });
      return panelToggle;
    };

    const updatePanelToggle = () => {
      ensurePanelToggle();
      const visible = panelVisible();
      panelToggle.hidden = !isEnabled();
      panelToggle.setAttribute("aria-label", visible ? "Masquer la section Épinglés" : "Afficher la section Épinglés");
      panelToggle.setAttribute("title", panelToggle.getAttribute("aria-label"));
      panelToggle.setAttribute("aria-pressed", String(visible));
    };

    const showToast = (message, allowUndo = true) => {
      createPanel();
      const toast = panel.querySelector(`#${TOAST_ID}`);
      if (!toast) return;
      if (toastTimer) about3Pane.clearTimeout(toastTimer);
      toast.replaceChildren();
      const text = createNode("span", "pin-mails-toast-text", message);
      toast.appendChild(text);
      if (allowUndo && this._settings.enableUndo && this._undoStack?.length) {
        const undo = createNode("button", "pin-mails-toast-undo", "Annuler");
        undo.type = "button";
        undo.addEventListener("click", () => this._undoLast(), {once: true});
        toast.appendChild(undo);
      }
      toast.hidden = false;
      toastTimer = about3Pane.setTimeout(() => {
        toast.hidden = true;
      }, this._settings.undoTimeoutMs);
    };

    const createEditor = () => {
      if (editor?.isConnected) return editor;
      editor = createNode("dialog", "pin-mails-editor"); editor.id = EDITOR_ID;
      const form = createNode("form", "pin-mails-editor-form"); form.method = "dialog";
      const title = createNode("h2", "pin-mails-editor-title", "Modifier le suivi");
      const subject = createNode("p", "pin-mails-editor-subject");
      const noteLabel = createNode("label", "", "Note personnelle");
      const note = createNode("textarea", "pin-mails-editor-note"); note.maxLength = MAX_NOTE_LENGTH; note.rows = 4; noteLabel.appendChild(note);
      const grid = createNode("div", "pin-mails-editor-grid");
      const field = (labelText, control) => { const label = createNode("label", "", labelText); label.appendChild(control); grid.appendChild(label); return control; };
      const group = field("Groupe", createNode("select", "pin-mails-editor-group"));
      const caseSelect = field("Affaire", createNode("select", "pin-mails-editor-case"));
      const templateSelect = field("Modèle de suivi", createNode("select", "pin-mails-editor-template"));
      const workflow = createNode("select", "pin-mails-editor-workflow");
      for (const [value, label] of [["active", "À traiter"], ["waiting", "En attente d’une réponse"], ["planned", "Planifié"], ["completed", "Terminé"]]) { const option = createNode("option", "", label); option.value = value; workflow.appendChild(option); }
      field("Statut", workflow);
      const priority = createNode("select", "pin-mails-editor-priority");
      for (const [value, label] of [["normal", "Normale"], ["high", "Haute"], ["urgent", "Urgente"]]) { const option = createNode("option", "", label); option.value = value; priority.appendChild(option); }
      field("Priorité", priority);
      const due = createNode("input", "pin-mails-editor-due"); due.type = "datetime-local"; field("Échéance", due);
      const reminder = createNode("input", "pin-mails-editor-reminder"); reminder.type = "datetime-local"; field("Rappel", reminder);
      const followUp = createNode("input", "pin-mails-editor-follow-up"); followUp.type = "datetime-local"; field("Relance / reprise", followUp);
      const repeat = createNode("select", "pin-mails-editor-repeat");
      for (const [value, label] of [["", "Aucune"], ["daily", "Chaque jour"], ["weekdays", "Jours ouvrés"], ["weekly", "Chaque semaine"], ["monthly", "Chaque mois"]]) { const option = createNode("option", "", label); option.value = value; repeat.appendChild(option); }
      field("Répétition du rappel", repeat);
      const recurrence = createNode("select", "pin-mails-editor-recurrence");
      for (const [value, label] of [["", "Aucune"], ["daily", "Quotidienne"], ["weekdays", "Jours ouvrés"], ["weekly", "Hebdomadaire"], ["monthly", "Mensuelle"], ["quarterly", "Trimestrielle"], ["yearly", "Annuelle"]]) { const option = createNode("option", "", label); option.value = value; recurrence.appendChild(option); }
      field("Suivi récurrent", recurrence);
      const recurrenceInterval = createNode("input", "pin-mails-editor-recurrence-interval"); recurrenceInterval.type = "number"; recurrenceInterval.min = "1"; recurrenceInterval.max = "100"; field("Intervalle de récurrence", recurrenceInterval);
      const lead = createNode("input", "pin-mails-editor-lead"); lead.type = "number"; lead.min = "0"; lead.max = "10080"; field("Rappel anticipé (minutes)", lead);
      const completedLabel = createNode("label", "pin-mails-editor-completed-label");
      const completed = createNode("input", "pin-mails-editor-completed"); completed.type = "checkbox";
      completedLabel.append(completed, createNode("span", "", "Marqué comme terminé")); grid.appendChild(completedLabel);
      const calendarRow = createNode("div", "pin-mails-editor-calendar-row");
      const applyTemplateButton = createNode("button", "secondary", "Appliquer le modèle"); applyTemplateButton.type = "button";
      const task = createNode("button", "secondary", "Créer / synchroniser une tâche"); task.type = "button"; task.dataset.calendarAction = "true";
      const eventButton = createNode("button", "secondary", "Créer / synchroniser un événement"); eventButton.type = "button"; eventButton.dataset.calendarAction = "true";
      const snooze10 = createNode("button", "secondary", "Reporter 10 min"); snooze10.type = "button";
      const snoozeHour = createNode("button", "secondary", "Reporter 1 h"); snoozeHour.type = "button";
      const snoozeTomorrow = createNode("button", "secondary", "Reporter à demain"); snoozeTomorrow.type = "button";
      calendarRow.append(applyTemplateButton, task, eventButton, snooze10, snoozeHour, snoozeTomorrow);
      const actions = createNode("div", "pin-mails-editor-actions");
      const cancel = createNode("button", "secondary", "Annuler"); cancel.type = "button";
      const save = createNode("button", "primary", "Enregistrer"); save.type = "submit"; actions.append(cancel, save);
      form.append(title, subject, noteLabel, grid, calendarRow, actions); editor.appendChild(form); document.body.appendChild(editor);
      cancel.addEventListener("click", () => editor.close());
      applyTemplateButton.addEventListener("click", () => {
        if (!templateSelect.value) return;
        const stableKey = editor.dataset.stableKey;
        this._applyTemplate([stableKey], templateSelect.value);
        editor.close();
        about3Pane.setTimeout(() => openEditor(stableKey), 0);
        showToast("Modèle de suivi appliqué.", true);
      });
      task.addEventListener("click", async () => { await this._createCalendarItem(editor.dataset.stableKey, "task", this._settings.preferredCalendarId); showToast("Tâche créée ou synchronisée dans l’agenda.", false); });
      eventButton.addEventListener("click", async () => { await this._createCalendarItem(editor.dataset.stableKey, "event", this._settings.preferredCalendarId); showToast("Événement créé dans l’agenda.", false); });
      snooze10.addEventListener("click", () => { this._snoozeReminder(editor.dataset.stableKey, 10 * 60_000); editor.close(); });
      snoozeHour.addEventListener("click", () => { this._snoozeReminder(editor.dataset.stableKey, 60 * 60_000); editor.close(); });
      snoozeTomorrow.addEventListener("click", () => { this._snoozeReminder(editor.dataset.stableKey, DAY_MS); editor.close(); });
      workflow.addEventListener("change", () => { completed.checked = workflow.value === "completed"; });
      completed.addEventListener("change", () => { workflow.value = completed.checked ? "completed" : (workflow.value === "completed" ? "active" : workflow.value); });
      form.addEventListener("submit", event => {
        event.preventDefault();
        this._setReferenceMetadata(editor.dataset.stableKey, {
          note: note.value, groupId: group.value, caseId: caseSelect.value, priorityLevel: priority.value,
          workflowStatus: workflow.value, dueAt: fromLocalDateTimeValue(due.value), reminderAt: fromLocalDateTimeValue(reminder.value),
          followUpAt: fromLocalDateTimeValue(followUp.value), repeatRule: repeat.value,
          recurrenceRule: recurrence.value, recurrenceInterval: Number(recurrenceInterval.value) || 1,
          reminderLeadMinutes: Number(lead.value) || 0, completed: completed.checked || workflow.value === "completed"
        });
        editor.close();
      });
      return editor;
    };

    const openEditor = stableKey => {
      const ref = this._data.refs[stableKey]; if (!ref) return;
      const dialog = createEditor(); dialog.dataset.stableKey = stableKey;
      dialog.querySelector(".pin-mails-editor-subject").textContent = `${ref.trackingMode === "conversation" ? "Conversation · " : ""}${ref.subject || "(sans objet)"}`;
      dialog.querySelector(".pin-mails-editor-note").value = ref.note || "";
      const groupSelect = dialog.querySelector(".pin-mails-editor-group"); groupSelect.replaceChildren();
      const none = createNode("option", "", "Aucun groupe"); none.value = ""; groupSelect.appendChild(none);
      for (const item of this._data.groups) { const option = createNode("option", "", item.name); option.value = item.id; groupSelect.appendChild(option); }
      groupSelect.value = ref.groupId || "";
      const caseSelect = dialog.querySelector(".pin-mails-editor-case"); caseSelect.replaceChildren();
      const noCase = createNode("option", "", "Aucune affaire"); noCase.value = ""; caseSelect.appendChild(noCase);
      for (const item of this._data.cases || []) { const option = createNode("option", "", item.name); option.value = item.id; caseSelect.appendChild(option); }
      caseSelect.value = ref.caseId || "";
      const templateSelect = dialog.querySelector(".pin-mails-editor-template"); templateSelect.replaceChildren();
      const noTemplate = createNode("option", "", "Aucun modèle"); noTemplate.value = ""; templateSelect.appendChild(noTemplate);
      for (const item of this._data.templates || []) { const option = createNode("option", "", item.name); option.value = item.id; templateSelect.appendChild(option); }
      templateSelect.value = ref.templateId || "";
      dialog.querySelector(".pin-mails-editor-workflow").value = ref.workflowStatus || (ref.completedAt ? "completed" : "active");
      dialog.querySelector(".pin-mails-editor-priority").value = ref.priorityLevel || "normal";
      dialog.querySelector(".pin-mails-editor-due").value = toLocalDateTimeValue(ref.dueAt);
      dialog.querySelector(".pin-mails-editor-reminder").value = toLocalDateTimeValue(ref.reminderAt);
      dialog.querySelector(".pin-mails-editor-follow-up").value = toLocalDateTimeValue(ref.followUpAt);
      dialog.querySelector(".pin-mails-editor-repeat").value = ref.repeatRule || "";
      dialog.querySelector(".pin-mails-editor-recurrence").value = ref.recurrenceRule || "";
      dialog.querySelector(".pin-mails-editor-recurrence-interval").value = String(ref.recurrenceInterval || 1);
      dialog.querySelector(".pin-mails-editor-lead").value = String(ref.reminderLeadMinutes || 0);
      dialog.querySelector(".pin-mails-editor-completed").checked = Boolean(ref.completedAt);
      for (const button of dialog.querySelectorAll(".pin-mails-editor-calendar-row [data-calendar-action]")) button.disabled = !this._settings.enableCalendarIntegration;
      dialog.querySelector(".pin-mails-editor-template").disabled = !this._settings.enableTemplates;
      dialog.showModal(); dialog.querySelector(".pin-mails-editor-note").focus();
    };

    const createGroupDialog = () => {
      if (groupDialog?.isConnected) return groupDialog;
      groupDialog = createNode("dialog", "pin-mails-group-dialog");
      const form = createNode("form", "pin-mails-group-dialog-form");
      form.method = "dialog";
      const title = createNode("h2", "pin-mails-group-dialog-title", "Créer un groupe");
      title.id = "pin-mails-group-dialog-create-title";
      groupDialog.setAttribute("aria-labelledby", title.id);
      const nameLabel = createNode("label", "", "Nom du groupe");
      const name = createNode("input", "pin-mails-group-dialog-name");
      name.type = "text";
      name.maxLength = 80;
      name.required = true;
      name.autocomplete = "off";
      nameLabel.appendChild(name);
      const colorLabel = createNode("label", "", "Couleur");
      const color = createNode("input", "pin-mails-group-dialog-color");
      color.type = "color";
      colorLabel.appendChild(color);
      const actions = createNode("div", "pin-mails-editor-actions");
      const cancel = createNode("button", "secondary", "Annuler");
      cancel.type = "button";
      const save = createNode("button", "primary", "Créer");
      save.type = "submit";
      actions.append(cancel, save);
      form.append(title, nameLabel, colorLabel, actions);
      groupDialog.appendChild(form);
      document.body.appendChild(groupDialog);
      cancel.addEventListener("click", () => groupDialog.close());
      form.addEventListener("submit", event => {
        event.preventDefault();
        const label = name.value.trim();
        if (!label) { name.focus(); return; }
        const base = sanitizeSearchText(label).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "groupe";
        let id = base.slice(0, 40);
        let index = 2;
        while (this._data.groups.some(group => group.id === id)) id = `${base.slice(0, 35)}-${index++}`;
        this._pushUndo("Création du groupe");
        this._data.groups.push({id, name: label.slice(0, 80), color: COLOR_RE.test(color.value) ? color.value : "#6264a7"});
        this._data.groupOrder.push(id);
        this._saveData("group-create");
        this._refreshAllStates(true);
        groupDialog.close();
        showToast("Groupe créé.", true);
      });
      return groupDialog;
    };

    const addGroup = () => {
      if (this._data.groups.length >= MAX_GROUPS) {
        showToast("Nombre maximal de groupes atteint.", false);
        return;
      }
      const dialog = createGroupDialog();
      const name = dialog.querySelector(".pin-mails-group-dialog-name");
      const color = dialog.querySelector(".pin-mails-group-dialog-color");
      name.value = "À traiter";
      color.value = DEFAULT_COLORS[this._data.groups.length % DEFAULT_COLORS.length];
      dialog.showModal();
      name.select();
    };

    const openGroupAssignmentDialog = keys => {
      if (!groupAssignmentDialog?.isConnected) {
        groupAssignmentDialog = createNode("dialog", "pin-mails-group-dialog");
        const form = createNode("form", "pin-mails-group-dialog-form");
        form.method = "dialog";
        const title = createNode("h2", "pin-mails-group-dialog-title", "Classer les messages");
        title.id = "pin-mails-group-dialog-assign-title";
        groupAssignmentDialog.setAttribute("aria-labelledby", title.id);
        form.appendChild(title);
        const label = createNode("label", "", "Groupe");
        const select = createNode("select", "pin-mails-group-assignment-select");
        label.appendChild(select);
        const actions = createNode("div", "pin-mails-editor-actions");
        const cancel = createNode("button", "secondary", "Annuler"); cancel.type = "button";
        const save = createNode("button", "primary", "Appliquer"); save.type = "submit";
        actions.append(cancel, save);
        form.append(label, actions);
        groupAssignmentDialog.appendChild(form);
        document.body.appendChild(groupAssignmentDialog);
        cancel.addEventListener("click", () => groupAssignmentDialog.close());
        form.addEventListener("submit", event => {
          event.preventDefault();
          const activeKeys = JSON.parse(groupAssignmentDialog.dataset.stableKeys || "[]");
          const groupId = select.value;
          this._pushUndo("Changement de groupe");
          let count = 0;
          for (const key of activeKeys) {
            const ref = this._data.refs[key];
            if (!ref) continue;
            ref.groupId = groupId;
            ref.updatedAt = Date.now();
            count++;
          }
          if (count) {
            this._saveData("group-assign");
            this._refreshAllStates(true);
          }
          groupAssignmentDialog.close();
          showToast(`${count} message(s) classé(s).`, true);
        });
      }
      const select = groupAssignmentDialog.querySelector(".pin-mails-group-assignment-select");
      select.replaceChildren();
      const none = createNode("option", "", "Aucun groupe"); none.value = ""; select.appendChild(none);
      for (const item of this._data.groups) { const option = createNode("option", "", item.name); option.value = item.id; select.appendChild(option); }
      groupAssignmentDialog.dataset.stableKeys = JSON.stringify(keys);
      groupAssignmentDialog.showModal();
      select.focus();
    };

    const createPanel = () => {
      if (panel?.isConnected && allHeader?.isConnected) return;
      panel = document.getElementById(PANEL_ID) || createNode("section", "pin-mails-panel");
      panel.id = PANEL_ID;
      panel.setAttribute("aria-label", "Messages épinglés");
      panel.replaceChildren();

      const header = createNode("div", "pin-mails-panel-header");
      const collapse = createNode("button", "pin-mails-collapse-button"); collapse.type = "button";
      collapse.appendChild(createNode("span", "pin-mails-chevron"));
      const icon = createNode("span", "pin-mails-header-icon"); icon.setAttribute("aria-hidden", "true");
      const titleWrap = createNode("div", "pin-mails-title-wrap");
      titleWrap.append(createNode("span", "pin-mails-title", "Épinglés"), createNode("span", "pin-mails-count", "0"));
      const summary = createNode("span", "pin-mails-summary"); titleWrap.appendChild(summary);
      const scope = createNode("select", "pin-mails-header-select"); scope.setAttribute("aria-label", "Portée du panneau");
      for (const [value, label] of [["currentInbox", "Cette boîte"], ["currentAccount", "Ce compte"], ["global", "Tous les comptes"]]) {
        const option = createNode("option", "", label); option.value = value; scope.appendChild(option);
      }
      const sort = createNode("select", "pin-mails-header-select"); sort.dataset.secondary = "true"; sort.setAttribute("aria-label", "Tri des épingles");
      for (const [value, label] of [["manual", "Ordre manuel"], ["pinnedAt", "Épinglage"], ["messageDate", "Date"], ["deadline", "Échéance"], ["priority", "Priorité"], ["sender", "Expéditeur"], ["account", "Compte"]]) {
        const option = createNode("option", "", label); option.value = value; sort.appendChild(option);
      }
      const headerAction = (className, label) => {
        const button = createNode("button", `pin-mails-header-action ${className}`);
        button.type = "button";
        button.title = label;
        button.setAttribute("aria-label", label);
        button.appendChild(createNode("span", "pin-mails-header-action-icon"));
        return button;
      };
      const conversationButton = headerAction("pin-mails-action-conversation", "Épingler la conversation sélectionnée");
      const dashboardButton = headerAction("pin-mails-action-dashboard", "Ouvrir le tableau de bord global");
      const addGroupButton = headerAction("pin-mails-action-add-group", "Créer un groupe");
      header.append(collapse, icon, titleWrap, scope, sort, conversationButton, dashboardButton, addGroupButton);

      const tools = createNode("div", "pin-mails-panel-tools");
      const searchWrap = createNode("label", "pin-mails-search-wrap");
      const search = createNode("input", "pin-mails-search"); search.type = "search"; search.placeholder = "Rechercher dans les épingles…"; search.setAttribute("aria-label", "Rechercher dans les messages épinglés");
      searchWrap.appendChild(search);
      const bulk = createNode("div", "pin-mails-bulk-actions"); bulk.hidden = true;
      const bulkCount = createNode("span", "pin-mails-bulk-count", "0 sélection");
      const bulkButton = (action, label) => { const b = createNode("button", "pin-mails-quick-button", label); b.type = "button"; b.dataset.bulkAction = action; b.setAttribute("aria-label", label); return b; };
      bulk.append(bulkCount, bulkButton("toggleRead", "Lu/non lu"), bulkButton("complete", "Terminer"), bulkButton("archive", "Archiver"), bulkButton("group", "Grouper"), bulkButton("unpin", "Désépingler"), bulkButton("delete", "Supprimer"));
      tools.append(searchWrap, bulk);

      const list = createNode("div", "pin-mails-panel-list"); list.setAttribute("role", "listbox"); list.setAttribute("aria-multiselectable", "true"); list.tabIndex = -1;
      const live = createNode("div", "pin-mails-live"); live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
      const toast = createNode("div", "pin-mails-toast"); toast.id = TOAST_ID; toast.hidden = true; toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite");
      contextMenu = createNode("div", "pin-mails-context-menu");
      contextMenu.hidden = true;
      contextMenu.setAttribute("role", "menu");
      contextMenu.setAttribute("aria-label", "Actions du message épinglé");
      contextMenu.tabIndex = -1;
      const menuItems = [
        ["open", "Ouvrir le message"], ["reply", "Répondre"], ["toggleRead", "Marquer lu / non lu"],
        ["waiting", "Mettre en attente / à traiter"], ["planned", "Planifier / à traiter"],
        ["complete", "Terminer / rouvrir"], ["snooze", "Reporter le rappel d’une heure"],
        ["calendar", "Ajouter ou synchroniser dans l’agenda"], ["edit", "Modifier le suivi"],
        ["archive", "Archiver"], ["delete", "Supprimer"], ["unpin", "Désépingler"]
      ];
      for (const [action, label] of menuItems) {
        if (action === "archive" || action === "unpin") contextMenu.appendChild(createNode("div", "pin-mails-context-separator"));
        const item = createNode("button", "pin-mails-context-item", label);
        item.type = "button";
        item.dataset.contextAction = action;
        item.setAttribute("role", "menuitem");
        contextMenu.appendChild(item);
      }
      panel.append(header, tools, list, live, toast);
      document.body.appendChild(contextMenu);
      allHeader = document.getElementById(ALL_HEADER_ID) || createNode("div", "", "Tous les messages");
      allHeader.id = ALL_HEADER_ID;
      threadTree.before(panel, allHeader);

      collapse.addEventListener("click", () => {
        this._setPanelPreference(currentFolderURI(), "collapsedByInbox", !panelCollapsed());
        renderPanel();
      });
      scope.addEventListener("change", () => { this._settings.panelScope = scope.value; this._saveSettings(); renderLimit = this._settings.panelPageSize; this._refreshAllStates(true); });
      sort.addEventListener("change", () => { this._settings.sortMode = sort.value; this._saveSettings(); this._refreshAllStates(true); });
      addGroupButton.addEventListener("click", addGroup);
      conversationButton.addEventListener("click", () => {
        const headers = this._getSelectedHeaders(about3Pane); if (!headers.length) return;
        const unique = [...new Map(headers.map(h => [conversationStableKey(h), h])).values()];
        const state = !unique.every(h => conversationStableKey(h) in this._data.refs);
        this._setHeadersPinned(unique, state, currentFolderURI(), state ? "Épinglage de conversation" : "Désépinglage de conversation", "conversation");
        for (const hdr of unique) { const ref = this._data.refs[conversationStableKey(hdr)]; if (ref) this._updateConversationReference(ref, hdr); }
        this._saveData("conversation");
      });
      dashboardButton.addEventListener("click", () => {
        const listeners = [...(this._dashboardRequestListeners || [])];
        if (listeners.length) {
          for (const listener of listeners) {
            try { listener(); } catch (error) { this._recordDiagnostic("warning", "Ouverture du tableau de bord impossible", error); }
          }
          return;
        }
        this._dashboardRequestPending = true;
        showToast("Ouverture du tableau de bord…", false);
        about3Pane.setTimeout(() => {
          if (!this._dashboardRequestPending) return;
          this._dashboardRequestPending = false;
          showToast("Le tableau de bord n’a pas pu être ouvert. Redémarrez Thunderbird puis réessayez.", false);
        }, 2500);
      });
      search.addEventListener("input", () => { searchText = search.value; renderLimit = this._settings.panelPageSize; renderPanel(); });

      bulk.addEventListener("click", event => {
        const button = event.target.closest("[data-bulk-action]");
        if (!button) return;
        const action = button.dataset.bulkAction;
        const keys = [...selectedPanelKeys];
        const headers = keys.map(key => document.querySelector(`.pin-mails-card[data-stable-key="${CSS.escape(key)}"]`)?._pinMessageHeader).filter(Boolean);
        if (action === "unpin") {
          this._pushUndo("Désépinglage multiple", this._captureFlags(headers));
          if (this._settings.pinMode === "nativeStar") {
            const byFolder = new Map();
            for (const hdr of headers) { const bucket = byFolder.get(hdr.folder) || []; bucket.push(hdr); byFolder.set(hdr.folder, bucket); }
            for (const [folder, bucket] of byFolder) folder.markMessagesFlagged(bucket, false);
          }
          for (const key of keys) this._removeReferenceByKey(key);
          this._saveData();
          this._refreshAllStates(true);
          showToast(`${keys.length} message(s) désépinglé(s).`, true);
          selectedPanelKeys.clear();
        } else if (action === "complete") {
          this._performReferenceAction(keys, "complete"); selectedPanelKeys.clear();
        } else if (action === "group") {
          openGroupAssignmentDialog(keys);
        } else {
          this._performMessageAction(action, headers, about3Pane);
        }
      });

      const closeContextMenu = () => {
        if (!contextMenu) return;
        contextMenu.hidden = true;
        contextMenuKey = "";
      };
      const positionContextMenu = (clientX, clientY) => {
        if (!contextMenu) return;
        contextMenu.hidden = false;
        contextMenu.style.left = "0px";
        contextMenu.style.top = "0px";
        const menuRect = contextMenu.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth || about3Pane.innerWidth;
        const viewportHeight = document.documentElement.clientHeight || about3Pane.innerHeight;
        const x = Math.max(6, Math.min(clientX, viewportWidth - menuRect.width - 6));
        const y = Math.max(6, Math.min(clientY, viewportHeight - menuRect.height - 6));
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.querySelector(".pin-mails-context-item:not([disabled])")?.focus();
      };
      const runCardAction = (key, action) => {
        const ref = this._data.refs[key];
        const card = list.querySelector(`.pin-mails-card[data-stable-key="${CSS.escape(key)}"]`);
        const hdr = card?._pinMessageHeader || (ref ? this._resolveReference(ref, false) : null);
        if (!ref) return;
        if (action === "open") selectPanelMessage(ref, hdr, card);
        else if (action === "unpin") { if (selectedPanelKey === key) selectedPanelKey = null; selectedPanelKeys.delete(key); this._performReferenceAction([key], "unpin"); showToast(hdr ? "Message désépinglé." : "Référence introuvable retirée.", true); }
        else if (action === "edit") openEditor(key);
        else if (action === "waiting") this._setWorkflowStatus([key], ref.workflowStatus === "waiting" ? "active" : "waiting");
        else if (action === "planned") this._setWorkflowStatus([key], ref.workflowStatus === "planned" ? "active" : "planned");
        else if (action === "complete") this._performReferenceAction([key], ref.completedAt ? "uncomplete" : "complete");
        else if (action === "snooze") this._snoozeReminder(key, 60 * 60_000);
        else if (action === "calendar") this._createCalendarItem(key, this._settings.calendarItemType, this._settings.preferredCalendarId).then(() => showToast("Ajouté à l’agenda.", false)).catch(error => showToast(String(error), false));
        else this._performMessageAction(action, hdr ? [hdr] : [], about3Pane);
      };
      contextMenu.addEventListener("click", event => {
        const item = event.target.closest("[data-context-action]");
        if (!item || !contextMenuKey) return;
        const key = contextMenuKey;
        closeContextMenu();
        runCardAction(key, item.dataset.contextAction);
      });
      contextMenu.addEventListener("keydown", event => {
        const items = [...contextMenu.querySelectorAll(".pin-mails-context-item:not([disabled])")];
        const index = items.indexOf(document.activeElement);
        if (event.key === "Escape") {
          event.preventDefault();
          const key = contextMenuKey;
          closeContextMenu();
          if (key) list.querySelector(`[data-stable-key="${CSS.escape(key)}"]`)?.focus();
        }
        else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const delta = event.key === "ArrowDown" ? 1 : -1;
          items[(index + delta + items.length) % items.length]?.focus();
        } else if (event.key === "Home") { event.preventDefault(); items[0]?.focus(); }
        else if (event.key === "End") { event.preventDefault(); items.at(-1)?.focus(); }
      });
      if (!onPanelContextMenu) {
        onPanelContextMenu = event => {
          const card = cardFromEvent(event);
          if (!card || !panel?.contains(card)) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          selectedPanelKey = card.dataset.stableKey;
          selectionAnchorKey = card.dataset.stableKey;
          updatePanelSelection();
          contextMenuKey = card.dataset.stableKey;
          positionContextMenu(event.clientX, event.clientY);
        };
        document.addEventListener("contextmenu", onPanelContextMenu, true);
      }

      list.addEventListener("click", event => {
        closeContextMenu();
        const actionButton = event.target.closest("[data-card-action]");
        const card = event.target.closest(".pin-mails-card");
        if (!card) return;
        const key = card.dataset.stableKey;
        const ref = this._data.refs[key];
        const hdr = card._pinMessageHeader;
        if (actionButton) {
          event.preventDefault(); event.stopPropagation();
          const action = actionButton.dataset.cardAction;
          if (action === "more") {
            selectedPanelKey = key;
            selectionAnchorKey = key;
            updatePanelSelection();
            contextMenuKey = key;
            const rect = actionButton.getBoundingClientRect();
            positionContextMenu(rect.right, rect.bottom);
          } else {
            runCardAction(key, action);
          }
          return;
        }
        if (this._settings.enableMultiSelect && (event.ctrlKey || event.metaKey)) {
          if (selectedPanelKeys.has(key)) selectedPanelKeys.delete(key); else selectedPanelKeys.add(key);
          selectionAnchorKey = key;
          updatePanelSelection();
          return;
        }
        if (this._settings.enableMultiSelect && event.shiftKey && selectionAnchorKey) {
          const cards = [...list.querySelectorAll(".pin-mails-card")];
          const a = cards.findIndex(item => item.dataset.stableKey === selectionAnchorKey);
          const b = cards.findIndex(item => item.dataset.stableKey === key);
          if (a >= 0 && b >= 0) for (const item of cards.slice(Math.min(a, b), Math.max(a, b) + 1)) selectedPanelKeys.add(item.dataset.stableKey);
          updatePanelSelection();
          return;
        }
        selectedPanelKeys.clear();
        selectionAnchorKey = key;
        selectPanelMessage(ref, hdr, card);
      });

      list.addEventListener("keydown", event => {
        const card = event.target.closest(".pin-mails-card");
        if (!card) return;
        const cards = [...list.querySelectorAll(".pin-mails-card")];
        const index = cards.indexOf(card);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault(); cards[Math.max(0, Math.min(cards.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
        } else if (event.key === " " && this._settings.enableMultiSelect) {
          event.preventDefault(); const key = card.dataset.stableKey; selectedPanelKeys.has(key) ? selectedPanelKeys.delete(key) : selectedPanelKeys.add(key); selectionAnchorKey = key; updatePanelSelection();
        } else if (event.key === "Enter") {
          event.preventDefault(); selectPanelMessage(this._data.refs[card.dataset.stableKey], card._pinMessageHeader, card);
        } else if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
          event.preventDefault();
          selectedPanelKey = card.dataset.stableKey;
          selectionAnchorKey = card.dataset.stableKey;
          updatePanelSelection();
          contextMenuKey = card.dataset.stableKey;
          const rect = card.getBoundingClientRect();
          positionContextMenu(rect.left + Math.min(36, rect.width / 2), rect.top + Math.min(36, rect.height / 2));
        } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
          event.preventDefault(); for (const item of cards) selectedPanelKeys.add(item.dataset.stableKey); updatePanelSelection();
        }
      });

      list.addEventListener("dblclick", event => {
        const card = event.target.closest(".pin-mails-card");
        if (card && !event.target.closest("button") && card._pinMessageHeader) MailUtils.displayMessage(card._pinMessageHeader);
      });

      list.addEventListener("dragstart", event => {
        const card = event.target.closest(".pin-mails-card");
        if (!card || this._settings.sortMode !== "manual" || this._settings.safeMode) { event.preventDefault(); return; }
        cardDragKey = card.dataset.stableKey; card.toggleAttribute("data-dragging", true); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/x-pin-mails-card", cardDragKey);
      });
      list.addEventListener("dragend", clearDropFeedback);
      list.addEventListener("dragleave", event => {
        if (!list.contains(event.relatedTarget)) clearDropFeedback();
      });
      list.addEventListener("dragover", event => {
        const target = event.target.closest(".pin-mails-card,.pin-mails-custom-group,.pin-mails-account-group") || list;
        if (!cardDragKey && !inboxDragHeaders.length) return;
        event.preventDefault();
        clearDropTargets();
        event.dataTransfer.dropEffect = cardDragKey ? "move" : "copy";
        target.toggleAttribute?.("data-drop-target", true);
        if (cardDragKey && target.classList?.contains("pin-mails-card")) {
          const rect = target.getBoundingClientRect(); const before = event.clientY < rect.top + rect.height / 2;
          target.toggleAttribute("data-drop-before", before); target.toggleAttribute("data-drop-after", !before);
        }
      });
      list.addEventListener("drop", event => {
        event.preventDefault();
        const draggedCardKey = cardDragKey;
        const draggedInboxHeaders = [...inboxDragHeaders];
        clearDropFeedback();
        const groupContainer = event.target.closest("[data-group-id]");
        const groupId = groupContainer?.dataset.groupId || "";
        if (draggedInboxHeaders.length) {
          this._setHeadersPinned(draggedInboxHeaders, true, currentFolderURI(), "Épinglage par glisser-déposer");
          if (groupId) for (const hdr of draggedInboxHeaders) { const ref = this._data.refs[messageStableKey(hdr)]; if (ref) ref.groupId = groupId; }
          this._saveData(); this._refreshAllStates(true); return;
        }
        const target = event.target.closest(".pin-mails-card");
        if (!draggedCardKey) return;
        if (groupId && this._data.refs[draggedCardKey]) {
          this._pushUndo("Changement de groupe");
          this._data.refs[draggedCardKey].groupId = groupId;
        }
        if (target && target.dataset.stableKey !== draggedCardKey) {
          const rect = target.getBoundingClientRect(); this._reorderReferences(draggedCardKey, target.dataset.stableKey, event.clientY < rect.top + rect.height / 2);
        } else { this._saveData(); this._refreshAllStates(true); }
      });
    };

    const updatePanelSelection = () => {
      if (!panel) return;
      for (const card of panel.querySelectorAll(".pin-mails-card")) {
        const key = card.dataset.stableKey;
        const selected = selectedPanelKeys.has(key);
        const active = selectedPanelKey === key;
        card.toggleAttribute("data-selected", selected);
        card.toggleAttribute("data-active", active);
        card.setAttribute("aria-selected", String(selected));
        if (active) card.setAttribute("aria-current", "true");
        else card.removeAttribute("aria-current");
      }
      const bulk = panel.querySelector(".pin-mails-bulk-actions");
      if (bulk) {
        bulk.hidden = selectedPanelKeys.size < 2;
        bulk.querySelector(".pin-mails-bulk-count").textContent = `${selectedPanelKeys.size} sélection(s)`;
      }
    };

    const selectPanelMessage = (ref, hdr, card) => {
      if (!ref) return;
      selectedPanelKey = ref.stableKey;
      updatePanelSelection();
      if (!hdr) return;
      try {
        about3Pane.messagePane.displayMessage(hdr.folder.getUriForMsg(hdr));
      } catch (error) {
        this._recordDiagnostic("error", "Affichage du message impossible", error);
      }
    };

    const createQuickButton = (action, label, text) => {
      const button = createNode("button", "pin-mails-quick-button", text);
      button.type = "button"; button.dataset.cardAction = action; button.title = label; button.setAttribute("aria-label", label); return button;
    };

    const createCard = entry => {
      const {ref, hdr} = entry;
      const color = this._settings.showAccountColor
        ? this._getAccountColor(ref.accountKey)
        : "#0f6cbd";
      const card = createNode("article", "pin-mails-card");
      card.setAttribute("role", "option"); card.tabIndex = 0; card.dataset.stableKey = ref.stableKey; card._pinMessageHeader = hdr;
      card.draggable = this._settings.sortMode === "manual" && Boolean(hdr) && !this._settings.safeMode;
      card.style.setProperty("--pin-account-color", color);
      card.toggleAttribute("data-unread", Boolean(hdr && !(hdr.flags & Ci.nsMsgMessageFlags.Read)));
      card.toggleAttribute("data-overdue", Boolean(!ref.completedAt && ref.dueAt && ref.dueAt < Date.now()));
      card.toggleAttribute("data-priority-high", ref.priorityLevel === "high");
      card.toggleAttribute("data-priority-urgent", ref.priorityLevel === "urgent");
      card.toggleAttribute("data-completed", Boolean(ref.completedAt));
      card.toggleAttribute("data-conversation", ref.trackingMode === "conversation");
      if (!hdr) card.toggleAttribute("data-broken", true);

      const top = createNode("div", "pin-mails-card-top");
      if (hdr && !(hdr.flags & Ci.nsMsgMessageFlags.Read)) { const dot = createNode("span", "pin-mails-unread-dot"); dot.title = "Non lu"; top.appendChild(dot); }
      const author = createNode("span", "pin-mails-author", hdr ? formatAuthor(hdr) : ref.author || "Message introuvable"); author.title = author.textContent;
      const date = createNode("time", "pin-mails-date", this._formatDate(about3Pane, hdr, ref));
      const pin = createQuickButton("unpin", "Désépingler", ""); pin.classList.add("pin-mails-card-pin");
      top.append(author, date, pin);
      const subject = createNode("div", "pin-mails-subject", hdr ? formatSubject(hdr) : ref.subject || "Message déplacé ou supprimé"); subject.title = subject.textContent;
      card.append(top, subject);

      if (this._settings.showNotes && ref.note) card.appendChild(createNode("div", "pin-mails-note", ref.note));
      const statusLine = createNode("div", "pin-mails-status-line");
      if (ref.trackingMode === "conversation") statusLine.appendChild(createNode("span", "pin-mails-conversation-chip", `${ref.conversationCount || 1} message(s)${ref.conversationUnread ? ` · ${ref.conversationUnread} non lu(s)` : ""}`));
      if (ref.workflowStatus === "waiting") statusLine.appendChild(createNode("span", "pin-mails-workflow-chip waiting", ref.waitingSince ? `En attente depuis ${this._formatTimestamp(about3Pane, ref.waitingSince)}` : "En attente d’une réponse"));
      else if (ref.workflowStatus === "planned") statusLine.appendChild(createNode("span", "pin-mails-workflow-chip planned", "Planifié"));
      if (ref.completedAt || ref.workflowStatus === "completed") statusLine.appendChild(createNode("span", "pin-mails-completed-chip", "Terminé"));
      if (ref.followUpAt && ref.workflowStatus !== "completed") statusLine.appendChild(createNode("span", `pin-mails-follow-up-chip${ref.followUpAt < Date.now() ? " overdue" : ""}`, `${ref.followUpAt < Date.now() ? "Relance en retard · " : "Relance · "}${this._formatTimestamp(about3Pane, ref.followUpAt)}`));
      if (ref.recurrenceRule) statusLine.appendChild(createNode("span", "pin-mails-recurrence-chip", `Récurrent · ${ref.recurrenceInterval > 1 ? `${ref.recurrenceInterval}× ` : ""}${({daily:"jour",weekdays:"jours ouvrés",weekly:"semaine",monthly:"mois",quarterly:"trimestre",yearly:"an"})[ref.recurrenceRule] || ref.recurrenceRule}`));
      const caseItem = (this._data.cases || []).find(item => item.id === ref.caseId);
      if (caseItem) { const chip = createNode("span", "pin-mails-case-chip", `Affaire · ${caseItem.name}`); chip.style.setProperty("--pin-case-color", caseItem.color); statusLine.appendChild(chip); }
      if (ref.calendarItemId) statusLine.appendChild(createNode("span", "pin-mails-calendar-chip", "Agenda synchronisé"));
      if (this._settings.showDeadlines && ref.dueAt) {
        const due = createNode("span", "pin-mails-due", `${ref.dueAt < Date.now() ? "En retard · " : "Échéance · "}${this._formatTimestamp(about3Pane, ref.dueAt)}`); statusLine.appendChild(due);
      }
      const group = this._groupForId(ref.groupId);
      if (this._settings.showGroups && group) { const chip = createNode("span", "pin-mails-group-chip", group.name); chip.style.setProperty("--pin-group-color", group.color); statusLine.appendChild(chip); }
      if (ref.priorityLevel !== "normal") statusLine.appendChild(createNode("span", `pin-mails-priority-chip ${ref.priorityLevel}`, ref.priorityLevel === "urgent" ? "Urgent" : "Priorité haute"));
      if (statusLine.childNodes.length) card.appendChild(statusLine);

      if (this._settings.cardLines >= 3) {
        const meta = createNode("div", "pin-mails-card-meta");
        const preview = !this._settings.safeMode && hdr ? getCachedPreview(hdr) : "";
        if (preview) { const node = createNode("span", "pin-mails-preview", preview); node.title = preview; meta.appendChild(node); }
        if (this._settings.showPriority && hdr && isHighPriority(hdr)) { const node = createNode("span", "pin-mails-meta-icon pin-mails-priority", "!"); node.title = "Priorité élevée du message"; meta.appendChild(node); }
        if (this._settings.showAttachments && hdr && hasAttachment(hdr)) { const node = createNode("span", "pin-mails-meta-icon", "PJ"); node.title = "Pièce jointe"; meta.appendChild(node); }
        if (this._settings.showTags && !this._settings.safeMode && hdr) for (const tag of getTagMetadata(hdr)) { const node = createNode("span", "pin-mails-tag", tag.name); node.style.setProperty("--tag-color", tag.color); meta.appendChild(node); }
        if (this._settings.showFolder && ref.folderName) { const node = createNode("span", "pin-mails-folder", ref.folderName); node.title = ref.folderName; meta.appendChild(node); }
        if (meta.childNodes.length) card.appendChild(meta);
      }

      if (this._settings.showQuickActions && !this._settings.safeMode && hdr) {
        const actions = createNode("div", "pin-mails-card-actions");
        actions.append(
          createQuickButton("reply", "Répondre", "↩"),
          createQuickButton("waiting", ref.workflowStatus === "waiting" ? "Repasser à traiter" : "Mettre en attente d’une réponse", ref.workflowStatus === "waiting" ? "▶" : "⌛"),
          createQuickButton("complete", ref.completedAt ? "Rouvrir" : "Marquer terminé", ref.completedAt ? "↺" : "✓"),
          createQuickButton("edit", "Note, affaire, modèle et échéance", "✎"),
          (() => { const more = createQuickButton("more", "Plus d’actions", "⋯"); more.setAttribute("aria-haspopup", "menu"); return more; })()
        );
        card.appendChild(actions);
      } else if (!this._settings.safeMode && (this._settings.showNotes || this._settings.showDeadlines || this._settings.showGroups)) {
        const actions = createNode("div", "pin-mails-card-actions"); actions.appendChild(createQuickButton("edit", "Modifier le suivi", "✎")); card.appendChild(actions);
      }
      return card;
    };

    const createGroupSection = (id, name, color, entries, kind) => {
      const section = createNode("section", kind === "custom" ? "pin-mails-custom-group" : (kind === "smart" ? "pin-mails-smart-group" : "pin-mails-account-group"));
      section.dataset.groupId = kind === "custom" ? id : "";
      section.style.setProperty("--pin-account-color", color);
      const header = createNode("div", kind === "custom" ? "pin-mails-custom-group-header" : (kind === "smart" ? "pin-mails-smart-group-header" : "pin-mails-account-header"));
      header.append(createNode("span", "pin-mails-account-dot"), createNode("span", "pin-mails-account-name", name));
      const unread = entries.filter(entry => entry.hdr && !(entry.hdr.flags & Ci.nsMsgMessageFlags.Read)).length;
      const overdue = entries.filter(entry => !entry.ref.completedAt && entry.ref.dueAt && entry.ref.dueAt < Date.now()).length;
      header.appendChild(createNode("span", "pin-mails-group-count", `${entries.length}${unread ? ` · ${unread} non lu(s)` : ""}${overdue ? ` · ${overdue} en retard` : ""}`));
      section.appendChild(header);
      for (const entry of entries) section.appendChild(createCard(entry));
      return section;
    };

    const updateFolderBadge = _stats => {
      // Retired in 2.0: a custom number beside a folder is visually
      // indistinguishable from Thunderbird's unread counter.
      for (const old of document.querySelectorAll(".pin-mails-folder-badge")) old.remove();
    };

    const renderPanel = () => {
      const renderStarted = about3Pane.performance.now();
      createPanel();
      clearDropVisuals();
      const enabled = isEnabled();
      document.documentElement.toggleAttribute(INBOX_ATTRIBUTE, enabled);
      document.documentElement.setAttribute("pin-mails-density", this._settings.density);
      document.documentElement.setAttribute("pin-mails-animate", String(this._settings.animateChanges && !this._settings.safeMode));
      document.documentElement.style.setProperty("--pin-mails-max-height", `${this._settings.panelMaxHeight}px`);
      panel.hidden = !enabled || !panelVisible(); allHeader.hidden = !enabled || !panelVisible();
      updatePanelToggle();
      if (!enabled) return;
      panel.toggleAttribute("data-collapsed", panelCollapsed());
      panel.querySelector(".pin-mails-collapse-button").setAttribute("aria-label", panelCollapsed() ? "Développer la section Épinglés" : "Réduire la section Épinglés");
      panel.querySelector(".pin-mails-header-select").value = this._settings.panelScope;
      panel.querySelector(".pin-mails-header-select[data-secondary]").value = this._settings.sortMode;
      panel.querySelector(".pin-mails-panel-tools").hidden = panelCollapsed();
      panel.querySelector(".pin-mails-search-wrap").hidden = !this._settings.showSearch;
      panel.querySelector(".pin-mails-search").value = searchText;
      panel.querySelector(".pin-mails-action-conversation").hidden = !this._settings.enableConversationPins || this._settings.safeMode;
      panel.querySelector(".pin-mails-action-dashboard").hidden = !this._settings.enableGlobalDashboard;
      panel.querySelector(".pin-mails-action-add-group").hidden = !this._settings.showGroups || this._settings.safeMode;
      this._syncInbox(about3Pane.gFolder);
      const allEntries = this._entriesForFolder(about3Pane.gFolder);
      const stats = {
        total: allEntries.length,
        unread: allEntries.filter(entry => entry.hdr && !(entry.hdr.flags & Ci.nsMsgMessageFlags.Read)).length,
        overdue: allEntries.filter(entry => !entry.ref.completedAt && entry.ref.dueAt && entry.ref.dueAt < Date.now()).length,
        completed: allEntries.filter(entry => entry.ref.completedAt).length
      };
      panel.querySelector(".pin-mails-count").textContent = String(stats.total);
      panel.querySelector(".pin-mails-summary").textContent = this._settings.showCounters ? `${stats.unread} non lu(s) · ${stats.overdue} en retard${stats.completed ? ` · ${stats.completed} terminé(s)` : ""}` : "";
      updateFolderBadge(stats);
      const query = sanitizeSearchText(searchText);
      let entries = query ? allEntries.filter(entry => {
        const group = this._groupForId(entry.ref.groupId);
        return sanitizeSearchText([entry.ref.author, entry.ref.subject, entry.ref.accountName, entry.ref.folderName, entry.ref.note, group?.name].join(" ")).includes(query);
      }) : allEntries;
      const totalFiltered = entries.length;
      entries = entries.slice(0, renderLimit);
      const list = panel.querySelector(".pin-mails-panel-list"); list.replaceChildren();
      if (!entries.length) { list.appendChild(createNode("div", "pin-mails-empty", query ? "Aucun résultat" : "Aucun message épinglé")); updatePanelSelection(); return; }
      const fragment = document.createDocumentFragment();
      if (this._settings.showSmartSections) {
        const buckets = new Map();
        for (const entry of entries) { const id = smartSectionForRef(entry.ref); const bucket = buckets.get(id) || []; bucket.push(entry); buckets.set(id, bucket); }
        for (const id of ["overdue", "today", "week", "later", "noDue", "completed"]) {
          const bucket = buckets.get(id); if (!bucket?.length) continue;
          const colors = {overdue: "#d13438", today: "#ca5010", week: "#0f6cbd", later: "#6264a7", noDue: "#777777", completed: "#107c10"};
          fragment.appendChild(createGroupSection(id, SMART_SECTION_LABELS[id], colors[id], bucket, "smart"));
        }
      } else if (this._settings.groupByCustomGroup && this._settings.showGroups) {
        const buckets = new Map();
        for (const entry of entries) { const id = entry.ref.groupId || "__none"; const bucket = buckets.get(id) || []; bucket.push(entry); buckets.set(id, bucket); }
        const order = [...this._data.groupOrder, "__none"];
        for (const id of order) {
          const bucket = buckets.get(id); if (!bucket?.length) continue;
          const group = this._groupForId(id); fragment.appendChild(createGroupSection(id === "__none" ? "" : id, group?.name || "Sans groupe", group?.color || "#777777", bucket, "custom"));
        }
      } else if (this._settings.groupByAccount) {
        const buckets = new Map();
        for (const entry of entries) { const bucket = buckets.get(entry.ref.accountKey) || []; bucket.push(entry); buckets.set(entry.ref.accountKey, bucket); }
        for (const [key, bucket] of buckets) fragment.appendChild(createGroupSection(
          key,
          bucket[0].ref.accountName || key,
          this._settings.showAccountColor ? this._getAccountColor(key) : "#0f6cbd",
          bucket,
          "account"
        ));
      } else {
        for (const entry of entries) fragment.appendChild(createCard(entry));
      }
      list.appendChild(fragment);
      if (totalFiltered > entries.length) {
        const more = createNode("button", "pin-mails-load-more", `Afficher ${Math.min(this._settings.panelPageSize, totalFiltered - entries.length)} message(s) de plus`); more.type = "button";
        more.addEventListener("click", () => { renderLimit += this._settings.panelPageSize; renderPanel(); }); list.appendChild(more);
      }
      updatePanelSelection();
      panel.querySelector(".pin-mails-live").textContent = `${totalFiltered} message(s) affiché(s).`;
      if (this._settings.enablePerformanceMetrics) {
        const elapsed = about3Pane.performance.now() - renderStarted; this._performance.renders++; this._performance.totalRenderMs += elapsed;
        this._performance.lastRenderMs = elapsed; this._performance.maxRenderMs = Math.max(this._performance.maxRenderMs, elapsed);
      }
    };

    const scheduleRefresh = (immediate = false) => {
      if (disposed) return;
      if (refreshTimer !== null) about3Pane.clearTimeout(refreshTimer);
      refreshTimer = about3Pane.setTimeout(() => {
        refreshTimer = null; patchAllRows(); renderPanel(); this._updateMainMenuWindow(about3Pane.top);
      }, immediate ? 0 : REFRESH_DELAY_MS);
    };

    const applySettings = () => { renderLimit = this._settings.panelPageSize; updatePanelToggle(); scheduleRefresh(true); };
    const updateFolderMode = () => { selectedPanelKeys.clear(); selectedPanelKey = null; selectionAnchorKey = null; searchText = ""; renderLimit = this._settings.panelPageSize; patchAllRows(); renderPanel(); this._updateMainMenuWindow(about3Pane.top); };

    const observer = new about3Pane.MutationObserver(() => scheduleRefresh());
    observer.observe(threadTree, {subtree: true, childList: true, attributes: true, attributeFilter: ["data-properties"]});
    const onFolderChanged = () => {
      if (contextMenu) { contextMenu.hidden = true; contextMenuKey = ""; }
      clearDropFeedback();
      about3Pane.setTimeout(updateFolderMode, 0);
    };
    const onRowCountChange = () => scheduleRefresh();
    const onSelectionChange = () => this._updateMainMenuWindow(about3Pane.top);
    const onDocumentPointerDown = event => {
      if (contextMenu?.hidden || event.target?.closest?.(".pin-mails-context-menu")) return;
      contextMenu.hidden = true;
      contextMenuKey = "";
    };
    const onDocumentKeyDown = event => {
      if (event.key === "Escape" && contextMenu && !contextMenu.hidden) {
        contextMenu.hidden = true;
        contextMenuKey = "";
      }
    };
    const onWindowBlur = () => { if (contextMenu) { contextMenu.hidden = true; contextMenuKey = ""; } clearDropFeedback(); };
    const onViewportChange = () => { if (contextMenu) { contextMenu.hidden = true; contextMenuKey = ""; } clearDropTargets(); };
    const onThreadDragEnd = () => clearDropFeedback();
    const onDocumentClick = event => {
      const custom = event.target?.closest?.(`.${INDEPENDENT_BUTTON_CLASS}`);
      if (custom && isEnabled() && this._settings.pinMode === "independent") {
        event.preventDefault(); event.stopImmediatePropagation();
        const hdr = headerForRow(custom.closest("tr"));
        if (hdr) this._setHeadersPinned([hdr], !this._isPinnedHeader(hdr), currentFolderURI(), this._isPinnedHeader(hdr) ? "Désépinglage" : "Épinglage");
      } else if (event.target?.closest?.(".tree-button-flag") && this._settings.pinMode === "nativeStar" && isEnabled()) {
        about3Pane.setTimeout(() => { this._syncInbox(about3Pane.gFolder); scheduleRefresh(true); }, 0);
      }
    };
    const onThreadDragStart = event => {
      if (!this._settings.enableDragFromInbox || this._settings.safeMode || !isEnabled() || event.target.closest("button")) return;
      const row = event.target.closest("tr"); const hdr = headerForRow(row); if (!hdr) return;
      const selected = this._getSelectedHeaders(about3Pane); inboxDragHeaders = selected.some(item => item === hdr) ? selected : [hdr];
      event.dataTransfer.effectAllowed = "copyMove"; event.dataTransfer.setData("text/x-pin-mails-inbox", String(inboxDragHeaders.length));
    };

    const cleanup = () => {
      if (disposed) return; disposed = true;
      if (refreshTimer !== null) about3Pane.clearTimeout(refreshTimer);
      if (toastTimer) about3Pane.clearTimeout(toastTimer);
      observer.disconnect();
      about3Pane.removeEventListener("folderURIChanged", onFolderChanged);
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("pointerdown", onDocumentPointerDown, true);
      document.removeEventListener("keydown", onDocumentKeyDown, true);
      if (onPanelContextMenu) document.removeEventListener("contextmenu", onPanelContextMenu, true);
      document.removeEventListener("select", onSelectionChange, true);
      about3Pane.removeEventListener("blur", onWindowBlur, true);
      about3Pane.removeEventListener("resize", onViewportChange);
      panel?.querySelector(".pin-mails-panel-list")?.removeEventListener("scroll", onViewportChange);
      threadTree.removeEventListener("rowcountchange", onRowCountChange);
      threadTree.removeEventListener("dragstart", onThreadDragStart);
      threadTree.removeEventListener("dragend", onThreadDragEnd);
      about3Pane.removeEventListener("unload", cleanup);
      document.documentElement.removeAttribute(INBOX_ATTRIBUTE);
      document.documentElement.removeAttribute("pin-mails-native-star");
      document.documentElement.removeAttribute("pin-mails-density");
      document.documentElement.removeAttribute("pin-mails-animate");
      document.documentElement.style.removeProperty("--pin-mails-max-height");
      panel?.remove(); allHeader?.remove(); panelToggle?.remove(); editor?.remove(); contextMenu?.remove(); groupDialog?.remove(); groupAssignmentDialog?.remove(); for (const badge of document.querySelectorAll(".pin-mails-folder-badge")) badge.remove();
      for (const button of document.querySelectorAll(`.${INDEPENDENT_BUTTON_CLASS}`)) button.remove();
      for (const button of document.querySelectorAll(`.${BUTTON_CLASS}`)) restoreNativeButton(button);
      this._states.delete(state);
    };

    const state = {
      about3Pane, updateFolderMode, scheduleRefresh, applySettings, cleanup, showToast,
      getSelectionState: () => this._selectionState(about3Pane),
      toggleSelected: forceState => this._toggleSelectedInPane(about3Pane, forceState)
    };
    this._states.add(state);
    about3Pane.addEventListener("folderURIChanged", onFolderChanged);
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("pointerdown", onDocumentPointerDown, true);
    document.addEventListener("keydown", onDocumentKeyDown, true);
    document.addEventListener("select", onSelectionChange, true);
    about3Pane.addEventListener("blur", onWindowBlur, true);
    about3Pane.addEventListener("resize", onViewportChange);
    panel?.querySelector(".pin-mails-panel-list")?.addEventListener("scroll", onViewportChange, {passive: true});
    threadTree.addEventListener("rowcountchange", onRowCountChange);
    threadTree.addEventListener("dragstart", onThreadDragStart);
    threadTree.addEventListener("dragend", onThreadDragEnd);
    about3Pane.addEventListener("unload", cleanup, {once: true});
    this._ensureMainMenuWindow(about3Pane.top);
    ensurePanelToggle(); createPanel(); updateFolderMode(); scheduleRefresh(true);
  }

  _formatTimestamp(about3Pane, timestamp) {
    if (!timestamp) return "";
    return new about3Pane.Intl.DateTimeFormat(undefined, {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(new Date(timestamp));
  }

  _stateForTopWindow(topWindow) {
    const active = topWindow?.gTabmail?.currentTabInfo?.chromeBrowser?.contentWindow;
    return [...(this._states || [])].find(state => state.about3Pane === active) || null;
  }

  _ensureMainMenuWindow(topWindow) {
    if (!topWindow?.document || this._menuWindows.has(topWindow)) {
      return;
    }
    const document = topWindow.document;
    const popup = document.getElementById("messageMenuPopup");
    const before = document.getElementById("markMenu");
    if (!popup || !before) {
      return;
    }
    const separator = document.createXULElement("menuseparator");
    separator.id = "pin-mails-message-separator";
    const item = document.createXULElement("menuitem");
    item.id = "pin-mails-message-command";
    item.setAttribute("label", "Épingler la sélection");
    item.setAttribute("accesskey", "p");
    popup.insertBefore(separator, before);
    popup.insertBefore(item, before);

    const onCommand = () => {
      const state = this._stateForTopWindow(topWindow);
      state?.toggleSelected(null);
    };
    const onShowing = () => this._updateMainMenuWindow(topWindow);
    item.addEventListener("command", onCommand);
    popup.addEventListener("popupshowing", onShowing);
    this._menuWindows.set(topWindow, {popup, item, separator, onCommand, onShowing});
    this._updateMainMenuWindow(topWindow);
  }

  _updateMainMenuWindow(topWindow) {
    const record = this._menuWindows?.get(topWindow);
    if (!record) {
      return;
    }
    const state = this._stateForTopWindow(topWindow);
    const selection = state?.getSelectionState() || {
      count: 0,
      allPinned: false,
      anyPinned: false
    };
    record.item.hidden = !selection.count;
    record.separator.hidden = !selection.count;
    record.item.setAttribute(
      "label",
      selection.allPinned ? "Désépingler la sélection" : "Épingler la sélection"
    );
  }

  _cleanupMainMenus() {
    for (const [window, record] of this._menuWindows || []) {
      try {
        record.item.removeEventListener("command", record.onCommand);
        record.popup.removeEventListener("popupshowing", record.onShowing);
        record.item.remove();
        record.separator.remove();
      } catch {
        // Window may already be closed.
      }
      this._menuWindows.delete(window);
    }
  }

  onShutdown(isAppShutdown) {
    this._unregisterFolderListener();
    this._unregisterDataObserver();
    this._unregisterCalendarObservers();
    if (this._calendarSyncTimer) { try { this._calendarSyncTimer.cancel(); } catch {} this._calendarSyncTimer = null; }
    if (this._backupTimer) { try { this._backupTimer.cancel(); } catch {} this._backupTimer = null; }
    if (this._reminderTimer) {
      try { this._reminderTimer.cancel(); } catch {}
      this._reminderTimer = null;
    }
    for (const timer of this._pendingDeleteTimers || []) { try { timer.cancel(); } catch {} }
    this._pendingDeleteTimers?.clear();
    this._pendingDeleteKeys?.clear();
    if (this._states) {
      for (const state of [...this._states]) {
        try { state.cleanup(); } catch (error) { console.error("Épingles : nettoyage incomplet", error); }
      }
    }
    this._cleanupMainMenus();
    this._dashboardRequestPending = false;
    this._dashboardRequestListeners?.clear();
    // Start an atomic emergency-file write before the asynchronous SQLite
    // close. The next startup compares it with the last committed revision and
    // only restores it when it contains newer, different data.
    this._storage?.writeEmergencyRecovery(this._data, this._undoStack, "shutdown").catch(() => {});
    // Flush and close asynchronously. Extension shutdown does not await this
    // hook, but PinStructuredStore serializes pending writes before closing.
    this._storage?.close();
    if (!isAppShutdown) {
      if (this._styleSheetService && this._styleUri &&
          this._styleSheetService.sheetRegistered(this._styleUri, this._styleSheetService.AUTHOR_SHEET)) {
        this._styleSheetService.unregisterSheet(this._styleUri, this._styleSheetService.AUTHOR_SHEET);
      }
      Services.obs.notifyObservers(null, "startupcache-invalidate");
    }
  }
};
