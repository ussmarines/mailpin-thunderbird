"use strict";

const PinSettings = globalThis.PinSettings;
const startup = globalThis.MailPerchOptionsStartup;

let configuration = null;
let configurationReady = false;
let refreshSettingsNavigation = null;
let saveInFlight = false;
let groups = [];
let rules = [];
let cases = [];
let templates = [];
let dirty = false;
let persistedDraftSnapshot = "";
let draftStateError = null;
let statusTimer = null;
let lastStatusControl = null;
let calendarRenderGeneration = 0;
let availableCalendars = [];
let entitySequence = 0;
let initializationGeneration = 0;
let initializationInFlight = false;
let lastInitializationDiagnostic = "options:init:not-started";

const accountControls = new Map();
const inboxControls = new Map();
const selectedAccountControls = new Map();
let unavailableSelectedAccountKeys = [];
const $ = id => document.getElementById(id);
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const INITIALIZATION_TIMEOUTS = Object.freeze({
  apiNamespace: 2_000,
  configuration: 10_000,
  shortcut: 5_000,
  calendar: 7_000,
  auxiliary: 7_000
});
const COMMANDS = Object.freeze([
  ["toggle-pin-selected", "commandToggle"],
  ["toggle-conversation-selected", "commandConversation"],
  ["complete-selected-pin", "commandComplete"],
  ["wait-selected-pin", "commandWait"],
  ["plan-selected-pin", "commandPlan"],
  ["activate-selected-pin", "commandActivate"],
  ["snooze-selected-pin", "commandSnooze"],
  ["track-no-reply-selected", "commandTrackNoReply"],
  ["quick-today-selected", "commandQuickToday"],
  ["open-pin-dashboard", "commandDashboard"]
]);
const SETTINGS_REGISTRY_AVAILABLE = Boolean(
  globalThis.PinSettings?.DEFAULTS &&
  typeof globalThis.PinSettings.normalize === "function" &&
  typeof globalThis.PinSettings.describe === "function"
);

class OptionsInitializationTimeout extends Error {
  constructor(operation, timeoutMs) {
    super(`${operation} n’a pas répondu après ${timeoutMs} ms.`);
    this.name = "OptionsInitializationTimeout";
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

function withTimeout(operation, timeoutMs, operationName) {
  let timer = null;
  const task = Promise.resolve().then(operation);
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new OptionsInitializationTimeout(operationName, timeoutMs)), timeoutMs);
  });
  return Promise.race([task, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function pinInboxMethod(name) {
  const method = globalThis.messenger?.pinInbox?.[name];
  if (typeof method !== "function") {
    throw new Error(`L’API MailPerch « ${name} » n’est pas disponible.`);
  }
  return method.bind(globalThis.messenger.pinInbox);
}

async function waitForPinInbox() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < INITIALIZATION_TIMEOUTS.apiNamespace) {
    if (typeof globalThis.messenger?.pinInbox?.getConfiguration === "function") {
      startup?.mark("api:namespace-present");
      return;
    }
    await wait(50);
  }
  throw new OptionsInitializationTimeout("api-namespace", INITIALIZATION_TIMEOUTS.apiNamespace);
}

function safeErrorName(error) {
  return String(error?.name || "Error").replace(/[^a-z0-9_-]/gi, "").slice(0, 48) || "Error";
}

function initializationDiagnostic(error) {
  if (error instanceof OptionsInitializationTimeout) {
    return `options:init:timeout:${error.operation}`;
  }
  return `options:init:error:${safeErrorName(error)}`;
}

function setInitializationState(state, error = null) {
  configurationReady = state === "ready";
  document.body.dataset.initializationState = state;
  document.body.toggleAttribute("data-configuration-ready", configurationReady);
  const form = $("settings-form");
  const loading = $("settings-loading");
  const failure = $("settings-error");
  if (form) {
    form.hidden = !configurationReady;
    form.setAttribute("aria-busy", String(!configurationReady));
  }
  if (loading) loading.hidden = state !== "loading";
  if (failure) failure.hidden = state !== "error";
  if (state === "error") {
    lastInitializationDiagnostic = initializationDiagnostic(error);
    const diagnostic = $("settings-error-diagnostic");
    if (diagnostic) diagnostic.textContent = lastInitializationDiagnostic;
  }
  syncSaveControls();
}

function currentSettings(overrides = {}) {
  return {...(configuration?.settings || {}), ...overrides};
}

const RECOMMENDED_PRESERVED_SETTING_KEYS = Object.freeze(new Set([
  "preferredCalendarId", "waitingGroupId", "backupDirectory", "accountColors", "inboxEnabled", "selectedAccountKeys"
]));

function applyRecommendedDraft(control = null) {
  const config = requireConfiguration();
  const recommended = PinSettings.normalize(config.recommendedSettings || PinSettings.defaults());
  for (const entry of SETTINGS_CONTROL_DEFINITIONS) {
    if (entry.dynamic || RECOMMENDED_PRESERVED_SETTING_KEYS.has(entry.key)) continue;
    const target = $(entry.id);
    if (!target) continue;
    entry.write(target, recommended[entry.key], {entry, settings: recommended});
  }
  syncToggleCards();
  const draft = collectSettings();
  applyUxPreferences(draft);
  syncDirtyState();
  if (control) setLocalStatus(control, msg("recommendedDraftApplied"), "success");
  return draft;
}

function requireConfiguration() {
  if (!configuration?.settings || typeof configuration.settings !== "object") {
    throw new Error("Les paramètres MailPerch sont encore en cours de chargement. Réessayez dans un instant.");
  }
  return configuration;
}

function setConfigurationReady(ready) {
  setInitializationState(ready ? "ready" : "loading");
}

async function fetchConfigurationWithRetry(attempts = 1) {
  await waitForPinInbox();
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      startup?.mark("api:getConfiguration:start");
      const value = await withTimeout(
        () => pinInboxMethod("getConfiguration")(),
        INITIALIZATION_TIMEOUTS.configuration,
        "configuration"
      );
      if (value?.settings && typeof value.settings === "object") {
        startup?.mark("options:getConfiguration:resolved");
        return value;
      }
      lastError = new Error("La configuration reçue est vide.");
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await wait(100 * attempt);
  }
  throw lastError || new Error("La configuration MailPerch est indisponible.");
}

const CONTROL_CODECS = Object.freeze({
  boolean: Object.freeze({
    read: control => Boolean(control.checked),
    write: (control, value) => { control.checked = Boolean(value); }
  }),
  string: Object.freeze({
    read: control => String(control.value || ""),
    write: (control, value) => { control.value = String(value ?? ""); }
  }),
  number: Object.freeze({
    read: (control, context) => readFiniteControlNumber(context.entry.id, context.settings[context.entry.key]),
    write: (control, value) => { control.value = String(value ?? 0); }
  }),
  lines: Object.freeze({
    read: control => lines(control.value),
    write: (control, value) => { control.value = (Array.isArray(value) ? value : []).join("\n"); }
  }),
  preserved: Object.freeze({
    read: (_control, context) => context.settings[context.entry.key],
    write: (control, value) => { control.value = String(value ?? ""); }
  }),
  accountColors: Object.freeze({
    read: () => Object.fromEntries([...accountControls].map(([key, input]) => [key, input.value])),
    write: () => {}
  }),
  inboxEnabled: Object.freeze({
    read: () => Object.fromEntries([...inboxControls].map(([uri, input]) => [uri, input.checked])),
    write: () => {}
  }),
  selectedAccountKeys: Object.freeze({
    read: () => [...selectedAccountControls].filter(([, input]) => input.checked).map(([key]) => key).concat(unavailableSelectedAccountKeys),
    write: () => {}
  })
});

const CONTROL_VALUE_TYPES = Object.freeze({
  boolean: "boolean",
  string: "string",
  number: "number",
  lines: "array",
  preserved: "string",
  accountColors: "record",
  inboxEnabled: "record",
  selectedAccountKeys: "array"
});

function cloneSettingValue(value) {
  return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
}

function settingControl(id, type, options = {}) {
  const key = options.key || id;
  const codec = CONTROL_CODECS[type];
  if (!codec || (SETTINGS_REGISTRY_AVAILABLE && !Object.prototype.hasOwnProperty.call(PinSettings.DEFAULTS, key))) {
    throw new Error(`Contrôle de réglage invalide : ${id}`);
  }
  return Object.freeze({
    id,
    key,
    type,
    valueType: CONTROL_VALUE_TYPES[type],
    defaultValue: SETTINGS_REGISTRY_AVAILABLE ? cloneSettingValue(PinSettings.DEFAULTS[key]) : undefined,
    read: codec.read,
    write: codec.write,
    normalize: value => PinSettings.normalize({...PinSettings.DEFAULTS, [key]: value})[key],
    includeInDirty: options.includeInDirty !== false,
    includeInSave: options.includeInSave !== false,
    dependency: options.dependency || "",
    dynamic: Boolean(options.dynamic)
  });
}

const SETTINGS_CONTROL_DEFINITIONS = Object.freeze([
  ...[
    "allowPinOutsideInbox", "enableConversationPins", "safeMode", "showSmartSections",
    "hideCompleted", "autoRemoveCompleted", "groupByAccount", "groupByCustomGroup",
    "showSearch", "showCounters", "rememberCollapsed", "showAccountColor",
    "showAttachments", "showTags", "showPriority", "smartDates", "showFolder",
    "showNotes", "showDeadlines", "showGroups", "showQuickActions",
    "enableDragFromInbox", "enableMultiSelect", "enableBulkActions",
    "confirmBulkDestructiveActions", "enableUndo", "confirmDelete", "animateChanges",
    "enableReminders", "enableAdvancedReminders", "enableAutomaticRules",
    "enableRuleSimulation", "autoUnpinOnArchive", "autoCompleteOnArchive",
    "autoUnpinOnDelete", "autoUnpinOnRead", "autoUnpinOnReply", "keepPinOnMove",
    "moveToWaitingOnReply", "enableCalendarIntegration", "enableBidirectionalCalendarSync", "enableThunderbirdTagSync",
    "calendarCompleteOnPinComplete", "calendarDeleteOnUnpin", "enableGlobalDashboard",
    "enablePerformanceMetrics", "autoCleanup", "enableWaitingWorkflow",
    "reopenOnConversationReply", "enableRecurringFollowUps", "enableHistory",
    "enableCases", "enableKanban", "enableTemplates", "enableAutomaticBackups",
    "backupBeforeMigration", "backupIncludeHistory", "enableConcurrentWriteProtection",
    "enableCounterRegressionGuard", "enableAutomaticNoReplyTracking",
    "noReplyCancelOnIncomingReply", "enableSmartViews", "enableHealthCenter",
    "enableHealthNotifications", "enableDiagnostics"
  ].map(id => settingControl(id, "boolean")),
  ...[
    "pinMode", "defaultPinTarget", "compatibilityMode", "panelScope", "sortMode",
    "density", "missedReminderPolicy", "calendarItemType", "settingsExperience",
    "uiPreset", "reduceMotion", "defaultSmartView", "diagnosticLevel",
    "waitingGroupId", "preferredCalendarId"
  ].map(id => settingControl(id, "string")),
  ...[
    "cardLines", "panelMaxHeight", "panelPageSize", "panelVirtualizationThreshold",
    "completedRetentionDays", "undoTimeoutMs", "reminderLeadMinutes",
    "cleanupGraceDays", "defaultFollowUpDays", "noReplyDefaultDays",
    "ruleErrorDisableThreshold", "ruleDefaultMaxPerMinute", "backupIntervalHours",
    "backupRetention", "diagnosticMaxEntries"
  ].map(id => settingControl(id, "number")),
  settingControl("autoPinSenders", "lines"),
  settingControl("autoPinTags", "lines"),
  settingControl("backupDirectory", "preserved", {includeInDirty: false, dependency: "choose-backup"}),
  settingControl("accounts-list", "accountColors", {key: "accountColors", dynamic: true}),
  settingControl("accounts-list", "inboxEnabled", {key: "inboxEnabled", dynamic: true}),
  settingControl("selected-accounts-list", "selectedAccountKeys", {key: "selectedAccountKeys", dynamic: true})
]);

const SETTINGS_CONTROL_REGISTRY = new Map(
  SETTINGS_CONTROL_DEFINITIONS.map(entry => [entry.key, entry])
);
const NON_UI_SETTING_KEYS = Object.freeze(new Set(["schemaVersion", "showFolderBadge"]));
const NON_SETTING_CONTROL_IDS = Object.freeze(new Set([
  "clear-stars-after-import", "import-file", "shortcut"
]));

function validateSettingsControlRegistry() {
  if (!SETTINGS_REGISTRY_AVAILABLE) {
    throw new Error("Le registre de recommandations MailPerch n’est pas chargé.");
  }
  const schema = new Map(PinSettings.describe().map(entry => [entry.key, entry]));
  for (const [key, entry] of SETTINGS_CONTROL_REGISTRY) {
    const declaration = schema.get(key);
    if (!declaration || declaration.migration !== PinSettings.MIGRATION_STRATEGY) {
      throw new Error(`Stratégie de migration absente pour ${key}.`);
    }
    if (declaration.type !== entry.valueType) {
      throw new Error(`Type de réglage divergent pour ${key}.`);
    }
    if (stableSnapshot(entry.defaultValue) !== stableSnapshot(declaration.defaultValue)) {
      throw new Error(`Valeur recommandée divergente pour ${key}.`);
    }
    if (!$(entry.id)) throw new Error(`Contrôle déclaré introuvable : ${entry.id}.`);
  }
  for (const key of schema.keys()) {
    if (!SETTINGS_CONTROL_REGISTRY.has(key) && !NON_UI_SETTING_KEYS.has(key)) {
      throw new Error(`Réglage sans contrôle ni exclusion explicite : ${key}.`);
    }
  }
  for (const control of document.querySelectorAll("#settings-form input[id], #settings-form select[id], #settings-form textarea[id]")) {
    if (NON_SETTING_CONTROL_IDS.has(control.id)) continue;
    const registered = SETTINGS_CONTROL_DEFINITIONS.some(entry => entry.id === control.id && !entry.dynamic);
    if (!registered) throw new Error(`Contrôle configurable non enregistré : ${control.id}.`);
  }
}


const CONTROL_HELP = {
  pinMode: "controlHelpPinMode",
  defaultPinTarget: "controlHelpDefaultPinTarget",
  compatibilityMode: "controlHelpCompatibilityMode",
  enableCounterRegressionGuard: "controlHelpCounterGuard",
  enableConcurrentWriteProtection: "controlHelpConcurrentWrites",
  safeMode: "controlHelpSafeMode",
  showQuickActions: "controlHelpQuickActions",
  enableMultiSelect: "controlHelpMultiSelect",
  confirmDelete: "controlHelpConfirmDelete",
  enableCalendarIntegration: "controlHelpCalendarIntegration",
  enableBidirectionalCalendarSync: "controlHelpCalendarSync",
  enableThunderbirdTagSync: "controlHelpThunderbirdTagSync",
  calendarCompleteOnPinComplete: "controlHelpCalendarComplete",
  calendarDeleteOnUnpin: "controlHelpCalendarDelete",
  calendarItemType: "controlHelpCalendarItemType",
  preferredCalendarId: "controlHelpPreferredCalendar",
  enableAutomaticBackups: "controlHelpAutomaticBackups",
  backupDirectory: "controlHelpBackupDirectory",
  enableGlobalDashboard: "controlHelpGlobalDashboard",
  enablePerformanceMetrics: "controlHelpPerformanceMetrics",
  shortcut: "controlHelpShortcut"
};

const BUTTON_HELP = {
  "apply-recommended-settings": "buttonHelpApplyRecommended",
  "import-stars": "buttonHelpImportStars",
  "simulate-rules": "buttonHelpSimulateRules",
  "clear-rule-log": "buttonHelpClearRuleLog",
  "add-rule": "buttonHelpAddRule",
  "add-group": "buttonHelpAddGroup",
  "add-case": "buttonHelpAddCase",
  "add-template": "buttonHelpAddTemplate",
  "sync-calendar": "buttonHelpSyncCalendar",
  "sync-tags": "buttonHelpSyncTags",
  "choose-backup": "buttonHelpChooseBackup",
  "run-backup": "buttonHelpRunBackup",
  "integrity-check": "buttonHelpIntegrityCheck",
  "compat-check": "buttonHelpCompatibilityCheck",
  dashboard: "buttonHelpDashboard",
  undo: "buttonHelpUndo",
  repair: "buttonHelpRepair",
  rescan: "buttonHelpRescan",
  cleanup: "buttonHelpCleanup",
  "reset-interface": "buttonHelpResetInterface",
  diagnostic: "buttonHelpDiagnostic",
  export: "buttonHelpExport",
  "save-shortcut": "buttonHelpSaveShortcut",
  "save-all-floating": "buttonHelpSaveAll",
  reset: "buttonHelpReset"
};

Object.assign(CONTROL_HELP, {
  settingsExperience: "controlHelpSettingsExperience",
  uiPreset: "controlHelpUiPreset",
  reduceMotion: "controlHelpReduceMotion",
  panelVirtualizationThreshold: "controlHelpVirtualization",
  enableSmartViews: "controlHelpSmartViews",
  enableBulkActions: "controlHelpBulkActions",
  confirmBulkDestructiveActions: "controlHelpBulkConfirm",
  enableAutomaticNoReplyTracking: "controlHelpAutomaticNoReply",
  noReplyCancelOnIncomingReply: "controlHelpCancelNoReply",
  noReplyDefaultDays: "controlHelpNoReplyDays",
  defaultSmartView: "controlHelpDefaultSmartView",
  enableHealthCenter: "controlHelpHealthCenter",
  enableHealthNotifications: "controlHelpHealthNotifications",
  enableDiagnostics: "controlHelpDiagnostics",
  diagnosticLevel: "controlHelpDiagnosticLevel",
  diagnosticMaxEntries: "controlHelpDiagnosticEntries"
});

Object.assign(BUTTON_HELP, {
  "provider-check": "buttonHelpProviderCheck",
  "health-check": "buttonHelpHealthCheck",
  "health-repair": "buttonHelpHealthRepair",
  "clear-diagnostics": "buttonHelpClearDiagnostics"
});

function genericControlHelp(control) {
  if (control.type === "checkbox") return msg("genericCheckboxHelp");
  if (control.tagName === "SELECT") return msg("genericSelectHelp");
  if (control.type === "number") return msg("genericNumberHelp");
  if (control.tagName === "TEXTAREA") return msg("genericTextareaHelp");
  return msg("genericValueHelp");
}

function msg(key, substitutions = undefined) {
  const value = messenger.i18n.getMessage(key, substitutions);
  if (!value) throw new Error(`Traduction dynamique absente : ${key}`);
  return value;
}

function failureMessage(key, error) {
  return `${msg(key)} (${safeErrorName(error)})`;
}

function syncIntegrationControls() {
  const tagSyncEnabled = Boolean($("enableThunderbirdTagSync")?.checked);
  const tagSyncButton = $("sync-tags");
  if (tagSyncButton) {
    tagSyncButton.disabled = !tagSyncEnabled;
    tagSyncButton.setAttribute("aria-disabled", String(!tagSyncEnabled));
  }

  const calendarEnabled = Boolean($("enableCalendarIntegration")?.checked);
  const calendarSyncButton = $("sync-calendar");
  if (calendarSyncButton) {
    calendarSyncButton.disabled = !calendarEnabled;
    calendarSyncButton.setAttribute("aria-disabled", String(!calendarEnabled));
  }
}

function syncToggleCards() {
  const recommended = configuration?.recommendedSettings || {};
  for (const card of document.querySelectorAll(".setting-toggle")) {
    const checkbox = card.querySelector('input[type="checkbox"]');
    if (!checkbox) continue;
    const active = checkbox.checked;
    card.dataset.enabled = String(active);
    let badge = card.querySelector(":scope > .toggle-recommended-badge");
    const isRecommendedButDisabled = recommended[checkbox.id] === true && !active;
    if (isRecommendedButDisabled && !badge) {
      badge = node("span", "toggle-recommended-badge", msg("dynamicRecommended"));
      badge.setAttribute("aria-label", msg("dynamicRecommendedDisabled"));
      card.append(badge);
    }
    if (badge) badge.hidden = !isRecommendedButDisabled;
  }
  syncIntegrationControls();
}

function slugify(value) {
  return String(value || "section")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function setLocalStatus(control, message, type = "") {
  if (!(control instanceof HTMLElement) || !message) return;
  const anchor = control.closest(".button-help-wrap, label, .file-button") || control;
  const section = control.closest("section") || control.closest("footer");
  if (!section) return;
  for (const old of section.querySelectorAll(".control-feedback[data-active='true']")) {
    old.dataset.active = "false";
  }
  let feedback = anchor.parentElement?.querySelector(`:scope > .control-feedback[data-for="${control.id || control.name || "control"}"]`);
  if (!feedback) {
    feedback = node("small", "control-feedback");
    feedback.dataset.for = control.id || control.name || "control";
    anchor.after(feedback);
  }
  feedback.textContent = String(message);
  feedback.className = `control-feedback ${type}`.trim();
  feedback.dataset.active = "true";
  feedback.setAttribute("role", type === "error" ? "alert" : "status");
}

function enhanceSettingsPage() {
  const nav = $("settings-nav");
  nav.replaceChildren();
  const sections = [...document.querySelectorAll("#settings-form > section")];
  const groups = new Map();
  const links = new Map();
  const navFragment = document.createDocumentFragment();

  for (const [index, section] of sections.entries()) {
    const heading = section.querySelector("h2");
    if (!heading) continue;
    section.id ||= `settings-${slugify(heading.textContent)}-${index + 1}`;
    section.dataset.searchText = section.textContent.toLowerCase();
    const groupName = section.dataset.navGroupI18n ? msg(section.dataset.navGroupI18n) : (section.dataset.navGroup || msg("navOther"));
    let group = groups.get(groupName);
    if (!group) {
      group = node("section", "settings-nav-group");
      group.dataset.navGroup = groupName;
      const title = node("strong", "settings-nav-group-title", groupName);
      const list = node("div", "settings-nav-group-links");
      group.append(title, list);
      groups.set(groupName, group);
      navFragment.appendChild(group);
    }
    const link = node("a", "settings-nav-link");
    link.href = `#${section.id}`;
    link.dataset.sectionId = section.id;
    const icon = node("span", "settings-nav-icon", section.dataset.navIcon || "•");
    icon.setAttribute("aria-hidden", "true");
    link.append(icon, node("span", "", heading.textContent.trim()));
    link.addEventListener("click", event => {
      event.preventDefault();
      section.scrollIntoView({behavior: document.body.dataset.reduceMotion === "always" ? "auto" : "smooth", block: "start"});
      history.replaceState(null, "", `#${section.id}`);
      section.querySelector("input, select, textarea, button, summary")?.focus({preventScroll: true});
    });
    group.querySelector(".settings-nav-group-links").appendChild(link);
    links.set(section.id, link);
  }
  nav.appendChild(navFragment);

  const setActiveSection = sectionId => {
    for (const [id, link] of links) {
      const active = id === sectionId;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
    }
  };
  const observer = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting && !entry.target.hidden)
      .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
    if (visible[0]) setActiveSection(visible[0].target.id);
  }, {rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.1, 0.5]}) : null;
  if (observer) for (const section of sections) observer.observe(section);
  setActiveSection(location.hash.slice(1) || sections[0]?.id || "");

  for (const label of document.querySelectorAll("#settings-form section label")) {
    const control = label.querySelector("input:not([type='file']), select, textarea");
    if (!control || label.querySelector(":scope > .control-help")) continue;
    const help = node("small", "control-help", CONTROL_HELP[control.id] ? msg(CONTROL_HELP[control.id]) : genericControlHelp(control));
    const helpId = `help-${control.id || slugify(label.textContent)}`;
    help.id = helpId;
    control.setAttribute("aria-describedby", [control.getAttribute("aria-describedby"), helpId].filter(Boolean).join(" "));
    label.appendChild(help);
  }

  for (const button of document.querySelectorAll("#settings-form section button, #settings-form footer button")) {
    if (!button.id || button.closest(".save-dock") || button.closest(".button-help-wrap")) continue;
    const wrapper = node("span", "button-help-wrap");
    button.before(wrapper);
    wrapper.appendChild(button);
    const help = node("small", "button-help", msg(BUTTON_HELP[button.id] || "genericButtonHelp"));
    wrapper.appendChild(help);
  }

  const search = $("settings-search");
  const applySearch = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const section of sections) {
      const matchesSearch = !query || section.dataset.searchText.includes(query);
      const matchesExperience = section.dataset.experienceHidden !== "true";
      const match = matchesSearch && matchesExperience;
      section.hidden = !match;
      const link = links.get(section.id);
      if (link) link.hidden = !match;
      if (match) visible++;
    }
    for (const group of groups.values()) {
      group.hidden = ![...group.querySelectorAll(".settings-nav-link")].some(link => !link.hidden);
    }
    const available = sections.filter(section => section.dataset.experienceHidden !== "true").length;
    $("settings-search-summary").textContent = query
      ? msg("settingsSearchMatches", [visible, search.value.trim()])
      : msg("settingsSectionsAvailable", [available]);
    if (query) setActiveSection(sections.find(section => !section.hidden)?.id || "");
  };
  refreshSettingsNavigation = applySearch;
  search.addEventListener("input", applySearch);
  search.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !search.value) return;
    search.value = "";
    applySearch();
  });
  applySearch();
}

function syncSaveControls() {
  const save = $("save-all-floating");
  const discard = $("discard-changes");
  const saveDisabled = !configurationReady || saveInFlight || !dirty || Boolean(draftStateError);
  const discardDisabled = !configurationReady || saveInFlight || !dirty;
  if (save) {
    save.disabled = saveDisabled;
    save.setAttribute("aria-disabled", String(saveDisabled));
  }
  if (discard) {
    discard.disabled = discardDisabled;
    discard.setAttribute("aria-disabled", String(discardDisabled));
  }
}

function canonicalDraftValue(value) {
  if (value === undefined) throw new Error("Le brouillon contient une valeur indéfinie.");
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("Le brouillon contient un nombre invalide.");
  }
  if (Array.isArray(value)) return value.map(canonicalDraftValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, canonicalDraftValue(value[key])])
    );
  }
  return value;
}

function stableSnapshot(value) {
  return JSON.stringify(canonicalDraftValue(value));
}

function comparableDraftSettings(settings) {
  return Object.fromEntries(
    SETTINGS_CONTROL_DEFINITIONS
      .filter(entry => entry.includeInDirty)
      .map(entry => [entry.key, cloneSettingValue(settings[entry.key])])
  );
}

function currentDraftSnapshot() {
  if (!configurationReady || !configuration?.settings) return "";
  const settings = collectSettings();
  return stableSnapshot({
    settings: comparableDraftSettings(settings),
    groups,
    rules,
    cases,
    templates
  });
}

function rememberPersistedDraft() {
  persistedDraftSnapshot = currentDraftSnapshot();
  draftStateError = null;
}

function setDirty(value = false) {
  dirty = Boolean(value);
  document.body.toggleAttribute("data-dirty", dirty);
  const dock = $("save-dock");
  if (dock) {
    dock.hidden = !dirty;
    dock.setAttribute("aria-hidden", String(!dirty));
  }
  syncSaveControls();
  if ($("save-dock-message")) {
    $("save-dock-message").textContent = dirty
      ? msg("unsavedChanges")
      : msg("settingsSaved");
  }
}

function syncDirtyState() {
  if (!configurationReady) return;
  try {
    const snapshot = currentDraftSnapshot();
    draftStateError = null;
    setDirty(snapshot !== persistedDraftSnapshot);
  } catch (error) {
    draftStateError = error;
    setDirty(true);
    setStatus(failureMessage("draftEvaluationFailed", error), "error", {persistent: true});
  }
}

function clearStatus() {
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  const host = $("status");
  if (!host) return;
  host.hidden = true;
  host.className = "status-toast";
  $("status-message").textContent = "";
}

function setStatus(message, type = "", {persistent = false, control = null} = {}) {
  const host = $("status");
  if (!host) return;
  const requestedControl = control instanceof HTMLElement ? control : lastStatusControl;
  const activeControl = requestedControl?.isConnected ? requestedControl : null;
  if (message && activeControl) setLocalStatus(activeControl, message, type);
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  $("status-message").textContent = String(message || "");
  host.className = `status-toast ${type}`.trim();
  host.hidden = !message;
  if (message && !persistent && type !== "busy") {
    statusTimer = setTimeout(clearStatus, type === "error" ? 12000 : 7000);
  }
}

function node(tag, className, value) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (value !== undefined) item.textContent = value;
  return item;
}

function lines(value) {
  return String(value || "").split(/\r?\n/).map(v => v.trim()).filter(Boolean);
}

function uniqueEntityId(prefix, items) {
  const existing = new Set((items || []).map(item => String(item?.id || "")));
  let candidate;
  do {
    entitySequence += 1;
    candidate = `${prefix}-${Date.now().toString(36)}-${entitySequence.toString(36)}`;
  } while (existing.has(candidate));
  return candidate;
}

async function getShortcuts() {
  try {
    const commands = await withTimeout(
      () => globalThis.messenger?.commands?.getAll?.() || Promise.reject(new Error("Les raccourcis MailPerch sont indisponibles.")),
      INITIALIZATION_TIMEOUTS.shortcut,
      "shortcut"
    );
    return Object.fromEntries(commands.map(command => [String(command.name || ""), String(command.shortcut || "")]));
  } catch {
    return {"toggle-pin-selected": "Alt+P"};
  }
}

async function getShortcut() {
  return (await getShortcuts())["toggle-pin-selected"] || "";
}

function renderShortcuts(values = {}) {
  const host = $("shortcut-list");
  if (!host) return;
  host.replaceChildren();
  for (const [name, labelKey] of COMMANDS) {
    const label = node("label", "shortcut-item");
    const copy = node("span", "");
    copy.append(node("strong", "", msg(labelKey)), node("small", "", name));
    const input = document.createElement("input");
    input.type = "text";
    input.dataset.commandName = name;
    input.value = String(values[name] || "");
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", msg(labelKey));
    if (name === "toggle-pin-selected") input.id = "shortcut";
    label.append(copy, input);
    host.append(label);
  }
}

function collectShortcuts() {
  return Object.fromEntries([...document.querySelectorAll("#shortcut-list [data-command-name]")]
    .map(input => [input.dataset.commandName, input.value.trim()]));
}

async function withBusy(control, message, task) {
  const button = control instanceof HTMLElement ? control : null;
  const wasDisabled = button?.disabled;
  if (button) {
    lastStatusControl = button;
    button.disabled = true;
    button.dataset.busy = "true";
    button.setAttribute("aria-busy", "true");
  }
  setStatus(message, "busy", {persistent: true, control: button});
  try {
    return await task();
  } finally {
    if (button) {
      button.disabled = Boolean(wasDisabled);
      delete button.dataset.busy;
      button.removeAttribute("aria-busy");
    }
  }
}

function select(options, value, label) {
  const el = document.createElement("select");
  el.setAttribute("aria-label", label);
  for (const [id, text] of options) {
    const option = node("option", "", text);
    option.value = id;
    el.append(option);
  }
  el.value = value;
  return el;
}

function removeButton(callback) {
  const button = node("button", "danger compact", msg("delete"));
  button.type = "button";
  button.addEventListener("click", () => {
    callback();
    syncDirtyState();
  });
  return button;
}

function moveButtons(list, index, render) {
  const up = node("button", "secondary compact", "↑");
  const down = node("button", "secondary compact", "↓");
  up.type = down.type = "button";
  up.disabled = index === 0;
  down.disabled = index >= list.length - 1;
  up.setAttribute("aria-label", msg("dynamicMoveUp"));
  down.setAttribute("aria-label", msg("dynamicMoveDown"));
  up.title = msg("dynamicMoveUp");
  down.title = msg("dynamicMoveDown");
  up.addEventListener("click", () => {
    if (!index) return;
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
    render();
    syncDirtyState();
  });
  down.addEventListener("click", () => {
    if (index >= list.length - 1) return;
    [list[index + 1], list[index]] = [list[index], list[index + 1]];
    render();
    syncDirtyState();
  });
  return [up, down];
}

function entityField(labelKey, control, helpKey = "") {
  const field = node("label", "entity-field");
  const caption = node("span", "", msg(labelKey));
  field.append(caption, control);
  if (helpKey) {
    const hint = node("small", "entity-field-help", msg(helpKey));
    const hintId = `entity-help-${uniqueEntityId("field", [])}`;
    hint.id = hintId;
    control.setAttribute("aria-describedby", [control.getAttribute("aria-describedby"), hintId].filter(Boolean).join(" "));
    field.append(hint);
  }
  return field;
}

function calendarLabel(id) {
  return availableCalendars.find(calendar => calendar.id === id)?.name || msg("dynamicSelectedCalendar");
}

function calendarOptions(type, selectedId = "") {
  const compatible = availableCalendars.filter(calendar => type === "event" ? calendar.eventCompatible : calendar.taskCompatible);
  const control = select([["", msg("dynamicChooseCalendar")], ...compatible.map(calendar => [calendar.id, calendar.name])], selectedId, msg("calendarTarget"));
  control.required = true;
  return {control, compatible};
}

function renderGroups() {
  const host = $("groups-list");
  host.replaceChildren();
  if (!groups.length) host.append(node("p", "hint", msg("noCustomGroups")));
  groups.forEach((group, index) => {
    const row = node("article", "group-row group-editor-row");
    row.style.setProperty("--group-color", group.color);

    const drag = node("span", "group-drag", "⋮⋮");
    drag.setAttribute("aria-hidden", "true");
    drag.title = msg("groupOrder");

    const nameField = node("label", "entity-field");
    nameField.append(node("span", "", msg("groupName")));
    const name = document.createElement("input");
    name.value = group.name;
    name.maxLength = 80;
    name.setAttribute("aria-label", msg("groupName"));
    nameField.append(name);

    const colorField = node("label", "entity-field");
    colorField.append(node("span", "", msg("dynamicColor")));
    const color = document.createElement("input");
    color.type = "color";
    color.value = group.color;
    color.setAttribute("aria-label", msg("groupColorLabel", [group.name || index + 1]));
    colorField.append(color);

    name.addEventListener("input", () => {
      group.name = name.value.slice(0, 80);
      color.setAttribute("aria-label", msg("groupColorLabel", [group.name || index + 1]));
    });
    color.addEventListener("input", () => {
      group.color = color.value;
      row.style.setProperty("--group-color", color.value);
    });

    const [up, down] = moveButtons(groups, index, () => {
      renderGroups();
      renderRules();
      renderTemplates();
    });
    const actions = node("div", "entity-actions");
    actions.append(up, down, removeButton(() => {
      groups.splice(index, 1);
      renderGroups();
      renderRules();
      renderTemplates();
    }));

    row.append(drag, nameField, colorField, actions);
    host.append(row);
  });
  renderWaitingGroups();
}
function renderWaitingGroups(selected=configuration?.settings?.waitingGroupId||""){const el=$("waitingGroupId");el.replaceChildren();const none=node("option","",msg("none"));none.value="";el.append(none);for(const group of groups){const option=node("option","",group.name);option.value=group.id;el.append(option);}el.value=groups.some(g=>g.id===selected)?selected:"";}
function renderCases(){
  const host=$("cases-list");host.replaceChildren();
  if(!cases.length)host.append(node("p","hint",msg("noCases")));
  cases.forEach((item,index)=>{
    const row=node("article","group-row case-editor-row");row.style.setProperty("--group-color",item.color);
    const name=document.createElement("input");name.value=item.name;name.maxLength=120;name.required=true;
    const color=document.createElement("input");color.type="color";color.value=item.color;
    const status=select([["active",msg("statusActive")],["waiting",msg("statusWaiting")],["planned",msg("statusPlanned")],["completed",msg("statusComplete")]],item.status||"active",msg("dynamicStatus"));
    const due=document.createElement("input");due.type="datetime-local";due.required=true;due.value=item.dueAt?new Date(item.dueAt-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):"";
    const note=document.createElement("input");note.value=item.note||"";note.placeholder=msg("notes");
    const type=select([["task",msg("task")],["event",msg("event")]],item.calendarItemType||currentSettings().calendarItemType||"task",msg("calendarItemType"));
    let {control: calendar, compatible} = calendarOptions(type.value, item.calendarId || currentSettings().preferredCalendarId || "");
    const sync=()=>Object.assign(item,{name:name.value.trim().slice(0,120),color:color.value,status:status.value,dueAt:due.value?new Date(due.value).getTime():0,note:note.value.slice(0,4000),calendarItemType:type.value,calendarId:calendar.value,updatedAt:Date.now()});
    type.addEventListener("change", () => {
      const next = calendarOptions(type.value, "");
      compatible = next.compatible;
      calendar.replaceChildren(...next.control.options);
      calendar.value = "";
      sync();
    });
    for(const control of[name,color,status,due,note,type,calendar])control.addEventListener("input",sync);
    const agenda = node("button", "secondary compact", item.calendarItemId ? msg("dynamicCalendarSync") : msg("calendarCreate"));
    agenda.type = "button";
    agenda.dataset.action = "case-calendar";
    agenda.addEventListener("click", async event => {
      try {
        sync();
        if (!item.name) throw new Error(msg("dynamicCalendarTitleRequired"));
        if (!item.dueAt) throw new Error(msg("dynamicCalendarDueRequired"));
        if (!calendar.value) {
          throw new Error(compatible.length
            ? msg("dynamicChooseCalendar")
            : msg(type.value === "event" ? "dynamicNoEventCalendar" : "dynamicNoTaskCalendar"));
        }
        const result = await withBusy(event.currentTarget, msg("dynamicCalendarBusy"), async () => {
          await messenger.pinInbox.updateCase(item.id, item);
          return messenger.pinInbox.createCaseCalendarItem(
            item.id,
            type.value,
            calendar.value
          );
        });
        item.calendarItemId = result.itemId || item.calendarItemId || "";
        item.calendarId = result.calendarId || item.calendarId || "";
        renderCases();
        setStatus(
          msg(result.updated ? "dynamicCaseSynchronized" : "dynamicCaseCreated", [calendarLabel(result.calendarId || calendar.value), msg(result.itemType === "event" ? "event" : "task"), new Date(item.dueAt).toLocaleString()]),
          "success"
        );
      } catch (error) {
        setStatus(failureMessage("calendarWriteFailed", error), "error");
      }
    });
    const[up,down]=moveButtons(cases,index,renderCases);
    row.append(entityField("dynamicTitle",name,"dynamicCaseTitleHelp"),entityField("dynamicColor",color),entityField("dynamicStatus",status),entityField("deadline",due,"dynamicCaseDueHelp"),entityField("notes",note),entityField("calendarItemType",type),entityField("calendarTarget",calendar,"calendarCreateHelp"),agenda,up,down,removeButton(()=>{cases.splice(index,1);renderCases();renderRules();renderTemplates();}));host.append(row);
  });
}
function renderTemplates(){
  const host=$("templates-list");host.replaceChildren();
  if(!templates.length)host.append(node("p","hint",msg("noTemplates")));
  templates.forEach((item,index)=>{
    const row=node("article","rule-row template-row");
    const name=document.createElement("input");name.value=item.name;name.placeholder=msg("templateNamePlaceholder");
    const group=select([["",msg("withoutGroup")],...groups.map(g=>[g.id,g.name])],item.groupId||"",msg("group"));
    const caseSelect=select([["",msg("withoutCase")],...cases.map(c=>[c.id,c.name])],item.caseId||"",msg("case"));
    const priority=select([["normal",msg("priorityNormal")],["high",msg("priorityHigh")],["urgent",msg("priorityUrgent")]],item.priorityLevel||"normal",msg("priority"));
    const status=select([["active",msg("statusActive")],["waiting",msg("statusWaiting")],["planned",msg("statusPlanned")]],item.workflowStatus||"active",msg("dynamicStatus"));
    const due=document.createElement("input");due.type="number";due.min="0";due.max="3650";due.value=item.dueOffsetDays||0;due.title=msg("dynamicTemplateDeadlineHelp");due.placeholder=msg("deadlineOffsetPlaceholder");
    const follow=document.createElement("input");follow.type="number";follow.min="0";follow.max="365";follow.value=item.followUpDelayDays||0;follow.title=msg("dynamicTemplateFollowUpHelp");follow.placeholder=msg("followUpOffsetPlaceholder");
    const lead=document.createElement("input");lead.type="number";lead.min="0";lead.max="10080";lead.value=item.reminderLeadMinutes||0;lead.title=msg("dynamicTemplateLeadHelp");lead.placeholder=msg("leadMinutesPlaceholder");
    const recurrence=select([["",msg("recurrenceNone")],["daily",msg("recurrenceDaily")],["weekdays",msg("recurrenceWeekdays")],["weekly",msg("recurrenceWeekly")],["monthly",msg("recurrenceMonthly")],["quarterly",msg("recurrenceQuarterly")],["yearly",msg("recurrenceYearly")]],item.recurrenceRule||"",msg("dynamicRecurrence"));
    const interval=document.createElement("input");interval.type="number";interval.min="1";interval.max="100";interval.value=item.recurrenceInterval||1;interval.title=msg("dynamicTemplateIntervalHelp");
    const note=document.createElement("input");note.value=item.notePrefix||"";note.placeholder=msg("dynamicNotePrefix");note.maxLength=500;
    const sync=()=>Object.assign(item,{name:name.value.slice(0,120),groupId:group.value,caseId:caseSelect.value,priorityLevel:priority.value,workflowStatus:status.value,dueOffsetDays:Number(due.value)||0,followUpDelayDays:Number(follow.value)||0,reminderLeadMinutes:Number(lead.value)||0,recurrenceRule:recurrence.value,recurrenceInterval:Number(interval.value)||1,notePrefix:note.value.slice(0,500)});
    for(const control of[name,group,caseSelect,priority,status,due,follow,lead,recurrence,interval,note])control.addEventListener("input",sync);
    const[up,down]=moveButtons(templates,index,renderTemplates);
    row.append(entityField("dynamicName",name,"dynamicTemplateNameHelp"),entityField("group",group),entityField("case",caseSelect),entityField("priority",priority),entityField("dynamicStatus",status),entityField("deadline",due,"dynamicTemplateDeadlineHelp"),entityField("dynamicFollowUp",follow,"dynamicTemplateFollowUpHelp"),entityField("dynamicLead",lead,"dynamicTemplateLeadHelp"),entityField("dynamicRecurrence",recurrence),entityField("dynamicInterval",interval,"dynamicTemplateIntervalHelp"),entityField("dynamicNotePrefix",note),up,down,removeButton(()=>{templates.splice(index,1);renderTemplates();renderRules();}));
    host.append(row);
  });
}
function renderAccounts(accounts) {
  const host = $("accounts-list");
  host.replaceChildren();
  accountControls.clear();
  inboxControls.clear();
  for (const account of accounts) {
    const card = node("article", "account-card");
    card.style.setProperty("--account-color", account.color);
    const header = node("div", "account-header");
    const title = node("div", "account-title");
    const primaryLabel = String(account.name || account.email || msg("thunderbirdAccount")).trim();
    const secondaryLabel = String(account.email || "").trim();
    title.append(node("div", "account-name", primaryLabel));
    if (secondaryLabel && secondaryLabel.localeCompare(primaryLabel, undefined, {sensitivity: "accent"}) !== 0) {
      title.append(node("div", "account-email", secondaryLabel));
    }
    title.title = msg("technicalIdentifier", [account.key]);
    const color = document.createElement("input");
    color.type = "color";
    color.value = account.color;
    color.dataset.settingKey = "accountColors";
    color.dataset.settingType = SETTINGS_CONTROL_REGISTRY.get("accountColors").valueType;
    color.dataset.settingDirty = "true";
    color.dataset.settingSave = "true";
    color.dataset.settingMigration = PinSettings.MIGRATION_STRATEGY;
    color.addEventListener("input", () => card.style.setProperty("--account-color", color.value));
    accountControls.set(account.key, color);
    const reset = node("button", "secondary", msg("defaultButton"));
    reset.type = "button";
    reset.addEventListener("click", () => {
      color.value = account.defaultColor;
      card.style.setProperty("--account-color", account.defaultColor);
      syncDirtyState();
    });
    header.append(title, color, reset);
    card.append(header);
    const inboxes = node("div", "inbox-list");
    for (const inbox of account.inboxes) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = inbox.enabled;
      input.dataset.settingKey = "inboxEnabled";
      input.dataset.settingType = SETTINGS_CONTROL_REGISTRY.get("inboxEnabled").valueType;
      input.dataset.settingDirty = "true";
      input.dataset.settingSave = "true";
      input.dataset.settingMigration = PinSettings.MIGRATION_STRATEGY;
      label.append(input, document.createTextNode(`Panneau dans « ${inbox.name} »`));
      inboxes.append(label);
      inboxControls.set(inbox.uri, input);
    }
    card.append(inboxes);
    host.append(card);
  }
}

function renderSelectedAccounts(accounts, selectedKeys) {
  const host = $("selected-accounts-list");
  const empty = $("selected-accounts-empty");
  host.replaceChildren();
  selectedAccountControls.clear();
  const selected = new Set(Array.isArray(selectedKeys) ? selectedKeys : []);
  const compatibleAccounts = Array.isArray(accounts) ? accounts.filter(account => account?.key) : [];
  unavailableSelectedAccountKeys = [...selected].filter(key => !compatibleAccounts.some(account => account.key === key));
  if (empty) empty.hidden = compatibleAccounts.length > 0;
  for (const account of compatibleAccounts) {
    const label = node("label", "selected-account-choice");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = selected.has(account.key);
    input.dataset.settingKey = "selectedAccountKeys";
    input.dataset.settingType = SETTINGS_CONTROL_REGISTRY.get("selectedAccountKeys").valueType;
    input.dataset.settingDirty = "true";
    input.dataset.settingSave = "true";
    input.dataset.settingMigration = PinSettings.MIGRATION_STRATEGY;
    input.addEventListener("change", syncSelectedAccountsSummary);
    selectedAccountControls.set(account.key, input);
    const copy = node("span", "selected-account-copy");
    copy.append(node("span", "", String(account.name || account.key)));
    if (account.email && account.email !== account.name) copy.append(node("span", "selected-account-email", String(account.email)));
    label.append(input, copy);
    host.append(label);
  }
  syncSelectedAccountsSummary();
}

function syncSelectedAccountsSummary() {
  const count = [...selectedAccountControls.values()].filter(input => input.checked).length + unavailableSelectedAccountKeys.length;
  const summary = $("selected-accounts-summary");
  const unavailable = $("selected-accounts-unavailable");
  if (summary) summary.textContent = count === 0
    ? msg("selectedAccountsNone")
    : count === 1 ? msg("selectedAccountsOne") : msg("selectedAccountsMany", [count]);
  if (unavailable) {
    unavailable.hidden = unavailableSelectedAccountKeys.length === 0;
    unavailable.textContent = unavailableSelectedAccountKeys.length === 1
      ? msg("selectedAccountsUnavailableOne")
      : msg("selectedAccountsUnavailableMany", [unavailableSelectedAccountKeys.length]);
  }
}

function syncSelectedAccountsVisibility() {
  const section = $("selected-accounts-setting");
  if (section) section.hidden = $("panelScope")?.value !== "selectedAccounts";
}

function reorderSettingsFamilies() {
  const form = $("settings-form");
  const tail = form.querySelector(".form-footer");
  if (!tail) return;
  for (const heading of form.querySelectorAll(".settings-family-heading")) heading.remove();
  const families = [
    ["Essentiel", "navEssential", "Essentiel"],
    ["Automatisation", "navAutomation", "Automatisation"],
    ["Organisation", "navOrganization", "Organisation"],
    ["Avancé", "navAdvanced", "Avancé"]
  ];
  for (const [family, key, fallback] of families) {
    const sections = [...form.querySelectorAll(`:scope > .settings-section[data-nav-group="${family}"]`)];
    if (!sections.length) continue;
    const heading = node("div", "settings-family-heading");
    heading.append(node("h2", "", msg(key, fallback)));
    form.insertBefore(heading, tail);
    for (const section of sections) form.insertBefore(section, tail);
  }
}
function renderRules(){
  const host=$("rules-list");host.replaceChildren();
  if(!rules.length)host.append(node("p","hint",msg("noCustomRules")));
  const accountOptions=[["",msg("allAccounts")],...(configuration?.accounts||[]).map(account=>[account.key,account.name||account.email||account.key])];
  rules.forEach((rule,index)=>{
    const row=node("article","rule-row");
    const enabled=document.createElement("input");enabled.type="checkbox";enabled.checked=rule.enabled!==false;enabled.title=msg("dynamicRuleEnabledHelp");enabled.setAttribute("aria-label",msg("dynamicRuleEnabled"));
    const name=document.createElement("input");name.value=rule.name||msg("ruleDefaultName", [index+1]);name.placeholder=msg("dynamicName");
    const priority=document.createElement("input");priority.type="number";priority.min="1";priority.max="10000";priority.value=rule.priority||((index+1)*100);priority.title=msg("dynamicRulePriorityHelp");
    const trigger=select([["messageAdded",msg("triggerMessageAdded")],["read",msg("triggerRead")],["archive",msg("triggerArchive")],["reply",msg("triggerReply")],["move",msg("triggerMove")],["delete",msg("triggerDelete")],["complete",msg("triggerComplete")],["calendar",msg("triggerCalendar")]],rule.trigger||"messageAdded",msg("dynamicTrigger"));
    const action=select([["pin",msg("ruleActionPin")],["unpin",msg("unpin")],["complete",msg("ruleActionComplete")],["group",msg("group")],["case",msg("case")],["status",msg("dynamicStatus")],["template",msg("template")],["keep",msg("ruleActionKeep")]],rule.action||"pin",msg("dynamicAction"));
    const target=select([["message",msg("ruleTargetMessage")],["conversation",msg("ruleTargetConversation")]],rule.trackingMode||"message",msg("dynamicTarget"));
    const sender=document.createElement("input");sender.value=rule.senderContains||"";sender.placeholder=msg("dynamicSenderContains");sender.title=msg("senderFilterHelp");
    const subject=document.createElement("input");subject.value=rule.subjectContains||"";subject.placeholder=msg("dynamicSubjectContains");subject.title=msg("subjectFilterHelp");
    const tag=document.createElement("input");tag.value=rule.tagKey||"";tag.placeholder=msg("dynamicTagKey");tag.title=msg("tagFilterHelp");
    const account=select(accountOptions,rule.accountKey||"",msg("dynamicAccount"));
    const folder=document.createElement("input");folder.value=rule.folderURI||"";folder.placeholder=msg("folderUriPlaceholder");folder.title=msg("dynamicFolderHelp");
    const group=select([["",msg("withoutGroup")],...groups.map(g=>[g.id,g.name])],rule.groupId||"",msg("dynamicGroupTarget"));
    const caseSelect=select([["",msg("withoutCase")],...cases.map(c=>[c.id,c.name])],rule.caseId||"",msg("dynamicCaseTarget"));
    const template=select([["",msg("withoutTemplate")],...templates.map(t=>[t.id,t.name])],rule.templateId||"",msg("dynamicTemplateTarget"));
    const status=select([["active",msg("statusActive")],["waiting",msg("statusWaiting")],["planned",msg("statusPlanned")],["completed",msg("statusComplete")]],rule.workflowStatus||"active",msg("dynamicStatusTarget"));
    const stopLabel=node("label","compact-check");const stop=document.createElement("input");stop.type="checkbox";stop.checked=rule.stopProcessing!==false;stopLabel.append(stop,document.createTextNode(msg("stopProcessing")));
    const rate=document.createElement("input");rate.type="number";rate.min="1";rate.max="1000";rate.value=rule.maxPerMinute||60;rate.title=msg("dynamicRuleLimitHelp");
    const sync=()=>Object.assign(rule,{
      enabled:enabled.checked,name:name.value.slice(0,100),priority:Number(priority.value)||100,
      trigger:trigger.value,action:action.value,trackingMode:target.value,
      senderContains:sender.value,subjectContains:subject.value,tagKey:tag.value,
      accountKey:account.value,folderURI:folder.value,groupId:group.value,caseId:caseSelect.value,
      templateId:template.value,workflowStatus:status.value,stopProcessing:stop.checked,
      maxPerMinute:Number(rate.value)||60
    });
    for(const control of[enabled,name,priority,trigger,action,target,sender,subject,tag,account,folder,group,caseSelect,template,status,stop,rate])control.addEventListener("input",sync);
    const [up,down]=moveButtons(rules,index,renderRules);
    row.append(entityField("dynamicRuleEnabled",enabled,"dynamicRuleEnabledHelp"),entityField("dynamicName",name,"dynamicRuleNameHelp"),entityField("priority",priority,"dynamicRulePriorityHelp"),entityField("dynamicTrigger",trigger),entityField("dynamicAction",action),entityField("dynamicTarget",target),entityField("dynamicSenderContains",sender),entityField("dynamicSubjectContains",subject),entityField("dynamicTagKey",tag),entityField("dynamicAccount",account),entityField("folder",folder,"dynamicFolderHelp"),entityField("dynamicGroupTarget",group),entityField("dynamicCaseTarget",caseSelect),entityField("dynamicTemplateTarget",template),entityField("dynamicStatusTarget",status),stopLabel,entityField("dynamicRuleLimit",rate,"dynamicRuleLimitHelp"),up,down,removeButton(()=>{rules.splice(index,1);renderRules();}));
    host.append(row);
  });
}
async function renderCalendars(selected) {
  const generation = ++calendarRenderGeneration;
  const el = $("preferredCalendarId");
  const info = $("calendar-info");
  el.replaceChildren();
  info?.replaceChildren();
  const ask = node("option", "", msg("calendarAskOnCreate"));
  ask.value = "";
  el.append(ask);
  try {
    const calendars = await withTimeout(
      () => pinInboxMethod("getCalendars")(),
      INITIALIZATION_TIMEOUTS.calendar,
      "calendars"
    );
    if (!Array.isArray(calendars)) throw new TypeError("calendar-list-invalid");
    if (generation !== calendarRenderGeneration) return;
    availableCalendars = calendars.filter(calendar => calendar && typeof calendar.id === "string");
    for (const calendar of calendars) {
      const option = node(
        "option",
        "",
        `${calendar.name} — ${msg("tasksShort")} ${calendar.taskCompatible ? "✓" : "✕"} · ${msg("eventsShort")} ${calendar.eventCompatible ? "✓" : "✕"}${calendar.reason ? ` · ${calendar.reason}` : ""}`
      );
      option.value = calendar.id;
      option.disabled = !calendar.taskCompatible && !calendar.eventCompatible;
      el.append(option);
      if (info) {
        const taskCompatible = Boolean(calendar.taskCompatible);
        const eventCompatible = Boolean(calendar.eventCompatible);
        const capabilityClass = !calendar.writable || (!taskCompatible && !eventCompatible)
          ? "blocked"
          : taskCompatible && eventCompatible
            ? "writable"
            : taskCompatible ? "tasks-only" : "events-only";
        const stateLabel = capabilityClass === "writable"
          ? msg("calendarTasksAndEvents")
          : capabilityClass === "tasks-only"
            ? msg("calendarTasksOnly")
            : capabilityClass === "events-only"
              ? msg("calendarEventsOnly")
              : msg("calendarReadOnly");
        const card = node("div", `calendar-capability ${capabilityClass}`);
        const title = node("strong", "", calendar.name);
        const state = node("span", "calendar-capability-state", stateLabel);
        const details = node(
          "small",
          "",
          msg("calendarCapabilityDetails")
            .replace("$1", calendar.type || msg("unknown"))
            .replace("$2", taskCompatible ? msg("compatible") : msg("notCompatible"))
            .replace("$3", eventCompatible ? msg("compatible") : msg("notCompatible")) +
            (calendar.reason ? ` · ${calendar.reason}` : "")
        );
        card.append(title, state, details);
        info.appendChild(card);
      }
    }
    if (info && !calendars.length) {
      info.appendChild(node("p", "hint", msg("noCalendarAvailable")));
    }
  } catch (error) {
    availableCalendars = [];
    if (generation !== calendarRenderGeneration) return;
    console.warn("MailPerch : calendriers indisponibles", initializationDiagnostic(error));
    setStatus(msg("calendarsUnavailable"), "error", {control: el});
    info?.appendChild(node(
      "p",
      "hint",
      error instanceof OptionsInitializationTimeout
        ? msg("calendarListTimeout")
        : msg("calendarListFailed")
    ));
  }
  el.value = [...el.options].some(option => option.value === selected && !option.disabled) ? selected : "";
}


function applyUxPreferences(settings = configuration?.settings || {}) {
  const experience = settings.settingsExperience === "advanced" ? "advanced" : "guided";
  document.body.dataset.settingsExperience = experience;
  document.body.dataset.uiPreset = settings.uiPreset || "balanced";
  document.body.dataset.reduceMotion = settings.reduceMotion || "auto";
  const advanced = experience === "advanced";
  for (const section of document.querySelectorAll("#settings-form > section[data-experience='advanced']")) {
    section.dataset.experienceHidden = String(!advanced);
    section.hidden = !advanced;
  }
  for (const details of document.querySelectorAll("details.advanced-group")) {
    if (!advanced && !details.hasAttribute("data-guided-visible")) details.open = false;
  }
  refreshSettingsNavigation?.();
}

function humanTime(value) {
  const timestamp = Number(value) || 0;
  if (!timestamp) return "Jamais";
  try { return new Intl.DateTimeFormat(undefined, {dateStyle: "short", timeStyle: "short"}).format(new Date(timestamp)); }
  catch { return new Date(timestamp).toLocaleString(); }
}

function renderHealth(report) {
  const host = $("health-info");
  if (!host) return;
  host.replaceChildren();
  if (!report) {
    host.append(node("p", "hint", msg("healthNotAnalyzed")));
    $("health-score-badge").textContent = "—";
    $("overview-health").textContent = "—";
    return;
  }
  const score = Math.max(0, Math.min(100, Number(report.score) || 0));
  const statusLabels = {healthy: msg("healthStatusHealthy"), attention: msg("healthStatusAttention"), critical: msg("healthStatusCritical")};
  const summary = node("div", "health-summary");
  const title = node("strong", "", `${score}/100 · ${statusLabels[report.status] || msg("healthStatusUnknown")}`);
  const meta = node("small", "", msg("healthOptionsSummary").replace("$1", report.counts?.pinned || 0).replace("$2", report.issues?.length || 0));
  summary.append(title, meta);
  host.append(summary);
  const issues = node("div", "health-issues");
  for (const issue of report.issues || []) {
    const card = node("article", `health-issue ${issue.severity || "info"}`);
    card.append(node("strong", "", issue.title || msg("information")), node("small", "", issue.detail || ""));
    issues.append(card);
  }
  if (!issues.childElementCount) issues.append(node("p", "hint", msg("healthNoIssues")));
  host.append(issues);
  $("health-score-badge").textContent = `${score}/100`;
  $("health-score-badge").dataset.status = report.status || "unknown";
  $("overview-health").textContent = `${score}/100`;
}

function renderProviderMatrix(matrix) {
  const host = $("provider-info");
  if (!host) return;
  host.replaceChildren();
  if (!matrix?.checkedAt) {
    host.append(node("p", "hint", msg("providerRunPrompt")));
    return;
  }
  host.append(node("p", "hint", msg("providerLastCheck").replace("$1", humanTime(matrix.checkedAt)).replace("$2", (matrix.accounts || []).length).replace("$3", (matrix.calendars || []).length)));
  for (const row of matrix.accounts || []) {
    const card = node("div", "provider-row");
    card.append(
      node("strong", "", row.accountName || row.accountKey || msg("account")),
      node("span", "", row.provider || msg("unknown")),
      node("span", "", (row.protocol || msg("unknown")).toUpperCase()),
      node("span", "", row.supportsFolders ? msg("foldersSupported") : msg("foldersLimited")),
      node("span", "", row.offlineSupport ? msg("offlineSupported") : msg("offlineUnavailable"))
    );
    if ((row.knownRisks || []).length) card.title = row.knownRisks.join(", ");
    host.append(card);
  }
}

function renderImportPreview(preview, configurationData) {
  const host = $("import-preview");
  host.replaceChildren();
  host.hidden = !preview;
  if (!preview) return;
  const incoming = preview.incoming || {};
  host.append(
    node("h3", "", msg("restorePreviewTitle")),
    node("p", "", msg("restorePreviewFormat").replace("$1", preview.format || msg("unknown")).replace("$2", preview.version || msg("unknown"))),
    node("p", "", msg("restorePreviewCounts").replace("$1", incoming.refs || 0).replace("$2", incoming.groups || 0).replace("$3", incoming.rules || 0).replace("$4", incoming.cases || 0).replace("$5", incoming.templates || 0)),
    node("p", preview.conflicts ? "warning-text" : "hint", msg("restorePreviewConflicts").replace("$1", preview.conflicts || 0))
  );
  const actions = node("div", "actions-row");
  const merge = node("button", "secondary", msg("restoreMerge"));
  merge.type = "button";
  merge.id = "restore-merge";
  const replace = node("button", "danger", msg("restoreReplace"));
  replace.type = "button";
  replace.id = "restore-replace";
  const restore = async (strategy, control) => {
    if (strategy === "replace" && !confirm(msg("restoreReplaceConfirm"))) return;
    try {
      await withBusy(control, msg("restoreBusy"), async () => {
        await messenger.pinInbox.restoreConfiguration(configurationData, strategy);
        const restoredShortcuts = configurationData.shortcuts && typeof configurationData.shortcuts === "object"
          ? configurationData.shortcuts
          : (typeof configurationData.shortcut === "string" ? {"toggle-pin-selected": configurationData.shortcut} : {});
        for (const [name, shortcut] of Object.entries(restoredShortcuts)) {
          if (!COMMANDS.some(([commandName]) => commandName === name)) continue;
          await messenger.commands.update({name, shortcut: String(shortcut || "").slice(0, 64)}).catch(() => {});
        }
        await reload();
      });
      host.hidden = true;
      setStatus(msg(strategy === "merge" ? "restoreMerged" : "restoreCompleted"), "success", {control});
    } catch (error) {
      setStatus(failureMessage("restoreFailed", error), "error", {control, persistent: true});
    }
  };
  merge.addEventListener("click", event => restore("merge", event.currentTarget));
  replace.addEventListener("click", event => restore("replace", event.currentTarget));
  actions.append(merge, replace);
  host.append(actions);
}

function updateRuntimeSummary(config, backup = null) {
  if (!config) return;
  const stats = config.stats || {};
  $("stats").textContent = msg("runtimeStats").replace("$1", stats.pinned || 0).replace("$2", stats.waiting || 0).replace("$3", stats.overdue || 0).replace("$4", stats.history || 0);
  $("storage-info").textContent = msg("runtimeStorage").replace("$1", config.storage?.backend || msg("unknown")).replace("$2", config.storage?.database || "").replace("$3", config.storage?.schemaVersion || "");
  $("compat-info").textContent =
    msg("runtimeCompatibility").replace("$1", config.compatibility?.mode || msg("unknown")) +
    `${config.compatibility?.missing?.length ? ` · ${config.compatibility.missing.join(", ")}` : ""}`;
  const perf = config.performance || {};
  $("performance-info").textContent = msg("runtimePerformance").replace("$1", perf.renders || 0).replace("$2", perf.averageRenderMs || 0).replace("$3", perf.maxRenderMs || 0);
  if ($("overview-pinned")) $("overview-pinned").textContent = String(stats.pinned || 0);
  if ($("overview-attention")) $("overview-attention").textContent = String((stats.overdue || 0) + (stats.waiting || 0));
  if (backup) {
    $("backup-info").textContent = msg("runtimeBackup").replace("$1", backup.directory || msg("notDefined")).replace("$2", backup.lastBackupAt ? new Date(backup.lastBackupAt).toLocaleString() : msg("noneFeminine"));
    if ($("overview-backup")) $("overview-backup").textContent = backup.lastBackupAt ? humanTime(backup.lastBackupAt).split(" ")[0] : msg("never");
  }
  if (config.providerMatrix) renderProviderMatrix(config.providerMatrix);
}

async function applyConfiguration(config) {
  if (!config?.settings || typeof config.settings !== "object") {
    throw new Error("La configuration MailPerch est incomplète.");
  }
  const recommendedSettings = PinSettings.normalize(
    config.recommendedSettings && typeof config.recommendedSettings === "object"
      ? config.recommendedSettings
      : PinSettings.defaults()
  );
  const settings = PinSettings.normalize(config.settings);
  configuration = {
    ...config,
    settings,
    recommendedSettings,
    settingsSchema: Array.isArray(config.settingsSchema) ? config.settingsSchema : PinSettings.describe()
  };
  for (const entry of SETTINGS_CONTROL_DEFINITIONS) {
    if (entry.dynamic) continue;
    const control = $(entry.id);
    if (!control) throw new Error(`Contrôle de réglage introuvable : ${entry.id}`);
    entry.write(control, settings[entry.key], {entry, settings});
    control.dataset.settingKey = entry.key;
    control.dataset.settingType = entry.valueType;
    control.dataset.settingDirty = String(entry.includeInDirty);
    control.dataset.settingSave = String(entry.includeInSave);
    control.dataset.settingMigration = PinSettings.MIGRATION_STRATEGY;
    if (entry.dependency) control.dataset.settingDependency = entry.dependency;
  }
  renderShortcuts(config.shortcuts || {"toggle-pin-selected": config.shortcut || "Alt+P"});
  groups = (config.groups || []).map(item => ({...item}));
  rules = (config.rules || []).map(item => ({...item}));
  cases = (config.cases || []).map(item => ({...item}));
  templates = (config.templates || []).map(item => ({...item}));
  renderGroups();
  renderCases();
  renderTemplates();
  renderRules();
  syncToggleCards();
  renderAccounts(config.accounts || []);
  renderSelectedAccounts(config.accounts || [], settings.selectedAccountKeys);
  syncSelectedAccountsVisibility();
  reorderSettingsFamilies();
  renderWaitingGroups(settings.waitingGroupId);
  applyUxPreferences(settings);
  updateRuntimeSummary(config);
  renderProviderMatrix(config.providerMatrix);
  setConfigurationReady(true);
  rememberPersistedDraft();
  setDirty(false);
  startup?.complete();
  // Calendar discovery is useful but cannot keep primary settings hidden.
  // The selector starts with the valid “ask” choice and fills in afterwards.
  void renderCalendars(settings.preferredCalendarId);
}

function readFiniteControlNumber(id, fallback) {
  const control = $(id);
  const parsed = Number(control?.value);
  if (!Number.isFinite(parsed)) return Number(fallback) || 0;
  const minimum = control?.min === "" ? -Infinity : Number(control?.min);
  const maximum = control?.max === "" ? Infinity : Number(control?.max);
  return Math.min(Number.isFinite(maximum) ? maximum : Infinity,
    Math.max(Number.isFinite(minimum) ? minimum : -Infinity, parsed));
}

function collectSettings() {
  const settings = requireConfiguration().settings;
  const result = {...settings};
  for (const entry of SETTINGS_CONTROL_DEFINITIONS) {
    if (!entry.includeInSave) continue;
    const control = entry.dynamic ? $(entry.id) : $(entry.id);
    if (!control) throw new Error(`Contrôle de réglage introuvable : ${entry.id}`);
    const rawValue = entry.read(control, {entry, settings});
    result[entry.key] = entry.normalize(rawValue);
  }
  return PinSettings.normalize(result);
}

async function refreshOptionalConfiguration(config) {
  const configurationAtStart = configuration;
  const [backup, health] = await Promise.all([
    withTimeout(() => pinInboxMethod("getBackupStatus")(), INITIALIZATION_TIMEOUTS.auxiliary, "backup-status").catch(() => null),
    withTimeout(() => pinInboxMethod("getHealthReport")(), INITIALIZATION_TIMEOUTS.auxiliary, "health-report").catch(() => null)
  ]);
  if (!configurationReady || configuration !== configurationAtStart) return;
  updateRuntimeSummary(configurationAtStart || config, backup);
  renderHealth(health);
  renderProviderMatrix(config.providerMatrix || health?.providerMatrix);
}

async function reload({preserveEdits = false} = {}) {
  const config = await fetchConfigurationWithRetry();
  const shortcuts = await getShortcuts();
  config.shortcuts = shortcuts;
  config.shortcut = shortcuts["toggle-pin-selected"] || "";
  if (preserveEdits && configuration) {
    configuration = {
      ...configuration,
      stats: config.stats,
      storage: config.storage,
      compatibility: config.compatibility,
      performance: config.performance,
      providerMatrix: config.providerMatrix
    };
    updateRuntimeSummary(config);
  } else {
    await applyConfiguration(config);
  }
  void refreshOptionalConfiguration(config);
  return config;
}

async function initializeOptions({preserveEdits = false} = {}) {
  if (initializationInFlight) return;
  const generation = ++initializationGeneration;
  initializationInFlight = true;
  startup?.mark("options:init:start");
  setInitializationState("loading");
  clearStatus();
  try {
    await reload({preserveEdits});
    if (generation !== initializationGeneration) return;
    clearStatus();
  } catch (error) {
    if (generation !== initializationGeneration) return;
    console.error("MailPerch : initialisation des paramètres impossible", initializationDiagnostic(error));
    setInitializationState("error", error);
    startup?.fail("options-initialize", error, lastInitializationDiagnostic);
  } finally {
    if (generation === initializationGeneration) {
      initializationInFlight = false;
      if (document.body.dataset.initializationState === "loading") {
        setInitializationState("error", new Error("Initialisation interrompue."));
      }
    }
  }
}

function persistenceSnapshot(config) {
  return stableSnapshot({
    settings: PinSettings.normalize(config?.settings),
    groups: Array.isArray(config?.groups) ? config.groups : [],
    rules: Array.isArray(config?.rules) ? config.rules : [],
    cases: Array.isArray(config?.cases) ? config.cases : [],
    templates: Array.isArray(config?.templates) ? config.templates : []
  });
}

async function saveAll(event = null) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const submitter = event?.submitter instanceof HTMLElement
    ? event.submitter
    : event?.currentTarget instanceof HTMLButtonElement
      ? event.currentTarget
      : $("save-all-floating");
  if (!configurationReady) {
    setStatus(msg("settingsStillLoading"), "error", {control: submitter, persistent: true});
    return;
  }
  if (saveInFlight) {
    setStatus(msg("settingsOperationBusy"), "busy", {control: submitter, persistent: true});
    return;
  }
  saveInFlight = true;
  syncSaveControls();
  try {
    if (!configuration?.settings) await reload();
    const config = await withBusy(submitter, msg("settingsSaveBusy"), async () => {
      const requested = {
        settings: collectSettings(),
        groups,
        rules,
        cases,
        templates
      };
      const saved = await messenger.pinInbox.setConfiguration(requested);
      if (!saved?.settings || typeof saved.settings !== "object") {
        throw new Error("MailPerch n’a pas confirmé l’enregistrement des paramètres.");
      }
      if (stableSnapshot(PinSettings.normalize(requested.settings)) !==
          stableSnapshot(PinSettings.normalize(saved.settings))) {
        throw new Error("Les réglages confirmés diffèrent du brouillon demandé.");
      }
      // Read back through the public API. This verifies the complete path from
      // the form to the privileged preference/SQLite stores before showing a
      // success message.
      const persisted = await messenger.pinInbox.getConfiguration();
      if (!persisted?.settings || typeof persisted.settings !== "object") {
        throw new Error("La relecture des paramètres enregistrés a échoué.");
      }
      if (persistenceSnapshot(saved) !== persistenceSnapshot(persisted)) {
        throw new Error("La configuration relue diffère de la configuration enregistrée.");
      }
      return {
        ...persisted,
        settings: {...persisted.settings},
        shortcuts: await getShortcuts(),
        shortcut: await getShortcut()
      };
    });
    await applyConfiguration(config);
    setStatus(msg("settingsSaved"), "success");
  } catch (error) {
    setStatus(failureMessage("settingsSaveFailed", error), "error");
  } finally {
    saveInFlight = false;
    syncSaveControls();
  }
}

async function discardChanges(event = null) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const control = event?.submitter instanceof HTMLElement
    ? event.submitter
    : event?.currentTarget instanceof HTMLButtonElement
      ? event.currentTarget
      : $("discard-changes");
  if (!configurationReady) {
    setStatus(msg("settingsStillLoading"), "error", {control, persistent: true});
    return;
  }
  if (saveInFlight) {
    setStatus(msg("settingsOperationBusy"), "busy", {control, persistent: true});
    return;
  }
  saveInFlight = true;
  syncSaveControls();
  try {
    await withBusy(control, msg("settingsDiscardBusy"), () => reload());
    setDirty(false);
    setStatus(msg("settingsDiscarded"), "success", {control});
  } catch (error) {
    setStatus(failureMessage("settingsDiscardFailed", error), "error", {control, persistent: true});
  } finally {
    saveInFlight = false;
    syncSaveControls();
  }
}

async function saveShortcut(event) {
  try {
    await withBusy(event?.currentTarget || $("save-shortcut"), msg("shortcutSaveBusy"), async () => {
      const requested = collectShortcuts();
      for (const [name, shortcut] of Object.entries(requested)) {
        await messenger.commands.update({name, shortcut});
      }
      renderShortcuts(await getShortcuts());
    });
    setStatus(msg("shortcutsSaved"), "success");
  } catch (error) {
    setStatus(failureMessage("shortcutSaveFailed", error), "error");
  }
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function run(action, message, {
  control = null,
  busyMessage = msg("operationBusy"),
  reloadAfter = true
} = {}) {
  try {
    const result = await withBusy(control, busyMessage, action);
    if (reloadAfter) await reload({preserveEdits: dirty});
    setStatus(typeof message === "function" ? message(result) : message, "success");
    return result;
  } catch (error) {
    setStatus(failureMessage("operationFailed", error), "error");
    return null;
  }
}

async function importFile(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    setStatus(msg("importFileTooLarge"), "error", {control: input, persistent: true});
    return;
  }
  try {
    const parsed = JSON.parse(await file.text());
    const preview = await withBusy(null, msg("importAnalyzeBusy"), () => messenger.pinInbox.previewImport(parsed));
    if (!preview?.valid) throw new TypeError("backup-format-invalid");
    renderImportPreview(preview, parsed);
    setStatus(msg("importAnalyzed"), "success", {control: $("import-preview")});
  } catch (error) {
    renderImportPreview(null, null);
    setStatus(failureMessage("importPreviewFailed", error), "error", {persistent: true});
  }
}

function localize() {
  document.documentElement.lang = (messenger.i18n.getUILanguage?.() || "fr").split("-")[0];
  for (const element of document.querySelectorAll("[data-i18n]")) {
    const value = messenger.i18n.getMessage(element.dataset.i18n);
    if (!value) continue;
    if (element.childElementCount) {
      throw new Error(`Cible de traduction non terminale : ${element.dataset.i18n}`);
    }
    element.textContent = value;
  }
  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    const value = messenger.i18n.getMessage(element.dataset.i18nPlaceholder);
    if (value) element.placeholder = value;
  }
  for (const element of document.querySelectorAll("[data-i18n-title]")) {
    const value = messenger.i18n.getMessage(element.dataset.i18nTitle);
    if (value) element.title = value;
  }
  for (const element of document.querySelectorAll("[data-i18n-aria-label]")) {
    const value = messenger.i18n.getMessage(element.getAttribute("data-i18n-aria-label"));
    if (value) element.setAttribute("aria-label", value);
  }
}

async function openExternalSupportLink(event) {
  event.preventDefault();
  const link = event.currentTarget;
  try {
    await messenger.tabs.create({url: link.href});
  } catch (error) {
    console.warn("MailPerch : ouverture du lien de soutien impossible", error?.name || "Error");
    setStatus(msg("supportOpenFailed"), "error", {control: link, persistent: true});
  }
}

function installSupportLinks() {
  for (const link of document.querySelectorAll("[data-support-link]")) {
    link.addEventListener("click", openExternalSupportLink);
  }
}


function installCriticalSettingsActions() {
  const form = $("settings-form");
  const save = $("save-all-floating");
  const discard = $("discard-changes");
  if (!form || form.dataset.criticalActionsBound === "true") return;
  form.dataset.criticalActionsBound = "true";
  form.noValidate = true;
  form.addEventListener("submit", saveAll);
  form.addEventListener("reset", discardChanges);
  // Thunderbird options tabs can host the document in an embedding browser.
  // Keep the form semantics for keyboard and assistive technology, but bind
  // the actual visible controls as well: delegation on the outer document is
  // not a reliable activation path in that embedding.
  save?.addEventListener("click", saveAll);
  discard?.addEventListener("click", discardChanges);
}

function renderBrandVersion() {
  const version = messenger.runtime.getManifest().version;
  $("app-version").textContent = version ? `v${version}` : "";
}

let optionsPageInstalled = false;

async function startOptions() {
  if (optionsPageInstalled) {
    await initializeOptions();
    return;
  }
  try {
    installCriticalSettingsActions();
    localize();
    installSupportLinks();
    renderBrandVersion();
    setConfigurationReady(false);
    validateSettingsControlRegistry();
    enhanceSettingsPage();
  } catch (error) {
    console.error("MailPerch : préparation des paramètres impossible", initializationDiagnostic(error));
    setInitializationState("error", error);
    startup?.fail("options-prepare", error, lastInitializationDiagnostic);
    throw error;
  }

  const form = $("settings-form");
  const saveButton = $("save-all-floating");
  const discardButton = $("discard-changes");
  // Thunderbird options tabs have historically been inconsistent with
  // out-of-form submitters. Keep native form events for keyboard/assistive
  // technology, and bind the visible controls directly as the authoritative
  // click path. Both routes converge on the same guarded functions.
  form.addEventListener("input", event => {
    if (event.target.id === "import-file" || event.target.closest?.("#shortcut-list")) return;
    if (configurationReady) {
      syncToggleCards();
      syncDirtyState();
    }
  });
  form.addEventListener("change", event => {
    if (event.target.id === "import-file" || event.target.closest?.("#shortcut-list")) return;
    if (configurationReady) {
      syncToggleCards();
      syncDirtyState();
    }
  });

  $("status-close").addEventListener("click", clearStatus);
  $("save-shortcut").addEventListener("click", saveShortcut);

  $("add-group").addEventListener("click", () => {
    groups.push({
      id: uniqueEntityId("group", groups),
      name: msg("dynamicNewGroup"),
      color: "#6264a7"
    });
    renderGroups();
    renderRules();
    renderTemplates();
    syncDirtyState();
  });

  $("add-case").addEventListener("click", () => {
    cases.push({
      id: uniqueEntityId("case", cases),
      name: msg("dynamicNewCase"),
      color: "#0f6cbd",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    renderCases();
    renderRules();
    renderTemplates();
    syncDirtyState();
  });

  $("add-template").addEventListener("click", () => {
    templates.push({
      id: uniqueEntityId("template", templates),
      name: msg("dynamicNewTemplate"),
      priorityLevel: "normal",
      workflowStatus: "active",
      recurrenceInterval: 1
    });
    renderTemplates();
    renderRules();
    syncDirtyState();
  });

  $("add-rule").addEventListener("click", () => {
    rules.push({
      id: uniqueEntityId("rule", rules),
      name: msg("dynamicNewRule"),
      enabled: true,
      priority: (rules.length + 1) * 100,
      trigger: "messageAdded",
      action: "pin",
      trackingMode: "message",
      stopProcessing: true,
      maxPerMinute: 60
    });
    renderRules();
    syncDirtyState();
  });

  $("simulate-rules").addEventListener("click", async event => {
    const result = await run(
      () => messenger.pinInbox.simulateRules({trigger: "messageAdded", limit: 1000, rules}),
      value => msg("dynamicSimulationSummary", [value.matches.length, value.scanned]),
      {
        control: event.currentTarget,
        busyMessage: msg("dynamicSimulationBusy"),
        reloadAfter: false
      }
    );
    if (result) {
      const counts = new Map();
      for (const item of result.matches) counts.set(item.ruleName, (counts.get(item.ruleName) || 0) + 1);
      const summary = [...counts].map(([name, count]) => msg("simulationRuleMatches", [name, count])).join("\n");
      const examples = result.matches.slice(0, 20).map(item => `• ${item.ruleName} → ${item.action} · ${item.subject}`).join("\n");
      $("rule-simulation").textContent = [
        msg("simulationTotals", [result.rules || rules.length, result.scanned]),
        summary,
        examples,
        result.truncated ? msg("simulationTruncated") : ""
      ].filter(Boolean).join("\n\n") || msg("dynamicSimulationNoMatch");
    }
  });

  const bindRun = (id, action, message, busyMessage, options = {}) => {
    $(id).addEventListener("click", event => run(action, message, {
      control: event.currentTarget,
      busyMessage,
      ...options
    }));
  };

  $("apply-recommended-settings").addEventListener("click", event => applyRecommendedDraft(event.currentTarget));
  $("settingsExperience").addEventListener("change", () => applyUxPreferences(currentSettings({settingsExperience: $("settingsExperience").value})));
  $("uiPreset").addEventListener("change", () => applyUxPreferences(currentSettings({uiPreset: $("uiPreset").value})));
  $("reduceMotion").addEventListener("change", () => applyUxPreferences(currentSettings({reduceMotion: $("reduceMotion").value})));

  $("provider-check").addEventListener("click", async event => {
    const matrix = await run(
      () => messenger.pinInbox.runProviderCompatibilityCheck(),
      value => msg("providerAnalysisResult", [value.accounts?.length || 0, value.calendars?.length || 0]),
      {control: event.currentTarget, busyMessage: msg("providerCheckBusy"), reloadAfter: false}
    );
    if (matrix) {
      renderProviderMatrix(matrix);
      if (configuration) configuration.providerMatrix = matrix;
    }
  });

  $("health-check").addEventListener("click", async event => {
    try {
      const health = await withBusy(event.currentTarget, msg("healthCheckBusy"), () => messenger.pinInbox.getHealthReport());
      renderHealth(health);
      setStatus(msg("healthCheckComplete").replace("$1", health.score), health.status === "critical" ? "error" : "success", {control: event.currentTarget});
    } catch (error) {
      setStatus(failureMessage("healthCheckFailed", error), "error", {control: event.currentTarget, persistent: true});
    }
  });

  $("health-repair").addEventListener("click", async event => {
    if (!confirm(msg("healthRepairConfirmWithBackup"))) return;
    try {
      const result = await withBusy(event.currentTarget, msg("healthRepairBusy"), () => messenger.pinInbox.repairHealthIssues({actions: ["orphan-links", "repair-references"]}));
      renderHealth(result.health);
      await reload({preserveEdits: dirty});
      setStatus(msg("healthRepairComplete").replace("$1", result.repaired || 0), "success", {control: event.currentTarget});
    } catch (error) {
      setStatus(failureMessage("healthRepairFailed", error), "error", {control: event.currentTarget, persistent: true});
    }
  });

  $("clear-diagnostics").addEventListener("click", async event => {
    const result = await run(
      () => messenger.pinInbox.clearDiagnostics(),
      value => msg("diagnosticsClearedCount", [value.cleared || 0]),
      {control: event.currentTarget, busyMessage: msg("diagnosticsClearBusy"), reloadAfter: false}
    );
    if (result) renderHealth(await messenger.pinInbox.getHealthReport().catch(() => null));
  });

  bindRun(
    "clear-rule-log",
    () => messenger.pinInbox.clearRuleLog(),
    result => msg("ruleLogCleared", [result.cleared]),
    msg("ruleLogClearBusy")
  );
  bindRun(
    "import-stars",
    () => messenger.pinInbox.importNativeStars($("clear-stars-after-import").checked),
    result => msg("starsImported", [result.imported]),
    msg("starsImportBusy")
  );
  bindRun("undo", () => messenger.pinInbox.undoLast(), msg("undoComplete"), msg("undoBusy"));
  bindRun(
    "repair",
    () => messenger.pinInbox.repairReferences(),
    result => msg("referencesRepaired", [result.repaired, result.missing]),
    msg("referencesRepairBusy")
  );
  bindRun("rescan", () => messenger.pinInbox.rescanPinned(), msg("rescanComplete"), msg("rescanBusy"));
  bindRun("cleanup", () => messenger.pinInbox.cleanupBroken(), msg("cleanupComplete"), msg("cleanupBusy"));
  bindRun(
    "reset-interface",
    () => messenger.pinInbox.resetInterface(),
    msg("interfaceReset"),
    msg("interfaceResetBusy")
  );
  bindRun(
    "compat-check",
    () => messenger.pinInbox.runCompatibilityCheck(),
    msg("compatibilityCheckComplete"),
    msg("compatibilityCheckBusy")
  );
  bindRun(
    "sync-calendar",
    () => messenger.pinInbox.syncCalendarLinks(),
    result => msg("calendarSyncComplete", [result.synced || 0]),
    msg("calendarSyncBusy")
  );
  bindRun(
    "sync-tags",
    () => messenger.pinInbox.syncTags([]),
    result => msg("tagSyncComplete", [result.synced || 0, result.errors || 0]),
    msg("tagSyncBusy")
  );
  bindRun(
    "run-backup",
    () => messenger.pinInbox.runBackup("manual"),
    result => msg("backupCreated", [result.path]),
    msg("backupCreateBusy")
  );

  $("integrity-check").addEventListener("click", async event => {
    const result = await run(
      () => messenger.pinInbox.checkStorageIntegrity(),
      value => msg(value.ok ? "sqliteHealthy" : "sqliteIssue"),
      {
        control: event.currentTarget,
        busyMessage: msg("sqliteCheckBusy")
      }
    );
    if (result) $("integrity-info").textContent = JSON.stringify(result, null, 2);
  });

  $("choose-backup").addEventListener("click", async event => {
    try {
      const result = await withBusy(
        event.currentTarget,
        msg("backupFolderBusy"),
        () => messenger.pinInbox.chooseBackupDirectory()
      );
      if (!result.selected) {
        setStatus(msg("backupFolderCancelled"), "success");
        return;
      }
      $("backupDirectory").value = result.path;
      if (!configuration?.settings) await reload();
      requireConfiguration().settings.backupDirectory = result.path;
      const backup = await messenger.pinInbox.getBackupStatus().catch(() => null);
      updateRuntimeSummary(configuration, backup);
      setStatus(msg("backupFolderSaved"), "success");
    } catch (error) {
      setStatus(failureMessage("backupFolderFailed", error), "error");
    }
  });

  $("dashboard").addEventListener("click", async event => {
    try {
      await withBusy(event.currentTarget, msg("dashboardOpenBusy"), () =>
        messenger.tabs.create({url: messenger.runtime.getURL("dashboard/dashboard.html")})
      );
      setStatus(msg("dashboardOpened"), "success");
    } catch (error) {
      setStatus(failureMessage("dashboardOpenFailed", error), "error");
    }
  });
  $("panelScope").addEventListener("change", syncSelectedAccountsVisibility);

  $("diagnostic").addEventListener("click", async event => {
    try {
      const report = await withBusy(
        event.currentTarget,
        msg("diagnosticExportBusy"),
        () => messenger.pinInbox.exportDiagnosticBundle()
      );
      downloadJson(
        `mailperch-diagnostic-${new Date().toISOString().slice(0, 10)}.json`,
        report
      );
      setStatus(msg("diagnosticExported"), "success");
    } catch (error) {
      setStatus(failureMessage("diagnosticExportFailed", error), "error");
    }
  });

  $("export").addEventListener("click", async event => {
    try {
      const data = await withBusy(event.currentTarget, msg("backupExportBusy"), async () => {
        const value = await messenger.pinInbox.exportConfiguration();
        value.shortcuts = await getShortcuts();
        value.shortcut = value.shortcuts["toggle-pin-selected"] || "";
        return value;
      });
      downloadJson(`mailperch-${new Date().toISOString().slice(0, 10)}.json`, data);
      setStatus(msg("backupExported"), "success");
    } catch (error) {
      setStatus(failureMessage("backupExportFailed", error), "error");
    }
  });

  $("import-file").addEventListener("change", importFile);

  $("reset").addEventListener("click", async event => {
    if (!confirm(msg("settingsResetConfirm"))) {
      return;
    }
    const result = await run(
      () => messenger.pinInbox.resetConfiguration(),
      msg("settingsReset"),
      {
        control: event.currentTarget,
        busyMessage: msg("settingsResetBusy")
      }
    );
    if (result) setDirty(false);
  });

  window.addEventListener("keydown", event => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== "s") return;
    if (!configurationReady || !dirty || saveInFlight) return;
    event.preventDefault();
    void saveAll({
      preventDefault() {},
      stopPropagation() {},
      currentTarget: saveButton
    });
  });

  window.addEventListener("beforeunload", event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  // Thunderbird can restore an Options tab from its back/forward cache. A
  // cached document must not display an old draft after returning to it.
  window.addEventListener("pageshow", event => {
    if (!event.persisted) return;
    void initializeOptions({preserveEdits: true});
  });

  optionsPageInstalled = true;
  startup?.setRetry(() => initializeOptions());
  await initializeOptions();
}

Object.defineProperty(globalThis, "MailPerchOptionsMain", {
  value: Object.freeze({startOptions}),
  configurable: false,
  enumerable: false,
  writable: false
});
