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
var { Management } = ChromeUtils.importESModule(
  "resource://gre/modules/Extension.sys.mjs"
);
var { ExtensionUtils } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionUtils.sys.mjs"
);
var { ExtensionError } = ExtensionUtils;

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AddonManager: "resource://gre/modules/AddonManager.sys.mjs",
  ExtensionStorage: "resource://gre/modules/ExtensionStorage.sys.mjs",
  Sqlite: "resource://gre/modules/Sqlite.sys.mjs",
  cal: "resource:///modules/calendar/calUtils.sys.mjs",
  CalEvent: "resource:///modules/CalEvent.sys.mjs",
  CalTodo: "resource:///modules/CalTodo.sys.mjs"
});

const PIN_MODULES = {};
let THUNDERBIRD_COMPAT = null;
const MODULE_PATHS = [
  "settings.js", "identity.js", "storage.js", "workflow.js", "rules.js", "calendar.js",
  "smart.js", "bulk.js", "diagnostics.js", "providers.js", "health.js",
  "migrations.js", "performance.js", "localization.js", "review.js", "related.js",
  "checklists.js", "analytics.js", "saved-views.js", "tag-sync.js",
  "thunderbird-messages.js", "thunderbird-tags.js", "thunderbird-calendar.js", "compatibility.js"
];

const STYLE_SHEET_SERVICE = "@mozilla.org/content/style-sheet-service;1";
const PREF_SETTINGS = "extensions.pinMails.settings";
const PREF_DATA = "extensions.pinMails.data"; // legacy migration source only
const PREF_STRUCTURED_MIGRATED = "extensions.pinMails.structuredMigrated";
const PREF_STORAGE_FALLBACK = "extensions.pinMails.storageFallback";
const PREF_LAST_BACKUP_AT = "extensions.pinMails.lastBackupAt";
const PREF_LAST_BACKUP_PATH = "extensions.pinMails.lastBackupPath";
const PREF_BRANCH = "extensions.pinMails.";
const INSTALL_SENTINEL_KEY = "mailperch.installation";
const INSTALL_SENTINEL_VALUE = "mailperch-installation-v1";
const MAILPERCH_BACKUP_FILE_RE = /^pin-mails-.*\.json(?:\.tmp)?$/i;
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
const MAX_DIAGNOSTIC_EVENTS = 500;
const DATA_CHANGED_TOPIC = "pin-mails-data-changed";
const DEFAULT_BACKUP_FOLDER = "pin-mails-backups";
const RECOVERY_FILENAME = "pin-mails-recovery.json";
const MAX_RECOVERY_PREF_BYTES = 256 * 1024;
const RULE_LOOP_GUARD_MS = 5000;
const CALENDAR_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const BACKUP_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const INBOX_ATTRIBUTE = "pin-mails-inbox";
const BUTTON_CLASS = "pin-mails-row-button";
const INDEPENDENT_BUTTON_CLASS = "pin-mails-independent-button";
const CARD_ACTION_RAIL_CLASS = "pin-mails-card-action-rail";
const PANEL_TOGGLE_ID = "pin-mails-qfb-toggle";
const EDITOR_ID = "pin-mails-editor";
const TOAST_ID = "pin-mails-toast";
const PANEL_ID = "pin-mails-panel";
const ALL_HEADER_ID = "pin-mails-all-header";
const CONTEXT_MENU_ID = "pin-mails-card-context-menu";
const REFRESH_DELAY_MS = 160;
const READY_RETRIES = 50;
const READY_RETRY_DELAY_MS = 100;
const DAY_MS = 86_400_000;
const COLOR_RE = /^#[0-9a-f]{6}$/i;
const GROUP_ID_RE = /^[a-z0-9_-]{1,48}$/i;
const MAX_NOTE_LENGTH = 4000;
const MAX_GROUPS = 40;
const MAX_UNDO = 20;
const RESOLVE_CACHE_MS = 30_000;
const CONVERSATION_CACHE_MS = 45_000;
const COMPATIBILITY_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const MAX_API_INPUT_NODES = 100_000;
const MAX_API_INPUT_DEPTH = 24;
const MAX_BULK_KEYS = 500;
const SQLITE_LIST_TABLE_COLUMNS = Object.freeze({
  groups_data: "group_id",
  rules: "rule_id",
  cases_data: "case_id",
  templates: "template_id"
});
const SQLITE_REF_COLUMN_DEFINITIONS = Object.freeze([
  "account_key TEXT NOT NULL DEFAULT ''",
  "due_at INTEGER NOT NULL DEFAULT 0",
  "completed_at INTEGER NOT NULL DEFAULT 0",
  "group_id TEXT NOT NULL DEFAULT ''",
  "case_id TEXT NOT NULL DEFAULT ''",
  "conversation_key TEXT NOT NULL DEFAULT ''",
  "workflow_status TEXT NOT NULL DEFAULT 'active'",
  "follow_up_at INTEGER NOT NULL DEFAULT 0"
]);

let MAILPERCH_UNINSTALLING = false;
const ACTIVE_PIN_INBOX_INSTANCES = new Set();
const MAILPERCH_LIFECYCLE_HANDLERS = new Map();

function safeErrorName(error) {
  return String(error?.name || "Error").replace(/[^a-z0-9_.-]/gi, "").slice(0, 64) || "Error";
}

async function removePathIfPresent(path, options = {}) {
  if (!path) return;
  try {
    if (await IOUtils.exists(path)) await IOUtils.remove(path, options);
  } catch (error) {
    console.warn("MailPerch : suppression locale incomplète", safeErrorName(error));
  }
}

async function isVerifiedMailPerchBackup(path) {
  try {
    const info = await IOUtils.stat(path);
    if (!info || info.type !== "regular" || info.size > MAX_IMPORT_BYTES * 4) return false;
    const envelope = JSON.parse(await IOUtils.readUTF8(path));
    // External directories can contain unrelated files. Only delete a backup
    // whose signed envelope can be verified by the same code that imports it.
    return Boolean(
      envelope?.checksum &&
      PIN_MODULES.PinStorageHelpers?.verifyBackupEnvelope?.(envelope)
    );
  } catch {
    return false;
  }
}

async function removeMailPerchBackupFiles(directory, {removeDirectory = false} = {}) {
  if (!directory) return;
  try {
    if (!(await IOUtils.exists(directory))) return;
    if (removeDirectory) {
      await IOUtils.remove(directory, {recursive: true});
      return;
    }
    for (const child of await IOUtils.getChildren(directory)) {
      if (MAILPERCH_BACKUP_FILE_RE.test(PathUtils.filename(child)) &&
          await isVerifiedMailPerchBackup(child)) {
        await removePathIfPresent(child);
      }
    }
  } catch (error) {
    console.warn("MailPerch : nettoyage des sauvegardes incomplet", safeErrorName(error));
  }
}

async function hasMailPerchProfileData() {
  try {
    if (Services.prefs.getBranch(PREF_BRANCH).getChildList("").length) return true;
  } catch {}
  for (const filename of [DB_FILENAME, `${DB_FILENAME}-wal`, RECOVERY_FILENAME]) {
    try {
      if (await IOUtils.exists(PathUtils.join(PathUtils.profileDir, filename))) return true;
    } catch {}
  }
  return false;
}

async function shouldPreservePreSentinelData(extensionId) {
  if (!(await hasMailPerchProfileData())) return false;
  try {
    const addon = await lazy.AddonManager.getAddonByID(extensionId);
    const installedAt = Number(addon?.installDate?.getTime?.()) || 0;
    const updatedAt = Number(addon?.updateDate?.getTime?.()) || 0;
    // The sentinel is new in 3.2.4. Preserve data once when this build is
    // reached through a real update. A reinstall has a fresh install date and
    // therefore falls through to the purge path below.
    return Boolean(installedAt && updatedAt > installedAt + 1000);
  } catch {
    // Never destroy an existing profile merely because AddonManager metadata
    // is temporarily unavailable. The active uninstall hook still performs
    // the normal purge; this conservative fallback only affects migration.
    return true;
  }
}

async function ensureMailPerchInstallationState(extensionId) {
  const id = String(extensionId || "");
  if (!id) return {fresh: false, storageAvailable: false};
  try {
    const jsonFile = await lazy.ExtensionStorage.getFile(id);
    const marker = jsonFile?.data?.get(INSTALL_SENTINEL_KEY);
    if (marker === INSTALL_SENTINEL_VALUE) {
      return {fresh: false, storageAvailable: true};
    }
    const preserveExisting = await shouldPreservePreSentinelData(id);
    if (!preserveExisting) await purgeMailPerchProfileData();
    await lazy.ExtensionStorage.set(id, {[INSTALL_SENTINEL_KEY]: INSTALL_SENTINEL_VALUE});
    return {fresh: !preserveExisting, storageAvailable: true};
  } catch (error) {
    console.warn("MailPerch : état d’installation impossible à vérifier", safeErrorName(error));
    return {fresh: false, storageAvailable: false};
  }
}

async function purgeMailPerchProfileData() {
  const stored = parseStored(PREF_SETTINGS, {});
  const customBackupDirectory = typeof stored?.backupDirectory === "string" ? stored.backupDirectory : "";
  const internalBackupDirectory = PathUtils.join(PathUtils.profileDir, DEFAULT_BACKUP_FOLDER);
  const profileFiles = [
    DB_FILENAME,
    `${DB_FILENAME}-wal`,
    `${DB_FILENAME}-shm`,
    `${DB_FILENAME}-journal`,
    RECOVERY_FILENAME,
    `${RECOVERY_FILENAME}.tmp`
  ];
  for (const filename of profileFiles) {
    await removePathIfPresent(PathUtils.join(PathUtils.profileDir, filename));
  }
  await removeMailPerchBackupFiles(internalBackupDirectory, {removeDirectory: true});
  if (customBackupDirectory && customBackupDirectory !== internalBackupDirectory) {
    // A user-selected directory may contain unrelated files. Remove only the
    // files created by MailPerch and never delete the directory itself.
    await removeMailPerchBackupFiles(customBackupDirectory);
  }
  try { Services.prefs.getBranch(PREF_BRANCH).deleteBranch(""); } catch {}
  Services.obs.notifyObservers(null, "startupcache-invalidate");
}


function registerMailPerchLifecycle(extensionId) {
  const id = String(extensionId || "");
  if (!id || MAILPERCH_LIFECYCLE_HANDLERS.has(id)) return;

  const handlers = {
    uninstallPending: false,
    preparationPromise: null,
    beginPreparation() {
      MAILPERCH_UNINSTALLING = true;
      this.preparationPromise ??= Promise.allSettled(
        [...ACTIVE_PIN_INBOX_INSTANCES].map(instance => instance._prepareForUninstall())
      );
      return this.preparationPromise;
    },
    unregister() {
      try { lazy.AddonManager.removeAddonListener(this.addonListener); } catch {}
      try { Management.off("uninstall", this.onUninstall); } catch {}
      try { Management.off("update", this.onUpdate); } catch {}
      MAILPERCH_LIFECYCLE_HANDLERS.delete(id);
    },
    async onUninstall(_eventName, details = {}) {
      if (details?.id !== id) return;
      try {
        await this.beginPreparation();
        ACTIVE_PIN_INBOX_INSTANCES.clear();
        await purgeMailPerchProfileData();
      } finally {
        this.unregister();
      }
    },
    onUpdate(_eventName, details = {}) {
      if (details?.id === id) this.unregister();
    },
    addonListener: {
      onUninstalling(addon) {
        if (addon?.id !== id) return;
        handlers.uninstallPending = true;
        MAILPERCH_UNINSTALLING = true;
      },
      onOperationCancelled(addon) {
        if (addon?.id !== id || !handlers.uninstallPending) return;
        handlers.uninstallPending = false;
        MAILPERCH_UNINSTALLING = false;
      }
    }
  };

  for (const name of ["beginPreparation", "unregister", "onUninstall", "onUpdate"]) {
    handlers[name] = handlers[name].bind(handlers);
  }
  MAILPERCH_LIFECYCLE_HANDLERS.set(id, handlers);
  lazy.AddonManager.addAddonListener(handlers.addonListener);
  Management.on("uninstall", handlers.onUninstall);
  Management.on("update", handlers.onUpdate);
}

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

let DEFAULT_SETTINGS = null;

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

function parseStored(prefName, fallback) {
  try {
    const raw = Services.prefs.getStringPref(prefName, "");
    if (!raw) return clone(fallback);
    if (raw.length > MAX_IMPORT_BYTES) throw new Error("Préférence trop volumineuse");
    const parsed = JSON.parse(raw);
    assertStructuredInput(parsed, `Préférence ${prefName}`, {maxBytes: MAX_IMPORT_BYTES});
    return parsed;
  } catch (error) {
    console.warn(`Épingles : préférence invalide ${prefName}`, safeErrorName(error));
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
    throw new Error("Le module de recommandations MailPerch n'est pas chargé.");
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
  settings.autoUnpinOnArchive = false;
  settings.autoCompleteOnArchive = false;
  settings.autoUnpinOnRead = false;
  settings.autoUnpinOnReply = false;
  settings.enableBidirectionalCalendarSync = false;
  settings.enableThunderbirdTagSync = false;
  settings.calendarDeleteOnUnpin = false;
  settings.calendarCompleteOnPinComplete = false;
  settings.autoCleanup = false;
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
  const color = COLOR_RE.test(String(value.color || "")) ? String(value.color).toLowerCase() : "#6264a7";
  return {id, name, color, updatedAt: Math.max(0, Number(value.updatedAt) || Date.now())};
}

function normalizeCase(value, fallbackIndex = 0) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || `case-${fallbackIndex + 1}`).replace(/[^a-z0-9_-]/gi, "-").slice(0, 64);
  if (!id || !isSafeRecordKey(id, 64)) return null;
  return {
    id,
    name: boundedText(value.name || `Affaire ${fallbackIndex + 1}`, 120),
    color: COLOR_RE.test(String(value.color || "")) ? String(value.color).toLowerCase() : "#0f6cbd",
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
  return THUNDERBIRD_COMPAT?.messages?.folderChildren?.(folder) || [];
}

function walkFolders(root) {
  return THUNDERBIRD_COMPAT?.messages?.walkFolders?.(root) || [];
}

function getAccountForFolder(folder) {
  return THUNDERBIRD_COMPAT?.messages?.accountForFolder?.(folder) || null;
}

function accountKeyForFolder(folder) {
  return THUNDERBIRD_COMPAT?.messages?.accountKeyForFolder?.(folder) || "unknown";
}

function accountNameForFolder(folder) {
  return THUNDERBIRD_COMPAT?.messages?.accountNameForFolder?.(folder) || folder?.server?.prettyName || "Compte inconnu";
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
  return THUNDERBIRD_COMPAT?.tags?.metadataForHeader?.(hdr, 3) || [];
}

function hasAttachment(hdr) {
  return Boolean(hdr?.flags & Ci.nsMsgMessageFlags.Attachment);
}

function isHighPriority(hdr) {
  try {
    return Number(hdr.priority) >= Number(Ci.nsMsgPriority.high);
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
  return THUNDERBIRD_COMPAT?.messages?.findHeaderInFolder?.(folder, ref, messageIdentityFingerprint) || null;
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

function isStrongConversationKey(value) {
  return PIN_MODULES.PinIdentity?.strongConversationKey(value) ??
    /\|conv:(?:gm|root|thread):/i.test(String(value || ""));
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
    if (table !== "refs" || !/^[a-z_][a-z0-9_]*$/i.test(column)) {
      throw new Error("Identifiant SQLite non autorisé");
    }
    try {
      const rows = await this.connection.execute("PRAGMA table_info(refs)");
      return rows.some(row => row.getResultByName("name") === column);
    } catch {
      return false;
    }
  }

  async _addColumn(table, definition) {
    if (table !== "refs" || !SQLITE_REF_COLUMN_DEFINITIONS.includes(definition)) {
      throw new Error("Migration SQLite non autorisée");
    }
    const column = definition.trim().split(/\s+/)[0];
    if (!(await this._columnExists(table, column))) {
      await this.connection.execute(`ALTER TABLE refs ADD COLUMN ${definition}`);
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
    for (const definition of SQLITE_REF_COLUMN_DEFINITIONS) {
      await this._addColumn("refs", definition);
    }
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
        else if (key === "providerMatrix") data.providerMatrix = value;
        else if (key === "caseOrder") data.caseOrder = Array.isArray(value) ? value.map(String) : [];
        else if (key === "savedViews") data.savedViews = PIN_MODULES.PinSavedViews?.normalizeList(value) || [];
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
      this.writeChain = this.writeChain.catch(() => {}).then(async () => {
        await this.writeEmergencyRecovery(snapshot.data, snapshot.undo, `storage-unavailable-${reason}`);
      });
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
    if (SQLITE_LIST_TABLE_COLUMNS[table] !== idColumn) {
      throw new Error("Table SQLite non autorisée");
    }
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
                this.owner._recordDiagnostic?.("warning",`Suppression concurrente évitée : ${hashString(String(key)).toString(16)}`);
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
                this.owner._recordDiagnostic?.("warning",`Modification concurrente conservée : ${hashString(String(key)).toString(16)}`);
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

      const states = {manualOrder:data.manualOrder||[],collapsedByInbox:data.collapsedByInbox||{},panelVisibleByInbox:data.panelVisibleByInbox||{},migration:data.migration||{},dashboard:data.dashboard||{},providerMatrix:data.providerMatrix||{},caseOrder:data.caseOrder||[],savedViews:data.savedViews||[]};
      const oldStates = {manualOrder:previous.manualOrder||[],collapsedByInbox:previous.collapsedByInbox||{},panelVisibleByInbox:previous.panelVisibleByInbox||{},migration:previous.migration||{},dashboard:previous.dashboard||{},providerMatrix:previous.providerMatrix||{},caseOrder:previous.caseOrder||[],savedViews:previous.savedViews||[]};
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
    const backupData=portableDataSnapshot(data);
    if (!this.owner._settings?.backupIncludeHistory) {
      backupData.history=[];
      backupData.ruleLog=[];
      backupData.activity=[];
    }
    const metadata={reason,revision:this.revision,extensionVersion:this.owner?._extensionVersion||"0.0.0",schemaVersion:DB_SCHEMA_VERSION,settings:portableSettingsSnapshot(this.owner._settings||DEFAULT_SETTINGS)};
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
    this._extension = context.extension;
    this._states ??= new Set();
    ACTIVE_PIN_INBOX_INSTANCES.add(this);
    this._context = context;
    registerMailPerchLifecycle(context.extension.id);
    this._rootURI = context.extension.rootURI;
    this._extensionVersion = String(context.extension.manifest?.version || "0.0.0");
    this._locale = String(context.extension.localeData?.selectedLocale || Services.locale?.appLocaleAsBCP47 || "fr");
    if (!this._modulesLoaded) {
      for (const name of MODULE_PATHS) {
        Services.scriptloader.loadSubScript(context.extension.rootURI.resolve(`api/pinInbox/modules/${name}`), PIN_MODULES, "UTF-8");
      }
      if (!PIN_MODULES.PinSettings?.DEFAULTS) {
        throw new Error("Le registre de recommandations MailPerch est indisponible.");
      }
      DEFAULT_SETTINGS = PIN_MODULES.PinSettings.DEFAULTS;
      this._modulesLoaded = true;
    }
    if (!this._thunderbird) {
      let calendarDependencies = {};
      try { calendarDependencies = {cal: lazy.cal, CalEvent: lazy.CalEvent, CalTodo: lazy.CalTodo}; } catch {}
      this._thunderbird = PIN_MODULES.PinCompatibility?.create?.({
        MailServices, MailUtils, MessageArchiver, ChromeUtils, Ci, ExtensionError,
        ...calendarDependencies
      }) || null;
    }
    THUNDERBIRD_COMPAT = this._thunderbird;
    if (!this._readyPromise) {
      this._readyPromise = (async () => {
        await ensureMailPerchInstallationState(context.extension.id);
        const rawSettings = parseStored(PREF_SETTINGS, DEFAULT_SETTINGS);
        const rawData = parseStored(PREF_DATA, DEFAULT_DATA);
        this._settings = normalizeSettings(rawSettings);
        this._data = normalizeData(rawData);
        this._undoStack = [];
        this._resolveCache = new Map();
        this._conversationCache = new Map();
        this._diagnosticEvents = [];
        this._performance = {renders: 0, skippedRenders: 0, createdCards: 0, reusedCards: 0, totalRenderMs: 0, maxRenderMs: 0, resolves: 0, cacheHits: 0, ruleRuns: 0, lastRenderMs: 0};
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

        const registerRuntime = () => {
          this._registerStyleSheet(context);
          this._checkCompatibility(true);
          this._registerFolderListener();
          this._registerDataObserver();
          this._registerCalendarObservers();
          this._startReminderTimer();
          this._startCalendarSyncTimer();
          this._startBackupTimer();
        };

        try {
          const result = await this._storage.initialize(this._data, this._undoStack);
          this._data = normalizeData(result.data);
          this._undoStack = Array.isArray(result.undo) ? result.undo.slice(-MAX_UNDO) : [];
          this._storageBackend = result.backend;
          this._data.revision = Math.max(Number(this._data.revision) || 0, Number(result.revision) || 0);
          await this._migrateFromLegacy(rawSettings, rawData);
          registerRuntime();
          if (String(result.backend || "").startsWith("sqlite")) {
            try { Services.prefs.clearUserPref(PREF_DATA); } catch {}
          }
          return true;
        } catch (error) {
          this._recordDiagnostic("error", "Initialisation incomplète", error);
          this._storageBackend = "preference-fallback";
          registerRuntime();
          return false;
        }
      })();
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
        quickCaptureSelected: ready((tabId, preset) => this._quickCaptureSelectedByTab(context, tabId, preset)),
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
        exportDiagnosticBundle: ready(() => this._exportDiagnosticBundle()),
        clearDiagnostics: ready(() => this._clearDiagnostics()),
        getHealthReport: ready(() => this._getHealthReport()),
        repairHealthIssues: ready(options => this._repairHealthIssues(options || {})),
        runProviderCompatibilityCheck: ready(() => this._runProviderCompatibilityCheck()),
        previewImport: ready(configuration => this._previewImport(configuration)),
        restoreConfiguration: ready((configuration, strategy) => this._restoreConfiguration(configuration, strategy || "replace")),
        setNoReplyTracking: ready((stableKeys, options) => this._setNoReplyTracking(stableKeys, options || {})),
        getDashboardData: ready(options => this._getDashboardData(options || {})),
        openReference: ready(stableKey => this._openReference(stableKey)),
        performReferenceAction: ready((stableKeys, action, options) => this._performReferenceAction(stableKeys, action, options || {})),
        mergeRelatedReferences: ready(stableKeys => this._mergeRelatedReferences(stableKeys)),
        getCalendars: ready(() => this._getCalendars()),
        createCalendarItem: ready((stableKey, itemType, calendarId) => this._createCalendarItem(stableKey, itemType, calendarId)),
        createCaseCalendarItem: ready((caseId, itemType, calendarId) => this._createCaseCalendarItem(caseId, itemType, calendarId)),
        snoozeReminder: ready((stableKey, durationMs) => this._snoozeReminder(stableKey, durationMs)),
        runCompatibilityCheck: ready(() => this._checkCompatibility(true)),
        getPerformanceReport: ready(() => this._getPerformanceReport()),
        checkStorageIntegrity: ready(() => this._storage.integrityCheck()),
        runBackup: ready(reason => this._storage.createFileBackup(this._data, this._undoStack, boundedText(reason, 128) || "manual")),
        getBackupStatus: ready(() => this._storage.getBackupStatus()),
        chooseBackupDirectory: ready(() => this._chooseBackupDirectory()),
        simulateRules: ready(options => this._simulateRules(options || {})),
        clearRuleLog: ready(() => this._clearRuleLog()),
        getCases: ready(() => clone(this._data.cases || [])),
        getTemplates: ready(() => clone(this._data.templates || [])),
        getHistory: ready(options => this._getHistory(options || {})),
        updateReferenceDetails: ready((stableKey, details) => this._updateReferenceDetails(stableKey, details || {})),
        createSavedView: ready(details => this._createSavedView(details || {})),
        updateSavedView: ready((viewId, details) => this._updateSavedView(viewId, details || {})),
        deleteSavedView: ready(viewId => this._deleteSavedView(viewId)),
        syncTags: ready(stableKeys => this._syncTags(stableKeys || [])),
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

  _t(key, fallback = "", variables = {}) {
    try {
      const localized = this._context?.extension?.localeData?.localizeMessage?.(key);
      if (localized) return PIN_MODULES.PinLocalization?.interpolate(localized, variables) || localized;
    } catch {}
    return PIN_MODULES.PinLocalization?.t(this._locale, key, fallback, variables) || fallback || key;
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
    for (const field of ["groups", "rules", "cases", "templates", "savedViews"]) {
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

  async _migrateFromLegacy(rawSettings, rawData) {
    const oldSettingsVersion = Number(rawSettings?.schemaVersion) || 1;
    const oldDataVersion = Number(rawData?.schemaVersion) || Number(this._data.schemaVersion) || 1;
    const oldVersion = Math.min(oldSettingsVersion, oldDataVersion);
    if (oldVersion < 7 || Number(this._data.migration?.to) < 7) {
      const hasUserData = Object.keys(this._data.refs || {}).length || (this._data.groups || []).length || (this._data.rules || []).length || (this._data.cases || []).length;
      if (hasUserData && this._storage?.available) {
        try {
          await this._storage.createFileBackup(clone(this._data), clone(this._undoStack), `before-migration-${oldVersion}-to-7`);
        } catch (error) {
          this._recordDiagnostic("error", "Sauvegarde pré-migration impossible", error, {component: "migration", action: `v${oldVersion}-to-v7`});
          throw new ExtensionError(`Migration annulée : la sauvegarde de sécurité n’a pas pu être créée (${error?.message || error}).`);
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
      this._data.cases ||= []; this._data.caseOrder ||= []; this._data.templates ||= []; this._data.savedViews ||= []; this._data.history ||= []; this._data.ruleLog ||= [];
      this._data.dashboard = {...(this._data.dashboard || {}), smartView: this._data.dashboard?.smartView || this._settings.defaultSmartView || "today", view: this._data.dashboard?.view || "today"};
      this._data.providerMatrix ||= {checkedAt:0,accounts:[],providers:[],calendars:[]};
      for (const ref of Object.values(this._data.refs || {})) {
        ref.noReplyTracking = Boolean(ref.noReplyTracking);
        ref.noReplyAt = Math.max(0, Number(ref.noReplyAt || 0));
        ref.noReplyStartedAt = Math.max(0, Number(ref.noReplyStartedAt || 0));
        ref.calendarSyncError ||= "";
      }
      this._data.savedViews = PIN_MODULES.PinSavedViews?.normalizeList(this._data.savedViews) || [];
      this._data.migration = {from: oldVersion, to: 7, completedAt: Date.now()};
      this._settings.schemaVersion = 7; this._data.schemaVersion = 7;
      this._saveSettings(); this._saveData("migration-v7");
    }
  }

  _recordDiagnostic(type, message, details = "", context = {}) {
    this._diagnosticEvents ??= [];
    const levels = {debug:0,info:1,warning:2,error:3};
    const threshold = levels[this._settings?.diagnosticLevel || "warning"] ?? 2;
    const event = PIN_MODULES.PinDiagnostics?.event(type, message, details, context) || {time:Date.now(),type,message:String(message),details:String(details||"").slice(0,900)};
    const eventLevel = levels[event.type] ?? 1;
    const keep = (this._settings?.enableDiagnostics && eventLevel >= threshold) || eventLevel >= levels.error;
    if (keep) this._diagnosticEvents.push(event);
    const limit = clampNumber(this._settings?.diagnosticMaxEntries, 50, MAX_DIAGNOSTIC_EVENTS, 500);
    if (this._diagnosticEvents.length > limit) this._diagnosticEvents.splice(0, this._diagnosticEvents.length - limit);
  }

  _clearDiagnostics() {
    const cleared = this._diagnosticEvents?.length || 0;
    this._diagnosticEvents = [];
    return {cleared};
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
    const previousTagSync = Boolean(this._settings.enableThunderbirdTagSync);
    if (previousTagSync) this._clearManagedTagsForReferences(Object.values(this._data.refs));
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
    if (this._settings.enableThunderbirdTagSync) {
      try { this._ensureMailPerchTags(); this._syncTags([]).catch(error => this._recordDiagnostic("warning", "Restauration de la synchronisation des tags impossible", error, {component: "tags"})); }
      catch (error) { this._recordDiagnostic("warning", "Restauration de la synchronisation des tags impossible", error, {component: "tags"}); }
    } else if (previousTagSync) {
      this._removeMailPerchTagDefinitions();
    }
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
        ref.reminderFiredAt = now;
        ref.reminderAcknowledgedAt = now;
        changed = true;
        continue;
      }
      const title = ref.workflowStatus === "waiting" && ref.followUpAt && ref.followUpAt <= now
        ? this._t("reminderTitleFollowUp", "")
        : (ref.dueAt && ref.dueAt < now ? this._t("reminderTitleOverdue", "") : this._t("reminderTitlePinned", ""));
      const text = `${ref.subject || this._t("noSubject", "")} — ${ref.author || ref.accountName || ""}`;
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
      ref.reminderAcknowledgedAt = 0;
      ref.snoozeUntil = 0;
      if (ref.workflowStatus === "waiting" && ref.followUpAt && ref.followUpAt <= now) ref.followUpCount = (ref.followUpCount || 0) + 1;
      const next = this._nextRepeatedReminder(ref, ref.reminderAt || ref.dueAt || now);
      if (next) {
        if (ref.reminderAt) ref.reminderAt = next;
        if (ref.dueAt) ref.dueAt = next;
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
    for (const account of this._thunderbird?.messages?.accountList?.() || []) {
      try {
        const server = account.incomingServer;
        if (!server?.rootFolder) {
          continue;
        }
        const accountKey = this._thunderbird?.messages?.accountKeyForAccount?.(account) || "unknown";
        if (accountKey === "unknown") continue;
        const inboxes = walkFolders(server.rootFolder)
          .filter(folder => Boolean(folder.flags & Ci.nsMsgFolderFlags.Inbox))
          .map(folder => ({
            uri: folder.URI,
            name: folder.prettyName || folder.name || "Courrier entrant",
            enabled: this._settings.inboxEnabled[folder.URI] !== false
          }));
        const provider = PIN_MODULES.PinProviders?.providerFor(server) || String(server.type || "unknown");
        accounts.push({
          key: accountKey,
          name: server.prettyName || accountKey,
          email: account.defaultIdentity?.email || "",
          color: this._getAccountColor(accountKey),
          defaultColor: getDefaultColor(accountKey),
          protocol: String(server.type || "unknown"),
          provider,
          inboxes
        });
      } catch (error) {
        console.warn("Épingles : lecture d’un compte incomplète", safeErrorName(error));
      }
    }
    return accounts;
  }

  _getConfiguration() {
    const refs = Object.values(this._data.refs);
    const now = Date.now();
    const broken = refs.filter(ref => ref.missingSince).length;
    return {
      settings: clone(this._settings),
      recommendedSettings: PIN_MODULES.PinSettings.defaults(),
      settingsSchema: PIN_MODULES.PinSettings.describe(),
      groups: clone(this._data.groups),
      cases: clone(this._data.cases || []),
      templates: clone(this._data.templates || []),
      accounts: this._getAccountsMetadata(),
      stats: {
        pinned: refs.length,
        broken,
        unread: refs.filter(ref => {
          const hdr = this._resolveReference(ref, false);
          return Boolean(hdr && !(hdr.flags & Ci.nsMsgMessageFlags.Read));
        }).length,
        overdue: refs.filter(ref => !ref.completedAt && ((ref.dueAt && ref.dueAt < now) || (ref.followUpAt && ref.followUpAt < now))).length,
        waiting: refs.filter(ref => ref.workflowStatus === "waiting").length,
        completed: refs.filter(ref => ref.completedAt || ref.workflowStatus === "completed").length,
        history: (this._data.history || []).length,
        undoAvailable: Boolean(this._undoStack?.length),
        ...(PIN_MODULES.PinAnalytics?.build(refs, this._data.history || [], now, value => PIN_MODULES.PinChecklists?.stats(value) || {pending: 0}) || {})
      },
      shortcut: "Alt+P",
      rules: clone(this._data.rules || []),
      ruleLog: clone((this._data.ruleLog || []).slice(-100)),
      storage: {backend: this._storageBackend || "unknown", database: DB_FILENAME, schemaVersion: DB_SCHEMA_VERSION},
      compatibility: clone(this._compatibility || {}),
      providerMatrix: clone(this._data.providerMatrix || DEFAULT_DATA.providerMatrix),
      diagnostics: PIN_MODULES.PinDiagnostics?.summary(this._diagnosticEvents || []) || {total:(this._diagnosticEvents||[]).length},
      performance: this._getPerformanceReport()
    };
  }

  async _setConfiguration(configuration) {
    assertStructuredInput(configuration, "Configuration", {maxBytes: 2 * 1024 * 1024, maxNodes: 25_000});
    if (!configuration || typeof configuration !== "object") {
      throw new ExtensionError("Configuration invalide.");
    }
    this._pushUndo("Modification des paramètres");
    const previousPinMode = this._settings.pinMode;
    const previousTagSync = Boolean(this._settings.enableThunderbirdTagSync);
    if (configuration.settings) {
      const currentBackupDirectory = this._settings.backupDirectory || "";
      const nextSettings = normalizeSettings({...this._settings, ...configuration.settings});
      if (!previousTagSync && nextSettings.enableThunderbirdTagSync) this._ensureMailPerchTags();
      this._settings = nextSettings;
      // Arbitrary filesystem paths are not accepted through page JavaScript.
      // Only the native folder picker may update this privileged setting.
      this._settings.backupDirectory = currentBackupDirectory;
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
    await this._applyTagSyncSettingTransition(previousTagSync);
    this._refreshAllStates(true);
    // setConfiguration is an explicit user save boundary. Do not acknowledge
    // success until all queued SQLite writes have completed.
    await this._storage?.flush();
    return this._getConfiguration();
  }

  _exportConfiguration() {
    return {
      format: "thunderbird-pin-mails",
      version: 7,
      exportedAt: new Date().toISOString(),
      settings: portableSettingsSnapshot(this._settings),
      data: portableDataSnapshot(this._data)
    };
  }

  async _importConfiguration(configuration) {
    assertStructuredInput(configuration, "Sauvegarde", {maxBytes: MAX_IMPORT_BYTES});
    if (configuration?.format === "pin-mails-backup" &&
        !PIN_MODULES.PinStorageHelpers?.verifyBackupEnvelope(configuration)) {
      throw new ExtensionError("La sauvegarde est incomplète ou corrompue.");
    }
    if (configuration?.format === "pin-mails-backup" && configuration.data) {
      configuration = {
        format: "thunderbird-pin-mails",
        version: Number(configuration.metadata?.schemaVersion || configuration.data?.schemaVersion || 7),
        exportedAt: new Date(configuration.createdAt || Date.now()).toISOString(),
        settings: configuration.metadata?.settings || clone(this._settings),
        data: configuration.data,
        undo: configuration.undo || []
      };
    }
    if (
      !configuration ||
      configuration.format !== "thunderbird-pin-mails" ||
      ![1, 2, 3, 4, 5, 6, 7].includes(Number(configuration.version))
    ) {
      throw new ExtensionError("Ce fichier n’est pas une sauvegarde compatible.");
    }
    const serialized = JSON.stringify(configuration);
    if (serialized.length > MAX_IMPORT_BYTES) throw new ExtensionError("La sauvegarde dépasse la taille maximale autorisée.");
    this._pushUndo("Import de la sauvegarde");
    const importUndoAction = this._undoStack?.at(-1) || null;
    const previousTagSync = Boolean(this._settings.enableThunderbirdTagSync);
    const hardened = hardenImportedConfiguration(
      configuration.settings,
      configuration.data,
      this._settings.backupDirectory || ""
    );
    if (previousTagSync) this._clearManagedTagsForReferences(Object.values(this._data.refs));
    if (hardened.settings.enableThunderbirdTagSync) this._ensureMailPerchTags();
    this._settings = hardened.settings;
    this._data = hardened.data;
    // Undo payloads can contain privileged message operations. They are local
    // runtime state, not portable backup data, and are never imported.
    this._undoStack = importUndoAction ? [importUndoAction] : [];
    this._data.migration = {
      from: Number(configuration.version) || 1,
      to: 7,
      completedAt: Date.now()
    };
    this._saveSettings();
    this._saveData("import");
    this._applyRuntimeSettings();
    if (this._settings.enableThunderbirdTagSync) await this._syncTags([]);
    else if (previousTagSync) this._removeMailPerchTagDefinitions();
    this._refreshAllStates(true);
    await this._storage?.flush();
    return this._getConfiguration();
  }

  async _resetConfiguration() {
    this._pushUndo("Réinitialisation des paramètres");
    const previousTagSync = Boolean(this._settings.enableThunderbirdTagSync);
    this._settings = clone(DEFAULT_SETTINGS);
    this._data.manualOrder = Object.keys(this._data.refs);
    this._data.groups = [];
    this._data.groupOrder = [];
    this._data.cases = []; this._data.caseOrder = []; this._data.templates = []; this._data.rules = []; this._data.savedViews = [];
    this._data.dashboard = clone(DEFAULT_DATA.dashboard);
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
    await this._applyTagSyncSettingTransition(previousTagSync);
    this._refreshAllStates(true);
    await this._storage?.flush();
    return this._getConfiguration();
  }

  _identityEmails() {
    if (this._cachedIdentityEmails) return this._cachedIdentityEmails;
    const emails = new Set();
    for (const email of this._thunderbird?.messages?.identityEmails?.() || []) emails.add(email);
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
      if (ref.trackingMode === "conversation" && isStrongConversationKey(convKey) &&
          (ref.stableKey === convKey || ref.conversationKey === convKey)) results.push(ref);
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
    assertStructuredInput(options, "Options d’historique", {maxBytes: 64 * 1024, maxNodes: 1000});
    const search = sanitizeSearchText(options.search || "");
    const caseId = String(options.caseId || "");
    const limit = clampNumber(options.limit, 1, MAX_HISTORY, 500);
    return (this._data.history || []).filter(item => (!caseId || item.caseId === caseId) && (!search || sanitizeSearchText([item.subject,item.author,item.accountName,item.action].join(" ")).includes(search))).slice(-limit).reverse();
  }

  _updateReferenceDetails(stableKey, details = {}) {
    assertStructuredInput(details, "Détails du suivi", {maxBytes: 256 * 1024, maxNodes: 5000});
    const key = boundedText(stableKey, 8192);
    const ref = this._data.refs[key];
    if (!ref) throw new ExtensionError("Épingle introuvable.");
    this._pushUndo("Modification du suivi");
    if ("note" in details) ref.note = String(details.note || "").slice(0, MAX_NOTE_LENGTH);
    if ("checklist" in details) ref.checklist = PIN_MODULES.PinChecklists?.normalize(details.checklist) || [];
    ref.updatedAt = Date.now();
    this._recordActivity("details", key, ref.subject);
    this._saveData("reference-details");
    this._refreshAllStates(true);
    if (this._settings.enableBidirectionalCalendarSync && ref.calendarItemId) {
      this._syncReferenceToCalendar(ref).catch(error => this._recordDiagnostic("warning", "Mise à jour Agenda impossible", error));
    }
    if (this._settings.enableThunderbirdTagSync) {
      this._syncTags([key]).catch(error => this._recordDiagnostic("warning", "Synchronisation des tags impossible", error));
    }
    return this._serializeReference(ref, true);
  }

  _createSavedView(details = {}) {
    assertStructuredInput(details, "Vue enregistrée", {maxBytes: 64 * 1024, maxNodes: 1000});
    const views = this._data.savedViews || (this._data.savedViews = []);
    if (views.length >= (PIN_MODULES.PinSavedViews?.MAX_VIEWS || 30)) throw new ExtensionError("Le nombre maximal de vues enregistrées est atteint.");
    const now = Date.now();
    const normalized = PIN_MODULES.PinSavedViews?.normalize({...details, id: uniqueEntityId("view", views), createdAt: now, updatedAt: now}, views.length);
    if (!normalized) throw new ExtensionError("Donnez un nom valide à la vue.");
    this._pushUndo("Création d’une vue enregistrée");
    views.push(normalized);
    this._data.dashboard = {...(this._data.dashboard || {}), savedViewId: normalized.id};
    this._saveData("saved-view-create");
    return clone(normalized);
  }

  _updateSavedView(viewId, details = {}) {
    assertStructuredInput(details, "Vue enregistrée", {maxBytes: 64 * 1024, maxNodes: 1000});
    const index = (this._data.savedViews || []).findIndex(item => item.id === String(viewId || ""));
    if (index < 0) throw new ExtensionError("Vue enregistrée introuvable.");
    const current = this._data.savedViews[index];
    const normalized = PIN_MODULES.PinSavedViews?.normalize({...current, ...details, id: current.id, createdAt: current.createdAt, updatedAt: Date.now()}, index);
    if (!normalized) throw new ExtensionError("Donnez un nom valide à la vue.");
    this._pushUndo("Modification d’une vue enregistrée");
    this._data.savedViews[index] = normalized;
    this._saveData("saved-view-update");
    return clone(normalized);
  }

  _deleteSavedView(viewId) {
    const id = boundedText(viewId, 80);
    const index = (this._data.savedViews || []).findIndex(item => item.id === id);
    if (index < 0) return {deleted: false};
    this._pushUndo("Suppression d’une vue enregistrée");
    this._data.savedViews.splice(index, 1);
    if (this._data.dashboard?.savedViewId === id) this._data.dashboard.savedViewId = "";
    this._saveData("saved-view-delete");
    return {deleted: true};
  }

  _clearManagedTagsForReferences(refs) {
    let cleared = 0;
    let errors = 0;
    for (const ref of refs || []) {
      try {
        const result = this._clearReferenceTags(ref);
        cleared += Number(result.removed) || 0;
        ref.tagSyncError = "";
      } catch (error) {
        errors += 1;
        ref.tagSyncError = boundedText(error?.message || error, 500);
        this._recordDiagnostic("warning", "Nettoyage des tags MailPerch impossible", error, {component: "tags", stableKey: ref.stableKey});
      }
    }
    return {cleared, errors};
  }

  async _applyTagSyncSettingTransition(previousEnabled) {
    const currentEnabled = Boolean(this._settings.enableThunderbirdTagSync);
    if (Boolean(previousEnabled) === currentEnabled) return {changed: false};
    if (currentEnabled) {
      this._ensureMailPerchTags();
      return {...(await this._syncTags([])), changed: true, enabled: true};
    }
    const {cleared, errors} = this._clearManagedTagsForReferences(Object.values(this._data.refs));
    const definitionsRemoved = this._removeMailPerchTagDefinitions();
    this._saveData("tag-sync-disabled");
    return {changed: true, enabled: false, cleared, errors, definitionsRemoved};
  }

  _ensureMailPerchTags() {
    const definitions = PIN_MODULES.PinTagSync?.DEFINITIONS || [];
    this._thunderbird?.tags?.ensureDefinitions?.(definitions);
    return definitions;
  }

  _ownedMailPerchTagKeys() {
    return this._thunderbird?.tags?.ownedKeys?.(PIN_MODULES.PinTagSync?.DEFINITIONS || []) || new Set();
  }

  _removeMailPerchTagDefinitions() {
    return this._thunderbird?.tags?.removeDefinitions?.(
      PIN_MODULES.PinTagSync?.DEFINITIONS || [],
      (key, error) => this._recordDiagnostic("warning", "Suppression d’un tag MailPerch impossible", error, {component: "tags", tagKey: key})
    ) || 0;
  }

  _tagHeadersForReference(ref) {
    const resolved = this._resolveReference(ref, false);
    if (!resolved?.folder) return [];
    if (ref?.trackingMode !== "conversation") return [resolved];
    const headers = this._conversationHeaders(resolved).filter(hdr => hdr?.folder);
    return headers.length ? headers : [resolved];
  }

  _batchTagHeaders(headers, operation, keywords) {
    if (!headers?.length || !keywords) return 0;
    const result = this._thunderbird?.tags?.batchKeywords?.(headers, String(keywords).split(/\s+/), operation === "add");
    return Number(result?.headers) || 0;
  }

  _clearReferenceTags(ref) {
    const headers = this._tagHeadersForReference(ref);
    if (!headers.length) return {removed: 0, messages: 0};
    const managed = this._ownedMailPerchTagKeys();
    if (!managed.size) return {removed: 0, messages: 0};
    const byKeywords = new Map();
    for (const hdr of headers) {
      const current = this._thunderbird?.tags?.keywordsForHeader?.(hdr) || new Set();
      const remove = [...managed].filter(key => current.has(key)).sort().join(" ");
      if (!remove) continue;
      if (!byKeywords.has(remove)) byKeywords.set(remove, []);
      byKeywords.get(remove).push(hdr);
    }
    let removed = 0;
    let messages = 0;
    for (const [keywords, taggedHeaders] of byKeywords) {
      messages += this._batchTagHeaders(taggedHeaders, "remove", keywords);
      removed += keywords.split(/\s+/).filter(Boolean).length * taggedHeaders.length;
    }
    return {removed, messages};
  }

  _syncReferenceTags(ref) {
    if (!this._settings.enableThunderbirdTagSync) return {synced: false, reason: "disabled"};
    const headers = this._tagHeadersForReference(ref);
    if (!headers.length) return {synced: false, reason: "missing"};
    const desired = new Set(PIN_MODULES.PinTagSync?.desiredKeys(ref) || []);
    const managed = this._ownedMailPerchTagKeys();
    const addGroups = new Map();
    const removeGroups = new Map();
    let added = 0;
    let removed = 0;
    for (const hdr of headers) {
      const current = this._thunderbird?.tags?.keywordsForHeader?.(hdr) || new Set();
      const add = [...desired].filter(key => !current.has(key)).sort().join(" ");
      const remove = [...managed].filter(key => current.has(key) && !desired.has(key)).sort().join(" ");
      if (add) {
        if (!addGroups.has(add)) addGroups.set(add, []);
        addGroups.get(add).push(hdr);
        added += add.split(/\s+/).filter(Boolean).length;
      }
      if (remove) {
        if (!removeGroups.has(remove)) removeGroups.set(remove, []);
        removeGroups.get(remove).push(hdr);
        removed += remove.split(/\s+/).filter(Boolean).length;
      }
    }
    for (const [keywords, taggedHeaders] of addGroups) this._batchTagHeaders(taggedHeaders, "add", keywords);
    for (const [keywords, taggedHeaders] of removeGroups) this._batchTagHeaders(taggedHeaders, "remove", keywords);
    ref.tagSyncError = "";
    ref.tagLastSyncedAt = Date.now();
    return {synced: true, added, removed, messages: headers.length};
  }

  async _syncTags(stableKeys = []) {
    const requested = normalizeStableKeyList(stableKeys).slice(0, 500);
    if (!this._settings.enableThunderbirdTagSync) return {synced: 0, skipped: requested.length || Object.keys(this._data.refs).length, errors: 0, disabled: true};
    this._ensureMailPerchTags();
    const refs = (requested.length ? requested : Object.keys(this._data.refs)).map(key => this._data.refs[key]).filter(Boolean);
    let synced = 0, skipped = 0, errors = 0;
    for (const ref of refs) {
      try {
        const result = this._syncReferenceTags(ref);
        if (result.synced) synced++; else skipped++;
      } catch (error) {
        errors++; ref.tagSyncError = boundedText(error?.message || error, 500);
        this._recordDiagnostic("warning", "Synchronisation d’un tag impossible", error, {component: "tags", stableKey: ref.stableKey});
      }
    }
    this._saveData("tag-sync");
    this._refreshAllStates(true);
    return {synced, skipped, errors, managedTags: clone(PIN_MODULES.PinTagSync?.DEFINITIONS || [])};
  }

  _setWorkflowStatus(stableKeys, status, options = {}) {
    assertStructuredInput(options, "Options de workflow", {maxBytes: 64 * 1024, maxNodes: 1000});
    const allowed = new Set(["active", "waiting", "planned", "completed"]);
    const target = allowed.has(status) ? status : "active";
    const keys = normalizeStableKeyList(stableKeys);
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
    if (this._settings.enableThunderbirdTagSync) this._syncTags(refs.map(item => item.stableKey)).catch(error => this._recordDiagnostic("warning", "Synchronisation des tags impossible", error));
    return {count:refs.length,status:target};
  }

  _createCase(details = {}) {
    assertStructuredInput(details, "Affaire", {maxBytes: 64 * 1024, maxNodes: 1000});
    if (!this._settings.enableCases) throw new ExtensionError("Les affaires sont désactivées.");
    if ((this._data.cases || []).length >= MAX_CASES) throw new ExtensionError("Nombre maximal d’affaires atteint.");
    const values = this._data.cases || [];
    const item = normalizeCase({...details, id: details.id || uniqueEntityId("case", values)}, values.length);
    if (!item) throw new ExtensionError("Affaire invalide.");
    if (values.some(existing => existing.id === item.id)) throw new ExtensionError("Une affaire utilise déjà cet identifiant.");
    values.push(item); this._data.caseOrder.push(item.id); this._saveData("case-create");
    return clone(item);
  }

  _updateCase(caseId, details = {}) {
    assertStructuredInput(details, "Affaire", {maxBytes: 64 * 1024, maxNodes: 1000});
    caseId = boundedText(caseId, 64);
    const index=(this._data.cases||[]).findIndex(item=>item.id===String(caseId));
    if(index<0) throw new ExtensionError("Affaire introuvable.");
    const item=normalizeCase({...this._data.cases[index],...details,id:this._data.cases[index].id,updatedAt:Date.now()},index);
    this._data.cases[index]=item; this._saveData("case-update"); this._refreshAllStates(true); return clone(item);
  }

  _deleteCase(caseId) {
    const id=boundedText(caseId, 64); const before=(this._data.cases||[]).length;
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
    assertStructuredInput(details, "Modèle", {maxBytes: 64 * 1024, maxNodes: 1000});
    if (!this._settings.enableTemplates) throw new ExtensionError("Les modèles sont désactivés.");
    if ((this._data.templates || []).length >= MAX_TEMPLATES) throw new ExtensionError("Nombre maximal de modèles atteint.");
    const values = this._data.templates || [];
    const item=normalizeTemplate({...details,id:details.id||uniqueEntityId("template",values)},values.length);
    if(!item) throw new ExtensionError("Modèle invalide.");
    if(values.some(existing=>existing.id===item.id)) throw new ExtensionError("Un modèle utilise déjà cet identifiant.");
    values.push(item);this._saveData("template-create");return clone(item);
  }

  _updateTemplate(templateId, details = {}) {
    assertStructuredInput(details, "Modèle", {maxBytes: 64 * 1024, maxNodes: 1000});
    templateId = boundedText(templateId, 64);
    const index=(this._data.templates||[]).findIndex(item=>item.id===String(templateId));
    if(index<0) throw new ExtensionError("Modèle introuvable.");
    const item=normalizeTemplate({...this._data.templates[index],...details,id:this._data.templates[index].id},index);
    this._data.templates[index]=item;this._saveData("template-update");return clone(item);
  }

  _deleteTemplate(templateId) {
    const id=boundedText(templateId, 64);const before=(this._data.templates||[]).length;
    this._data.templates=(this._data.templates||[]).filter(item=>item.id!==id);
    for(const ref of Object.values(this._data.refs)) if(ref.templateId===id) ref.templateId="";
    if(before!==this._data.templates.length)this._saveData("template-delete");
    return {deleted:before!==this._data.templates.length};
  }

  _applyTemplate(stableKeys, templateId, {pushUndo=true, save=true, refresh=true} = {}) {
    templateId = boundedText(templateId, 64);
    const template=(this._data.templates||[]).find(item=>item.id===templateId);
    if(!template) throw new ExtensionError("Modèle introuvable.");
    const keys=normalizeStableKeyList(stableKeys);const refs=keys.map(key=>this._data.refs[key]).filter(Boolean);const now=Date.now();
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
    if(this._settings.enableThunderbirdTagSync&&save)this._syncTags(refs.map(ref=>ref.stableKey)).catch(error=>this._recordDiagnostic("warning","Synchronisation des tags impossible",error));
    return {count:refs.length,template:clone(template)};
  }

  async _chooseBackupDirectory() {
    const win=Services.wm.getMostRecentWindow("mail:3pane") || Services.wm.getMostRecentWindow(null);
    const browsingContext=win?.browsingContext;
    if (!browsingContext) {
      throw new ExtensionError("Aucune fenêtre Thunderbird active ne permet d’ouvrir le sélecteur de dossier.");
    }
    const picker=Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    picker.init(browsingContext, "Choisir le dossier des sauvegardes MailPerch", Ci.nsIFilePicker.modeGetFolder);
    if (this._settings.backupDirectory) {
      try {
        const currentDirectory=Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
        currentDirectory.initWithPath(this._settings.backupDirectory);
        if (currentDirectory.exists() && currentDirectory.isDirectory()) picker.displayDirectory=currentDirectory;
      } catch (error) {
        this._recordDiagnostic("warning", "Dossier de sauvegarde actuel inutilisable par le sélecteur", error);
      }
    }
    const result=await new Promise((resolve,reject)=>{
      try {
        picker.open(value=>resolve(value));
      } catch (error) {
        reject(error);
      }
    });
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
      reminderAcknowledgedAt: 0,
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
    if(this._settings.enableThunderbirdTagSync){try{this._clearReferenceTags(ref);}catch(error){this._recordDiagnostic("warning","Nettoyage des tags MailPerch impossible",error,{component:"tags",stableKey});}}
    delete this._data.refs[stableKey];this._data.manualOrder=this._data.manualOrder.filter(key=>key!==stableKey);return true;
  }

  async _deleteLinkedCalendarItem(ref) {
    const {calendar,item}=await this._calendarItemForRef(ref);if(calendar&&item)await this._thunderbird?.calendar?.deleteItem?.(calendar, item);
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
        folder = this._thunderbird?.messages?.folderForURL?.(ref.lastFolderURI);
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
      account = (this._thunderbird?.messages?.accountList?.() || []).find(
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
    return hasOwn(this._data.refs, messageStableKey(hdr)) ||
      (this._settings.enableConversationPins && hasOwn(this._data.refs, conversationStableKey(hdr)));
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
        if (trackingMode === "conversation" || hasOwn(this._data.refs, conversationStableKey(hdr))) this._removeReferenceByKey(conversationStableKey(hdr));
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
    if(newState&&this._settings.enableThunderbirdTagSync){const tagKeys=usable.map(hdr=>trackingMode==="conversation"?conversationStableKey(hdr):messageStableKey(hdr));this._syncTags(tagKeys).catch(error=>this._recordDiagnostic("warning","Synchronisation des tags impossible",error));}
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
          const existed = hasOwn(this._data.refs, key);
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
          const folder = this._thunderbird?.messages?.folderForURL?.(inbox.uri);
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
    const empty = {
      count: 0,
      allPinned: false,
      anyPinned: false,
      conversationEnabled: Boolean(this._settings.enableConversationPins),
      conversationCount: 0,
      allConversationsPinned: false,
      anyConversationPinned: false
    };
    const folder = about3Pane.gFolder;
    if (!folder || (!(folder.flags & Ci.nsMsgFolderFlags.Inbox) && !this._settings.allowPinOutsideInbox)) {
      return empty;
    }
    const headers = this._getSelectedHeaders(about3Pane);
    const pinnedCount = headers.filter(hdr => this._isPinnedHeader(hdr)).length;
    const conversationKeys = [...new Set(headers.map(hdr => conversationStableKey(hdr)).filter(Boolean))];
    const conversationPinnedCount = conversationKeys.filter(key => hasOwn(this._data.refs, key)).length;
    return {
      count: headers.length,
      allPinned: Boolean(headers.length && pinnedCount === headers.length),
      anyPinned: pinnedCount > 0,
      conversationEnabled: Boolean(this._settings.enableConversationPins),
      conversationCount: conversationKeys.length,
      allConversationsPinned: Boolean(conversationKeys.length && conversationPinnedCount === conversationKeys.length),
      anyConversationPinned: conversationPinnedCount > 0
    };
  }

  async _getSelectionStateByTab(context, tabId) {
    const about3Pane = this._about3PaneForTab(context, tabId);
    return about3Pane
      ? this._selectionState(about3Pane)
      : {
          count: 0,
          allPinned: false,
          anyPinned: false,
          conversationEnabled: Boolean(this._settings.enableConversationPins),
          conversationCount: 0,
          allConversationsPinned: false,
          anyConversationPinned: false
        };
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
    const normalizedAction = boundedText(action, 64);
    const referenceActions = new Set([
      "complete", "uncomplete", "unpin", "active", "waiting", "planned",
      "snooze", "wake", "trackNoReply", "cancelNoReply", "dismissReminder"
    ]);
    const allowedActions = new Set(["read", "unread", "toggleRead", "reply", "archive", "delete", ...referenceActions]);
    if (!allowedActions.has(normalizedAction)) return {count: 0, unsupported: true};
    const pane = this._about3PaneForTab(context, tabId);
    const headers = pane ? this._getSelectedHeaders(pane) : [];
    if (!headers.length) return {count: 0};
    if (referenceActions.has(normalizedAction)) {
      const keys = [];
      for (const hdr of headers) {
        const conversationKey = conversationStableKey(hdr);
        const key = hasOwn(this._data.refs, conversationKey) ? conversationKey : messageStableKey(hdr);
        if (hasOwn(this._data.refs, key) && !keys.includes(key)) keys.push(key);
      }
      const options = normalizedAction === "snooze"
        ? {durationMs: 60 * 60_000}
        : normalizedAction === "trackNoReply"
          ? {days: this._settings.noReplyDefaultDays}
          : {};
      return this._performReferenceAction(keys, normalizedAction, options);
    }
    return this._performMessageAction(normalizedAction, headers, pane);
  }

  _quickPresetDueAt(preset, now = Date.now()) {
    const target = new Date(now);
    if (preset === "tomorrow") {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
      return target.getTime();
    }
    if (preset === "today") {
      target.setHours(17, 0, 0, 0);
      if (target.getTime() <= now) return now + 60 * 60_000;
      return target.getTime();
    }
    return 0;
  }

  async _quickCaptureSelectedByTab(context, tabId, preset = "simple") {
    const normalizedPreset = ["simple", "today", "tomorrow", "waiting", "noReply"].includes(preset) ? preset : "simple";
    const pane = this._about3PaneForTab(context, tabId);
    const folder = pane?.gFolder;
    const headers = pane ? this._getSelectedHeaders(pane).filter(Boolean) : [];
    if (!folder || !headers.length || (!(folder.flags & Ci.nsMsgFolderFlags.Inbox) && !this._settings.allowPinOutsideInbox)) return {count: 0};

    const trackingMode = this._settings.defaultPinTarget === "conversation" && this._settings.enableConversationPins ? "conversation" : "message";
    const counterSnapshot = this._captureFolderCounters(headers);
    this._pushUndo("Capture rapide", this._captureFlags(headers));
    const refs = new Map();
    const byFolder = new Map();
    const now = Date.now();
    for (const hdr of headers) {
      const ref = this._ensureReference(hdr, folder.URI || hdr.folder?.URI || "", trackingMode);
      refs.set(ref.stableKey, ref);
      if (this._settings.pinMode === "nativeStar") {
        const list = byFolder.get(hdr.folder) || [];
        list.push(hdr);
        byFolder.set(hdr.folder, list);
      }
    }
    if (this._settings.pinMode === "nativeStar") {
      for (const [targetFolder, list] of byFolder) targetFolder.markMessagesFlagged(list, true);
    }

    const dueAt = this._quickPresetDueAt(normalizedPreset, now);
    for (const ref of refs.values()) {
      ref.completedAt = 0;
      ref.snoozeUntil = 0;
      ref.reminderAcknowledgedAt = 0;
      if (dueAt) {
        ref.workflowStatus = "planned";
        ref.waitingSince = 0;
        ref.followUpAt = 0;
        ref.noReplyTracking = false;
        ref.noReplyAt = 0;
        ref.noReplyStartedAt = 0;
        ref.noReplyBaselineMessageId = "";
        ref.dueAt = dueAt;
        const lead = Math.max(0, Number(ref.reminderLeadMinutes || this._settings.reminderLeadMinutes || 0)) * 60_000;
        ref.reminderAt = Math.max(now, dueAt - lead);
        ref.reminderFiredAt = 0;
      } else if (normalizedPreset === "waiting") {
        ref.workflowStatus = "waiting";
        ref.waitingSince = now;
        ref.noReplyTracking = false;
        ref.noReplyAt = 0;
        ref.noReplyStartedAt = 0;
        ref.noReplyBaselineMessageId = "";
        ref.followUpAt = now + Math.max(1, this._settings.defaultFollowUpDays || 3) * DAY_MS;
        ref.reminderAt = ref.followUpAt;
        ref.reminderFiredAt = 0;
      } else if (normalizedPreset === "noReply") {
        ref.workflowStatus = "waiting";
        ref.waitingSince = now;
        ref.noReplyTracking = true;
        ref.noReplyStartedAt = now;
        ref.noReplyAt = now + Math.max(1, this._settings.noReplyDefaultDays || 5) * DAY_MS;
        ref.noReplyBaselineMessageId = String(ref.headerMessageId || "");
        ref.followUpAt = ref.noReplyAt;
        ref.reminderAt = ref.noReplyAt;
        ref.reminderFiredAt = 0;
      } else if (ref.workflowStatus === "completed") {
        ref.workflowStatus = "active";
      }
      ref.updatedAt = now;
      this._recordActivity(`quick-${normalizedPreset}`, ref.stableKey, ref.subject);
    }
    this._saveData(`quick-${normalizedPreset}`);
    this._resolveCache?.clear();
    this._refreshAllStates(true);
    this._showToastAll(`${refs.size} message(s) ajouté(s) au suivi.`, true);
    this._scheduleCounterRegressionCheck(counterSnapshot, `quick-${normalizedPreset}`);
    return {count: refs.size, preset: normalizedPreset, stableKeys: [...refs.keys()], dueAt};
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
    const entries = [];
    let dataChanged = false;

    for (const ref of Object.values(this._data.refs)) {
      if (!PIN_MODULES.PinSettings.matchesPanelScope(this._settings, ref, folder.URI)) continue;
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
    if("checklist" in patch)ref.checklist=PIN_MODULES.PinChecklists?.normalize(patch.checklist)||[];
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
    if(this._settings.enableThunderbirdTagSync)this._syncTags([stableKey]).catch(error=>this._recordDiagnostic("warning","Synchronisation des tags impossible",error));
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
          const folder = this._thunderbird?.messages?.folderForURL?.(inbox.uri);
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


  _exportDiagnosticBundle() {
    return {
      ...this._getDiagnosticReport(),
      format: "mailperch-diagnostic-bundle",
      version: 4,
      healthSnapshot: PIN_MODULES.PinHealth?.build({
        data: this._data, settings: this._settings, compatibility: this._compatibility,
        performance: this._getPerformanceReport(),
        diagnostics: PIN_MODULES.PinDiagnostics?.summary(this._diagnosticEvents || [])
      }) || null,
      providerMatrix: anonymizeProviderMatrix(this._data.providerMatrix || DEFAULT_DATA.providerMatrix)
    };
  }

  _runProviderCompatibilityCheck() {
    const accounts = this._getAccountsMetadata();
    const calendars = this._settings.enableCalendarIntegration ? this._getCalendars() : [];
    this._data.providerMatrix = PIN_MODULES.PinProviders?.matrix(accounts, calendars) || {checkedAt:Date.now(),accounts,providers:[],calendars};
    this._saveData("provider-matrix");
    this._recordDiagnostic("info", "Matrice de compatibilité actualisée", `${accounts.length} compte(s), ${calendars.length} calendrier(s)`, {component:"compatibility"});
    return clone(this._data.providerMatrix);
  }

  async _getHealthReport() {
    let integrity = {ok:false, unavailable:true};
    let backup = {stale:true};
    try { integrity = await this._storage.integrityCheck(); } catch (error) { this._recordDiagnostic("warning", "Contrôle de santé SQLite impossible", error, {component:"health"}); }
    try { backup = await this._storage.getBackupStatus(); } catch (error) { this._recordDiagnostic("warning", "État des sauvegardes indisponible", error, {component:"health"}); }
    const report = PIN_MODULES.PinHealth?.build({
      data:this._data, settings:this._settings, compatibility:this._compatibility,
      performance:this._getPerformanceReport(), integrity, backup,
      diagnostics:PIN_MODULES.PinDiagnostics?.summary(this._diagnosticEvents || [])
    }) || {score:0,status:"critical",issues:[],counts:{}};
    return {...report, integrity, backup, providerMatrix:clone(this._data.providerMatrix || DEFAULT_DATA.providerMatrix)};
  }

  async _repairHealthIssues(options = {}) {
    assertStructuredInput(options, "Options de réparation", {maxBytes: 64 * 1024, maxNodes: 1000});
    const actions = Array.isArray(options.actions) ? new Set(options.actions.map(String)) : new Set(["orphan-links", "repair-references"]);
    if (this._settings.backupBeforeMigration && this._storage) {
      await this._storage.createFileBackup(this._data, this._undoStack, "before-health-repair");
    }
    this._pushUndo("Réparation du centre de santé");
    let changed = false;
    let repaired = 0;
    if (actions.has("orphan-links")) {
      const groups = new Set((this._data.groups || []).map(item => item.id));
      const cases = new Set((this._data.cases || []).map(item => item.id));
      const templates = new Set((this._data.templates || []).map(item => item.id));
      for (const ref of Object.values(this._data.refs || {})) {
        if (ref.groupId && !groups.has(ref.groupId)) { ref.groupId = ""; repaired++; changed = true; }
        if (ref.caseId && !cases.has(ref.caseId)) { ref.caseId = ""; repaired++; changed = true; }
        if (ref.templateId && !templates.has(ref.templateId)) { ref.templateId = ""; repaired++; changed = true; }
      }
    }
    if (actions.has("repair-references")) { const result = this._repairReferences(); repaired += result.repaired || 0; }
    if (changed) { this._saveData("health-repair"); this._refreshAllStates(true); }
    return {repaired, health:await this._getHealthReport()};
  }

  _previewImport(configuration) {
    assertStructuredInput(configuration, "Sauvegarde", {maxBytes: MAX_IMPORT_BYTES});
    if (!configuration || typeof configuration !== "object") throw new ExtensionError("Configuration invalide.");
    const preview = PIN_MODULES.PinMigrations?.analyze(configuration, this._data) || {valid: false, errors: ["analysis-unavailable"]};
    if (!preview.valid) this._recordDiagnostic("warning", "Sauvegarde refusée lors de la prévisualisation", (preview.errors || []).join(", "), {component: "migration", action: "preview"});
    return preview;
  }

  async _restoreConfiguration(configuration, strategy = "replace") {
    const preview = this._previewImport(configuration);
    const selectedStrategy = ["replace", "merge"].includes(strategy) ? strategy : "replace";
    if (!preview.valid) throw new ExtensionError(`Cette sauvegarde ne peut pas être restaurée${preview.errors?.length ? ` : ${preview.errors.join(", ")}` : "."}`);
    if (!this._storage) throw new ExtensionError("Le stockage local MailPerch n’est pas disponible pour sécuriser la restauration.");

    let safetyBackup;
    try {
      safetyBackup = await this._storage.createFileBackup(this._data, this._undoStack, `before-restore-${selectedStrategy}`);
    } catch (error) {
      this._recordDiagnostic("error", "Sauvegarde de sécurité avant restauration impossible", error, {component: "migration", action: selectedStrategy});
      throw new ExtensionError(`La restauration a été annulée car la sauvegarde de sécurité n’a pas pu être créée : ${error?.message || error}`);
    }

    try {
      let result;
      if (selectedStrategy === "merge") {
        const incoming = PIN_MODULES.PinMigrations?.sourceFor(configuration) || {};
        const merged = PIN_MODULES.PinMigrations?.merge(this._data, incoming) || incoming;
        result = await this._importConfiguration({
          format: "thunderbird-pin-mails",
          version: Number(configuration.version || configuration.metadata?.schemaVersion || incoming.schemaVersion || 7),
          settings: {...this._settings, ...(configuration.settings || configuration.metadata?.settings || {})},
          data: merged
        });
      } else {
        result = await this._importConfiguration(configuration);
      }
      this._recordDiagnostic("info", "Restauration MailPerch terminée", `${selectedStrategy} · ${preview.incoming?.refs || 0} référence(s)`, {component: "migration", action: selectedStrategy});
      return {...result, strategy: selectedStrategy, safetyBackup: safetyBackup?.path || "", preview};
    } catch (error) {
      this._recordDiagnostic("error", "Restauration MailPerch interrompue", error, {component: "migration", action: selectedStrategy});
      throw error;
    }
  }

  _setNoReplyTracking(stableKeys, options = {}) {
    assertStructuredInput(options, "Options de relance", {maxBytes: 64 * 1024, maxNodes: 1000});
    const keys = normalizeStableKeyList(stableKeys);
    const refs = keys.map(key => this._data.refs[key]).filter(Boolean);
    if (!refs.length) return {count:0};
    const enabled = options.enabled !== false;
    const days = clampNumber(options.days, 1, 365, this._settings.noReplyDefaultDays || 5);
    const now = Date.now();
    this._pushUndo(enabled ? "Suivi sans réponse" : "Arrêt du suivi sans réponse");
    for (const ref of refs) {
      ref.noReplyTracking = enabled;
      ref.noReplyStartedAt = enabled ? now : 0;
      ref.noReplyAt = enabled ? Number(options.at) || now + days * DAY_MS : 0;
      ref.noReplyBaselineMessageId = enabled ? String(ref.headerMessageId || "") : "";
      if (enabled) {
        ref.workflowStatus = "waiting"; ref.waitingSince ||= now; ref.followUpAt = ref.noReplyAt; ref.completedAt = 0;
      } else if (options.keepWaiting !== true) {
        ref.workflowStatus = "active"; ref.waitingSince = 0; ref.followUpAt = 0;
      }
      ref.updatedAt = now;
      this._recordActivity(enabled ? "no-reply-start" : "no-reply-cancel", ref.stableKey, ref.subject);
    }
    this._saveData(enabled ? "no-reply-start" : "no-reply-cancel");
    this._refreshAllStates(true);
    if(this._settings.enableThunderbirdTagSync)this._syncTags(refs.map(ref=>ref.stableKey)).catch(error=>this._recordDiagnostic("warning","Synchronisation des tags impossible",error));
    return {count:refs.length, enabled, dueAt:enabled ? refs[0].noReplyAt : 0};
  }

  _resolveCapturedHeader(item) {
    if (!item) return null;
    try {
      const folder = item.folderURI ? this._thunderbird?.messages?.folderForURL?.(item.folderURI) : null;
      const direct = findHeaderInFolder(folder, item);
      if (direct) return direct;
    } catch {}
    let account = null;
    try { account = (this._thunderbird?.messages?.accountList?.() || []).find(candidate => candidate.key === item.accountKey); } catch {}
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
    const capabilities = this._thunderbird?.snapshot?.().groups || {};
    if (!capabilities.messages?.folderNotifications) missing.push("folder-notifications");
    if (!capabilities.messages?.folderLookup) missing.push("folder-lookup");
    if (!capabilities.messages?.displayMessage) missing.push("message-display");
    if (!capabilities.tags?.registry) missing.push("tag-registry");
    if (!capabilities.calendar?.manager) missing.push("calendar-manager");
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
      skippedRenders: p.skippedRenders || 0,
      createdCards: p.createdCards || 0,
      reusedCards: p.reusedCards || 0,
      reuseRate: (p.createdCards || p.reusedCards) ? Math.round((p.reusedCards || 0) / ((p.createdCards || 0) + (p.reusedCards || 0)) * 1000) / 10 : 0,
      storageBackend: this._storageBackend || "unknown",
      references: Object.keys(this._data?.refs || {}).length
    };
  }

  _registerFolderListener() {
    if (this._folderListenerHandle) return;
    const handle = this._thunderbird?.messages?.registerFolderListener?.({
      msgAdded: msg => this._onMsgAdded(msg),
      msgsDeleted: msgs => this._onMsgsDeleted(msgs),
      msgsMoveCopyCompleted: (move, srcMsgs, destFolder, destMsgs) => this._onMsgsMoveCopyCompleted(move, srcMsgs, destFolder, destMsgs),
      msgsClassified: msgs => { for (const msg of msgs || []) this._onMsgAdded(msg); },
      msgPropertyChanged: (msg, property, oldValue, newValue) => this._onMsgPropertyChanged(msg, property, oldValue, newValue),
      msgKeyChanged: (oldKey, newHdr) => this._onMsgKeyChanged(oldKey, newHdr),
      folderRenamed: (oldFolder, newFolder) => this._onFolderRenamed(oldFolder, newFolder)
    });
    if (handle?.registered) this._folderListenerHandle = handle;
  }

  _unregisterFolderListener() {
    try { this._folderListenerHandle?.dispose?.(); } catch {}
    this._folderListenerHandle = null;
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

  _applyCustomRules(trigger, hdr, {simulate=false, rules=null} = {}) {
    if (!hdr || (simulate ? !this._settings.enableRuleSimulation : !this._settings.enableAutomaticRules)) return simulate ? [] : false;
    let changed=false,logged=false;const results=[];
    const sourceRules = Array.isArray(rules) ? rules : (this._data.rules || []);
    const ordered=PIN_MODULES.PinRules?.ordered(sourceRules)||[...sourceRules];
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
    assertStructuredInput(options, "Options de simulation", {maxBytes: 512 * 1024, maxNodes: 20_000});
    const trigger=["messageAdded","read","archive","reply","move","delete","complete","calendar"].includes(options.trigger)?options.trigger:"messageAdded";
    const candidateRules = Array.isArray(options.rules)
      ? options.rules.slice(0, MAX_RULES).map((rule, index) => normalizeRule(rule, index)).filter(Boolean)
      : (this._data.rules || []);
    const limit=clampNumber(options.limit,1,10000,1000);const matches=[];let scanned=0;
    for(const account of this._thunderbird?.messages?.accountList?.() || []){
      const root=account?.incomingServer?.rootFolder;if(!root)continue;
      for(const folder of walkFolders(root)){
        if(options.accountKey&&account.key!==options.accountKey)continue;if(options.folderURI&&folder.URI!==options.folderURI)continue;
        try{
          const messages=folder.messages;
          while(messages.hasMoreElements()&&scanned<limit){
            const hdr=messages.getNext().QueryInterface(Ci.nsIMsgDBHdr);
            scanned++;
            const simulated=this._applyCustomRules(trigger,hdr,{simulate:true,rules:candidateRules});
            if (Array.isArray(simulated)) matches.push(...simulated);
            if (scanned % 250 === 0) await new Promise(resolve=>Services.tm.dispatchToMainThread(resolve));
          }
        }catch{}
        if(scanned>=limit)break;
      }
      if(scanned>=limit)break;
    }
    return {trigger,scanned,rules: candidateRules.length,matches:matches.slice(0,5000),truncated:matches.length>5000};
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
      const messageTime=Date.now();
      if(outgoing){
        for(const ref of refs){ref.lastOutgoingAt=messageTime;ref.updatedAt=messageTime;changed=true;}
        changed=this._applyCustomRules("reply",hdr)||changed;
        if(this._settings.autoUnpinOnReply){
          for(const ref of refs){this._archiveReferenceHistory(ref,"reply-unpin");changed=this._removeReferenceByKey(ref.stableKey)||changed;}
        } else if(this._settings.enableWaitingWorkflow){
          const now=messageTime;
          for(const ref of refs){
            ref.workflowStatus="waiting";ref.completedAt=0;ref.waitingSince=now;ref.lastOutgoingAt=now;
            const trackingDays=this._settings.enableAutomaticNoReplyTracking?(this._settings.noReplyDefaultDays||5):(this._settings.defaultFollowUpDays||3);
            ref.followUpAt=now+trackingDays*DAY_MS;
            if(this._settings.enableAutomaticNoReplyTracking){ref.noReplyTracking=true;ref.noReplyStartedAt=now;ref.noReplyAt=ref.followUpAt;ref.noReplyBaselineMessageId=String(hdr.messageId||"");}
            if(this._settings.moveToWaitingOnReply&&this._groupForId(this._settings.waitingGroupId))ref.groupId=this._settings.waitingGroupId;
            changed=true;this._recordActivity("reply-sent",ref.stableKey,formatSubject(hdr));
          }
        }
      } else {
        for(const ref of refs){ref.lastReplyAt=messageTime;ref.updatedAt=messageTime;changed=true;}
        if(this._settings.enableWaitingWorkflow){
          for(const ref of refs){if(ref.workflowStatus==="waiting"&&this._settings.reopenOnConversationReply){ref.workflowStatus="active";ref.followUpAt=0;ref.followUpCount=(ref.followUpCount||0)+1;if(this._settings.noReplyCancelOnIncomingReply){ref.noReplyTracking=false;ref.noReplyAt=0;ref.noReplyStartedAt=0;ref.noReplyBaselineMessageId="";}changed=true;this._recordActivity("reply-received",ref.stableKey,formatSubject(hdr));}}
        }
      }
    }
    if(trigger==="read"&&this._settings.autoUnpinOnRead)for(const key of keys)changed=this._removeReferenceByKey(key)||changed;
    if(trigger==="archive"||(trigger==="move"&&destination?.flags&Ci.nsMsgFolderFlags.Archive)){
      if(this._settings.autoUnpinOnArchive)for(const ref of refs){this._archiveReferenceHistory(ref,"archive-unpin");changed=this._removeReferenceByKey(ref.stableKey)||changed;}
      else if(this._settings.autoCompleteOnArchive)for(const ref of refs){ref.completedAt||=Date.now();ref.workflowStatus="completed";this._archiveReferenceHistory(ref,"archive-complete");changed=true;}
    }
    if(trigger==="reply"){
      if(this._settings.autoUnpinOnReply)for(const ref of refs){this._archiveReferenceHistory(ref,"reply-unpin");changed=this._removeReferenceByKey(ref.stableKey)||changed;}
      else if(this._settings.enableWaitingWorkflow){const now=Date.now();for(const ref of refs){ref.workflowStatus="waiting";ref.waitingSince=now;ref.lastOutgoingAt=now;const trackingDays=this._settings.enableAutomaticNoReplyTracking?(this._settings.noReplyDefaultDays||5):(this._settings.defaultFollowUpDays||3);ref.followUpAt=now+trackingDays*DAY_MS;if(this._settings.enableAutomaticNoReplyTracking){ref.noReplyTracking=true;ref.noReplyStartedAt=now;ref.noReplyAt=ref.followUpAt;ref.noReplyBaselineMessageId=String(hdr.messageId||"");}if(this._settings.moveToWaitingOnReply&&this._groupForId(this._settings.waitingGroupId))ref.groupId=this._settings.waitingGroupId;changed=true;}}
    }
    if(trigger==="delete"&&this._settings.autoUnpinOnDelete)for(const ref of refs){this._archiveReferenceHistory(ref,"delete");changed=this._removeReferenceByKey(ref.stableKey)||changed;}
    if(trigger==="move"&&!this._settings.keepPinOnMove)for(const ref of refs)changed=this._removeReferenceByKey(ref.stableKey)||changed;
    if(changed){this._saveData(`rule-${trigger}`);this._refreshAllStates();if(this._settings.enableThunderbirdTagSync){const tagKeys=this._referencesForHeader(hdr).map(ref=>ref.stableKey);this._syncTags(tagKeys).catch(error=>this._recordDiagnostic("warning","Synchronisation des tags impossible",error));}}
    return changed;
  }

  _onMsgAdded(hdr) {
    if(!hdr)return;
    const signature=PIN_MODULES.PinIdentity?.signature(hdr,accountKeyForFolder(hdr.folder),formatSubject(hdr),formatAuthor(hdr));
    let conversationChanged=false;
    for(const ref of Object.values(this._data.refs)){
      if(ref.trackingMode!=="conversation")continue;
      const seed=this._resolveReference(ref,false);const seedSignature=seed&&PIN_MODULES.PinIdentity?.signature(seed,ref.accountKey,formatSubject(seed),formatAuthor(seed));
      const matches=(isStrongConversationKey(ref.conversationKey)&&ref.conversationKey===conversationStableKey(hdr))||(signature&&seedSignature&&PIN_MODULES.PinIdentity?.sameConversation(seedSignature,signature));
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
    if(account?.incomingServer?.rootFolder){for(const folder of walkFolders(account.incomingServer.rootFolder)){try{let count=0;const messages=folder.messages;while(messages.hasMoreElements()&&count++<20000){const hdr=messages.getNext().QueryInterface(Ci.nsIMsgDBHdr);const candidate=PIN_MODULES.PinIdentity?.signature(hdr,accountKeyForFolder(hdr.folder),formatSubject(hdr),formatAuthor(hdr));if((seedSignature&&candidate&&PIN_MODULES.PinIdentity?.sameConversation(seedSignature,candidate))||(isStrongConversationKey(key)&&conversationStableKey(hdr)===key))headers.push(hdr);}}catch{}}}
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
    const allPinned = unique.every(h => hasOwn(this._data.refs, conversationStableKey(h)));
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
    const hdr = this._resolveReference(ref, false);
    const caseItem = (this._data.cases || []).find(item => item.id === ref.caseId);
    const group = this._groupForId(ref.groupId);
    const unread = Boolean(hdr && !(hdr.flags & Ci.nsMsgMessageFlags.Read));
    const missing = !hdr;
    return {
      stableKey: ref.stableKey,
      subject: hdr ? formatSubject(hdr) : ref.subject,
      author: hdr ? formatAuthor(hdr) : ref.author,
      accountKey: ref.accountKey,
      accountName: ref.accountName,
      folderName: ref.folderName,
      date: ref.date,
      pinnedAt: ref.pinnedAt,
      updatedAt: ref.updatedAt || ref.pinnedAt,
      note: ref.note,
      checklist: clone(ref.checklist || []),
      checklistStats: PIN_MODULES.PinChecklists?.stats(ref.checklist) || {total:0,completed:0,pending:0,progress:0},
      responseState: PIN_MODULES.PinAnalytics?.responseState(ref) || "none",
      responseAgeMs: PIN_MODULES.PinAnalytics?.waitingAgeMs(ref) || 0,
      ageMs: PIN_MODULES.PinAnalytics?.ageMs(ref) || 0,
      dueAt: ref.dueAt,
      reminderAt: ref.reminderAt,
      reminderFiredAt: ref.reminderFiredAt,
      reminderAcknowledgedAt: ref.reminderAcknowledgedAt,
      followUpAt: ref.followUpAt,
      snoozeUntil: ref.snoozeUntil,
      priorityLevel: ref.priorityLevel,
      groupId: ref.groupId,
      groupName: group?.name || "",
      caseId: ref.caseId,
      caseName: caseItem?.name || "",
      templateId: ref.templateId,
      completedAt: ref.completedAt,
      workflowStatus: PIN_MODULES.PinWorkflow?.statusForReference(ref) || ref.workflowStatus || "active",
      waitingSince: ref.waitingSince,
      lastReplyAt: ref.lastReplyAt,
      lastOutgoingAt: ref.lastOutgoingAt,
      followUpCount: ref.followUpCount,
      noReplyTracking: Boolean(ref.noReplyTracking),
      noReplyAt: ref.noReplyAt || 0,
      noReplyStartedAt: ref.noReplyStartedAt || 0,
      calendarSyncError: ref.calendarSyncError || "",
      tagSyncError: ref.tagSyncError || "",
      tagLastSyncedAt: ref.tagLastSyncedAt || 0,
      tags: hdr ? getTagMetadata(hdr) : [],
      recurrenceRule: ref.recurrenceRule,
      recurrenceInterval: ref.recurrenceInterval,
      trackingMode: ref.trackingMode,
      conversationCount: ref.conversationCount,
      conversationUnread: ref.conversationUnread,
      unread,
      missing,
      smartSection: PIN_MODULES.PinSmartViews?.sectionFor(ref, {unread, missing, calendarError: Boolean(ref.calendarSyncError)}) || smartSectionForRef(ref),
      accountColor: this._getAccountColor(ref.accountKey),
      calendarItemId: ref.calendarItemId,
      calendarId: ref.calendarId,
      activity: includeActivity ? (this._data.activity || []).filter(item => item.stableKey === ref.stableKey).slice(-20) : undefined
    };
  }

  _getDashboardData(options = {}) {
    assertStructuredInput(options, "Options du tableau de bord", {maxBytes: 64 * 1024, maxNodes: 1000});
    const validFilters = new Set(["active", "all", "overdue", "today", "week", "completed", "unread", "waiting", "planned", "noReply", "snoozed", "noDue", "missing", "calendarError", "recentCompleted", "waitingForThem", "needsReply", "checklistPending"]);
    const validViews = new Set(["today", "list", "kanban", "cases", "review", "history", "health"]);
    const filter = validFilters.has(options.filter) ? options.filter : (this._data.dashboard?.filter || "active");
    const smartView = validFilters.has(options.smartView) ? options.smartView : (this._data.dashboard?.smartView || this._settings.defaultSmartView || "today");
    const savedViewId = String(options.savedViewId ?? this._data.dashboard?.savedViewId ?? "").slice(0, 80);
    const savedView = (this._data.savedViews || []).find(item => item.id === savedViewId) || null;
    const rawSearch = options.search !== undefined ? options.search : (savedView?.search ?? this._data.dashboard?.search ?? "");
    const search = sanitizeSearchText(rawSearch);
    const view = validViews.has(options.view) ? options.view : (this._data.dashboard?.view || "today");
    const reviewMode = options.reviewMode === "weekly" ? "weekly" : (options.reviewMode === "daily" ? "daily" : (this._data.dashboard?.reviewMode === "weekly" ? "weekly" : "daily"));
    const nextDashboard = {filter, smartView, search: String(rawSearch || "").slice(0, 500), view, reviewMode, savedViewId: savedView?.id || ""};
    if ((PIN_MODULES.PinStorageHelpers?.stableStringify(this._data.dashboard) || JSON.stringify(this._data.dashboard)) !==
        (PIN_MODULES.PinStorageHelpers?.stableStringify(nextDashboard) || JSON.stringify(nextDashboard))) {
      this._data.dashboard = nextDashboard;
      this._saveData("dashboard-state");
    }

    const refs = Object.values(this._data.refs);
    const now = Date.now();
    const serializedAll = refs.map(ref => this._serializeReference(ref));
    const serializedByKey = new Map(serializedAll.map(item => [item.stableKey, item]));
    const allItems = [];
    for (const item of serializedAll) {
      const ref = this._data.refs[item.stableKey];
      const context = {unread: item.unread, missing: item.missing, calendarError: Boolean(item.calendarSyncError), now};
      const activeFilter = savedView?.smartView || (options.useSmartView !== false && this._settings.enableSmartViews ? smartView : filter);
      const matches = PIN_MODULES.PinSmartViews?.matches(activeFilter, ref, {...context, responseState:item.responseState, checklistStats:item.checklistStats}) ?? (activeFilter === "all" || item.smartSection === activeFilter || item.workflowStatus === activeFilter);
      if (!matches) continue;
      const searchText = [item.subject, item.author, item.note, PIN_MODULES.PinChecklists?.searchableText(item.checklist), (item.tags || []).map(tag => tag.name || tag.key).join(" "), item.accountName, item.folderName, item.groupName, item.caseName, item.workflowStatus, item.responseState].join(" ");
      const normalizedSearchText = sanitizeSearchText(searchText);
      const searchTokens = search.split(/\s+/).filter(Boolean);
      if (searchTokens.some(token => !normalizedSearchText.includes(token))) continue;
      if (savedView && !PIN_MODULES.PinSavedViews?.matches(savedView, {...item, searchText}, {normalizeText:sanitizeSearchText, smartMatches:(viewId, candidate)=>PIN_MODULES.PinSmartViews?.matches(viewId, ref, {...context,responseState:candidate.responseState,checklistStats:candidate.checklistStats})})) continue;
      allItems.push(item);
    }
    allItems.sort((left, right) =>
      (left.snoozeUntil || left.dueAt || left.followUpAt || left.noReplyAt || Number.MAX_SAFE_INTEGER) -
      (right.snoozeUntil || right.dueAt || right.followUpAt || right.noReplyAt || Number.MAX_SAFE_INTEGER) || right.date - left.date);

    const smartCounts = PIN_MODULES.PinSmartViews?.counts(serializedAll.map(item => ({ref: item, unread: item.unread, missing: item.missing, calendarError: Boolean(item.calendarSyncError), responseState:item.responseState, checklistStats:item.checklistStats})), now) || {};
    const dailyReview = PIN_MODULES.PinReview?.build(serializedAll, {now, mode: "daily"}) || {mode: "daily", buckets: {}, counts: {}, actionable: 0, total: 0};
    const weeklyReview = PIN_MODULES.PinReview?.build(serializedAll, {now, mode: "weekly"}) || {mode: "weekly", buckets: {}, counts: {}, actionable: 0, total: 0};
    const relatedGroups = (PIN_MODULES.PinRelated?.detect(refs) || []).map(group => ({
      ...group,
      items: group.stableKeys.map(key => serializedByKey.get(key)).filter(Boolean)
    }));
    const pendingReminders = (PIN_MODULES.PinReview?.pendingReminders(serializedAll, {now}) || []).slice(0, 20);
    const diagnosticSummary = PIN_MODULES.PinDiagnostics?.summary(this._diagnosticEvents || []) || {total: (this._diagnosticEvents || []).length, counts: {}};
    const health = PIN_MODULES.PinHealth?.build({data: this._data, settings: this._settings, compatibility: this._compatibility, performance: this._getPerformanceReport(), diagnostics: diagnosticSummary}) || null;
    return {
      items: allItems,
      filter,
      smartView,
      search: String(rawSearch || ""),
      view,
      reviewMode,
      smartViews: clone(PIN_MODULES.PinSmartViews?.VIEWS || []),
      savedViews: clone(this._data.savedViews || []),
      savedViewId: savedView?.id || "",
      smartCounts,
      todayPlan: dailyReview,
      review: reviewMode === "weekly" ? weeklyReview : dailyReview,
      pendingReminders,
      relatedGroups,
      groups: clone(this._data.groups),
      cases: clone(this._data.cases || []),
      templates: clone(this._data.templates || []),
      history: this._getHistory({limit: 200, search: options.historySearch !== undefined ? options.historySearch : rawSearch}),
      ruleLog: clone((this._data.ruleLog || []).slice(-200).reverse()),
      stats: {
        total: refs.length,
        active: refs.filter(ref => (ref.workflowStatus || "active") === "active" && !ref.completedAt).length,
        waiting: refs.filter(ref => ref.workflowStatus === "waiting").length,
        planned: refs.filter(ref => ref.workflowStatus === "planned").length,
        completed: refs.filter(ref => ref.completedAt || ref.workflowStatus === "completed").length,
        overdue: refs.filter(ref => !ref.completedAt && ((ref.dueAt && ref.dueAt < now) || (ref.followUpAt && ref.followUpAt < now))).length,
        noReply: refs.filter(ref => ref.noReplyTracking).length,
        snoozed: refs.filter(ref => Number(ref.snoozeUntil || 0) > now && !ref.completedAt).length,
        missing: refs.filter(ref => ref.missingSince).length,
        ...(PIN_MODULES.PinAnalytics?.build(refs, this._data.history || [], now, value => PIN_MODULES.PinChecklists?.stats(value) || {pending:0}) || {})
      },
      activity: clone((this._data.activity || []).slice(-100).reverse()),
      compatibility: clone(this._compatibility),
      providerMatrix: clone(this._data.providerMatrix || DEFAULT_DATA.providerMatrix),
      performance: this._getPerformanceReport(),
      health,
      diagnostics: diagnosticSummary,
      revision: this._data.revision || 0,
      counterRegressionEvents: clone(this._counterRegressionEvents || [])
    };
  }

  _mergeRelatedReferences(stableKeys) {
    const keys = normalizeStableKeyList(stableKeys).slice(0, 50);
    const refs = keys.map(key => this._data.refs[key]).filter(Boolean);
    if (refs.length < 2) throw new ExtensionError("Sélectionnez au moins deux épingles associées.");
    if (this._settings.pinMode === "nativeStar") {
      throw new ExtensionError("La fusion de conversations est indisponible lorsque l’étoile native pilote les épingles.");
    }
    const identitySets = refs.map(ref => new Set(PIN_MODULES.PinRelated?.identityKeys(ref) || []));
    const sharedIdentities = [...identitySets[0]].filter(identity => identitySets.every(set => set.has(identity)));
    if (!sharedIdentities.length) throw new ExtensionError("Ces épingles ne partagent pas une identité de conversation suffisamment fiable.");

    const calendarLinks = [...new Set(refs.map(ref => ref.calendarItemId).filter(Boolean))];
    if (calendarLinks.length > 1) {
      throw new ExtensionError("Plusieurs éléments Agenda distincts sont liés à cette conversation. Retirez les doublons Agenda avant la fusion.");
    }
    const seedHeader = refs.map(ref => this._resolveReference(ref, true)).find(Boolean);
    if (!seedHeader) throw new ExtensionError("La conversation ne peut pas être résolue dans Thunderbird.");

    this._pushUndo("Fusion des épingles associées");
    const target = this._ensureReference(seedHeader, seedHeader.folder?.URI || refs[0].sourceInboxURI || "", "conversation");
    const metadata = PIN_MODULES.PinRelated?.mergeMetadata([...refs, target]);
    if (!metadata) throw new ExtensionError("La fusion des métadonnées a échoué.");
    Object.assign(target, {
      note: metadata.note,
      priorityLevel: metadata.priorityLevel,
      pinnedAt: metadata.pinnedAt,
      dueAt: metadata.dueAt,
      reminderAt: metadata.reminderAt,
      followUpAt: metadata.followUpAt,
      snoozeUntil: metadata.snoozeUntil,
      groupId: metadata.groupId,
      caseId: metadata.caseId,
      noReplyTracking: metadata.noReplyTracking,
      noReplyAt: metadata.noReplyAt,
      noReplyStartedAt: metadata.noReplyStartedAt,
      workflowStatus: metadata.workflowStatus,
      trackingMode: "conversation",
      updatedAt: Date.now()
    });
    const linked = refs.find(ref => ref.calendarItemId);
    if (linked && !target.calendarItemId) {
      target.calendarId = linked.calendarId;
      target.calendarItemId = linked.calendarItemId;
      target.calendarItemType = linked.calendarItemType;
    }
    this._updateConversationReference(target, seedHeader);

    let removed = 0;
    for (const ref of refs) {
      if (ref.stableKey === target.stableKey) continue;
      if (this._removeReferenceByKey(ref.stableKey, {archiveAction: "merge-related", deleteCalendar: false})) removed++;
    }
    this._recordActivity("merge-related", target.stableKey, target.subject);
    this._saveData("merge-related");
    this._resolveCache?.clear();
    this._conversationCache?.clear();
    this._refreshAllStates(true);
    this._showToastAll(`${removed + 1} épingle(s) regroupée(s) en une conversation.`, true);
    return {
      count: removed + 1,
      removed,
      stableKey: target.stableKey,
      identity: sharedIdentities[0],
      groupConflict: new Set(refs.map(ref => ref.groupId || "")).size > 1,
      caseConflict: new Set(refs.map(ref => ref.caseId || "")).size > 1
    };
  }

  _openReference(stableKey) {
    stableKey = boundedText(stableKey, 8192);
    const ref = this._data.refs[stableKey];
    if (!ref) return {opened: false};
    let hdr = this._resolveReference(ref, true);
    if (hdr && ref.trackingMode === "conversation") hdr = this._updateConversationReference(ref, hdr);
    if (!hdr) return {opened: false, missing: true};
    try { if (this._thunderbird?.messages?.displayMessageInFolderTab?.(hdr)) return {opened: true}; return {opened: false}; }
    catch (error) { this._recordDiagnostic("error", "Ouverture du message impossible", error); return {opened: false}; }
  }

  _performReferenceAction(stableKeys, action, options = {}) {
    assertStructuredInput(options, "Options d’action", {maxBytes: 64 * 1024, maxNodes: 1000});
    const bulk = PIN_MODULES.PinBulk;
    const normalizedAction = boundedText(action, 64);
    const boundedKeys = normalizeStableKeyList(stableKeys);
    const keys = bulk?.normalizeKeys(boundedKeys, MAX_BULK_KEYS) || boundedKeys;
    if (!keys.length || (bulk && !bulk.supported(normalizedAction))) return {count: 0, unsupported: Boolean(normalizedAction)};
    const actionKeys = bulk?.requiresSingle(normalizedAction) ? keys.slice(0, 1) : keys;
    const refs = actionKeys.map(key => this._data.refs[key]).filter(Boolean);
    if (!refs.length) return {count: 0};
    const normalizedOptions = bulk?.normalizeOptions(normalizedAction, options, {defaultNoReplyDays: this._settings.noReplyDefaultDays}) || options || {};
    this._recordDiagnostic("debug", "Action groupée demandée", `${normalizedAction} · ${refs.length} élément(s)`, {component: "bulk-actions", action: normalizedAction});

    if (normalizedAction === "open") return this._openReference(refs[0].stableKey);
    if (["complete", "uncomplete", "active", "waiting", "planned"].includes(normalizedAction)) {
      return this._setWorkflowStatus(actionKeys, normalizedAction === "uncomplete" ? "active" : normalizedAction === "complete" ? "completed" : normalizedAction, normalizedOptions);
    }
    if (normalizedAction === "unpin") {
      this._pushUndo("Désépinglage");
      for (const ref of refs) this._removeReferenceByKey(ref.stableKey, {archiveAction: "unpin"});
      this._saveData("unpin");
      this._refreshAllStates(true);
      return {count: refs.length};
    }
    if (normalizedAction === "snooze") return this._snoozeReferences(actionKeys, normalizedOptions);
    if (normalizedAction === "wake") return this._wakeReferences(actionKeys);
    if (normalizedAction === "dismissReminder") return this._acknowledgeReminders(actionKeys);
    if (normalizedAction === "trackNoReply") return this._setNoReplyTracking(actionKeys, {...normalizedOptions, enabled: true});
    if (normalizedAction === "cancelNoReply") return this._setNoReplyTracking(actionKeys, {...normalizedOptions, enabled: false});
    if (normalizedAction === "priority") {
      this._pushUndo("Modification de priorité");
      for (const ref of refs) { ref.priorityLevel = normalizedOptions.priorityLevel; ref.updatedAt = Date.now(); }
      this._saveData("bulk-priority");
      this._refreshAllStates(true);
      return {count: refs.length, priorityLevel: normalizedOptions.priorityLevel};
    }
    if (normalizedAction === "deadline") {
      this._pushUndo("Modification d’échéance");
      for (const ref of refs) {
        ref.dueAt = normalizedOptions.dueAt;
        ref.updatedAt = Date.now();
        if (ref.dueAt && this._settings.enableReminders) {
          ref.reminderAt = Math.max(Date.now(), ref.dueAt - (ref.reminderLeadMinutes || this._settings.reminderLeadMinutes || 0) * 60_000);
        } else if (!ref.dueAt) {
          ref.reminderAt = 0;
        }
      }
      this._saveData("bulk-deadline");
      this._refreshAllStates(true);
      return {count: refs.length, dueAt: normalizedOptions.dueAt};
    }
    if (normalizedAction === "calendar") return this._createCalendarItem(refs[0].stableKey, normalizedOptions.itemType, normalizedOptions.calendarId);
    if (normalizedAction === "group") {
      this._pushUndo("Changement de groupe");
      const groupId = this._groupForId(normalizedOptions.groupId) ? normalizedOptions.groupId : "";
      for (const ref of refs) { ref.groupId = groupId; ref.updatedAt = Date.now(); }
      this._saveData("group");
      this._refreshAllStates(true);
      return {count: refs.length, groupId};
    }
    if (normalizedAction === "case") {
      this._pushUndo("Changement d’affaire");
      const caseId = (this._data.cases || []).some(item => item.id === normalizedOptions.caseId) ? normalizedOptions.caseId : "";
      for (const ref of refs) { ref.caseId = caseId; ref.updatedAt = Date.now(); }
      this._saveData("case-assign");
      this._refreshAllStates(true);
      return {count: refs.length, caseId};
    }
    if (normalizedAction === "template") return this._applyTemplate(actionKeys, normalizedOptions.templateId);
    if (normalizedAction === "setMetadata") {
      let count = 0;
      for (const ref of refs) if (this._setReferenceMetadata(ref.stableKey, options)) count++;
      return {count};
    }

    const headers = refs.map(ref => this._resolveReference(ref, true)).filter(Boolean);
    if (["read", "unread", "toggleRead", "archive", "delete", "reply"].includes(normalizedAction)) {
      const about3Pane = Services.wm.getMostRecentWindow("mail:3pane")?.document?.getElementById("tabmail")?.currentAbout3Pane || null;
      const result = this._performMessageAction(normalizedAction, headers, about3Pane) || {count: 0};
      return {...result, requested: refs.length, resolved: headers.length};
    }
    return {count: 0, unsupported: true};
  }

  _registerCalendarObservers() {
    if (!this._settings.enableCalendarIntegration || !this._settings.enableBidirectionalCalendarSync) return;
    this._thunderbird?.calendar?.registerObservers?.(
      this._calendarObservers,
      {changed: (item, deleted) => this._onCalendarItemChanged(item, deleted)},
      (calendar, error) => this._recordDiagnostic("warning", `Observateur Agenda impossible : ${calendar?.name || calendar?.id || "inconnu"}`, error)
    );
  }

  _unregisterCalendarObservers() {
    this._thunderbird?.calendar?.unregisterObservers?.(this._calendarObservers);
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
    const calendars=(this._thunderbird?.calendar?.calendars?.() || []);
    return calendars.find(item=>item.id===ref.calendarId)||null;
  }

  async _calendarItemForRef(ref) {
    const calendar=this._calendarForRef(ref);if(!calendar||!ref.calendarItemId)return {calendar,item:null};
    try{return {calendar,item:await this._thunderbird?.calendar?.getItem?.(calendar, ref.calendarItemId)};}catch(error){this._recordDiagnostic("warning","Lecture de l’élément Agenda impossible",error);return {calendar,item:null};}
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
    if(changed){
      this._recordActivity("calendar-sync",stableKey,ref.subject);
      this._saveData("calendar-to-pin");
      this._refreshAllStates(true);
      if (this._settings.enableThunderbirdTagSync) {
        try {
          this._syncReferenceTags(ref);
        } catch (error) {
          this._recordDiagnostic("warning", "Synchronisation des tags après Agenda impossible", error);
        }
      }
    }
  }

  async _syncReferenceToCalendar(ref) {
    if (!this._settings.enableCalendarIntegration || !this._settings.enableBidirectionalCalendarSync || !ref?.calendarItemId) return {synced: false};
    const {calendar, item} = await this._calendarItemForRef(ref);
    if (!calendar || !item) return {synced: false, missing: true};
    const type = ref.calendarItemType === "event" ? "event" : "task";
    const descriptor = this._calendarDescriptor(calendar);
    const compatible = type === "event" ? descriptor.eventCompatible : descriptor.taskCompatible;
    if (!compatible) { const error=this._calendarOperationError("Calendrier devenu incompatible", descriptor, type); ref.calendarSyncError=String(error.message||error).slice(0,500); throw error; }
    const cloneItem = item.clone();
    const due = ref.dueAt || ref.followUpAt || 0;
    this._thunderbird?.calendar?.applySchedule?.(cloneItem, type, due);
    if (type !== "event" && this._settings.calendarCompleteOnPinComplete) {
      try { this._thunderbird?.calendar?.applyCompletion?.(cloneItem, ref.completedAt); } catch {}
    }
    cloneItem.title = ref.subject || cloneItem.title;
    cloneItem.setProperty("X-PIN-MAILS-STABLE-KEY", ref.stableKey);
    let saved;
    try {
      saved = await this._thunderbird?.calendar?.modifyItem?.(calendar, cloneItem, item);
    } catch (error) {
      const wrapped=this._calendarOperationError(error, descriptor, type);
      ref.calendarSyncError=String(wrapped.message||wrapped).slice(0,500);
      ref.updatedAt=Date.now();
      this._saveData("calendar-sync-error");
      throw wrapped;
    }
    ref.calendarSyncError = "";
    ref.calendarLastSyncedAt = Date.now();
    ref.calendarSyncHash = `${ref.dueAt}|${ref.completedAt}|${ref.subject}`;
    return {synced: true, itemId: saved?.id || item.id};
  }

  async _syncCalendarLinks(force=false) {
    if(!this._settings.enableCalendarIntegration||!this._settings.enableBidirectionalCalendarSync)return {synced:0,missing:0};
    if(!force&&Date.now()-this._lastCalendarSyncAt<CALENDAR_SYNC_INTERVAL_MS/2)return {synced:0,skipped:true};
    this._lastCalendarSyncAt=Date.now();let synced=0,missing=0,casesSynced=0;
    for(const ref of Object.values(this._data.refs)){
      if(!ref.calendarItemId)continue;
      try {
        const result=await this._syncReferenceToCalendar(ref);
        if(result.synced)synced++;
        if(result.missing){missing++;ref.calendarId="";ref.calendarItemId="";ref.calendarSyncError="Élément Agenda introuvable";}
      } catch (error) { missing++; ref.calendarSyncError=String(error?.message||error).slice(0,500); this._recordDiagnostic("warning",`Synchronisation Agenda impossible : ${hashString(String(ref.stableKey)).toString(16)}`,error,{component:"calendar"}); }
    }
    for (const caseItem of this._data.cases || []) {
      if (!caseItem.calendarItemId || !caseItem.calendarId) continue;
      try {
        const result = await this._createCaseCalendarItem(caseItem.id, caseItem.calendarItemType || "task", caseItem.calendarId, {save:false,refresh:false,createIfMissing:false});
        if (result.updated) casesSynced++;
      } catch (error) {
        missing++;
        this._recordDiagnostic("warning", `Synchronisation Agenda de l’affaire impossible : ${caseItem.name}`, error);
      }
    }
    if(missing||synced||casesSynced)this._saveData("calendar-sync");
    return {synced,missing,casesSynced};
  }

  _calendarCapabilitySupported(calendar, itemType) {
    return this._thunderbird?.calendar?.capabilitySupported?.(calendar, itemType) ?? false;
  }

  _calendarDescriptor(calendar) {
    const base = this._thunderbird?.calendar?.descriptor?.(calendar) || {
      id: String(calendar?.id || ""), name: String(calendar?.name || ""), type: String(calendar?.type || ""),
      readOnly: true, disabled: false, aclWritable: false, writable: false,
      taskSupported: false, eventSupported: false, taskCompatible: false, eventCompatible: false
    };
    const reasons = [];
    if (base.disabled) reasons.push(this._t("calendarDisabledReason", ""));
    if (base.readOnly) reasons.push(this._t("calendarReadOnlyReason", ""));
    if (!base.readOnly && !base.aclWritable) reasons.push(this._t("calendarAclDeniedReason", ""));
    if (!base.taskSupported && !base.eventSupported) reasons.push(this._t("calendarItemsUnsupportedReason", ""));
    return {
      ...base,
      name: base.name || this._t("calendarUnnamed", ""),
      reason: reasons.join(" · ")
    };
  }

  _getCalendars() {
    if (!this._settings.enableCalendarIntegration) return [];
    try {
      return (this._thunderbird?.calendar?.calendars?.() || []).map(calendar => this._calendarDescriptor(calendar));
    } catch (error) {
      this._recordDiagnostic("warning", "Calendriers indisponibles", error);
      return [];
    }
  }

  _selectCalendarForItem(itemType, calendarId = "") {
    const type = itemType === "event" ? "event" : "task";
    const calendars = (this._thunderbird?.calendar?.calendars?.() || []);
    const descriptors = calendars.map(calendar => this._calendarDescriptor(calendar));
    const compatible = descriptor => type === "event"
      ? descriptor.eventCompatible
      : descriptor.taskCompatible;
    const wanted = String(calendarId || this._settings.preferredCalendarId || "");
    if (wanted) {
      const index = descriptors.findIndex(item => item.id === wanted);
      if (index < 0) {
        throw new ExtensionError("Le calendrier sélectionné n’existe plus. Choisissez un autre calendrier.");
      }
      const descriptor = descriptors[index];
      if (!compatible(descriptor)) {
        const itemLabel = type === "event" ? "événement" : "tâche";
        const article = type === "event" ? "cet" : "cette";
        const reason = descriptor.reason || `${itemLabel} non pris en charge`;
        throw new ExtensionError(`Le calendrier « ${descriptor.name} » ne peut pas recevoir ${article} ${itemLabel} : ${reason}.`);
      }
      return {calendar: calendars[index], descriptor};
    }
    const index = descriptors.findIndex(compatible);
    if (index < 0) {
      const itemLabel = type === "event" ? "événement" : "tâche";
      throw new ExtensionError(`Aucun calendrier inscriptible compatible avec ce type d’${itemLabel} n’est disponible.`);
    }
    return {calendar: calendars[index], descriptor: descriptors[index]};
  }

  _calendarOperationError(error, descriptor, itemType) {
    const raw = String(error?.message || error || "MODIFICATION_FAILED");
    const label = itemType === "event" ? "l’événement" : "la tâche";
    const state = descriptor?.reason || (descriptor?.writable ? this._t("calendarWriteAllowed", "") : this._t("calendarStateUnknown", ""));
    this._recordDiagnostic("warning", this._t("calendarWriteRefused", ""), raw, {component: "calendar"});
    return new ExtensionError(
      this._t("calendarWriteFailed", "", {label, calendar: descriptor?.name || this._t("calendarUnknown", ""), state})
    );
  }

  async _createCalendarItem(stableKey, itemType = "", calendarId = "") {
    stableKey = boundedText(stableKey, 8192);
    calendarId = boundedText(calendarId, 512);
    if (!this._settings.enableCalendarIntegration) throw new ExtensionError("L’intégration Agenda est désactivée.");
    const ref = this._data.refs[String(stableKey || "")];
    if (!ref) throw new ExtensionError("Message épinglé introuvable.");
    const type = itemType === "event" ? "event" : (itemType === "task" ? "task" : this._settings.calendarItemType);
    if (ref.calendarItemId) {
      const existing = await this._calendarItemForRef(ref);
      if (existing.item) {
        await this._syncReferenceToCalendar(ref);
        return {created: false, updated: true, calendarId: ref.calendarId, itemId: ref.calendarItemId, itemType: ref.calendarItemType};
      }
    }
    const {calendar, descriptor} = this._selectCalendarForItem(type, calendarId);
    const hdr = this._resolveReference(ref, true);
    const start = ref.dueAt || ref.followUpAt || Date.now() + 3600000;
    const description = [
      ref.note,
      hdr ? `Message : ${hdr.folder.getUriForMsg(hdr)}` : "",
      `Expéditeur : ${ref.author}`,
      ref.caseId ? `Affaire : ${(this._data.cases || []).find(item => item.id === ref.caseId)?.name || ref.caseId}` : ""
    ].filter(Boolean).join("\n\n");
    const item = this._thunderbird?.calendar?.createItem?.(type, {
      calendar,
      title: ref.subject || "Message épinglé",
      startAt: start,
      dueAt: start,
      properties: {
        DESCRIPTION: description,
        "X-PIN-MAILS-STABLE-KEY": ref.stableKey,
        "X-PIN-MAILS-VERSION": "3"
      }
    });
    if (!item) throw new ExtensionError("L’intégration Agenda n’est pas disponible dans cette version de Thunderbird.");
    let saved;
    try {
      saved = await this._thunderbird?.calendar?.addItem?.(calendar, item);
    } catch (error) {
      throw this._calendarOperationError(error, descriptor, type);
    }
    ref.calendarId = calendar.id;
    ref.calendarItemId = saved?.id || item.id || "";
    ref.calendarItemType = type;
    ref.calendarLastSyncedAt = Date.now();
    this._registerCalendarObservers();
    this._recordActivity("calendar", ref.stableKey, `${type === "event" ? "Événement" : "Tâche"} créé`);
    this._saveData("calendar");
    this._refreshAllStates(true);
    return {created: true, calendarId: calendar.id, itemId: ref.calendarItemId, itemType: type};
  }


  async _deleteLinkedCaseCalendarItem(caseItem) {
    if (!caseItem?.calendarId || !caseItem?.calendarItemId) return {deleted:false};
    const calendar=(this._thunderbird?.calendar?.calendars?.() || []).find(item=>item.id===caseItem.calendarId);
    if (!calendar) return {deleted:false,missing:true};
    const item=await this._thunderbird?.calendar?.getItem?.(calendar, caseItem.calendarItemId);
    if (!item) return {deleted:false,missing:true};
    await this._thunderbird?.calendar?.deleteItem?.(calendar, item);
    return {deleted:true};
  }

  async _createCaseCalendarItem(caseId, itemType = "task", calendarId = "", {save=true,refresh=true,createIfMissing=true} = {}) {
    caseId = boundedText(caseId, 64);
    calendarId = boundedText(calendarId, 512);
    if(!this._settings.enableCalendarIntegration)throw new ExtensionError("L’intégration Agenda est désactivée.");
    const caseItem=(this._data.cases||[]).find(item=>item.id===String(caseId||""));if(!caseItem)throw new ExtensionError("Affaire introuvable.");
    if (!String(caseItem.name || "").trim()) throw new ExtensionError(this._t("caseCalendarTitleRequired", ""));
    if (!Number.isFinite(Number(caseItem.dueAt)) || Number(caseItem.dueAt) <= 0) {
      throw new ExtensionError(this._t("caseCalendarDueRequired", ""));
    }
    const type = itemType === "event" ? "event" : "task";
    const calendars = (this._thunderbird?.calendar?.calendars?.() || []);
    if(caseItem.calendarItemId&&caseItem.calendarId){
      try{
        const existingCalendar=calendars.find(item=>item.id===caseItem.calendarId);
        if (!existingCalendar) {
          if (!createIfMissing) return {created:false,updated:false,missing:true,caseId:caseItem.id};
        } else {
          const existingDescriptor = this._calendarDescriptor(existingCalendar);
          const compatible = type === "event" ? existingDescriptor.eventCompatible : existingDescriptor.taskCompatible;
          if (!compatible) throw this._calendarOperationError("Calendrier lié devenu incompatible", existingDescriptor, type);
        }
        const existing=await this._thunderbird?.calendar?.getItem?.(existingCalendar, caseItem.calendarItemId);
        if(existing){
          const cloneItem=existing.clone();
          cloneItem.title=caseItem.name||"Affaire";
          cloneItem.setProperty("DESCRIPTION",caseItem.note||"");
          cloneItem.setProperty("X-PIN-MAILS-CASE-ID",caseItem.id);
          this._thunderbird?.calendar?.applySchedule?.(cloneItem, existing.type === "event" || cloneItem.startDate ? "event" : "task", caseItem.dueAt);
          try { this._thunderbird?.calendar?.applyCompletion?.(cloneItem, caseItem.status === "completed" ? Date.now() : 0); } catch {}
          try {
            await this._thunderbird?.calendar?.modifyItem?.(existingCalendar, cloneItem, existing);
          } catch (error) {
            throw this._calendarOperationError(error, this._calendarDescriptor(existingCalendar), type);
          }
          caseItem.calendarItemType=type;
          caseItem.updatedAt=Date.now();
          if(save)this._saveData("case-calendar-update");
          if(refresh)this._refreshAllStates(true);
          return{created:false,updated:true,caseId:caseItem.id,calendarId:caseItem.calendarId,itemId:caseItem.calendarItemId,itemType:type};
        }
        if (!createIfMissing) return {created:false,updated:false,missing:true,caseId:caseItem.id};
      }catch(error){
        this._recordDiagnostic("warning","Mise à jour Agenda de l’affaire impossible",error);
        if (!createIfMissing) return {created:false,updated:false,missing:true,caseId:caseItem.id};
      }
    }
    if (!calendarId && !caseItem.calendarId) {
      throw new ExtensionError(this._t("caseCalendarSelectionRequired", ""));
    }
    const {calendar, descriptor} = this._selectCalendarForItem(type, calendarId || caseItem.calendarId);
    const start=caseItem.dueAt;
    const item=this._thunderbird?.calendar?.createItem?.(type,{
      calendar, title: caseItem.name || "Affaire", startAt: start, dueAt: start,
      properties: {DESCRIPTION: caseItem.note || "", "X-PIN-MAILS-CASE-ID": caseItem.id, "X-PIN-MAILS-VERSION": "3"}
    });
    if (!item) throw new ExtensionError("L’intégration Agenda n’est pas disponible dans cette version de Thunderbird.");
    let saved;
    try {
      saved = await this._thunderbird?.calendar?.addItem?.(calendar, item);
    } catch (error) {
      throw this._calendarOperationError(error, descriptor, type);
    }
    caseItem.calendarId=calendar.id;caseItem.calendarItemId=saved?.id||item.id||"";caseItem.calendarItemType=type;caseItem.updatedAt=Date.now();this._registerCalendarObservers();
    if(save)this._saveData("case-calendar");
    if(refresh)this._refreshAllStates(true);
    return{created:true,caseId:caseItem.id,calendarId:calendar.id,itemId:caseItem.calendarItemId,itemType:type};
  }

  _snoozeReferences(stableKeys, options = {}) {
    assertStructuredInput(options, "Options de mise en veille", {maxBytes: 64 * 1024, maxNodes: 1000});
    const keys = normalizeStableKeyList(stableKeys).slice(0, MAX_BULK_KEYS);
    const refs = keys.map(key => this._data.refs[key]).filter(Boolean);
    if (!refs.length) return {count: 0, snoozed: false};
    const now = Date.now();
    const duration = clampNumber(options.durationMs, 60_000, 30 * DAY_MS, 3_600_000);
    const requestedUntil = Number(options.until) || 0;
    const until = requestedUntil > now ? Math.min(requestedUntil, now + 30 * DAY_MS) : now + duration;
    this._pushUndo("Mise en veille");
    for (const ref of refs) {
      ref.snoozeUntil = until;
      ref.reminderFiredAt = 0;
      ref.reminderAcknowledgedAt = 0;
      ref.updatedAt = now;
      this._recordActivity("snooze", ref.stableKey, new Date(until).toISOString());
    }
    this._saveData("snooze");
    this._refreshAllStates(true);
    this._showToastAll(`${refs.length} message(s) mis en veille.`, true);
    return {count: refs.length, snoozed: true, until};
  }

  _wakeReferences(stableKeys) {
    const keys = normalizeStableKeyList(stableKeys).slice(0, MAX_BULK_KEYS);
    const refs = keys.map(key => this._data.refs[key]).filter(Boolean);
    if (!refs.length) return {count: 0, woken: false};
    const now = Date.now();
    this._pushUndo("Réveil des messages");
    for (const ref of refs) {
      ref.snoozeUntil = 0;
      ref.reminderFiredAt = 0;
      ref.reminderAcknowledgedAt = 0;
      ref.updatedAt = now;
      this._recordActivity("wake", ref.stableKey, ref.subject);
    }
    this._saveData("wake");
    this._refreshAllStates(true);
    this._showToastAll(`${refs.length} message(s) réveillé(s).`, true);
    return {count: refs.length, woken: true};
  }

  _acknowledgeReminders(stableKeys) {
    const keys = normalizeStableKeyList(stableKeys).slice(0, MAX_BULK_KEYS);
    const refs = keys.map(key => this._data.refs[key]).filter(Boolean);
    if (!refs.length) return {count: 0};
    const now = Date.now();
    for (const ref of refs) {
      ref.reminderAcknowledgedAt = now;
      ref.updatedAt = now;
      this._recordActivity("reminder-acknowledged", ref.stableKey, ref.subject);
    }
    this._saveData("reminder-acknowledged");
    this._refreshAllStates(true);
    return {count: refs.length, acknowledged: true};
  }

  _snoozeReminder(stableKey, durationMs) {
    const result = this._snoozeReferences([boundedText(stableKey, 8192)], {durationMs});
    return {snoozed: Boolean(result.count), until: result.until || 0, count: result.count || 0};
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
    if (!usable.length) return {count: 0};
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
      return {count: usable.length, read: targetRead};
    }
    if (action === "reply" && usable.length === 1) {
      const hdr = usable[0];
      const opened = this._thunderbird?.messages?.openReply?.(hdr, about3Pane?.msgWindow || null) || false;
      if (opened) this._recordActivity("reply-compose", messageStableKey(hdr), formatSubject(hdr));
      return {count: opened ? 1 : 0, opened};
    }
    if (action === "archive") {
      const requested = this._thunderbird?.messages?.archive?.(usable, about3Pane?.msgWindow || null, () => this._refreshAllStates(true)) || false;
      if (requested) this._showToastAll(`${usable.length} message(s) archivé(s).`, false);
      return {count: requested ? usable.length : 0, requested};
    }
    if (action === "delete") {
      if (this._settings.confirmDelete) {
        const accepted = about3Pane?.confirm
          ? about3Pane.confirm(`Supprimer ${usable.length} message(s) ?`)
          : Services.prompt.confirm(null, "MailPerch", `Supprimer ${usable.length} message(s) ?`);
        if (!accepted) return {count: 0, cancelled: true};
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
      return {count: usable.length, requested: true};
    }
    return {count: 0};
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
    let panelSmartView = "all";
    let renderLimit = this._settings.panelPageSize;
    let selectedPanelKey = null;
    const selectedPanelKeys = new Set();
    let selectionAnchorKey = null;
    let cardDragKey = null;
    let inboxDragHeaders = [];
    let contextMenuKey = "";
    let contextMenu = null;
    let contextMenuTrigger = null;
    let ownedPopupSet = null;
    let groupDialog = null;
    let groupAssignmentDialog = null;
    let onPanelContextMenu = null;
    const cardCache = new Map();
    const nativeButtonSnapshots = new WeakMap();
    let lastRenderSignature = "";

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
    const t = (key, variables = {}) => this._t(key, "", variables);

    const elementFromEvent = event => {
      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      for (const candidate of path) {
        if (candidate?.nodeType === 1) return candidate;
      }
      return event.target?.nodeType === 1 ? event.target : null;
    };

    const cardFromEvent = event => {
      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      for (const candidate of path) {
        if (candidate?.nodeType === 1 && candidate.classList?.contains("pin-mails-card")) {
          return candidate;
        }
      }
      return elementFromEvent(event)?.closest?.(".pin-mails-card") || null;
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
      const label = pinned ? this._t("unpinMessage", "Désépingler le message") : this._t("pinMessage", "Épingler le message");
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", String(Boolean(pinned)));
    };

    const snapshotNativeButton = button => {
      if (!button || nativeButtonSnapshots.has(button)) return;
      nativeButtonSnapshots.set(button, {
        parent: button.parentNode,
        nextSibling: button.nextSibling,
        attributes: new Map([
          "title",
          "aria-label",
          "aria-pressed",
          "data-l10n-id"
        ].map(name => [name, button.hasAttribute(name) ? button.getAttribute(name) : null]))
      });
    };

    const restoreNativeButton = button => {
      if (!button) return;
      const snapshot = nativeButtonSnapshots.get(button);
      button.classList.remove(BUTTON_CLASS);
      button.removeAttribute("data-pin-mails-native-star");
      button.removeAttribute("data-pin-mails-duplicate-star");
      if (snapshot) {
        for (const [name, value] of snapshot.attributes) {
          if (value === null) button.removeAttribute(name);
          else button.setAttribute(name, value);
        }
        if (snapshot.parent?.isConnected && button.parentNode !== snapshot.parent) {
          if (snapshot.nextSibling?.parentNode === snapshot.parent) {
            snapshot.parent.insertBefore(button, snapshot.nextSibling);
          } else {
            snapshot.parent.appendChild(button);
          }
        }
        nativeButtonSnapshots.delete(button);
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
        button = createNode("button", INDEPENDENT_BUTTON_CLASS);
        button.type = "button";
        button.dataset.pinMailsAction = "toggle-row-pin";
        if (row.classList.contains("card-layout")) {
          // Keep every card action in Thunderbird's official icon-info
          // container. CSS turns this container into a rail spanning the
          // native sender, subject and information rows.
          const iconInfo = row.querySelector(".thread-card-icon-info");
          const nativeStar = iconInfo?.querySelector(".button-star, .tree-button-flag");
          iconInfo?.insertBefore(button, nativeStar || null);
        } else {
          const host = row.querySelector("td.subjectcol-column") || row.lastElementChild;
          host?.classList.add("pin-mails-table-host");
          host?.appendChild(button);
        }
      }
      // Never inherit Thunderbird's generic icon-button classes here. In
      // Thunderbird 153 those classes can paint their own icon in addition to
      // MailPerch's masked pin, which makes the control look like a duplicated
      // star. Existing virtualized rows are normalized on every patch.
      button.classList.remove("button", "icon-button", "icon-only", "button-star", "tree-button-flag");
      button.classList.add(INDEPENDENT_BUTTON_CLASS);
      const pinned = this._isPinnedHeader(hdr);
      row.toggleAttribute("data-pin-mails-pinned", pinned);
      row.style.setProperty("--pin-row-account-color", this._getAccountColor(accountKeyForFolder(hdr.folder)));
      setButtonLabel(button, pinned);
      row.draggable = Boolean(this._settings.enableDragFromInbox && !this._settings.safeMode);
    };

    const patchRow = row => {
      if (!(row instanceof about3Pane.HTMLElement) || row.dataset.properties?.includes("dummy")) return;
      const hdr = headerForRow(row);
      const cardActionRail = row.classList.contains("card-layout")
        ? row.querySelector(".thread-card-icon-info")
        : null;
      cardActionRail?.classList.add(CARD_ACTION_RAIL_CLASS);
      const starCandidates = [...new Set(row.querySelectorAll(".button-star, .tree-button-flag"))];
      const nativeStarMode = this._settings.pinMode === "nativeStar" && isEnabled();

      if (nativeStarMode) {
        const star = starCandidates.find(item => item.classList.contains("button-star")) || starCandidates[0] || null;
        for (const candidate of starCandidates) {
          candidate.toggleAttribute("data-pin-mails-duplicate-star", candidate !== star);
          candidate.toggleAttribute("data-pin-mails-native-star", candidate === star);
        }
        row.querySelector(`.${INDEPENDENT_BUTTON_CLASS}`)?.remove();
        if (star) {
          snapshotNativeButton(star);
          star.classList.add(BUTTON_CLASS);
          const pinned = this._isPinnedHeader(hdr);
          setButtonLabel(star, pinned);
          row.style.setProperty("--pin-row-account-color", this._getAccountColor(accountKeyForFolder(hdr?.folder || about3Pane.gFolder)));
        }
      } else {
        // Independent mode must leave Thunderbird's native star controls entirely
        // untouched. In particular, remove annotations left on virtualized rows
        // that previously rendered in native-star mode.
        for (const candidate of starCandidates) restoreNativeButton(candidate);
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
      panelToggle.appendChild(createNode("span", "", t("panelToggleLabel")));
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
      panelToggle.setAttribute("aria-label", t(visible ? "panelHideSection" : "panelShowSection"));
      panelToggle.setAttribute("title", panelToggle.getAttribute("aria-label"));
      panelToggle.setAttribute("aria-pressed", String(visible));
    };

    const showToast = (message, allowUndo = true, kind = "info") => {
      createPanel();
      const toast = panel.querySelector(`#${TOAST_ID}`);
      if (!toast) return;
      if (toastTimer) about3Pane.clearTimeout(toastTimer);
      toast.replaceChildren();
      toast.dataset.kind = ["success", "error", "busy"].includes(kind) ? kind : "info";
      const text = createNode("span", "pin-mails-toast-text", message);
      toast.appendChild(text);
      if (allowUndo && this._settings.enableUndo && this._undoStack?.length) {
        const undo = createNode("button", "pin-mails-toast-undo", t("panelUndo"));
        undo.type = "button";
        undo.addEventListener("click", () => this._undoLast(), {once: true});
        toast.appendChild(undo);
      }
      toast.hidden = false;
      toastTimer = about3Pane.setTimeout(() => {
        toast.hidden = true;
        delete toast.dataset.kind;
      }, kind === "error" ? Math.max(this._settings.undoTimeoutMs, 9000) : this._settings.undoTimeoutMs);
    };

    const createEditor = () => {
      if (editor?.isConnected) return editor;
      editor = createNode("dialog", "pin-mails-editor"); editor.id = EDITOR_ID;
      const form = createNode("form", "pin-mails-editor-form"); form.method = "dialog";
      const title = createNode("h2", "pin-mails-editor-title", t("panelEditFollowUpTitle"));
      const subject = createNode("p", "pin-mails-editor-subject");
      const noteLabel = createNode("label", "", t("panelPersonalNote"));
      const note = createNode("textarea", "pin-mails-editor-note"); note.maxLength = MAX_NOTE_LENGTH; note.rows = 4; noteLabel.appendChild(note);
      const checklistSection = createNode("section", "pin-mails-editor-checklist");
      const checklistTitle = createNode("h3", "pin-mails-editor-checklist-title", t("panelChecklistTitle"));
      const checklistList = createNode("div", "pin-mails-editor-checklist-list");
      const checklistAddRow = createNode("div", "pin-mails-editor-checklist-add");
      const checklistInput = createNode("input", "pin-mails-editor-checklist-input"); checklistInput.type = "text"; checklistInput.maxLength = PIN_MODULES.PinChecklists?.MAX_TEXT || 240; checklistInput.placeholder = t("panelChecklistPlaceholder");
      const checklistAdd = createNode("button", "secondary", t("panelChecklistAdd")); checklistAdd.type = "button";
      checklistAddRow.append(checklistInput, checklistAdd); checklistSection.append(checklistTitle, checklistList, checklistAddRow);
      let checklistItems = [];
      const renderChecklist = () => {
        checklistList.replaceChildren();
        for (const item of checklistItems) {
          const row = createNode("label", "pin-mails-editor-checklist-item");
          const checkbox = createNode("input"); checkbox.type = "checkbox"; checkbox.checked = Boolean(item.completed);
          const text = createNode("span", "pin-mails-editor-checklist-text", item.text);
          const remove = createNode("button", "pin-mails-editor-checklist-remove", "×"); remove.type = "button"; remove.setAttribute("aria-label", t("panelChecklistRemove")); remove.title = t("panelChecklistRemove");
          checkbox.addEventListener("change", () => { item.completed = checkbox.checked; item.completedAt = checkbox.checked ? Date.now() : 0; });
          remove.addEventListener("click", event => { event.preventDefault(); checklistItems = checklistItems.filter(candidate => candidate.id !== item.id); renderChecklist(); });
          row.append(checkbox, text, remove); checklistList.appendChild(row);
        }
      };
      const addChecklistItem = () => {
        const text = String(checklistInput.value || "").trim().slice(0, PIN_MODULES.PinChecklists?.MAX_TEXT || 240);
        if (!text || checklistItems.length >= (PIN_MODULES.PinChecklists?.MAX_ITEMS || 50)) return;
        checklistItems.push({id:`task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,text,completed:false,createdAt:Date.now(),completedAt:0});
        checklistInput.value = ""; renderChecklist(); checklistInput.focus();
      };
      checklistAdd.addEventListener("click", addChecklistItem);
      checklistInput.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); addChecklistItem(); } });
      const grid = createNode("div", "pin-mails-editor-grid");
      const field = (labelText, control) => { const label = createNode("label", "", labelText); label.appendChild(control); grid.appendChild(label); return control; };
      const group = field(t("panelGroupLabel"), createNode("select", "pin-mails-editor-group"));
      const caseSelect = field(t("panelCaseLabel"), createNode("select", "pin-mails-editor-case"));
      const templateSelect = field(t("panelTemplateLabel"), createNode("select", "pin-mails-editor-template"));
      const workflow = createNode("select", "pin-mails-editor-workflow");
      for (const [value, key] of [["active", "panelWorkflowActive"], ["waiting", "panelWorkflowWaiting"], ["planned", "panelWorkflowPlanned"], ["completed", "panelWorkflowCompleted"]]) { const option = createNode("option", "", t(key)); option.value = value; workflow.appendChild(option); }
      field(t("panelStatusLabel"), workflow);
      const priority = createNode("select", "pin-mails-editor-priority");
      for (const [value, key] of [["normal", "panelPriorityNormal"], ["high", "panelPriorityHigh"], ["urgent", "panelPriorityUrgent"]]) { const option = createNode("option", "", t(key)); option.value = value; priority.appendChild(option); }
      field(t("panelPriorityLabel"), priority);
      const due = createNode("input", "pin-mails-editor-due"); due.type = "datetime-local"; field(t("panelDeadlineLabel"), due);
      const reminder = createNode("input", "pin-mails-editor-reminder"); reminder.type = "datetime-local"; field(t("panelReminderLabel"), reminder);
      const followUp = createNode("input", "pin-mails-editor-follow-up"); followUp.type = "datetime-local"; field(t("panelFollowUpLabel"), followUp);
      const repeat = createNode("select", "pin-mails-editor-repeat");
      for (const [value, key] of [["", "panelNone"], ["daily", "panelRepeatDaily"], ["weekdays", "panelRepeatWeekdays"], ["weekly", "panelRepeatWeekly"], ["monthly", "panelRepeatMonthly"]]) { const option = createNode("option", "", t(key)); option.value = value; repeat.appendChild(option); }
      field(t("panelReminderRepeatLabel"), repeat);
      const recurrence = createNode("select", "pin-mails-editor-recurrence");
      for (const [value, key] of [["", "panelNone"], ["daily", "panelRecurrenceDaily"], ["weekdays", "panelRecurrenceWeekdays"], ["weekly", "panelRecurrenceWeekly"], ["monthly", "panelRecurrenceMonthly"], ["quarterly", "panelRecurrenceQuarterly"], ["yearly", "panelRecurrenceYearly"]]) { const option = createNode("option", "", t(key)); option.value = value; recurrence.appendChild(option); }
      field(t("panelRecurringLabel"), recurrence);
      const recurrenceInterval = createNode("input", "pin-mails-editor-recurrence-interval"); recurrenceInterval.type = "number"; recurrenceInterval.min = "1"; recurrenceInterval.max = "100"; field(t("panelRecurrenceIntervalLabel"), recurrenceInterval);
      const lead = createNode("input", "pin-mails-editor-lead"); lead.type = "number"; lead.min = "0"; lead.max = "10080"; field(t("panelAdvanceReminderLabel"), lead);
      const calendarSelect = createNode("select", "pin-mails-editor-calendar");
      field(t("panelCalendarLabel"), calendarSelect);
      const completedLabel = createNode("label", "pin-mails-editor-completed-label");
      const completed = createNode("input", "pin-mails-editor-completed"); completed.type = "checkbox";
      completedLabel.append(completed, createNode("span", "", t("panelMarkedComplete"))); grid.appendChild(completedLabel);
      const calendarRow = createNode("div", "pin-mails-editor-calendar-row");
      const applyTemplateButton = createNode("button", "secondary", t("panelApplyTemplate")); applyTemplateButton.type = "button";
      const task = createNode("button", "secondary", t("calendarTask")); task.type = "button"; task.dataset.calendarAction = "true";
      const eventButton = createNode("button", "secondary", t("calendarEvent")); eventButton.type = "button"; eventButton.dataset.calendarAction = "true";
      const snooze10 = createNode("button", "secondary", t("panelSnooze10")); snooze10.type = "button";
      const snoozeHour = createNode("button", "secondary", t("panelSnoozeHour")); snoozeHour.type = "button";
      const snoozeTomorrow = createNode("button", "secondary", t("panelSnoozeTomorrow")); snoozeTomorrow.type = "button";
      calendarRow.append(applyTemplateButton, task, eventButton, snooze10, snoozeHour, snoozeTomorrow);
      const actions = createNode("div", "pin-mails-editor-actions");
      const cancel = createNode("button", "secondary", t("panelCancel")); cancel.type = "button";
      const save = createNode("button", "primary", t("panelSave")); save.type = "submit"; actions.append(cancel, save);
      form.append(title, subject, noteLabel, checklistSection, grid, calendarRow, actions); editor.appendChild(form); document.body.appendChild(editor);
      cancel.addEventListener("click", () => editor.close());
      applyTemplateButton.addEventListener("click", () => {
        if (!templateSelect.value) return;
        const stableKey = editor.dataset.stableKey;
        this._applyTemplate([stableKey], templateSelect.value);
        editor.close();
        about3Pane.setTimeout(() => openEditor(stableKey), 0);
        showToast(t("panelTemplateApplied"), true);
      });
      const runEditorCalendarAction = async (itemType, button) => {
        setActionBusy(button, true);
        try {
          let calendarId = calendarSelect.value;
          const ref = this._data.refs[editor.dataset.stableKey];
          if (!calendarId && !ref?.calendarItemId) {
            calendarId = await chooseCalendarForType(itemType, ref?.calendarId || this._settings.preferredCalendarId);
            if (!calendarId) return;
            calendarSelect.value = calendarId;
          }
          await this._createCalendarItem(editor.dataset.stableKey, itemType, calendarId || ref?.calendarId || "");
          showToast(t(itemType === "event" ? "panelEventSynced" : "panelTaskSynced"), false, "success");
        } catch (error) {
          this._recordDiagnostic("error", "Écriture Agenda depuis l’éditeur impossible", error);
          showToast(t("panelCalendarFailed"), false, "error");
        } finally {
          setActionBusy(button, false);
        }
      };
      task.addEventListener("click", () => { void runEditorCalendarAction("task", task); });
      eventButton.addEventListener("click", () => { void runEditorCalendarAction("event", eventButton); });
      snooze10.addEventListener("click", () => { this._snoozeReminder(editor.dataset.stableKey, 10 * 60_000); editor.close(); });
      snoozeHour.addEventListener("click", () => { this._snoozeReminder(editor.dataset.stableKey, 60 * 60_000); editor.close(); });
      snoozeTomorrow.addEventListener("click", () => { this._snoozeReminder(editor.dataset.stableKey, DAY_MS); editor.close(); });
      workflow.addEventListener("change", () => { completed.checked = workflow.value === "completed"; });
      completed.addEventListener("change", () => { workflow.value = completed.checked ? "completed" : (workflow.value === "completed" ? "active" : workflow.value); });
      form.addEventListener("submit", event => {
        event.preventDefault();
        this._setReferenceMetadata(editor.dataset.stableKey, {
          note: note.value, checklist: checklistItems, groupId: group.value, caseId: caseSelect.value, priorityLevel: priority.value,
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
      dialog.querySelector(".pin-mails-editor-subject").textContent = `${ref.trackingMode === "conversation" ? t("panelConversationPrefix") : ""}${ref.subject || t("panelNoSubject")}`;
      dialog.querySelector(".pin-mails-editor-note").value = ref.note || "";
      checklistItems = PIN_MODULES.PinChecklists?.normalize(ref.checklist) || []; renderChecklist();
      const groupSelect = dialog.querySelector(".pin-mails-editor-group"); groupSelect.replaceChildren();
      const none = createNode("option", "", t("panelNoGroup")); none.value = ""; groupSelect.appendChild(none);
      for (const item of this._data.groups) { const option = createNode("option", "", item.name); option.value = item.id; groupSelect.appendChild(option); }
      groupSelect.value = ref.groupId || "";
      const caseSelect = dialog.querySelector(".pin-mails-editor-case"); caseSelect.replaceChildren();
      const noCase = createNode("option", "", t("panelNoCase")); noCase.value = ""; caseSelect.appendChild(noCase);
      for (const item of this._data.cases || []) { const option = createNode("option", "", item.name); option.value = item.id; caseSelect.appendChild(option); }
      caseSelect.value = ref.caseId || "";
      const templateSelect = dialog.querySelector(".pin-mails-editor-template"); templateSelect.replaceChildren();
      const noTemplate = createNode("option", "", t("panelNoTemplate")); noTemplate.value = ""; templateSelect.appendChild(noTemplate);
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
      const calendarSelect = dialog.querySelector(".pin-mails-editor-calendar");
      calendarSelect.replaceChildren();
      const calendars = this._settings.enableCalendarIntegration ? this._getCalendars() : [];
      for (const calendar of calendars) {
        const option = createNode("option", "", `${calendar.name} — ${t("panelCalendarTasks")} ${calendar.taskCompatible ? "✓" : "✕"} · ${t("panelCalendarEvents")} ${calendar.eventCompatible ? "✓" : "✕"}${calendar.reason ? ` · ${calendar.reason}` : ""}`);
        option.value = calendar.id;
        option.dataset.taskCompatible = String(calendar.taskCompatible);
        option.dataset.eventCompatible = String(calendar.eventCompatible);
        option.disabled = !calendar.taskCompatible && !calendar.eventCompatible;
        calendarSelect.appendChild(option);
      }
      const preferredCalendar = [ref.calendarId, this._settings.preferredCalendarId]
        .find(id => calendars.some(calendar => calendar.id === id && (calendar.taskCompatible || calendar.eventCompatible)));
      calendarSelect.value = preferredCalendar || calendars.find(calendar => calendar.taskCompatible || calendar.eventCompatible)?.id || "";
      const updateCalendarButtons = () => {
        const option = calendarSelect.selectedOptions[0];
        const enabled = this._settings.enableCalendarIntegration && Boolean(option);
        const taskButton = dialog.querySelector('[data-calendar-action="true"]');
        const eventButton = dialog.querySelectorAll('[data-calendar-action="true"]')[1];
        if (taskButton) taskButton.disabled = !enabled || option?.dataset.taskCompatible !== "true";
        if (eventButton) eventButton.disabled = !enabled || option?.dataset.eventCompatible !== "true";
      };
      calendarSelect.onchange = updateCalendarButtons;
      calendarSelect.disabled = !this._settings.enableCalendarIntegration || !calendarSelect.options.length;
      updateCalendarButtons();
      dialog.querySelector(".pin-mails-editor-template").disabled = !this._settings.enableTemplates;
      dialog.showModal(); dialog.querySelector(".pin-mails-editor-note").focus();
    };

    const createGroupDialog = () => {
      if (groupDialog?.isConnected) return groupDialog;
      groupDialog = createNode("dialog", "pin-mails-group-dialog");
      const form = createNode("form", "pin-mails-group-dialog-form");
      form.method = "dialog";
      const title = createNode("h2", "pin-mails-group-dialog-title", t("panelCreateGroupTitle"));
      title.id = "pin-mails-group-dialog-create-title";
      groupDialog.setAttribute("aria-labelledby", title.id);
      const nameLabel = createNode("label", "", t("panelGroupName"));
      const name = createNode("input", "pin-mails-group-dialog-name");
      name.type = "text";
      name.maxLength = 80;
      name.required = true;
      name.autocomplete = "off";
      nameLabel.appendChild(name);
      const colorLabel = createNode("label", "", t("panelColor"));
      const color = createNode("input", "pin-mails-group-dialog-color");
      color.type = "color";
      colorLabel.appendChild(color);
      const actions = createNode("div", "pin-mails-editor-actions");
      const cancel = createNode("button", "secondary", t("panelCancel"));
      cancel.type = "button";
      const save = createNode("button", "primary", t("panelCreate"));
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
        this._pushUndo(t("panelUndoCreateGroup"));
        this._data.groups.push({id, name: label.slice(0, 80), color: COLOR_RE.test(color.value) ? color.value : "#6264a7"});
        this._data.groupOrder.push(id);
        this._saveData("group-create");
        this._refreshAllStates(true);
        groupDialog.close();
        showToast(t("panelGroupCreated"), true);
      });
      return groupDialog;
    };

    const addGroup = () => {
      if (this._data.groups.length >= MAX_GROUPS) {
        showToast(t("panelMaxGroups"), false);
        return;
      }
      const dialog = createGroupDialog();
      const name = dialog.querySelector(".pin-mails-group-dialog-name");
      const color = dialog.querySelector(".pin-mails-group-dialog-color");
      name.value = t("panelDefaultGroupName");
      color.value = DEFAULT_COLORS[this._data.groups.length % DEFAULT_COLORS.length];
      dialog.showModal();
      name.select();
    };

    const openGroupAssignmentDialog = keys => {
      if (!groupAssignmentDialog?.isConnected) {
        groupAssignmentDialog = createNode("dialog", "pin-mails-group-dialog");
        const form = createNode("form", "pin-mails-group-dialog-form");
        form.method = "dialog";
        const title = createNode("h2", "pin-mails-group-dialog-title", t("panelAssignMessages"));
        title.id = "pin-mails-group-dialog-assign-title";
        groupAssignmentDialog.setAttribute("aria-labelledby", title.id);
        form.appendChild(title);
        const label = createNode("label", "", t("panelGroupLabel"));
        const select = createNode("select", "pin-mails-group-assignment-select");
        label.appendChild(select);
        const actions = createNode("div", "pin-mails-editor-actions");
        const cancel = createNode("button", "secondary", t("panelCancel")); cancel.type = "button";
        const save = createNode("button", "primary", t("panelApply")); save.type = "submit";
        actions.append(cancel, save);
        form.append(label, actions);
        groupAssignmentDialog.appendChild(form);
        document.body.appendChild(groupAssignmentDialog);
        cancel.addEventListener("click", () => groupAssignmentDialog.close());
        form.addEventListener("submit", event => {
          event.preventDefault();
          const activeKeys = JSON.parse(groupAssignmentDialog.dataset.stableKeys || "[]");
          const groupId = select.value;
          this._pushUndo(t("panelUndoChangeGroup"));
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
          showToast(t("panelMessagesAssigned", {count}), true);
        });
      }
      const select = groupAssignmentDialog.querySelector(".pin-mails-group-assignment-select");
      select.replaceChildren();
      const none = createNode("option", "", t("panelNoGroup")); none.value = ""; select.appendChild(none);
      for (const item of this._data.groups) { const option = createNode("option", "", item.name); option.value = item.id; select.appendChild(option); }
      groupAssignmentDialog.dataset.stableKeys = JSON.stringify(keys);
      groupAssignmentDialog.showModal();
      select.focus();
    };

    const panelList = () => panel?.querySelector(".pin-mails-panel-list") || null;

    const findCardByStableKey = stableKey => {
      const key = String(stableKey || "");
      const list = panelList();
      if (!list || !key) return null;
      return [...list.querySelectorAll(".pin-mails-card")]
        .find(card => card.dataset.stableKey === key) || null;
    };

    const resetContextMenuState = () => {
      contextMenuKey = "";
      if (contextMenuTrigger) contextMenuTrigger.setAttribute("aria-expanded", "false");
      contextMenuTrigger = null;
    };

    const closeContextMenu = () => {
      if (!contextMenu) return;
      if (contextMenu.state && contextMenu.state !== "closed") {
        try { contextMenu.hidePopup(); } catch {}
      } else {
        resetContextMenuState();
      }
    };

    const setActionBusy = (button, busy) => {
      if (!button) return;
      button.disabled = Boolean(busy);
      button.toggleAttribute("data-busy", Boolean(busy));
      button.setAttribute("aria-busy", String(Boolean(busy)));
    };

    const calendarCompatible = (calendar, itemType) => itemType === "event"
      ? calendar.eventCompatible
      : calendar.taskCompatible;

    const chooseCalendarForType = (itemType, selectedId = "") => {
      const type = itemType === "event" ? "event" : "task";
      const calendars = this._getCalendars();
      const compatible = calendars.filter(calendar => calendarCompatible(calendar, type));
      if (!compatible.length) throw new ExtensionError(t(type === "event" ? "panelNoCompatibleEventCalendar" : "panelNoCompatibleTaskCalendar"));
      return new Promise(resolve => {
        const dialog = createNode("dialog", "pin-mails-calendar-dialog");
        const form = createNode("form", "pin-mails-calendar-dialog-form");
        form.method = "dialog";
        const title = createNode("h2", "pin-mails-calendar-dialog-title", t(type === "event" ? "panelChooseEventCalendar" : "panelChooseTaskCalendar"));
        const explanation = createNode("p", "pin-mails-calendar-dialog-help", t("panelCalendarChooserHelp"));
        const label = createNode("label", "", t("panelTargetCalendar"));
        const select = createNode("select", "pin-mails-calendar-dialog-select");
        for (const calendar of calendars) {
          const supported = calendarCompatible(calendar, type);
          const suffix = supported ? t("panelCalendarCompatible") : (calendar.reason || t(type === "event" ? "panelEventsUnsupported" : "panelTasksUnsupported"));
          const option = createNode("option", "", `${calendar.name} — ${suffix}`);
          option.value = calendar.id;
          option.disabled = !supported;
          select.appendChild(option);
        }
        const preferred = [selectedId, this._settings.preferredCalendarId]
          .find(id => compatible.some(calendar => calendar.id === id));
        select.value = preferred || compatible[0].id;
        label.appendChild(select);
        const actions = createNode("div", "pin-mails-editor-actions");
        const cancel = createNode("button", "secondary", t("panelCancel"));
        cancel.type = "button";
        const confirm = createNode("button", "primary", t("continue"));
        confirm.type = "submit";
        actions.append(cancel, confirm);
        form.append(title, explanation, label, actions);
        dialog.appendChild(form);
        document.body.appendChild(dialog);
        let resolved = false;
        const finish = value => {
          if (resolved) return;
          resolved = true;
          resolve(value);
          dialog.remove();
        };
        cancel.addEventListener("click", () => { dialog.close(); finish(""); });
        form.addEventListener("submit", event => {
          event.preventDefault();
          const value = select.value;
          dialog.close();
          finish(value);
        });
        dialog.addEventListener("cancel", event => { event.preventDefault(); dialog.close(); finish(""); });
        dialog.addEventListener("close", () => finish(""), {once: true});
        dialog.showModal();
        select.focus();
      });
    };

    const prepareContextMenu = key => {
      const ref = this._data.refs[key];
      const card = findCardByStableKey(key);
      const hdr = card?._pinMessageHeader || (ref ? this._resolveReference(ref, false) : null);
      const item = action => contextMenu?.querySelector(`[data-context-action="${action}"]`);
      const setLabel = (action, label) => {
        const menuItem = item(action);
        if (menuItem) menuItem.setAttribute("label", label);
      };
      const disable = (action, disabled) => {
        const button = item(action);
        if (button) button.disabled = Boolean(disabled);
      };

      setLabel("toggleRead", t(hdr && hdr.flags & Ci.nsMsgMessageFlags.Read ? "panelMarkUnread" : "panelMarkRead"));
      setLabel("waiting", t(ref?.workflowStatus === "waiting" ? "panelReturnActive" : "panelSetWaiting"));
      setLabel("planned", t(ref?.workflowStatus === "planned" ? "panelReturnActive" : "panelPlan"));
      setLabel("complete", t(ref?.completedAt ? "panelReopen" : "panelMarkComplete"));
      setLabel("track-no-reply", t(ref?.noReplyTracking ? "panelEditNoReply" : "panelTrackNoReply"));
      setLabel("cancel-no-reply", t("panelCancelNoReply"));
      disable("cancel-no-reply", !ref?.noReplyTracking);
      setLabel("unpin", hdr ? t("unpin") : t("panelRemoveMissingReference"));
      const group = this._groupForId(ref?.groupId);
      setLabel("remove-group", group ? t("panelRemoveFromNamedGroup", {group: group.name}) : t("panelRemoveFromGroup"));

      for (const action of ["open", "reply", "toggleRead", "archive", "delete"]) disable(action, !hdr);
      disable("group", !this._data.groups.length);
      disable("remove-group", !group);
      const calendars = this._settings.enableCalendarIntegration ? this._getCalendars() : [];
      disable("calendar-task", !calendars.some(calendar => calendar.taskCompatible));
      disable("calendar-event", !calendars.some(calendar => calendar.eventCompatible));
    };

    const openContextMenuForCard = (card, triggerEvent = null, trigger = null) => {
      if (!contextMenu || !card?.isConnected || card.ownerDocument !== document || !panel?.contains(card)) return false;
      const stableKey = card.dataset.stableKey;
      if (!stableKey) return false;

      const showPopup = () => {
        selectedPanelKey = stableKey;
        selectionAnchorKey = stableKey;
        updatePanelSelection();
        contextMenuKey = stableKey;
        contextMenuTrigger = trigger;
        if (contextMenuTrigger) contextMenuTrigger.setAttribute("aria-expanded", "true");
        prepareContextMenu(stableKey);
        this._recordDiagnostic("debug", "Ouverture du menu natif", trigger?.isConnected ? "button" : "contextmenu", {component:"pinned-panel",action:"open-menu",windowId:about3Pane.location?.href||"about:3pane"});
        try {
          if (trigger?.isConnected) {
            contextMenu.openPopup(trigger, "after_end", 0, 0, false, false, triggerEvent);
          } else {
            const screenX = Number.isFinite(triggerEvent?.screenX) ? Math.round(triggerEvent.screenX) : Math.round(about3Pane.mozInnerScreenX + 24);
            const screenY = Number.isFinite(triggerEvent?.screenY) ? Math.round(triggerEvent.screenY) : Math.round(about3Pane.mozInnerScreenY + 24);
            contextMenu.openPopupAtScreen(screenX, screenY, true, triggerEvent);
          }
        } catch (error) {
          resetContextMenuState();
          this._recordDiagnostic("error", "Ouverture du menu des messages épinglés impossible", error);
          showToast(t("panelMenuUnavailable"), false, "error");
        }
      };

      if (contextMenu.state && contextMenu.state !== "closed") {
        const reopen = () => showPopup();
        contextMenu.addEventListener("popuphidden", reopen, {once: true});
        try {
          contextMenu.hidePopup();
        } catch {
          contextMenu.removeEventListener("popuphidden", reopen);
          showPopup();
        }
      } else {
        showPopup();
      }
      return true;
    };

    const runCardAction = async (key, action, sourceButton = null) => {
      this._recordDiagnostic("debug", "Action de carte demandée", action, {component:"pinned-panel",action,windowId:about3Pane.location?.href||"about:3pane"});
      const ref = this._data.refs[key];
      const card = findCardByStableKey(key);
      const hdr = card?._pinMessageHeader || (ref ? this._resolveReference(ref, false) : null);
      if (!ref) {
        showToast(t("panelPinMissing"), false, "error");
        return;
      }

      setActionBusy(sourceButton, true);
      try {
        if (action === "open") {
          if (!selectPanelMessage(ref, hdr, card)) showToast(t("panelMessageMissing"), false, "error");
          return;
        }
        if (action === "unpin") {
          if (selectedPanelKey === key) selectedPanelKey = null;
          selectedPanelKeys.delete(key);
          this._performReferenceAction([key], "unpin");
          showToast(t(hdr ? "panelUnpinned" : "panelMissingRemoved"), true, "success");
          return;
        }
        if (action === "edit") { openEditor(key); return; }
        if (action === "group") { openGroupAssignmentDialog([key]); return; }
        if (action === "remove-group") {
          this._performReferenceAction([key], "group", {groupId: ""});
          showToast(t("panelRemovedGroup"), true, "success");
          return;
        }
        if (action === "waiting") {
          const waiting = ref.workflowStatus !== "waiting";
          this._setWorkflowStatus([key], waiting ? "waiting" : "active");
          showToast(t(waiting ? "panelWaitingSuccess" : "panelActiveSuccess"), true, "success");
          return;
        }
        if (action === "planned") {
          const planned = ref.workflowStatus !== "planned";
          this._setWorkflowStatus([key], planned ? "planned" : "active");
          showToast(t(planned ? "panelPlannedSuccess" : "panelActiveSuccess"), true, "success");
          return;
        }
        if (action === "complete") {
          const completed = !ref.completedAt;
          this._performReferenceAction([key], completed ? "complete" : "uncomplete");
          showToast(t(completed ? "panelCompletedSuccess" : "panelReopenedSuccess"), true, "success");
          return;
        }
        if (action === "track-no-reply") {
          this._setNoReplyTracking([key], {enabled:true});
          showToast(t("panelNoReplyScheduled", {days: this._settings.noReplyDefaultDays || 5}), true, "success");
          return;
        }
        if (action === "cancel-no-reply") {
          this._setNoReplyTracking([key], {enabled:false});
          showToast(t("panelNoReplyDisabled"), true, "success");
          return;
        }
        if (action === "snooze") {
          this._snoozeReminder(key, 60 * 60_000);
          showToast(t("panelReminderSnoozedHour"), true, "success");
          return;
        }
        if (action === "calendar-task" || action === "calendar-event") {
          const type = action === "calendar-event" ? "event" : "task";
          const calendarId = ref.calendarItemId
            ? ref.calendarId
            : await chooseCalendarForType(type, ref.calendarId || this._settings.preferredCalendarId);
          if (!calendarId && !ref.calendarItemId) {
            showToast(t("panelCalendarCancelled"), false, "info");
            return;
          }
          await this._createCalendarItem(key, type, calendarId);
          showToast(t(type === "event" ? "panelEventSynced" : "panelTaskSynced"), false, "success");
          return;
        }

        const result = this._performMessageAction(action, hdr ? [hdr] : [], about3Pane);
        if (!result?.count) {
          if (!result?.cancelled) showToast(t("panelActionUnavailable"), false, "error");
          return;
        }
        if (action === "reply") showToast(t("panelReplyOpened"), false, "success");
      } catch (error) {
        this._recordDiagnostic("error", `Action de carte impossible : ${action}`, error);
        showToast(t("panelActionFailed"), false, "error");
      } finally {
        setActionBusy(sourceButton, false);
      }
    };

    const dispatchCardAction = (card, action, sourceButton = null, triggerEvent = null) => {
      if (!card || !action || !panel?.contains(card)) return false;
      const key = card.dataset.stableKey;
      if (action === "more") {
        return openContextMenuForCard(card, triggerEvent, sourceButton);
      }
      void runCardAction(key, action, sourceButton);
      return true;
    };

    const createPanel = () => {
      if (panel?.isConnected && allHeader?.isConnected) return;
      panel = document.getElementById(PANEL_ID) || createNode("section", "pin-mails-panel");
      panel.id = PANEL_ID;
      panel.setAttribute("aria-label", this._t("pinnedMessages", "Messages épinglés"));
      panel.replaceChildren();

      const header = createNode("div", "pin-mails-panel-header");
      const collapse = createNode("button", "pin-mails-collapse-button"); collapse.type = "button";
      collapse.appendChild(createNode("span", "pin-mails-chevron"));
      const icon = createNode("span", "pin-mails-header-icon"); icon.setAttribute("aria-hidden", "true");
      const titleWrap = createNode("div", "pin-mails-title-wrap");
      titleWrap.append(createNode("span", "pin-mails-title", this._t("pinned", "Épinglés")), createNode("span", "pin-mails-count", "0"));
      const summary = createNode("span", "pin-mails-summary"); titleWrap.appendChild(summary);
      const healthIndicator = createNode("button", "pin-mails-health-indicator");
      healthIndicator.type = "button";
      healthIndicator.hidden = true;
      healthIndicator.setAttribute("aria-label", this._t("healthAttention", "Santé MailPerch à vérifier"));
      const scope = createNode("select", "pin-mails-header-select"); scope.setAttribute("aria-label", this._t("panelScope", "Portée du panneau"));
      for (const [value, label] of [["currentInbox", this._t("currentInbox", "Cette boîte")], ["selectedAccounts", this._t("scopeSelectedAccounts", "Comptes sélectionnés")], ["global", this._t("allAccounts", "Tous les comptes")]]) {
        const option = createNode("option", "", label); option.value = value; scope.appendChild(option);
      }
      const sort = createNode("select", "pin-mails-header-select"); sort.dataset.secondary = "true"; sort.setAttribute("aria-label", this._t("sortPins", "Tri des épingles"));
      for (const [value, label] of [["manual", this._t("manualOrder", "Ordre manuel")], ["pinnedAt", this._t("pinDate", "Épinglage")], ["messageDate", this._t("messageDate", "Date")], ["deadline", this._t("deadline", "Échéance")], ["priority", this._t("priority", "Priorité")], ["sender", this._t("sender", "Expéditeur")], ["account", this._t("account", "Compte")]]) {
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
      const conversationButton = headerAction("pin-mails-action-conversation", this._t("pinConversation", "Épingler la conversation sélectionnée"));
      const dashboardButton = headerAction("pin-mails-action-dashboard", this._t("openDashboard", "Ouvrir le tableau de bord global"));
      const addGroupButton = headerAction("pin-mails-action-add-group", this._t("createGroup", "Créer un groupe"));
      header.append(collapse, icon, titleWrap, healthIndicator, scope, sort, conversationButton, dashboardButton, addGroupButton);

      const tools = createNode("div", "pin-mails-panel-tools");
      const searchWrap = createNode("label", "pin-mails-search-wrap");
      const search = createNode("input", "pin-mails-search"); search.type = "search"; search.placeholder = this._t("searchPins", "Rechercher dans les épingles…"); search.setAttribute("aria-label", this._t("searchPinsLabel", "Rechercher dans les messages épinglés"));
      searchWrap.appendChild(search);
      const smartView = createNode("select", "pin-mails-smart-view-select");
      smartView.setAttribute("aria-label", this._t("smartView", "Vue intelligente"));
      for (const view of PIN_MODULES.PinSmartViews?.VIEWS || []) { const option=createNode("option","",this._t(view.labelKey, view.fallback));option.value=view.id;smartView.appendChild(option); }
      smartView.value = panelSmartView;
      smartView.addEventListener("change", () => { panelSmartView = smartView.value || "all"; lastRenderSignature = ""; renderLimit = this._settings.panelPageSize; renderPanel(); });
      const bulk = createNode("div", "pin-mails-bulk-actions"); bulk.hidden = true;
      const bulkCount = createNode("span", "pin-mails-bulk-count", t("panelSelectedCount", {count: 0}));
      const bulkButton = (action, label) => { const b = createNode("button", "pin-mails-quick-button", label); b.type = "button"; b.dataset.bulkAction = action; b.setAttribute("aria-label", label); return b; };
      bulk.append(bulkCount, bulkButton("toggleRead", this._t("readUnread", "Lu/non lu")), bulkButton("complete", this._t("complete", "Terminer")), bulkButton("trackNoReply", this._t("noReply", "Relancer sans réponse")), bulkButton("archive", this._t("archive", "Archiver")), bulkButton("group", this._t("group", "Grouper")), bulkButton("unpin", this._t("unpin", "Désépingler")), bulkButton("delete", this._t("delete", "Supprimer")));
      tools.append(searchWrap, smartView, bulk);

      const reminderCenter = createNode("section", "pin-mails-reminder-center");
      reminderCenter.hidden = true;
      reminderCenter.setAttribute("aria-label", t("panelReminderCenter"));
      const list = createNode("div", "pin-mails-panel-list"); list.setAttribute("role", "listbox"); list.setAttribute("aria-multiselectable", "true"); list.tabIndex = -1;
      const live = createNode("div", "pin-mails-live"); live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
      const toast = createNode("div", "pin-mails-toast"); toast.id = TOAST_ID; toast.hidden = true; toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite");
      contextMenu = document.createXULElement("menupopup");
      contextMenu.id = CONTEXT_MENU_ID;
      contextMenu.setAttribute("aria-label", this._t("cardActions", "Actions du message épinglé"));
      contextMenu.setAttribute("position", "after_end");
      const menuItems = [
        ["open", this._t("openMessage", "Ouvrir le message")],
        ["reply", this._t("reply", "Répondre")],
        ["toggleRead", this._t("markReadUnread", "Marquer lu / non lu")],
        ["waiting", this._t("waiting", "Mettre en attente")],
        ["planned", this._t("planned", "Planifier")],
        ["complete", this._t("markComplete", "Marquer comme terminé")],
        ["group", this._t("assignGroup", "Classer dans un groupe")],
        ["remove-group", this._t("removeFromGroup", "Retirer du groupe")],
        ["track-no-reply", this._t("trackNoReply", "Me relancer si aucune réponse")],
        ["cancel-no-reply", this._t("cancelNoReply", "Arrêter le suivi sans réponse")],
        ["snooze", this._t("snoozeOneHour", "Reporter le rappel d’une heure")],
        ["calendar-task", this._t("calendarTask", "Créer ou synchroniser une tâche")],
        ["calendar-event", this._t("calendarEvent", "Créer ou synchroniser un événement")],
        ["edit", this._t("editFollowUp", "Modifier le suivi")],
        ["archive", this._t("archive", "Archiver")],
        ["delete", this._t("delete", "Supprimer")],
        ["unpin", this._t("unpin", "Désépingler")]
      ];
      for (const [action, label] of menuItems) {
        if (action === "archive" || action === "unpin") {
          contextMenu.appendChild(document.createXULElement("menuseparator"));
        }
        const item = document.createXULElement("menuitem");
        item.setAttribute("label", label);
        item.setAttribute("data-context-action", action);
        contextMenu.appendChild(item);
      }
      panel.append(header, tools, reminderCenter, list, live, toast);
      let popupSet = document.querySelector("popupset") || document.getElementById("mainPopupSet");
      if (!popupSet) {
        popupSet = document.createXULElement("popupset");
        popupSet.id = "pin-mails-popup-set";
        document.documentElement.appendChild(popupSet);
        ownedPopupSet = popupSet;
      }
      popupSet.appendChild(contextMenu);
      allHeader = document.getElementById(ALL_HEADER_ID) || createNode("div", "", this._t("allMessages", "Tous les messages"));
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
        const state = !unique.every(h => hasOwn(this._data.refs, conversationStableKey(h)));
        this._setHeadersPinned(unique, state, currentFolderURI(), t(state ? "panelUndoPinConversation" : "panelUndoUnpinConversation"), "conversation");
        for (const hdr of unique) { const ref = this._data.refs[conversationStableKey(hdr)]; if (ref) this._updateConversationReference(ref, hdr); }
        this._saveData("conversation");
      });
      healthIndicator.addEventListener("click", () => {
        this._data.dashboard = {...(this._data.dashboard || {}), view: "health", smartView: "all"};
        this._saveData("open-health-center");
        dashboardButton.click();
      });
      dashboardButton.addEventListener("click", () => {
        this._dashboardRequestPending = true;
        const notifyBackground = () => {
          const listeners = [...(this._dashboardRequestListeners || [])];
          if (!listeners.length) return false;
          this._dashboardRequestPending = false;
          for (const listener of listeners) {
            try { listener(); } catch (error) { this._recordDiagnostic("warning", "Ouverture du tableau de bord impossible", error); }
          }
          return true;
        };
        if (!notifyBackground()) {
          Promise.resolve(this._extension?.wakeupBackground?.())
            .then(() => { notifyBackground(); })
            .catch(error => this._recordDiagnostic("warning", "Réveil du tableau de bord impossible", error));
        }
        showToast(t("panelDashboardOpening"), false);
        about3Pane.setTimeout(() => {
          if (!this._dashboardRequestPending) return;
          this._dashboardRequestPending = false;
          showToast(t("panelDashboardFailed"), false);
        }, 2500);
      });
      search.addEventListener("input", () => { searchText = search.value; renderLimit = this._settings.panelPageSize; renderPanel(); });
      reminderCenter.addEventListener("click", event => {
        const button = elementFromEvent(event)?.closest?.("[data-reminder-action]");
        const key = button?.dataset.stableKey || "";
        if (!button || !hasOwn(this._data.refs, key)) return;
        const action = button.dataset.reminderAction;
        try {
          if (action === "open") {
            this._openReference(key);
          } else if (action === "complete") {
            this._performReferenceAction([key], "complete", {});
          } else if (action === "snooze") {
            this._performReferenceAction([key], "snooze", {durationMs: 60 * 60_000});
          } else if (action === "tomorrow") {
            const target = new Date();
            target.setDate(target.getDate() + 1);
            target.setHours(9, 0, 0, 0);
            this._performReferenceAction([key], "snooze", {until: target.getTime()});
          } else if (action === "dismiss") {
            this._performReferenceAction([key], "dismissReminder", {});
          }
          showToast(t("panelReminderUpdated"), false, "success");
        } catch (error) {
          showToast(t("panelReminderFailed"), false, "error");
        }
      });

      bulk.addEventListener("click", event => {
        const button = event.target.closest("[data-bulk-action]");
        if (!button) return;
        const action = button.dataset.bulkAction;
        const keys = [...selectedPanelKeys];
        const headers = keys.map(key => findCardByStableKey(key)?._pinMessageHeader).filter(Boolean);
        if (action === "unpin") {
          this._pushUndo(t("panelUndoBulkUnpin"), this._captureFlags(headers));
          if (this._settings.pinMode === "nativeStar") {
            const byFolder = new Map();
            for (const hdr of headers) { const bucket = byFolder.get(hdr.folder) || []; bucket.push(hdr); byFolder.set(hdr.folder, bucket); }
            for (const [folder, bucket] of byFolder) folder.markMessagesFlagged(bucket, false);
          }
          for (const key of keys) this._removeReferenceByKey(key);
          this._saveData();
          this._refreshAllStates(true);
          showToast(t("panelBulkUnpinned", {count: keys.length}), true);
          selectedPanelKeys.clear();
        } else if (action === "complete") {
          this._performReferenceAction(keys, "complete"); selectedPanelKeys.clear();
        } else if (action === "trackNoReply") {
          this._setNoReplyTracking(keys, {enabled:true}); selectedPanelKeys.clear();
          showToast(t("panelBulkNoReply", {count: keys.length}), true, "success");
        } else if (action === "group") {
          openGroupAssignmentDialog(keys);
        } else {
          this._performMessageAction(action, headers, about3Pane);
        }
      });

      contextMenu.addEventListener("command", event => {
        const rawTarget = event.target || event.explicitOriginalTarget || event.originalTarget;
        const item = rawTarget?.closest?.("[data-context-action]");
        if (!item || !contextMenuKey) return;
        const key = contextMenuKey;
        const action = item.getAttribute("data-context-action");
        closeContextMenu();
        void runCardAction(key, action, item);
      });
      contextMenu.addEventListener("popuphidden", () => {
        const trigger = contextMenuTrigger;
        resetContextMenuState();
        if (trigger?.isConnected && !document.querySelector("dialog[open]")) {
          about3Pane.setTimeout(() => { try { trigger.focus(); } catch {} }, 0);
        }
      });

      if (!onPanelContextMenu) {
        onPanelContextMenu = event => {
          const card = cardFromEvent(event);
          if (!card || !panel?.contains(card)) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          openContextMenuForCard(card, event);
        };
        about3Pane.addEventListener("contextmenu", onPanelContextMenu, true);
      }

      list.addEventListener("contextmenu", event => {
        const card = cardFromEvent(event);
        if (!card || !list.contains(card)) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        openContextMenuForCard(card, event);
      }, true);

      list.addEventListener("click", event => {
        closeContextMenu();
        const target = elementFromEvent(event);
        const actionButton = target?.closest?.("[data-card-action]");
        const card = cardFromEvent(event);
        if (!card) return;
        const key = card.dataset.stableKey;
        const ref = this._data.refs[key];
        const hdr = card._pinMessageHeader;
        if (actionButton) {
          event.preventDefault();
          event.stopPropagation();
          dispatchCardAction(card, actionButton.dataset.cardAction, actionButton, event);
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

      list.addEventListener("focusin", event => {
        const card = event.target.closest?.(".pin-mails-card");
        if (!card) return;
        for (const item of list.querySelectorAll(".pin-mails-card")) item.tabIndex = item === card ? 0 : -1;
      });

      list.addEventListener("keydown", event => {
        const card = event.target.closest(".pin-mails-card");
        if (!card) return;
        const cards = [...list.querySelectorAll(".pin-mails-card")];
        const index = cards.indexOf(card);
        if (["ArrowDown", "ArrowUp", "Home", "End", "PageDown", "PageUp"].includes(event.key)) {
          event.preventDefault();
          let nextIndex = index;
          if (event.key === "ArrowDown") nextIndex++;
          else if (event.key === "ArrowUp") nextIndex--;
          else if (event.key === "Home") nextIndex = 0;
          else if (event.key === "End") nextIndex = cards.length - 1;
          else if (event.key === "PageDown") nextIndex += 5;
          else if (event.key === "PageUp") nextIndex -= 5;
          const nextCard = cards[Math.max(0, Math.min(cards.length - 1, nextIndex))];
          if (nextCard) {
            for (const item of cards) item.tabIndex = item === nextCard ? 0 : -1;
            nextCard.focus();
          }
        } else if (event.key === "Escape") {
          event.preventDefault();
          closeContextMenu();
          selectedPanelKeys.clear();
          updatePanelSelection();
        } else if (event.key === " " && this._settings.enableMultiSelect) {
          event.preventDefault(); const key = card.dataset.stableKey; selectedPanelKeys.has(key) ? selectedPanelKeys.delete(key) : selectedPanelKeys.add(key); selectionAnchorKey = key; updatePanelSelection();
        } else if (event.key === "Enter") {
          event.preventDefault(); selectPanelMessage(this._data.refs[card.dataset.stableKey], card._pinMessageHeader, card);
        } else if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
          event.preventDefault();
          openContextMenuForCard(card, event, card);
        } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
          event.preventDefault(); for (const item of cards) selectedPanelKeys.add(item.dataset.stableKey); updatePanelSelection();
        }
      });

      list.addEventListener("dblclick", event => {
        const card = event.target.closest(".pin-mails-card");
        if (card && !event.target.closest("button") && card._pinMessageHeader) this._thunderbird?.messages?.displayMessage?.(card._pinMessageHeader);
      });

      list.addEventListener("dragstart", event => {
        if (event.target.closest("button, input, select, textarea, a")) { event.preventDefault(); return; }
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
          this._setHeadersPinned(draggedInboxHeaders, true, currentFolderURI(), t("panelUndoDragPin"));
          if (groupId) for (const hdr of draggedInboxHeaders) { const ref = this._data.refs[messageStableKey(hdr)]; if (ref) ref.groupId = groupId; }
          this._saveData(); this._refreshAllStates(true); return;
        }
        const target = event.target.closest(".pin-mails-card");
        if (!draggedCardKey) return;
        if (groupId && this._data.refs[draggedCardKey]) {
          this._pushUndo(t("panelUndoChangeGroup"));
          this._data.refs[draggedCardKey].groupId = groupId;
        }
        if (target && target.dataset.stableKey !== draggedCardKey) {
          const rect = target.getBoundingClientRect(); this._reorderReferences(draggedCardKey, target.dataset.stableKey, event.clientY < rect.top + rect.height / 2);
        } else { this._saveData(); this._refreshAllStates(true); }
      });
    };

    const updatePanelSelection = () => {
      if (!panel) return;
      const cards = [...panel.querySelectorAll(".pin-mails-card")];
      const focusKey = cards.some(card => card.dataset.stableKey === selectedPanelKey)
        ? selectedPanelKey
        : (cards.find(card => card.tabIndex === 0)?.dataset.stableKey || cards[0]?.dataset.stableKey || "");
      cards.forEach((card, index) => {
        const key = card.dataset.stableKey;
        const selected = selectedPanelKeys.has(key);
        const active = selectedPanelKey === key;
        card.toggleAttribute("data-selected", selected);
        card.toggleAttribute("data-active", active);
        card.setAttribute("aria-selected", String(selected));
        card.setAttribute("aria-posinset", String(index + 1));
        card.setAttribute("aria-setsize", String(cards.length));
        card.tabIndex = key === focusKey ? 0 : -1;
        if (active) card.setAttribute("aria-current", "true");
        else card.removeAttribute("aria-current");
      });
      const bulk = panel.querySelector(".pin-mails-bulk-actions");
      if (bulk) {
        bulk.hidden = selectedPanelKeys.size < 2 || !this._settings.enableBulkActions;
        bulk.querySelector(".pin-mails-bulk-count").textContent = t("panelSelectedCount", {count: selectedPanelKeys.size});
      }
    };

    const selectPanelMessage = (ref, hdr, card) => {
      if (!ref) return false;
      selectedPanelKey = ref.stableKey;
      updatePanelSelection();
      if (!hdr) return false;
      try {
        about3Pane.messagePane.displayMessage(hdr.folder.getUriForMsg(hdr));
        return true;
      } catch (error) {
        this._recordDiagnostic("error", "Affichage du message impossible", error);
        return false;
      }
    };

    const createQuickButton = (action, label, text) => {
      const button = createNode("button", "pin-mails-quick-button", text);
      button.type = "button";
      button.dataset.cardAction = action;
      button.title = label;
      button.setAttribute("aria-label", label);
      button.draggable = false;
      button.addEventListener("pointerdown", event => {
        if (event.button !== 0) return;
        const card = button.closest(".pin-mails-card");
        if (!card?.draggable) return;
        card.draggable = false;
        const restoreDrag = () => {
          about3Pane.removeEventListener("pointerup", restoreDrag, true);
          about3Pane.removeEventListener("pointercancel", restoreDrag, true);
          if (card.isConnected) {
            card.draggable = this._settings.sortMode === "manual" && Boolean(card._pinMessageHeader) && !this._settings.safeMode;
          }
        };
        about3Pane.addEventListener("pointerup", restoreDrag, true);
        about3Pane.addEventListener("pointercancel", restoreDrag, true);
      }, true);
      return button;
    };

    const createCard = entry => {
      const {ref, hdr} = entry;
      const renderToken = PIN_MODULES.PinPerformance?.cardToken(entry, this._settings) || `${ref.stableKey}|${ref.updatedAt || 0}`;
      const cached = cardCache.get(ref.stableKey);
      if (cached?.token === renderToken && cached.node) {
        cached.node._pinMessageHeader = hdr;
        cached.node.draggable = this._settings.sortMode === "manual" && Boolean(hdr) && !this._settings.safeMode;
        this._performance.reusedCards = (this._performance.reusedCards || 0) + 1;
        return cached.node;
      }
      const color = this._settings.showAccountColor
        ? this._getAccountColor(ref.accountKey)
        : "#0f6cbd";
      const card = createNode("article", "pin-mails-card");
      card.setAttribute("role", "option"); card.tabIndex = -1; card.dataset.stableKey = ref.stableKey; card._pinMessageHeader = hdr;
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
      if (hdr && !(hdr.flags & Ci.nsMsgMessageFlags.Read)) { const dot = createNode("span", "pin-mails-unread-dot"); dot.title = t("panelUnread"); top.appendChild(dot); }
      const author = createNode("span", "pin-mails-author", hdr ? formatAuthor(hdr) : ref.author || t("panelMissingAuthor")); author.title = author.textContent;
      const date = createNode("time", "pin-mails-date", this._formatDate(about3Pane, hdr, ref));
      const more = createQuickButton("more", this._t("moreActions", "Plus d’actions"), "⋯");
      more.classList.add("pin-mails-card-more");
      more.setAttribute("aria-haspopup", "menu");
      more.setAttribute("aria-expanded", "false");
      more.draggable = false;
      more.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        dispatchCardAction(card, "more", more, event);
      }, true);
      const pin = createQuickButton("unpin", t("unpin"), "");
      pin.draggable = false;
      pin.classList.add("pin-mails-card-pin");
      top.append(author, date, more, pin);
      const subject = createNode("div", "pin-mails-subject", hdr ? formatSubject(hdr) : ref.subject || t("panelMovedOrDeleted")); subject.title = subject.textContent;
      card.setAttribute("aria-label", `${subject.textContent} — ${author.textContent}${ref.completedAt ? ` — ${t("panelAriaCompleted")}` : ""}${!hdr ? ` — ${t("panelAriaMissing")}` : ""}`);
      card.append(top, subject);

      if (this._settings.showNotes && ref.note) card.appendChild(createNode("div", "pin-mails-note", ref.note));
      const checklistStats = PIN_MODULES.PinChecklists?.stats(ref.checklist) || {total:0,completed:0,pending:0};
      if (checklistStats.total) card.appendChild(createNode("div", "pin-mails-checklist-summary", t("panelChecklistProgress", checklistStats)));
      const statusLine = createNode("div", "pin-mails-status-line");
      if (ref.trackingMode === "conversation") statusLine.appendChild(createNode("span", "pin-mails-conversation-chip", `${t("panelMessagesCount", {count: ref.conversationCount || 1})}${ref.conversationUnread ? ` · ${t("panelUnreadCount", {count: ref.conversationUnread})}` : ""}`));
      const responseState = PIN_MODULES.PinAnalytics?.responseState(ref) || "none";
      if (responseState === "waitingForThem") statusLine.appendChild(createNode("span", "pin-mails-response-chip waiting", t("panelWaitingForThem")));
      else if (responseState === "needsReply") statusLine.appendChild(createNode("span", "pin-mails-response-chip reply", t("panelNeedsReply")));
      if (ref.workflowStatus === "waiting") statusLine.appendChild(createNode("span", "pin-mails-workflow-chip waiting", ref.waitingSince ? t("panelWaitingSince", {date: this._formatTimestamp(about3Pane, ref.waitingSince)}) : t("panelWaitingForReply")));
      else if (ref.workflowStatus === "planned") statusLine.appendChild(createNode("span", "pin-mails-workflow-chip planned", t("panelPlanned")));
      if (ref.completedAt || ref.workflowStatus === "completed") statusLine.appendChild(createNode("span", "pin-mails-completed-chip", t("panelCompleted")));
      if (ref.followUpAt && ref.workflowStatus !== "completed") statusLine.appendChild(createNode("span", `pin-mails-follow-up-chip${ref.followUpAt < Date.now() ? " overdue" : ""}`, t(ref.followUpAt < Date.now() ? "panelFollowUpOverdue" : "panelFollowUpAt", {date: this._formatTimestamp(about3Pane, ref.followUpAt)})));
      if (ref.noReplyTracking && ref.noReplyAt) statusLine.appendChild(createNode("span", `pin-mails-no-reply-chip${ref.noReplyAt < Date.now() ? " overdue" : ""}`, ref.noReplyAt < Date.now() ? t("panelNoReplyOverdue") : t("panelNoReplyAt", {date: this._formatTimestamp(about3Pane, ref.noReplyAt)})));
      if (ref.recurrenceRule) {
        const recurrenceUnits = {daily:"panelUnitDay",weekdays:"panelUnitWeekdays",weekly:"panelUnitWeek",monthly:"panelUnitMonth",quarterly:"panelUnitQuarter",yearly:"panelUnitYear"};
        statusLine.appendChild(createNode("span", "pin-mails-recurrence-chip", t("panelRecurring", {interval: ref.recurrenceInterval > 1 ? `${ref.recurrenceInterval}× ` : "", unit: t(recurrenceUnits[ref.recurrenceRule] || "panelUnitDay")})));
      }
      const caseItem = (this._data.cases || []).find(item => item.id === ref.caseId);
      if (caseItem) { const chip = createNode("span", "pin-mails-case-chip", t("panelCaseChip", {name: caseItem.name})); chip.style.setProperty("--pin-case-color", caseItem.color); statusLine.appendChild(chip); }
      if (ref.calendarItemId) statusLine.appendChild(createNode("span", "pin-mails-calendar-chip", t("panelCalendarSynced")));
      if (this._settings.showDeadlines && ref.dueAt) {
        const due = createNode("span", "pin-mails-due", t(ref.dueAt < Date.now() ? "panelOverdueAt" : "panelDeadlineAt", {date: this._formatTimestamp(about3Pane, ref.dueAt)})); statusLine.appendChild(due);
      }
      const group = this._groupForId(ref.groupId);
      if (this._settings.showGroups && group) {
        const chip = createQuickButton("remove-group", t("panelRemoveFromNamedGroup", {group: group.name}), `${group.name} ×`);
        chip.classList.add("pin-mails-group-chip", "pin-mails-group-remove");
        chip.style.setProperty("--pin-group-color", group.color);
        statusLine.appendChild(chip);
      }
      if (ref.priorityLevel !== "normal") statusLine.appendChild(createNode("span", `pin-mails-priority-chip ${ref.priorityLevel}`, ref.priorityLevel === "urgent" ? t("panelPriorityUrgent") : t("panelPriorityHighChip")));
      if (statusLine.childNodes.length) card.appendChild(statusLine);

      if (this._settings.cardLines >= 3) {
        const meta = createNode("div", "pin-mails-card-meta");
        const preview = !this._settings.safeMode && hdr ? getCachedPreview(hdr) : "";
        if (preview) { const node = createNode("span", "pin-mails-preview", preview); node.title = preview; meta.appendChild(node); }
        if (this._settings.showPriority && hdr && isHighPriority(hdr)) { const node = createNode("span", "pin-mails-meta-icon pin-mails-priority", "!"); node.title = t("panelMessagePriorityHigh"); meta.appendChild(node); }
        if (this._settings.showAttachments && hdr && hasAttachment(hdr)) { const node = createNode("span", "pin-mails-meta-icon", "PJ"); node.title = t("panelAttachment"); meta.appendChild(node); }
        if (this._settings.showTags && !this._settings.safeMode && hdr) for (const tag of getTagMetadata(hdr)) { const node = createNode("span", "pin-mails-tag", tag.name); node.style.setProperty("--tag-color", tag.color); meta.appendChild(node); }
        if (this._settings.showFolder && ref.folderName) { const node = createNode("span", "pin-mails-folder", ref.folderName); node.title = ref.folderName; meta.appendChild(node); }
        if (meta.childNodes.length) card.appendChild(meta);
      }

      if (this._settings.showQuickActions && !this._settings.safeMode && hdr) {
        const actions = createNode("div", "pin-mails-card-actions");
        actions.append(
          createQuickButton("reply", t("panelReply"), "↩"),
          createQuickButton("waiting", t(ref.workflowStatus === "waiting" ? "panelReturnActive" : "panelSetWaitingForReply"), ref.workflowStatus === "waiting" ? "▶" : "⌛"),
          createQuickButton("complete", t(ref.completedAt ? "panelReopen" : "panelMarkCompletedQuick"), ref.completedAt ? "↺" : "✓"),
          createQuickButton("edit", t("panelEditMetadata"), "✎")
        );
        card.appendChild(actions);
      } else if (!this._settings.safeMode && (this._settings.showNotes || this._settings.showDeadlines || this._settings.showGroups)) {
        const actions = createNode("div", "pin-mails-card-actions"); actions.appendChild(createQuickButton("edit", t("panelEditFollowUpTitle"), "✎")); card.appendChild(actions);
      }
      cardCache.set(ref.stableKey, {token: renderToken, node: card});
      this._performance.createdCards = (this._performance.createdCards || 0) + 1;
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
      header.appendChild(createNode("span", "pin-mails-group-count", `${entries.length}${unread ? ` · ${t("panelUnreadCount", {count: unread})}` : ""}${overdue ? ` · ${t("panelOverdueCount", {count: overdue})}` : ""}`));
      section.appendChild(header);
      for (const entry of entries) section.appendChild(createCard(entry));
      return section;
    };

    const updateFolderBadge = _stats => {
      // Retired in 2.0: a custom number beside a folder is visually
      // indistinguishable from Thunderbird's unread counter.
      for (const old of document.querySelectorAll(".pin-mails-folder-badge")) old.remove();
    };

    const renderPanelReminders = entries => {
      const host = panel?.querySelector(".pin-mails-reminder-center");
      if (!host) return;
      const pending = PIN_MODULES.PinReview?.pendingReminders(entries.map(entry => entry.ref), {now: Date.now()}) || [];
      host.replaceChildren();
      host.hidden = panelCollapsed() || !pending.length;
      if (!pending.length) return;
      const heading = createNode("div", "pin-mails-reminder-heading");
      heading.append(createNode("strong", "", t("panelReminderCenter")), createNode("span", "pin-mails-reminder-count", String(pending.length)));
      host.appendChild(heading);
      for (const ref of pending.slice(0, 5)) {
        const row = createNode("article", "pin-mails-reminder-row");
        const copy = createNode("div", "pin-mails-reminder-copy");
        copy.append(createNode("strong", "", ref.subject || t("panelNoSubject")), createNode("span", "", ref.author || ""));
        const actions = createNode("div", "pin-mails-reminder-actions");
        for (const [action, label] of [
          ["open", t("panelOpen")],
          ["complete", this._t("complete", "")],
          ["snooze", this._t("snoozeOneHour", "")],
          ["tomorrow", t("panelSnoozeTomorrow")],
          ["dismiss", t("panelDismiss")]
        ]) {
          const button = createNode("button", "pin-mails-reminder-action", label);
          button.type = "button";
          button.dataset.reminderAction = action;
          button.dataset.stableKey = ref.stableKey;
          actions.appendChild(button);
        }
        row.append(copy, actions);
        host.appendChild(row);
      }
    };

    const renderPanel = () => {
      const renderStarted = about3Pane.performance.now();
      createPanel();
      clearDropVisuals();
      const enabled = isEnabled();
      document.documentElement.toggleAttribute(INBOX_ATTRIBUTE, enabled);
      document.documentElement.setAttribute("pin-mails-density", this._settings.density);
      const systemReducedMotion = Boolean(about3Pane.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
      const reduceMotion = this._settings.reduceMotion === "always" || (this._settings.reduceMotion === "auto" && systemReducedMotion);
      document.documentElement.setAttribute("pin-mails-animate", String(this._settings.animateChanges && !this._settings.safeMode && !reduceMotion));
      document.documentElement.style.setProperty("--pin-mails-max-height", `${this._settings.panelMaxHeight}px`);
      panel.hidden = !enabled || !panelVisible(); allHeader.hidden = !enabled || !panelVisible();
      updatePanelToggle();
      if (!enabled) return;
      panel.toggleAttribute("data-collapsed", panelCollapsed());
      panel.querySelector(".pin-mails-collapse-button").setAttribute("aria-label", panelCollapsed() ? this._t("expandPinned", "Développer la section Épinglés") : this._t("collapsePinned", "Réduire la section Épinglés"));
      panel.querySelector(".pin-mails-header-select").value = this._settings.panelScope;
      panel.querySelector(".pin-mails-header-select[data-secondary]").value = this._settings.sortMode;
      panel.querySelector(".pin-mails-panel-tools").hidden = panelCollapsed();
      panel.querySelector(".pin-mails-search-wrap").hidden = !this._settings.showSearch;
      panel.querySelector(".pin-mails-search").value = searchText;
      const smartViewControl = panel.querySelector(".pin-mails-smart-view-select");
      if (smartViewControl) { smartViewControl.hidden = !this._settings.enableSmartViews; smartViewControl.value = panelSmartView; }
      panel.querySelector(".pin-mails-action-conversation").hidden = !this._settings.enableConversationPins || this._settings.safeMode;
      panel.querySelector(".pin-mails-action-dashboard").hidden = !this._settings.enableGlobalDashboard;
      panel.querySelector(".pin-mails-action-add-group").hidden = !this._settings.showGroups || this._settings.safeMode;
      this._syncInbox(about3Pane.gFolder);
      const allEntries = this._entriesForFolder(about3Pane.gFolder);
      renderPanelReminders(allEntries);
      const stats = {
        total: allEntries.length,
        unread: allEntries.filter(entry => entry.hdr && !(entry.hdr.flags & Ci.nsMsgMessageFlags.Read)).length,
        overdue: allEntries.filter(entry => !entry.ref.completedAt && entry.ref.dueAt && entry.ref.dueAt < Date.now()).length,
        completed: allEntries.filter(entry => entry.ref.completedAt).length
      };
      panel.querySelector(".pin-mails-count").textContent = String(stats.total);
      panel.querySelector(".pin-mails-summary").textContent = this._settings.showCounters ? `${t("panelUnreadCount", {count: stats.unread})} · ${t("panelOverdueCount", {count: stats.overdue})}${stats.completed ? ` · ${t("panelCompletedCount", {count: stats.completed})}` : ""}` : "";
      const healthButton = panel.querySelector(".pin-mails-health-indicator");
      if (healthButton) {
        const health = this._settings.enableHealthCenter ? PIN_MODULES.PinHealth?.build({
          data: this._data,
          settings: this._settings,
          compatibility: this._compatibility,
          performance: this._getPerformanceReport(),
          diagnostics: PIN_MODULES.PinDiagnostics?.summary(this._diagnosticEvents || [])
        }) : null;
        const visible = Boolean(this._settings.enableHealthNotifications && health && health.status !== "healthy");
        healthButton.hidden = !visible;
        healthButton.textContent = visible ? t("panelHealthScore", {score: health.score}) : "";
        healthButton.dataset.status = health?.status || "healthy";
        healthButton.title = visible ? t("panelHealthIssues", {count: health.issues?.length || 0}) : this._t("healthHealthy", "");
      }
      updateFolderBadge(stats);
      const query = sanitizeSearchText(searchText);
      let entries = query ? allEntries.filter(entry => {
        const group = this._groupForId(entry.ref.groupId);
        return sanitizeSearchText([entry.ref.author, entry.ref.subject, entry.ref.accountName, entry.ref.folderName, entry.ref.note, group?.name].join(" ")).includes(query);
      }) : allEntries;
      if (this._settings.enableSmartViews && panelSmartView !== "all") {
        entries = entries.filter(entry => PIN_MODULES.PinSmartViews?.matches(panelSmartView, entry.ref, {unread:Boolean(entry.hdr && !(entry.hdr.flags & Ci.nsMsgMessageFlags.Read)),missing:!entry.hdr,calendarError:Boolean(entry.ref.calendarSyncError)}) ?? true);
      }
      const totalFiltered = entries.length;
      const virtualizationThreshold = Math.max(this._settings.panelPageSize, this._settings.panelVirtualizationThreshold || 180);
      const effectiveLimit = totalFiltered <= virtualizationThreshold ? totalFiltered : renderLimit;
      entries = entries.slice(0, effectiveLimit);
      const list = panel.querySelector(".pin-mails-panel-list");
      const grouping = this._settings.showSmartSections ? "smart" : (this._settings.groupByCustomGroup && this._settings.showGroups ? "group" : (this._settings.groupByAccount ? "account" : "flat"));
      const renderSignature = PIN_MODULES.PinPerformance?.listSignature(entries, {
        mode:`panel:${panelSmartView}`,search:query,limit:renderLimit,scope:this._settings.panelScope,sort:this._settings.sortMode,grouping,settings:this._settings
      }) || `${grouping}|${query}|${entries.map(entry => `${entry.ref.stableKey}:${entry.ref.updatedAt || 0}`).join(",")}`;
      if (renderSignature === lastRenderSignature && list.childElementCount) {
        this._performance.skippedRenders = (this._performance.skippedRenders || 0) + 1;
        updatePanelSelection();
        panel.querySelector(".pin-mails-live").textContent = t("panelDisplayedCount", {count: totalFiltered});
        return;
      }
      lastRenderSignature = renderSignature;
      list.replaceChildren();
      if (!entries.length) { list.appendChild(createNode("div", "pin-mails-empty", query ? this._t("noResult", "Aucun résultat") : this._t("noPinned", "Aucun message épinglé"))); updatePanelSelection(); return; }
      const fragment = document.createDocumentFragment();
      if (this._settings.showSmartSections) {
        const buckets = new Map();
        for (const entry of entries) {
          const id = PIN_MODULES.PinSmartViews?.sectionFor(entry.ref, {unread:Boolean(entry.hdr && !(entry.hdr.flags & Ci.nsMsgMessageFlags.Read)),missing:!entry.hdr,calendarError:Boolean(entry.ref.calendarSyncError)}) || smartSectionForRef(entry.ref);
          const bucket = buckets.get(id) || []; bucket.push(entry); buckets.set(id, bucket);
        }
        for (const id of ["overdue", "today", "week", "waiting", "noReply", "snoozed", "calendarError", "missing", "later", "noDue", "recentCompleted", "completed"]) {
          const bucket = buckets.get(id); if (!bucket?.length) continue;
          const colors = {overdue: "#d13438", today: "#ca5010", week: "#0f6cbd", waiting: "#8a4b00", noReply: "#6264a7", snoozed: "#0f6cbd", calendarError: "#d13438", missing: "#777777", later: "#6264a7", noDue: "#777777", recentCompleted: "#107c10", completed: "#107c10"};
          const smartView = (PIN_MODULES.PinSmartViews?.VIEWS || []).find(view => view.id === id);
          const label = smartView ? this._t(smartView.labelKey, smartView.fallback) : t(id === "later" ? "panelSmartLater" : "panelSmartCompleted");
          fragment.appendChild(createGroupSection(id, label, colors[id], bucket, "smart"));
        }
      } else if (this._settings.groupByCustomGroup && this._settings.showGroups) {
        const buckets = new Map();
        for (const entry of entries) { const id = entry.ref.groupId || "__none"; const bucket = buckets.get(id) || []; bucket.push(entry); buckets.set(id, bucket); }
        const order = [...this._data.groupOrder, "__none"];
        for (const id of order) {
          const bucket = buckets.get(id); if (!bucket?.length) continue;
          const group = this._groupForId(id); fragment.appendChild(createGroupSection(id === "__none" ? "" : id, group?.name || t("panelNoCustomGroup"), group?.color || "#777777", bucket, "custom"));
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
      const visibleKeys = new Set(entries.map(entry => entry.ref.stableKey));
      for (const [key, cached] of cardCache) {
        if (!visibleKeys.has(key)) { cached.node?.remove(); cardCache.delete(key); }
      }
      if (totalFiltered > entries.length) {
        const more = createNode("button", "pin-mails-load-more", t("panelLoadMore", {count: Math.min(this._settings.panelPageSize, totalFiltered - entries.length)})); more.type = "button";
        more.addEventListener("click", () => { renderLimit += this._settings.panelPageSize; renderPanel(); }); list.appendChild(more);
      }
      updatePanelSelection();
      panel.querySelector(".pin-mails-live").textContent = t("panelDisplayedCount", {count: totalFiltered});
      if (this._settings.enablePerformanceMetrics) {
        const elapsed = about3Pane.performance.now() - renderStarted; this._performance.renders++; this._performance.totalRenderMs += elapsed;
        this._performance.lastRenderMs = elapsed; this._performance.maxRenderMs = Math.max(this._performance.maxRenderMs, elapsed);
        if (elapsed > 120) this._recordDiagnostic("info", "Rendu du panneau lent", `${Math.round(elapsed)} ms pour ${entries.length} carte(s)`, {component:"performance",action:"render-panel"});
      }
    };

    const scheduleRefresh = (immediate = false) => {
      if (disposed) return;
      if (refreshTimer !== null) about3Pane.clearTimeout(refreshTimer);
      refreshTimer = about3Pane.setTimeout(() => {
        refreshTimer = null; patchAllRows(); renderPanel();
      }, immediate ? 0 : REFRESH_DELAY_MS);
    };

    const applySettings = () => { lastRenderSignature = ""; renderLimit = this._settings.panelPageSize; updatePanelToggle(); scheduleRefresh(true); };
    const updateFolderMode = () => { lastRenderSignature = ""; cardCache.clear(); selectedPanelKeys.clear(); selectedPanelKey = null; selectionAnchorKey = null; searchText = ""; panelSmartView = "all"; renderLimit = this._settings.panelPageSize; patchAllRows(); renderPanel(); };

    const observer = new about3Pane.MutationObserver(() => scheduleRefresh());
    observer.observe(threadTree, {subtree: true, childList: true, attributes: true, attributeFilter: ["data-properties"]});
    const onFolderChanged = () => {
      closeContextMenu();
      clearDropFeedback();
      about3Pane.setTimeout(updateFolderMode, 0);
    };
    const onRowCountChange = () => scheduleRefresh();
    const onWindowBlur = () => { closeContextMenu(); clearDropFeedback(); };
    const onViewportChange = () => { closeContextMenu(); clearDropTargets(); };
    const onThreadDragEnd = () => clearDropFeedback();
    const onDocumentClick = event => {
      const custom = event.target?.closest?.(`.${INDEPENDENT_BUTTON_CLASS}`);
      if (custom && isEnabled() && this._settings.pinMode === "independent") {
        event.preventDefault(); event.stopImmediatePropagation();
        const hdr = headerForRow(custom.closest("tr"));
        if (hdr) this._setHeadersPinned(
          [hdr],
          !this._isPinnedHeader(hdr),
          currentFolderURI(),
          t(this._isPinnedHeader(hdr) ? "panelUndoUnpin" : "panelUndoPin")
        );
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
      if (onPanelContextMenu) about3Pane.removeEventListener("contextmenu", onPanelContextMenu, true);
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
      document.documentElement.removeAttribute("pin-mails-ui-preset");
      document.documentElement.removeAttribute("pin-mails-animate");
      document.documentElement.style.removeProperty("--pin-mails-max-height");
      cardCache.clear(); lastRenderSignature = "";
      panel?.remove(); allHeader?.remove(); panelToggle?.remove(); editor?.remove(); contextMenu?.remove(); ownedPopupSet?.remove(); groupDialog?.remove(); groupAssignmentDialog?.remove(); for (const badge of document.querySelectorAll(".pin-mails-folder-badge")) badge.remove();
      for (const button of document.querySelectorAll(`.${INDEPENDENT_BUTTON_CLASS}`)) button.remove();
      for (const button of document.querySelectorAll(`.${BUTTON_CLASS}`)) restoreNativeButton(button);
      for (const rail of document.querySelectorAll(`.${CARD_ACTION_RAIL_CLASS}`)) rail.classList.remove(CARD_ACTION_RAIL_CLASS);
      for (const star of document.querySelectorAll("[data-pin-mails-native-star], [data-pin-mails-duplicate-star]")) {
        star.removeAttribute("data-pin-mails-native-star");
        star.removeAttribute("data-pin-mails-duplicate-star");
      }
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
    about3Pane.addEventListener("blur", onWindowBlur, true);
    about3Pane.addEventListener("resize", onViewportChange);
    threadTree.addEventListener("rowcountchange", onRowCountChange);
    threadTree.addEventListener("dragstart", onThreadDragStart);
    threadTree.addEventListener("dragend", onThreadDragEnd);
    about3Pane.addEventListener("unload", cleanup, {once: true});
    ensurePanelToggle();
    createPanel();
    panel?.querySelector(".pin-mails-panel-list")?.addEventListener("scroll", onViewportChange, {passive: true});
    updateFolderMode();
    scheduleRefresh(true);
  }

  _formatTimestamp(about3Pane, timestamp) {
    if (!timestamp) return "";
    return new about3Pane.Intl.DateTimeFormat(undefined, {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(new Date(timestamp));
  }

  _stopRuntimeResources() {
    this._unregisterFolderListener();
    this._unregisterDataObserver();
    this._unregisterCalendarObservers();
    if (this._calendarSyncTimer) { try { this._calendarSyncTimer.cancel(); } catch {} this._calendarSyncTimer = null; }
    if (this._backupTimer) { try { this._backupTimer.cancel(); } catch {} this._backupTimer = null; }
    if (this._reminderTimer) { try { this._reminderTimer.cancel(); } catch {} this._reminderTimer = null; }
    for (const timer of this._pendingDeleteTimers || []) { try { timer.cancel(); } catch {} }
    this._pendingDeleteTimers?.clear();
    this._pendingDeleteKeys?.clear();
    for (const state of [...(this._states || [])]) {
      try { state.cleanup(); } catch (error) { console.error("Épingles : nettoyage incomplet", safeErrorName(error)); }
    }
    this._dashboardRequestPending = false;
    this._dashboardRequestListeners?.clear();
  }

  async _prepareForUninstall() {
    this._uninstallPreparationPromise ??= (async () => {
      try { await this._readyPromise; } catch {}
      this._clearManagedTagsForReferences(Object.values(this._data?.refs || {}));
      this._removeMailPerchTagDefinitions();
      this._stopRuntimeResources();
      const storage = this._storage;
      this._storage = null;
      if (storage) await storage.close();
      this._readyPromise = Promise.resolve(false);
    })();
    return this._uninstallPreparationPromise;
  }


  onShutdown(isAppShutdown) {
    this._stopRuntimeResources();
    if (MAILPERCH_UNINSTALLING) {
      // The core uninstall event will await this same idempotent promise. Keep
      // the instance discoverable until the SQLite writer has fully closed.
      this._prepareForUninstall().finally(() => ACTIVE_PIN_INBOX_INSTANCES.delete(this));
    } else {
      ACTIVE_PIN_INBOX_INSTANCES.delete(this);
      // Start an atomic emergency-file write before the asynchronous SQLite
      // close. The next startup restores it only when it is newer.
      this._storage?.writeEmergencyRecovery(this._data, this._undoStack, "shutdown").catch(() => {});
      this._storage?.close();
    }
    if (!isAppShutdown) {
      if (this._styleSheetService && this._styleUri &&
          this._styleSheetService.sheetRegistered(this._styleUri, this._styleSheetService.AUTHOR_SHEET)) {
        this._styleSheetService.unregisterSheet(this._styleUri, this._styleSheetService.AUTHOR_SHEET);
      }
      Services.obs.notifyObservers(null, "startupcache-invalidate");
    }
  }
};
