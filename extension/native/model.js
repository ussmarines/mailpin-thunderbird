// Pure 1.7.10 normalization, selectively ported; no Thunderbird internals.
import "./models/settings.js";
import "./models/identity.js";
import "./models/storage.js";
import "./models/workflow.js";
import "./models/rules.js";
import "./models/smart.js";
import "./models/bulk.js";
import "./models/diagnostics.js";
import "./models/providers.js";
import "./models/health.js";
import "./models/migrations.js";
import "./models/performance.js";
import "./models/localization.js";
import "./models/review.js";
import "./models/related.js";
import "./models/checklists.js";
import "./models/analytics.js";
import "./models/saved-views.js";
import "./models/tag-sync.js";

const PIN_MODULES = globalThis;
const ExtensionError = Error;
const MAX_IMPORT_BYTES=10*1024*1024, MAX_API_INPUT_NODES=100000, MAX_API_INPUT_DEPTH=24, MAX_BULK_KEYS=500;
const MAX_HISTORY=5000, MAX_RULE_LOG=2000, MAX_RULES=200, MAX_CASES=200, MAX_TEMPLATES=100, MAX_ACTIVITY=1000, MAX_DIAGNOSTIC_EVENTS=500, MAX_NOTE_LENGTH=4000, MAX_GROUPS=40, MAX_UNDO=20, DAY_MS=86400000;
const COLOR_RE=/^#[0-9a-f]{6}$/i, GROUP_ID_RE=/^[a-z0-9_-]{1,48}$/i;
const DEFAULT_COLORS = Object.freeze([
  "#4e7569", // sage
  "#a14f68", // berry
  "#718547", // moss
  "#59558f", // indigo
  "#9b7040", // brass
  "#47758e", // ocean
  "#a95d4e", // clay
  "#875476"  // plum
]);

// Pre-Organic Workspace defaults were generated automatically from the
// account key and were then persisted by the Options form. Treat only that
// exact generated value as a legacy default; arbitrary/custom colours stay
// untouched.
const LEGACY_DEFAULT_COLORS = Object.freeze([
  "#0f6cbd", "#5c2d91", "#107c10", "#c239b3", "#d83b01",
  "#038387", "#8e562e", "#8764b8", "#0078d4", "#ca5010"
]);

function nextDefaultColor(items = [], startIndex = 0) {
  const usage = new Map(DEFAULT_COLORS.map(color => [color, 0]));
  for (const item of Array.isArray(items) ? items : []) {
    const color = String(item?.color || "").toLowerCase();
    if (usage.has(color)) usage.set(color, usage.get(color) + 1);
  }
  const minimum = Math.min(...usage.values());
  const start = Math.max(0, Number(startIndex) || 0) % DEFAULT_COLORS.length;
  for (let offset = 0; offset < DEFAULT_COLORS.length; offset += 1) {
    const color = DEFAULT_COLORS[(start + offset) % DEFAULT_COLORS.length];
    if (usage.get(color) === minimum) return color;
  }
  return DEFAULT_COLORS[start];
}

const DEFAULT_SETTINGS = globalThis.PinSettings.defaults();

const DEFAULT_DATA = Object.freeze({
  schemaVersion: 7,
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
  savedViews: [],
  dashboard: {filter: "active", smartView: "today", savedViewId: "", search: "", view: "today", reviewMode: "daily"},
  providerMatrix: {checkedAt: 0, accounts: [], providers: [], calendars: []},
  migration: {from: 0, to: 7, completedAt: 0},
  revision: 0
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function portableSettingsSnapshot(value) {
  const settings = clone(value || DEFAULT_SETTINGS);
  // Filesystem and provider identifiers are tied to one Thunderbird profile.
  // They are selected again after restore instead of being exported.
  settings.backupDirectory = "";
  settings.preferredCalendarId = "";
  return settings;
}

function portableDataSnapshot(value) {
  const data = clone(value || DEFAULT_DATA);
  data.providerMatrix = clone(DEFAULT_DATA.providerMatrix);
  return data;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, number));
}


const UNSAFE_RECORD_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function isSafeRecordKey(value, maxLength = 4096) {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength &&
    !UNSAFE_RECORD_KEYS.has(value);
}

function hasOwn(record, key) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function boundedText(value, maxLength) {
  return String(value ?? "").slice(0, maxLength);
}

function normalizeRecord(value, {maxKeyLength = 4096} = {}) {
  const result = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [key, item] of Object.entries(value)) {
    if (isSafeRecordKey(key, maxKeyLength)) result[key] = item;
  }
  return result;
}

function assertStructuredInput(value, label = "Données", {
  maxBytes = MAX_IMPORT_BYTES,
  maxDepth = MAX_API_INPUT_DEPTH,
  maxNodes = MAX_API_INPUT_NODES
} = {}) {
  const seen = new WeakSet();
  const stack = [{value, depth: 0}];
  let nodes = 0;
  let estimatedBytes = 0;

  while (stack.length) {
    const current = stack.pop();
    const item = current.value;
    const type = typeof item;
    nodes += 1;
    if (nodes > maxNodes) throw new ExtensionError(`${label} trop complexe.`);
    if (current.depth > maxDepth) throw new ExtensionError(`${label} trop imbriquées.`);

    if (item === null || type === "boolean") continue;
    if (type === "number") {
      if (!Number.isFinite(item)) throw new ExtensionError(`${label} contient un nombre non fini.`);
      continue;
    }
    if (type === "string") {
      estimatedBytes += item.length * 2;
      if (estimatedBytes > maxBytes) throw new ExtensionError(`${label} trop volumineuses.`);
      continue;
    }
    if (type !== "object") throw new ExtensionError(`${label} contient un type non autorisé.`);
    if (seen.has(item)) throw new ExtensionError(`${label} contient une référence cyclique.`);
    seen.add(item);

    const isArray = Array.isArray(item);
    if (!isArray && Object.prototype.toString.call(item) !== "[object Object]") {
      throw new ExtensionError(`${label} contient un objet non autorisé.`);
    }
    const entries = isArray ? item.entries() : Object.entries(item);
    for (const [rawKey, child] of entries) {
      const key = String(rawKey);
      if (!isArray && !isSafeRecordKey(key, 4096)) {
        throw new ExtensionError(`${label} contient une clé interdite.`);
      }
      estimatedBytes += key.length * 2;
      if (estimatedBytes > maxBytes) throw new ExtensionError(`${label} trop volumineuses.`);
      stack.push({value: child, depth: current.depth + 1});
    }
  }
  return value;
}

function normalizeStableKeyList(value, {maxItems = MAX_BULK_KEYS} = {}) {
  if (!Array.isArray(value)) throw new ExtensionError("La sélection de messages est invalide.");
  if (value.length > maxItems) throw new ExtensionError(`La sélection dépasse ${maxItems} messages.`);
  return uniqueStrings(value.map(item => boundedText(item, 8192).trim()).filter(Boolean)).slice(0, maxItems);
}

function uniqueStrings(values, predicate = () => true) {
  const result = [];
  const seen = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    const text = String(value);
    if (!seen.has(text) && predicate(text)) {
      seen.add(text);
      result.push(text);
    }
  }
  return result;
}

function uniqueById(values, limit) {
  const result = [];
  const seen = new Set();
  for (const item of values) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

function uniqueEntityId(prefix, values) {
  const existing = new Set((values || []).map(item => String(item?.id || "")));
  let candidate;
  do {
    candidate = `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  } while (existing.has(candidate));
  return candidate;
}

function normalizeSettings(value) {
  if (!PIN_MODULES.PinSettings) {
    throw new Error("Le module de recommandations MailPin n'est pas chargé.");
  }
  return PIN_MODULES.PinSettings.normalize(value);
}

function hardenImportedConfiguration(settingsValue, dataValue, currentBackupDirectory = "") {
  const settings = normalizeSettings(settingsValue);
  const data = normalizeData(dataValue);

  // Environment-bound and automatically executable values are never trusted
  // from an imported JSON file. The user must explicitly re-enable them after
  // reviewing the restored configuration.
  settings.backupDirectory = String(currentBackupDirectory || "").slice(0, 2048);
  settings.enableAutomaticRules = false;
  settings.enableAutomaticNoReplyTracking = false;
  settings.enableWaitingWorkflow = false;
  settings.moveToWaitingOnReply = false;
  settings.reopenOnConversationReply = false;
  settings.enableRecurringFollowUps = false;
  settings.autoRemoveCompleted = false;
  settings.completedRetentionDays = 0;
  settings.autoUnpinOnArchive = false;
  settings.autoCompleteOnArchive = false;
  settings.autoUnpinOnDelete = false;
  settings.autoUnpinOnRead = false;
  settings.autoUnpinOnReply = false;
  settings.keepPinOnMove = true;
  settings.enableBidirectionalCalendarSync = false;
  settings.enableThunderbirdTagSync = false;
  settings.calendarDeleteOnUnpin = false;
  settings.calendarCompleteOnPinComplete = false;
  settings.autoCleanup = false;
  settings.enableAutomaticBackups = false;
  settings.confirmDelete = true;
  settings.confirmBulkDestructiveActions = true;
  settings.preferredCalendarId = "";
  settings.autoPinSenders = [];
  settings.autoPinTags = [];
  settings.safeMode = true;
  data.rules = (data.rules || []).map(rule => ({...rule, enabled: false, errorCount: 0, lastError: ""}));
  data.providerMatrix = clone(DEFAULT_DATA.providerMatrix);
  for (const ref of Object.values(data.refs || {})) {
    ref.calendarId = "";
    ref.calendarItemId = "";
    ref.calendarSyncError = "";
    ref.calendarLastSyncAt = 0;
    ref.noReplyTracking = false;
    ref.noReplyAt = 0;
    ref.noReplyStartedAt = 0;
    ref.noReplyBaselineMessageId = "";
  }
  for (const item of data.cases || []) {
    item.calendarId = "";
    item.calendarItemId = "";
  }
  return {settings, data};
}

function normalizeProviderMatrix(matrix) {
  const source = matrix && typeof matrix === "object" ? matrix : DEFAULT_DATA.providerMatrix;
  return {
    checkedAt: Math.max(0, Number(source.checkedAt) || 0),
    providers: uniqueStrings(source.providers || [], value => value.length <= 40).slice(0, 20),
    accounts: (Array.isArray(source.accounts) ? source.accounts : []).slice(0, 100).map(account => ({
      accountKey: boundedText(account?.accountKey, 256),
      accountName: boundedText(account?.accountName, 320),
      provider: boundedText(account?.provider, 40),
      protocol: boundedText(account?.protocol, 40),
      secure: Boolean(account?.secure),
      offlineSupport: Boolean(account?.offlineSupport),
      inboxCount: clampNumber(account?.inboxCount, 0, 10000, 0),
      supportsFolders: Boolean(account?.supportsFolders),
      knownRisks: uniqueStrings(account?.knownRisks || [], value => value.length <= 120).slice(0, 20)
    })),
    calendars: (Array.isArray(source.calendars) ? source.calendars : []).slice(0, 200).map(calendar => ({
      id: boundedText(calendar?.id, 512),
      name: boundedText(calendar?.name, 320),
      type: boundedText(calendar?.type, 40),
      writable: Boolean(calendar?.writable),
      taskCompatible: Boolean(calendar?.taskCompatible),
      eventCompatible: Boolean(calendar?.eventCompatible),
      reason: boundedText(calendar?.reason, 500)
    }))
  };
}

function anonymizeProviderMatrix(matrix) {
  const source = matrix && typeof matrix === "object" ? matrix : DEFAULT_DATA.providerMatrix;
  return {
    checkedAt: Math.max(0, Number(source.checkedAt) || 0),
    providers: uniqueStrings(source.providers || [], value => value.length <= 40).slice(0, 20),
    accounts: (Array.isArray(source.accounts) ? source.accounts : []).slice(0, 100).map((account, index) => ({
      account: `account-${index + 1}`,
      provider: boundedText(account?.provider, 40),
      protocol: boundedText(account?.protocol, 40),
      secure: Boolean(account?.secure),
      offlineSupport: Boolean(account?.offlineSupport),
      inboxCount: clampNumber(account?.inboxCount, 0, 10000, 0),
      supportsFolders: Boolean(account?.supportsFolders),
      knownRisks: uniqueStrings(account?.knownRisks || [], value => value.length <= 120).slice(0, 20)
    })),
    calendars: (Array.isArray(source.calendars) ? source.calendars : []).slice(0, 200).map((calendar, index) => ({
      calendar: `calendar-${index + 1}`,
      type: boundedText(calendar?.type, 40),
      writable: Boolean(calendar?.writable),
      taskCompatible: Boolean(calendar?.taskCompatible),
      eventCompatible: Boolean(calendar?.eventCompatible),
      reason: PIN_MODULES.PinDiagnostics?.redact(calendar?.reason || "", 180) || ""
    }))
  };
}

function normalizeGroup(value, fallbackIndex = 0) {
  if (!value || typeof value !== "object") {
    return null;
  }
  let id = String(value.id || `group-${fallbackIndex + 1}`).trim().toLowerCase();
  id = id.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  if (!GROUP_ID_RE.test(id) || !isSafeRecordKey(id, 48)) {
    return null;
  }
  const name = String(value.name || "Groupe").trim().slice(0, 80) || "Groupe";
  const color = COLOR_RE.test(String(value.color || "")) ? String(value.color).toLowerCase() : DEFAULT_COLORS[fallbackIndex % DEFAULT_COLORS.length];
  return {id, name, color, updatedAt: Math.max(0, Number(value.updatedAt) || Date.now())};
}

function normalizeCase(value, fallbackIndex = 0) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || `case-${fallbackIndex + 1}`).replace(/[^a-z0-9_-]/gi, "-").slice(0, 64);
  if (!id || !isSafeRecordKey(id, 64)) return null;
  return {
    id,
    name: boundedText(value.name || `Affaire ${fallbackIndex + 1}`, 120),
    color: COLOR_RE.test(String(value.color || "")) ? String(value.color).toLowerCase() : DEFAULT_COLORS[fallbackIndex % DEFAULT_COLORS.length],
    note: boundedText(value.note, 4000),
    dueAt: Math.max(0, Number(value.dueAt) || 0),
    status: ["active", "waiting", "planned", "completed"].includes(value.status) ? value.status : "active",
    createdAt: Math.max(0, Number(value.createdAt) || Date.now()),
    updatedAt: Math.max(0, Number(value.updatedAt) || Date.now()),
    calendarId: boundedText(value.calendarId, 512),
    calendarItemId: boundedText(value.calendarItemId, 1024),
    calendarItemType: value.calendarItemType === "event" ? "event" : "task"
  };
}

function normalizeTemplate(value, fallbackIndex = 0) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || `template-${fallbackIndex + 1}`).replace(/[^a-z0-9_-]/gi, "-").slice(0, 64);
  if (!id || !isSafeRecordKey(id, 64)) return null;
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
  const id = boundedText(value.id || `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, 100);
  if (!isSafeRecordKey(id, 100)) return null;
  return {
    id,
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
    noReplyTracking: Boolean(value.noReplyTracking),
    noReplyAt: Math.max(0, Number(value.noReplyAt) || 0),
    noReplyStartedAt: Math.max(0, Number(value.noReplyStartedAt) || 0),
    noReplyBaselineMessageId: boundedText(value.noReplyBaselineMessageId, 2048),
    calendarSyncError: boundedText(value.calendarSyncError, 500),
    action: String(value.action || "completed").slice(0, 80)
  };
}

function normalizeRuleLog(value, fallbackIndex = 0) {
  if (!value || typeof value !== "object") return null;
  const fallbackId = `rule-log-${fallbackIndex + 1}`;
  const id = boundedText(value.id || fallbackId, 100);
  if (!isSafeRecordKey(id, 100)) return null;
  return {
    id,
    time: Math.max(0, Number(value.time) || Date.now()),
    ruleId: boundedText(value.ruleId, 64),
    ruleName: boundedText(value.ruleName, 100),
    trigger: boundedText(value.trigger, 40),
    result: boundedText(value.result, 40),
    details: boundedText(value.details, 1000),
    stableKey: boundedText(value.stableKey, 4096),
    subject: boundedText(value.subject, 300)
  };
}

function normalizeReference(key, value) {
  if (!value || typeof value !== "object") return null;
  const stableKey = boundedText(value.stableKey || key, 4096);
  if (!isSafeRecordKey(stableKey, 4096)) return null;
  const groupId = String(value.groupId || "");
  return {
    stableKey,
    headerMessageId: boundedText(value.headerMessageId, 2048),
    accountKey: boundedText(value.accountKey || "unknown", 256),
    sourceInboxURI: boundedText(value.sourceInboxURI, 4096),
    lastFolderURI: boundedText(value.lastFolderURI, 4096),
    lastMessageKey: Number.isInteger(value.lastMessageKey) ? value.lastMessageKey : Number(value.lastMessageKey) || 0,
    pinnedAt: Number(value.pinnedAt) || Date.now(),
    lastSeen: Number(value.lastSeen) || Date.now(),
    missingSince: Number(value.missingSince) || 0,
    subject: boundedText(value.subject, 1000),
    author: boundedText(value.author, 1000),
    date: Number(value.date) || 0,
    accountName: boundedText(value.accountName, 500),
    folderName: boundedText(value.folderName, 500),
    note: String(value.note || "").slice(0, MAX_NOTE_LENGTH),
    checklist: PIN_MODULES.PinChecklists?.normalize(value.checklist) || [],
    dueAt: Math.max(0, Number(value.dueAt) || 0),
    reminderAt: Math.max(0, Number(value.reminderAt) || 0),
    reminderFiredAt: Math.max(0, Number(value.reminderFiredAt) || 0),
    reminderAcknowledgedAt: Math.max(0, Number(value.reminderAcknowledgedAt) || 0),
    priorityLevel: ["normal", "high", "urgent"].includes(value.priorityLevel) ? value.priorityLevel : "normal",
    groupId: GROUP_ID_RE.test(groupId) ? groupId : "",
    trackingMode: value.trackingMode === "conversation" ? "conversation" : "message",
    conversationKey: boundedText(value.conversationKey, 4096),
    identityFingerprint: boundedText(value.identityFingerprint, 4096),
    completedAt: Math.max(0, Number(value.completedAt) || 0),
    snoozeUntil: Math.max(0, Number(value.snoozeUntil) || 0),
    repeatRule: ["", "daily", "weekdays", "weekly", "monthly"].includes(value.repeatRule) ? value.repeatRule : "",
    reminderLeadMinutes: clampNumber(value.reminderLeadMinutes, 0, 10080, 0),
    calendarId: boundedText(value.calendarId, 512),
    calendarItemId: boundedText(value.calendarItemId, 1024),
    calendarItemType: value.calendarItemType === "event" ? "event" : "task",
    conversationCount: Math.max(0, Number(value.conversationCount) || 0),
    conversationUnread: Math.max(0, Number(value.conversationUnread) || 0),
    nativeStarImported: Boolean(value.nativeStarImported),
    rootMessageId: boundedText(value.rootMessageId, 2048),
    gmThreadId: boundedText(value.gmThreadId, 256),
    threadId: Math.max(0, Number(value.threadId) || 0),
    workflowStatus: ["active", "waiting", "planned", "completed"].includes(value.workflowStatus) ? value.workflowStatus : (value.completedAt ? "completed" : "active"),
    waitingSince: Math.max(0, Number(value.waitingSince) || 0),
    followUpAt: Math.max(0, Number(value.followUpAt) || 0),
    lastReplyAt: Math.max(0, Number(value.lastReplyAt) || 0),
    lastOutgoingAt: Math.max(0, Number(value.lastOutgoingAt) || 0),
    followUpCount: Math.max(0, Number(value.followUpCount) || 0),
    noReplyTracking: Boolean(value.noReplyTracking),
    noReplyAt: Math.max(0, Number(value.noReplyAt) || 0),
    noReplyStartedAt: Math.max(0, Number(value.noReplyStartedAt) || 0),
    noReplyBaselineMessageId: boundedText(value.noReplyBaselineMessageId, 2048),
    calendarSyncError: boundedText(value.calendarSyncError, 500),
    tagSyncError: boundedText(value.tagSyncError, 500),
    tagLastSyncedAt: Math.max(0, Number(value.tagLastSyncedAt) || 0),
    caseId: String(value.caseId || "").slice(0, 64),
    templateId: String(value.templateId || "").slice(0, 64),
    recurrenceRule: ["", "daily", "weekdays", "weekly", "monthly", "quarterly", "yearly"].includes(value.recurrenceRule) ? value.recurrenceRule : "",
    recurrenceInterval: clampNumber(value.recurrenceInterval, 1, 100, 1),
    calendarLastSyncedAt: Math.max(0, Number(value.calendarLastSyncedAt) || 0),
    calendarSyncHash: boundedText(value.calendarSyncHash, 256),
    createdFromRuleId: String(value.createdFromRuleId || "").slice(0, 64),
    updatedAt: Math.max(0, Number(value.updatedAt) || Date.now())
  };
}

function normalizeData(value) {
  const source = value && typeof value === "object" ? value : {};
  const data = clone(DEFAULT_DATA);
  for (const [key, ref] of Object.entries(normalizeRecord(source.refs))) {
    const normalized = normalizeReference(key, ref);
    if (normalized && !hasOwn(data.refs, normalized.stableKey)) {
      data.refs[normalized.stableKey] = normalized;
    }
  }
  data.manualOrder = uniqueStrings(source.manualOrder, key => hasOwn(data.refs, key));
  for (const key of Object.keys(data.refs)) {
    if (!data.manualOrder.includes(key)) data.manualOrder.push(key);
  }

  const normalizedGroups = (Array.isArray(source.groups) ? source.groups : [])
    .map((item, index) => normalizeGroup(item, index)).filter(Boolean);
  data.groups = uniqueById(normalizedGroups, MAX_GROUPS);
  const groupIds = new Set(data.groups.map(group => group.id));
  data.groupOrder = uniqueStrings(source.groupOrder, id => groupIds.has(id));
  for (const group of data.groups) {
    if (!data.groupOrder.includes(group.id)) data.groupOrder.push(group.id);
  }

  data.collapsedByInbox = normalizeRecord(source.collapsedByInbox, {maxKeyLength: 4096});
  data.panelVisibleByInbox = normalizeRecord(source.panelVisibleByInbox, {maxKeyLength: 4096});

  const normalizedRules = (Array.isArray(source.rules) ? source.rules : [])
    .map((item, index) => normalizeRule(item, index)).filter(Boolean);
  data.rules = uniqueById(normalizedRules, MAX_RULES);
  const normalizedCases = (Array.isArray(source.cases) ? source.cases : [])
    .map((item, index) => normalizeCase(item, index)).filter(Boolean);
  data.cases = uniqueById(normalizedCases, MAX_CASES);
  const caseIds = new Set(data.cases.map(item => item.id));
  data.caseOrder = uniqueStrings(source.caseOrder, id => caseIds.has(id));
  for (const item of data.cases) {
    if (!data.caseOrder.includes(item.id)) data.caseOrder.push(item.id);
  }

  const normalizedTemplates = (Array.isArray(source.templates) ? source.templates : [])
    .map((item, index) => normalizeTemplate(item, index)).filter(Boolean);
  data.templates = uniqueById(normalizedTemplates, MAX_TEMPLATES);
  const templateIds = new Set(data.templates.map(item => item.id));

  for (const ref of Object.values(data.refs)) {
    if (ref.groupId && !groupIds.has(ref.groupId)) ref.groupId = "";
    if (ref.caseId && !caseIds.has(ref.caseId)) ref.caseId = "";
    if (ref.templateId && !templateIds.has(ref.templateId)) ref.templateId = "";
  }

  data.savedViews = PIN_MODULES.PinSavedViews?.normalizeList(source.savedViews) || [];

  const normalizedHistory = (Array.isArray(source.history) ? source.history : [])
    .map(normalizeHistory).filter(Boolean);
  data.history = uniqueById(normalizedHistory.slice(-MAX_HISTORY), MAX_HISTORY);
  const normalizedRuleLog = (Array.isArray(source.ruleLog) ? source.ruleLog : [])
    .map((item, index) => normalizeRuleLog(item, index)).filter(Boolean);
  data.ruleLog = uniqueById(normalizedRuleLog.slice(-MAX_RULE_LOG), MAX_RULE_LOG);
  data.activity = (Array.isArray(source.activity) ? source.activity : [])
    .map(normalizeActivity).filter(Boolean).slice(-MAX_ACTIVITY);
  data.dashboard = {
    filter: ["active", "all", "overdue", "today", "week", "completed", "unread", "waiting", "waitingForThem", "needsReply", "checklistPending", "planned", "noReply", "snoozed", "noDue", "missing", "calendarError", "recentCompleted"].includes(source.dashboard?.filter)
      ? source.dashboard.filter : "active",
    smartView: ["all", "today", "overdue", "week", "waiting", "waitingForThem", "needsReply", "checklistPending", "planned", "noReply", "snoozed", "noDue", "unread", "missing", "calendarError", "recentCompleted"].includes(source.dashboard?.smartView)
      ? source.dashboard.smartView : "today",
    reviewMode: source.dashboard?.reviewMode === "weekly" ? "weekly" : "daily",
    savedViewId: data.savedViews.some(item => item.id === source.dashboard?.savedViewId) ? String(source.dashboard.savedViewId) : "",
    search: boundedText(source.dashboard?.search, 500),
    view: ["today", "list", "kanban", "cases", "review", "history", "health"].includes(source.dashboard?.view) ? source.dashboard.view : "today"
  };
  data.providerMatrix = normalizeProviderMatrix(source.providerMatrix);
  data.migration = {
    from: Number(source.migration?.from) || Number(source.schemaVersion) || 1,
    to: 7,
    completedAt: Number(source.migration?.completedAt) || 0
  };
  data.revision = Math.max(0, Number(source.revision) || 0);
  data.schemaVersion = 7;
  return data;
}

function normalizeRule(value, index = 0) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || `rule-${index + 1}`).replace(/[^a-z0-9_-]/gi, "-").slice(0, 64) || `rule-${index + 1}`;
  if (!isSafeRecordKey(id, 64)) return null;
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


export { DEFAULT_DATA, DEFAULT_SETTINGS, DEFAULT_COLORS, PIN_MODULES, clone, normalizeSettings, normalizeData, normalizeReference, normalizeRule, normalizeGroup, normalizeCase, normalizeTemplate, assertStructuredInput, normalizeStableKeyList, boundedText, clampNumber, uniqueEntityId, nextDefaultColor, portableSettingsSnapshot, portableDataSnapshot, hardenImportedConfiguration };
