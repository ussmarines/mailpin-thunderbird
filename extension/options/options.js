"use strict";

const PinSettings = globalThis.PinSettings;
const startup = globalThis.MailPerchOptionsStartup;

let configuration = null;
let configurationReady = false;
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
let entitySequence = 0;
let initializationGeneration = 0;
let initializationInFlight = false;
let lastInitializationDiagnostic = "options:init:not-started";

const accountControls = new Map();
const inboxControls = new Map();
const $ = id => document.getElementById(id);
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const INITIALIZATION_TIMEOUTS = Object.freeze({
  apiNamespace: 2_000,
  configuration: 10_000,
  shortcut: 5_000,
  calendar: 7_000,
  auxiliary: 7_000
});
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

function initializationDiagnostic(error) {
  if (error instanceof OptionsInitializationTimeout) {
    return `options:init:timeout:${error.operation}`;
  }
  const name = String(error?.name || "Error").replace(/[^a-z0-9_-]/gi, "").slice(0, 48) || "Error";
  return `options:init:error:${name}`;
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
  })
});

const CONTROL_VALUE_TYPES = Object.freeze({
  boolean: "boolean",
  string: "string",
  number: "number",
  lines: "array",
  preserved: "string",
  accountColors: "record",
  inboxEnabled: "record"
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
    "moveToWaitingOnReply", "enableCalendarIntegration", "enableBidirectionalCalendarSync",
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
  settingControl("accounts-list", "inboxEnabled", {key: "inboxEnabled", dynamic: true})
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
  pinMode: "Le mode indépendant conserve les épingles dans le stockage local MailPerch sans modifier les étoiles Thunderbird.",
  defaultPinTarget: "Détermine si une nouvelle épingle suit uniquement le message sélectionné ou toute sa conversation.",
  compatibilityMode: "Automatique adapte l’intégration à votre version de Thunderbird. Le mode réduit désactive les fonctions DOM les plus sensibles.",
  enableCounterRegressionGuard: "Vérifie que MailPerch ne modifie pas les compteurs natifs de messages lus, non lus ou nouveaux.",
  enableConcurrentWriteProtection: "Sérialise les écritures locales lorsque plusieurs fenêtres Thunderbird utilisent MailPerch en même temps.",
  safeMode: "Masque les fonctions avancées susceptibles de dépendre davantage de l’interface interne de Thunderbird.",
  showQuickActions: "Affiche les boutons Répondre, Attente, Terminer et Modifier sur les cartes épinglées.",
  enableMultiSelect: "Autorise Ctrl/Cmd, Maj et les actions groupées dans le panneau des épingles.",
  confirmDelete: "Demande une confirmation avant toute suppression de message déclenchée depuis MailPerch.",
  enableCalendarIntegration: "Autorise la création locale de tâches et d’événements dans les calendriers Thunderbird compatibles.",
  enableBidirectionalCalendarSync: "Répercute les échéances et états terminés entre l’épingle et l’élément Agenda lié.",
  calendarCompleteOnPinComplete: "Marque la tâche Agenda terminée lorsque l’épingle correspondante est terminée.",
  calendarDeleteOnUnpin: "Supprime l’élément Agenda lié lors du désépinglage. Cette option peut être destructive.",
  calendarItemType: "Type proposé par défaut. Le calendrier reste sélectionnable au moment de chaque création.",
  preferredCalendarId: "Calendrier présélectionné. Laissez vide pour choisir le calendrier au moment de créer la tâche ou l’événement.",
  enableAutomaticBackups: "Crée périodiquement des sauvegardes locales de la configuration et des références MailPerch.",
  backupDirectory: "Dossier local utilisé pour les sauvegardes automatiques et manuelles.",
  enableGlobalDashboard: "Active l’onglet global regroupant les épingles de tous les comptes.",
  enablePerformanceMetrics: "Mesure uniquement les durées de rendu locales, sans télémétrie ni envoi réseau.",
  shortcut: "Raccourci Thunderbird utilisé pour épingler ou désépingler la sélection courante."
};

const BUTTON_HELP = {
  "import-stars": "Copie les étoiles Thunderbird existantes vers les épingles MailPerch. Les messages ne sont ni déplacés ni marqués comme lus.",
  "simulate-rules": "Analyse les règles sans modifier les messages ni les épingles.",
  "clear-rule-log": "Efface seulement le journal local des règles, pas les messages ni les règles.",
  "add-rule": "Ajoute une règle locale désactivable avant son enregistrement.",
  "add-group": "Ajoute un groupe local pour organiser les cartes épinglées.",
  "add-case": "Ajoute une affaire locale pouvant regrouper plusieurs messages.",
  "add-template": "Ajoute un modèle de suivi réutilisable.",
  "sync-calendar": "Relit et synchronise les liens Agenda existants. Aucun nouvel élément n’est créé sans action explicite.",
  "choose-backup": "Choisit le dossier local des sauvegardes et enregistre immédiatement ce chemin.",
  "run-backup": "Crée immédiatement une sauvegarde locale dans le dossier configuré.",
  "integrity-check": "Vérifie la cohérence SQLite sans supprimer ni réparer automatiquement les données.",
  "compat-check": "Contrôle la disponibilité des fonctions Thunderbird utilisées par MailPerch.",
  dashboard: "Ouvre le tableau de bord global dans un nouvel onglet Thunderbird.",
  undo: "Annule la dernière action MailPerch encore disponible dans l’historique local.",
  repair: "Tente de retrouver les messages déplacés ou renommés sans modifier les compteurs Thunderbird.",
  rescan: "Rescanne les références épinglées pour mettre à jour leur état local.",
  cleanup: "Retire les références définitivement introuvables après le délai de sécurité configuré.",
  "reset-interface": "Réinitialise uniquement la disposition et les préférences visuelles de l’interface.",
  diagnostic: "Exporte un rapport technique local expurgé du corps des messages et des pièces jointes.",
  export: "Télécharge une sauvegarde JSON locale de la configuration MailPerch.",
  "save-shortcut": "Enregistre uniquement le raccourci Thunderbird indiqué.",
  "save-all-floating": "Enregistre tous les champs, groupes, règles, affaires et modèles actuellement modifiés.",
  reset: "Réinitialise les réglages, groupes, affaires, modèles et règles. Les épingles sont conservées."
};

Object.assign(CONTROL_HELP, {
  settingsExperience: "Le mode Guidé masque les réglages avancés. Le mode Avancé affiche tous les réglages sans modifier leur valeur.",
  uiPreset: "Ajuste uniquement l’espacement de la page des paramètres. Cette option ne modifie jamais la liste des messages ni le panneau principal.",
  reduceMotion: "Réduit les animations pour plus de confort, sans désactiver les retours d’action.",
  panelVirtualizationThreshold: "Au-delà de ce nombre d’épingles, MailPerch limite le rendu initial afin de préserver la fluidité.",
  enableSmartViews: "Ajoute les vues Aujourd’hui, En retard, Sans réponse, Sans échéance et autres vues calculées localement.",
  enableBulkActions: "Permet d’appliquer une action à plusieurs épingles sélectionnées dans le panneau ou le tableau de bord.",
  confirmBulkDestructiveActions: "Demande une confirmation avant une suppression, un archivage ou un désépinglage groupé.",
  enableAutomaticNoReplyTracking: "Après un message envoyé, crée localement une date de relance et l’annule lorsqu’une réponse arrive.",
  noReplyCancelOnIncomingReply: "Désactive automatiquement le suivi sans réponse lorsque MailPerch détecte une réponse dans la conversation.",
  noReplyDefaultDays: "Nombre de jours avant qu’une conversation sans réponse apparaisse dans la vue À relancer.",
  defaultSmartView: "Vue sélectionnée lorsque le tableau de bord ou le panneau s’ouvre.",
  enableHealthCenter: "Calcule un score local à partir de l’intégrité, des sauvegardes, des références, de l’Agenda et des performances.",
  enableHealthNotifications: "N’affiche que les alertes utiles et évite les notifications répétitives.",
  enableDiagnostics: "Conserve localement un journal technique expurgé des adresses, chemins et contenus de messages.",
  diagnosticLevel: "Les niveaux plus élevés réduisent le nombre d’événements conservés.",
  diagnosticMaxEntries: "Limite la taille du journal local entre 50 et 500 événements."
});

Object.assign(BUTTON_HELP, {
  "provider-check": "Analyse les types de comptes et les calendriers disponibles, sans connexion réseau supplémentaire.",
  "health-check": "Contrôle la base locale, les références, l’Agenda, les sauvegardes et les performances.",
  "health-repair": "Exécute uniquement les réparations considérées comme non destructives et crée une sauvegarde préalable.",
  "clear-diagnostics": "Efface le journal technique local, sans toucher aux épingles ni à l’historique utilisateur."
});

function genericControlHelp(control) {
  if (control.type === "checkbox") return "Active ou désactive cette fonction après l’enregistrement des paramètres.";
  if (control.tagName === "SELECT") return "Choisissez le comportement utilisé par MailPerch, puis enregistrez les paramètres.";
  if (control.type === "number") return "Définit une limite ou une durée locale appliquée après l’enregistrement.";
  if (control.tagName === "TEXTAREA") return "Une valeur par ligne. Les données restent stockées localement dans MailPerch.";
  return "Cette valeur est appliquée après l’enregistrement des paramètres.";
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
    const groupName = section.dataset.navGroup || "Autres";
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
    const help = node("small", "control-help", CONTROL_HELP[control.id] || genericControlHelp(control));
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
    const help = node("small", "button-help", BUTTON_HELP[button.id] || "Exécute cette action localement et affiche son résultat près du bouton.");
    wrapper.appendChild(help);
  }

  const search = $("settings-search");
  const applySearch = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const section of sections) {
      const match = !query || section.dataset.searchText.includes(query);
      section.hidden = !match;
      const link = links.get(section.id);
      if (link) link.hidden = !match;
      if (match) visible++;
    }
    for (const group of groups.values()) {
      group.hidden = ![...group.querySelectorAll(".settings-nav-link")].some(link => !link.hidden);
    }
    $("settings-search-summary").textContent = query
      ? `${visible} section(s) contenant « ${search.value.trim()} ».`
      : `${sections.length} sections disponibles.`;
    if (query) setActiveSection(sections.find(section => !section.hidden)?.id || "");
  };
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
      ? "Modifications non enregistrées — elles ne seront appliquées qu’après Enregistrer."
      : "Paramètres enregistrés.";
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
    setStatus(`Impossible d’évaluer les modifications : ${error.message || error}`, "error", {persistent: true});
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

async function getShortcut() {
  try {
    const commands = await withTimeout(
      () => globalThis.messenger?.commands?.getAll?.() || Promise.reject(new Error("Les raccourcis MailPerch sont indisponibles.")),
      INITIALIZATION_TIMEOUTS.shortcut,
      "shortcut"
    );
    return commands.find(c => c.name === "toggle-pin-selected")?.shortcut || "";
  } catch {
    return "Alt+P";
  }
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
  const button = node("button", "danger compact", "Supprimer");
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
  up.setAttribute("aria-label", "Monter");
  down.setAttribute("aria-label", "Descendre");
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

function renderGroups() {
  const host = $("groups-list");
  host.replaceChildren();
  if (!groups.length) host.append(node("p", "hint", "Aucun groupe personnalisé."));
  groups.forEach((group, index) => {
    const row = node("article", "group-row group-editor-row");
    row.style.setProperty("--group-color", group.color);

    const drag = node("span", "group-drag", "⋮⋮");
    drag.setAttribute("aria-hidden", "true");
    drag.title = "Ordre du groupe";

    const nameField = node("label", "entity-field");
    nameField.append(node("span", "", "Nom du groupe"));
    const name = document.createElement("input");
    name.value = group.name;
    name.maxLength = 80;
    name.setAttribute("aria-label", "Nom du groupe");
    nameField.append(name);

    const colorField = node("label", "entity-field");
    colorField.append(node("span", "", "Couleur"));
    const color = document.createElement("input");
    color.type = "color";
    color.value = group.color;
    color.setAttribute("aria-label", `Couleur du groupe ${group.name || index + 1}`);
    colorField.append(color);

    name.addEventListener("input", () => {
      group.name = name.value.slice(0, 80);
      color.setAttribute("aria-label", `Couleur du groupe ${group.name || index + 1}`);
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
function renderWaitingGroups(selected=configuration?.settings?.waitingGroupId||""){const el=$("waitingGroupId");el.replaceChildren();const none=node("option","","Aucun");none.value="";el.append(none);for(const group of groups){const option=node("option","",group.name);option.value=group.id;el.append(option);}el.value=groups.some(g=>g.id===selected)?selected:"";}
function renderCases(){
  const host=$("cases-list");host.replaceChildren();
  if(!cases.length)host.append(node("p","hint","Aucune affaire."));
  cases.forEach((item,index)=>{
    const row=node("article","group-row case-editor-row");row.style.setProperty("--group-color",item.color);
    const name=document.createElement("input");name.value=item.name;name.maxLength=120;
    const color=document.createElement("input");color.type="color";color.value=item.color;
    const status=select([["active","À traiter"],["waiting","En attente"],["planned","Planifié"],["completed","Terminé"]],item.status||"active","Statut");
    const due=document.createElement("input");due.type="datetime-local";due.value=item.dueAt?new Date(item.dueAt-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):"";
    const note=document.createElement("input");note.value=item.note||"";note.placeholder="Note globale";
    const sync=()=>Object.assign(item,{name:name.value.slice(0,120),color:color.value,status:status.value,dueAt:due.value?new Date(due.value).getTime():0,note:note.value.slice(0,4000),updatedAt:Date.now()});
    for(const control of[name,color,status,due,note])control.addEventListener("input",sync);
    const agenda = node("button", "secondary compact", item.calendarItemId ? "Synchroniser Agenda" : "Créer dans Agenda");
    agenda.type = "button";
    agenda.addEventListener("click", async event => {
      try {
        const result = await withBusy(event.currentTarget, "Synchronisation de l’affaire avec l’Agenda…", async () => {
          sync();
          await messenger.pinInbox.updateCase(item.id, item);
          return messenger.pinInbox.createCaseCalendarItem(
            item.id,
            "task",
            currentSettings().preferredCalendarId || ""
          );
        });
        item.calendarItemId = result.itemId || item.calendarItemId || "";
        item.calendarId = result.calendarId || item.calendarId || "";
        renderCases();
        setStatus(
          result.updated ? "Affaire synchronisée avec l’Agenda." : "Tâche Agenda créée pour l’affaire.",
          "success"
        );
      } catch (error) {
        setStatus(`Agenda impossible : ${error.message || error}`, "error");
      }
    });
    const[up,down]=moveButtons(cases,index,renderCases);
    row.append(name,color,status,due,note,agenda,up,down,removeButton(()=>{cases.splice(index,1);renderCases();renderRules();renderTemplates();}));host.append(row);
  });
}
function renderTemplates(){
  const host=$("templates-list");host.replaceChildren();
  if(!templates.length)host.append(node("p","hint","Aucun modèle."));
  templates.forEach((item,index)=>{
    const row=node("article","rule-row template-row");
    const name=document.createElement("input");name.value=item.name;name.placeholder="Nom du modèle";
    const group=select([["","Aucun groupe"],...groups.map(g=>[g.id,g.name])],item.groupId||"","Groupe");
    const caseSelect=select([["","Aucune affaire"],...cases.map(c=>[c.id,c.name])],item.caseId||"","Affaire");
    const priority=select([["normal","Normale"],["high","Haute"],["urgent","Urgente"]],item.priorityLevel||"normal","Priorité");
    const status=select([["active","À traiter"],["waiting","En attente"],["planned","Planifié"]],item.workflowStatus||"active","Statut");
    const due=document.createElement("input");due.type="number";due.min="0";due.max="3650";due.value=item.dueOffsetDays||0;due.title="Échéance dans N jours";due.placeholder="Échéance J+";
    const follow=document.createElement("input");follow.type="number";follow.min="0";follow.max="365";follow.value=item.followUpDelayDays||0;follow.title="Relance dans N jours";follow.placeholder="Relance J+";
    const lead=document.createElement("input");lead.type="number";lead.min="0";lead.max="10080";lead.value=item.reminderLeadMinutes||0;lead.title="Rappel anticipé en minutes";lead.placeholder="Anticipation min";
    const recurrence=select([["","Aucune"],["daily","Quotidienne"],["weekdays","Jours ouvrés"],["weekly","Hebdomadaire"],["monthly","Mensuelle"],["quarterly","Trimestrielle"],["yearly","Annuelle"]],item.recurrenceRule||"","Récurrence");
    const interval=document.createElement("input");interval.type="number";interval.min="1";interval.max="100";interval.value=item.recurrenceInterval||1;interval.title="Intervalle de récurrence";
    const note=document.createElement("input");note.value=item.notePrefix||"";note.placeholder="Préfixe de note";note.maxLength=500;
    const sync=()=>Object.assign(item,{name:name.value.slice(0,120),groupId:group.value,caseId:caseSelect.value,priorityLevel:priority.value,workflowStatus:status.value,dueOffsetDays:Number(due.value)||0,followUpDelayDays:Number(follow.value)||0,reminderLeadMinutes:Number(lead.value)||0,recurrenceRule:recurrence.value,recurrenceInterval:Number(interval.value)||1,notePrefix:note.value.slice(0,500)});
    for(const control of[name,group,caseSelect,priority,status,due,follow,lead,recurrence,interval,note])control.addEventListener("input",sync);
    const[up,down]=moveButtons(templates,index,renderTemplates);
    row.append(name,group,caseSelect,priority,status,due,follow,lead,recurrence,interval,note,up,down,removeButton(()=>{templates.splice(index,1);renderTemplates();renderRules();}));
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
    const primaryLabel = String(account.name || account.email || "Compte Thunderbird").trim();
    const secondaryLabel = String(account.email || "").trim();
    title.append(node("div", "account-name", primaryLabel));
    if (secondaryLabel && secondaryLabel.localeCompare(primaryLabel, undefined, {sensitivity: "accent"}) !== 0) {
      title.append(node("div", "account-email", secondaryLabel));
    }
    title.title = `Identifiant technique : ${account.key}`;
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
    const reset = node("button", "secondary", "Défaut");
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
function renderRules(){
  const host=$("rules-list");host.replaceChildren();
  if(!rules.length)host.append(node("p","hint","Aucune règle personnalisée."));
  const accountOptions=[["","Tous les comptes"],...(configuration?.accounts||[]).map(account=>[account.key,account.name||account.email||account.key])];
  rules.forEach((rule,index)=>{
    const row=node("article","rule-row");
    const enabled=document.createElement("input");enabled.type="checkbox";enabled.checked=rule.enabled!==false;enabled.title="Activer la règle";
    const name=document.createElement("input");name.value=rule.name||`Règle ${index+1}`;name.placeholder="Nom";
    const priority=document.createElement("input");priority.type="number";priority.min="1";priority.max="10000";priority.value=rule.priority||((index+1)*100);priority.title="Priorité d’exécution";
    const trigger=select([["messageAdded","Nouveau message"],["read","Lecture"],["archive","Archivage"],["reply","Réponse"],["move","Déplacement"],["delete","Suppression"],["complete","Terminé"],["calendar","Agenda"]],rule.trigger||"messageAdded","Déclencheur");
    const action=select([["pin","Épingler"],["unpin","Désépingler"],["complete","Terminer"],["group","Groupe"],["case","Affaire"],["status","Statut"],["template","Modèle"],["keep","Conserver"]],rule.action||"pin","Action");
    const target=select([["message","Message"],["conversation","Conversation"]],rule.trackingMode||"message","Cible");
    const sender=document.createElement("input");sender.value=rule.senderContains||"";sender.placeholder="Expéditeur contient";sender.title="Filtre sur l’expéditeur";
    const subject=document.createElement("input");subject.value=rule.subjectContains||"";subject.placeholder="Objet contient";subject.title="Filtre sur l’objet";
    const tag=document.createElement("input");tag.value=rule.tagKey||"";tag.placeholder="Clé d’étiquette";tag.title="Clé interne d’une étiquette Thunderbird";
    const account=select(accountOptions,rule.accountKey||"","Compte");
    const folder=document.createElement("input");folder.value=rule.folderURI||"";folder.placeholder="URI du dossier (facultatif)";folder.title="Limiter à un dossier exact";
    const group=select([["","Aucun groupe"],...groups.map(g=>[g.id,g.name])],rule.groupId||"","Groupe cible");
    const caseSelect=select([["","Aucune affaire"],...cases.map(c=>[c.id,c.name])],rule.caseId||"","Affaire cible");
    const template=select([["","Aucun modèle"],...templates.map(t=>[t.id,t.name])],rule.templateId||"","Modèle cible");
    const status=select([["active","À traiter"],["waiting","En attente"],["planned","Planifié"],["completed","Terminé"]],rule.workflowStatus||"active","Statut cible");
    const stopLabel=node("label","compact-check");const stop=document.createElement("input");stop.type="checkbox";stop.checked=rule.stopProcessing!==false;stopLabel.append(stop,document.createTextNode("Arrêter"));
    const rate=document.createElement("input");rate.type="number";rate.min="1";rate.max="1000";rate.value=rule.maxPerMinute||60;rate.title="Nombre maximal d’actions par minute";
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
    row.append(enabled,name,priority,trigger,action,target,sender,subject,tag,account,folder,group,caseSelect,template,status,stopLabel,rate,up,down,removeButton(()=>{rules.splice(index,1);renderRules();}));
    host.append(row);
  });
}
async function renderCalendars(selected) {
  const generation = ++calendarRenderGeneration;
  const el = $("preferredCalendarId");
  const info = $("calendar-info");
  el.replaceChildren();
  info?.replaceChildren();
  const ask = node("option", "", "Demander lors de la création");
  ask.value = "";
  el.append(ask);
  try {
    const calendars = await withTimeout(
      () => pinInboxMethod("getCalendars")(),
      INITIALIZATION_TIMEOUTS.calendar,
      "calendars"
    );
    if (!Array.isArray(calendars)) throw new Error("La liste des calendriers est invalide.");
    if (generation !== calendarRenderGeneration) return;
    for (const calendar of calendars) {
      const option = node(
        "option",
        "",
        `${calendar.name} — tâches ${calendar.taskCompatible ? "✓" : "✕"} · événements ${calendar.eventCompatible ? "✓" : "✕"}${calendar.reason ? ` · ${calendar.reason}` : ""}`
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
          ? "Tâches et événements"
          : capabilityClass === "tasks-only"
            ? "Tâches uniquement"
            : capabilityClass === "events-only"
              ? "Événements uniquement"
              : "Indisponible en écriture";
        const card = node("div", `calendar-capability ${capabilityClass}`);
        const title = node("strong", "", calendar.name);
        const state = node("span", "calendar-capability-state", stateLabel);
        const details = node(
          "small",
          "",
          `Fournisseur : ${calendar.type || "inconnu"} · Tâches : ${taskCompatible ? "compatibles" : "non compatibles"} · Événements : ${eventCompatible ? "compatibles" : "non compatibles"}${calendar.reason ? ` · ${calendar.reason}` : ""}`
        );
        card.append(title, state, details);
        info.appendChild(card);
      }
    }
    if (info && !calendars.length) {
      info.appendChild(node("p", "hint", "Aucun calendrier Thunderbird n’est disponible ou l’intégration Agenda est désactivée."));
    }
  } catch (error) {
    if (generation !== calendarRenderGeneration) return;
    console.warn("MailPerch : calendriers indisponibles", initializationDiagnostic(error));
    setStatus("Les calendriers Thunderbird ne sont pas disponibles.", "error", {control: el});
    info?.appendChild(node(
      "p",
      "hint",
      error instanceof OptionsInitializationTimeout
        ? "La liste des calendriers n’a pas répondu. Réessayez avec « Synchroniser maintenant » lorsque l’Agenda est disponible."
        : "La liste des calendriers n’a pas pu être chargée."
    ));
  }
  el.value = [...el.options].some(option => option.value === selected && !option.disabled) ? selected : "";
}


function applyUxPreferences(settings = configuration?.settings || {}) {
  document.body.dataset.settingsExperience = settings.settingsExperience || "guided";
  document.body.dataset.uiPreset = settings.uiPreset || "balanced";
  document.body.dataset.reduceMotion = settings.reduceMotion || "auto";
  const advanced = settings.settingsExperience === "advanced";
  for (const details of document.querySelectorAll("details.advanced-group")) {
    if (!advanced && !details.hasAttribute("data-guided-visible")) details.open = false;
  }
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
    host.append(node("p", "hint", "Le centre de santé n’a pas encore été analysé."));
    $("health-score-badge").textContent = "—";
    $("overview-health").textContent = "—";
    return;
  }
  const score = Math.max(0, Math.min(100, Number(report.score) || 0));
  const statusLabels = {healthy: "Sain", attention: "À surveiller", critical: "Action requise"};
  const summary = node("div", "health-summary");
  const title = node("strong", "", `${score}/100 · ${statusLabels[report.status] || "État inconnu"}`);
  const meta = node("small", "", `${report.counts?.pinned || 0} épingle(s) · ${report.issues?.length || 0} point(s) à examiner`);
  summary.append(title, meta);
  host.append(summary);
  const issues = node("div", "health-issues");
  for (const issue of report.issues || []) {
    const card = node("article", `health-issue ${issue.severity || "info"}`);
    card.append(node("strong", "", issue.title || "Information"), node("small", "", issue.detail || ""));
    issues.append(card);
  }
  if (!issues.childElementCount) issues.append(node("p", "hint", "Aucune anomalie détectée par les contrôles locaux."));
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
    host.append(node("p", "hint", "Lancez le test pour obtenir la matrice de vos comptes et calendriers."));
    return;
  }
  host.append(node("p", "hint", `Dernier contrôle : ${humanTime(matrix.checkedAt)} · ${(matrix.accounts || []).length} compte(s) · ${(matrix.calendars || []).length} calendrier(s).`));
  for (const row of matrix.accounts || []) {
    const card = node("div", "provider-row");
    card.append(
      node("strong", "", row.accountName || row.accountKey || "Compte"),
      node("span", "", row.provider || "inconnu"),
      node("span", "", (row.protocol || "inconnu").toUpperCase()),
      node("span", "", row.supportsFolders ? "Dossiers ✓" : "Dossiers limités"),
      node("span", "", row.offlineSupport ? "Hors ligne ✓" : "Hors ligne —")
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
    node("h3", "", "Prévisualisation de la restauration"),
    node("p", "", `Format : ${preview.format || "inconnu"} · version ${preview.version || "inconnue"}`),
    node("p", "", `${incoming.refs || 0} épingle(s), ${incoming.groups || 0} groupe(s), ${incoming.rules || 0} règle(s), ${incoming.cases || 0} affaire(s), ${incoming.templates || 0} modèle(s).`),
    node("p", preview.conflicts ? "warning-text" : "hint", `${preview.conflicts || 0} conflit(s) d’identifiant détecté(s).`)
  );
  const actions = node("div", "actions-row");
  const merge = node("button", "secondary", "Fusionner avec les données actuelles");
  merge.type = "button";
  merge.id = "restore-merge";
  const replace = node("button", "danger", "Remplacer les données actuelles");
  replace.type = "button";
  replace.id = "restore-replace";
  const restore = async (strategy, control) => {
    if (strategy === "replace" && !confirm("Remplacer les données MailPerch actuelles par cette sauvegarde ? Une sauvegarde de sécurité sera créée avant l’opération lorsque cette option est active.")) return;
    try {
      await withBusy(control, "Restauration en cours…", async () => {
        await messenger.pinInbox.restoreConfiguration(configurationData, strategy);
        if (typeof configurationData.shortcut === "string") {
          await messenger.commands.update({name: "toggle-pin-selected", shortcut: configurationData.shortcut}).catch(() => {});
        }
        await reload();
      });
      host.hidden = true;
      setStatus(strategy === "merge" ? "Sauvegarde fusionnée avec succès." : "Sauvegarde restaurée avec succès.", "success", {control});
    } catch (error) {
      setStatus(`Restauration impossible : ${error.message || error}`, "error", {control, persistent: true});
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
  $("stats").textContent =
    `${stats.pinned || 0} épingle(s) · ${stats.waiting || 0} en attente · ` +
    `${stats.overdue || 0} en retard · ${stats.history || 0} historique`;
  $("storage-info").textContent =
    `Stockage : ${config.storage?.backend || "inconnu"} · ` +
    `${config.storage?.database || ""} · schéma ${config.storage?.schemaVersion || ""}`;
  $("compat-info").textContent =
    `Compatibilité : ${config.compatibility?.mode || "inconnue"}` +
    `${config.compatibility?.missing?.length ? ` · ${config.compatibility.missing.join(", ")}` : ""}`;
  const perf = config.performance || {};
  $("performance-info").textContent =
    `Rendu : ${perf.renders || 0} · moyenne ${perf.averageRenderMs || 0} ms · ` +
    `max ${perf.maxRenderMs || 0} ms`;
  if ($("overview-pinned")) $("overview-pinned").textContent = String(stats.pinned || 0);
  if ($("overview-attention")) $("overview-attention").textContent = String((stats.overdue || 0) + (stats.waiting || 0));
  if (backup) {
    $("backup-info").textContent =
      `Dossier : ${backup.directory || "non défini"} · dernière sauvegarde : ` +
      `${backup.lastBackupAt ? new Date(backup.lastBackupAt).toLocaleString() : "aucune"}`;
    if ($("overview-backup")) $("overview-backup").textContent = backup.lastBackupAt ? humanTime(backup.lastBackupAt).split(" ")[0] : "Jamais";
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
  $("shortcut").value = config.shortcut || "Alt+P";
  groups = (config.groups || []).map(item => ({...item}));
  rules = (config.rules || []).map(item => ({...item}));
  cases = (config.cases || []).map(item => ({...item}));
  templates = (config.templates || []).map(item => ({...item}));
  renderGroups();
  renderCases();
  renderTemplates();
  renderRules();
  renderAccounts(config.accounts || []);
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
  const shortcut = await getShortcut();
  config.shortcut = shortcut;
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
    setStatus("Les paramètres sont encore en cours de chargement.", "error", {control: submitter, persistent: true});
    return;
  }
  if (saveInFlight) {
    setStatus("Une opération sur les paramètres est déjà en cours.", "busy", {control: submitter, persistent: true});
    return;
  }
  saveInFlight = true;
  syncSaveControls();
  try {
    if (!configuration?.settings) await reload();
    const config = await withBusy(submitter, "Enregistrement des paramètres…", async () => {
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
        shortcut: await getShortcut()
      };
    });
    await applyConfiguration(config);
    setStatus("Paramètres enregistrés.", "success");
  } catch (error) {
    setStatus(`Erreur : ${error.message || error}`, "error");
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
    setStatus("Les paramètres sont encore en cours de chargement.", "error", {control, persistent: true});
    return;
  }
  if (saveInFlight) {
    setStatus("Une opération sur les paramètres est déjà en cours.", "busy", {control, persistent: true});
    return;
  }
  saveInFlight = true;
  syncSaveControls();
  try {
    await withBusy(control, "Restauration des paramètres enregistrés…", () => reload());
    setDirty(false);
    setStatus("Modifications annulées.", "success", {control});
  } catch (error) {
    setStatus(`Annulation impossible : ${error.message || error}`, "error", {control, persistent: true});
  } finally {
    saveInFlight = false;
    syncSaveControls();
  }
}

async function saveShortcut(event) {
  try {
    await withBusy(event?.currentTarget || $("save-shortcut"), "Enregistrement du raccourci…", async () => {
      await messenger.commands.update({
        name: "toggle-pin-selected",
        shortcut: $("shortcut").value.trim()
      });
      $("shortcut").value = await getShortcut();
    });
    setStatus("Raccourci enregistré.", "success");
  } catch (error) {
    setStatus(`Raccourci refusé : ${error.message || error}`, "error");
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
  busyMessage = "Opération en cours…",
  reloadAfter = true
} = {}) {
  try {
    const result = await withBusy(control, busyMessage, action);
    if (reloadAfter) await reload({preserveEdits: dirty});
    setStatus(typeof message === "function" ? message(result) : message, "success");
    return result;
  } catch (error) {
    setStatus(`Opération impossible : ${error.message || error}`, "error");
    return null;
  }
}

async function importFile(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    setStatus("Fichier trop volumineux.", "error", {control: input, persistent: true});
    return;
  }
  try {
    const parsed = JSON.parse(await file.text());
    const preview = await withBusy(null, "Analyse de la sauvegarde…", () => messenger.pinInbox.previewImport(parsed));
    if (!preview?.valid) throw new Error("Format de sauvegarde non reconnu");
    renderImportPreview(preview, parsed);
    setStatus("Sauvegarde analysée. Choisissez Fusionner ou Remplacer dans cette section.", "success", {control: $("import-preview")});
  } catch (error) {
    renderImportPreview(null, null);
    setStatus(`Prévisualisation impossible : ${error.message || error}`, "error", {persistent: true});
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
    if (event.target.id === "shortcut" || event.target.id === "import-file") return;
    if (configurationReady) syncDirtyState();
  });
  form.addEventListener("change", event => {
    if (event.target.id === "shortcut" || event.target.id === "import-file") return;
    if (configurationReady) syncDirtyState();
  });

  $("status-close").addEventListener("click", clearStatus);
  $("save-shortcut").addEventListener("click", saveShortcut);

  $("add-group").addEventListener("click", () => {
    groups.push({
      id: uniqueEntityId("group", groups),
      name: "Nouveau groupe",
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
      name: "Nouvelle affaire",
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
      name: "Nouveau modèle",
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
      name: "Nouvelle règle",
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
      () => messenger.pinInbox.simulateRules({trigger: "messageAdded", limit: 1000}),
      value => `${value.matches.length} correspondance(s) sur ${value.scanned} message(s).`,
      {
        control: event.currentTarget,
        busyMessage: "Simulation des règles…",
        reloadAfter: false
      }
    );
    if (result) {
      $("rule-simulation").textContent =
        result.matches.slice(0, 20)
          .map(item => `${item.ruleName} → ${item.action} · ${item.subject}`)
          .join("\n") || "Aucune correspondance.";
    }
  });

  const bindRun = (id, action, message, busyMessage, options = {}) => {
    $(id).addEventListener("click", event => run(action, message, {
      control: event.currentTarget,
      busyMessage,
      ...options
    }));
  };

  $("settingsExperience").addEventListener("change", () => applyUxPreferences(currentSettings({settingsExperience: $("settingsExperience").value})));
  $("uiPreset").addEventListener("change", () => applyUxPreferences(currentSettings({uiPreset: $("uiPreset").value})));
  $("reduceMotion").addEventListener("change", () => applyUxPreferences(currentSettings({reduceMotion: $("reduceMotion").value})));

  $("provider-check").addEventListener("click", async event => {
    const matrix = await run(
      () => messenger.pinInbox.runProviderCompatibilityCheck(),
      value => `${value.accounts?.length || 0} compte(s) et ${value.calendars?.length || 0} calendrier(s) analysé(s).`,
      {control: event.currentTarget, busyMessage: "Analyse des fournisseurs…", reloadAfter: false}
    );
    if (matrix) {
      renderProviderMatrix(matrix);
      if (configuration) configuration.providerMatrix = matrix;
    }
  });

  $("health-check").addEventListener("click", async event => {
    try {
      const health = await withBusy(event.currentTarget, "Analyse de la santé MailPerch…", () => messenger.pinInbox.getHealthReport());
      renderHealth(health);
      setStatus(`Analyse terminée : score ${health.score}/100.`, health.status === "critical" ? "error" : "success", {control: event.currentTarget});
    } catch (error) {
      setStatus(`Analyse impossible : ${error.message || error}`, "error", {control: event.currentTarget, persistent: true});
    }
  });

  $("health-repair").addEventListener("click", async event => {
    if (!confirm("Exécuter les réparations non destructives ? MailPerch créera une sauvegarde avant la restauration lorsque cette option est active.")) return;
    try {
      const result = await withBusy(event.currentTarget, "Réparation des anomalies sûres…", () => messenger.pinInbox.repairHealthIssues({actions: ["orphan-links", "repair-references"]}));
      renderHealth(result.health);
      await reload({preserveEdits: dirty});
      setStatus(`${result.repaired || 0} élément(s) réparé(s).`, "success", {control: event.currentTarget});
    } catch (error) {
      setStatus(`Réparation impossible : ${error.message || error}`, "error", {control: event.currentTarget, persistent: true});
    }
  });

  $("clear-diagnostics").addEventListener("click", async event => {
    const result = await run(
      () => messenger.pinInbox.clearDiagnostics(),
      value => `${value.cleared || 0} événement(s) diagnostic supprimé(s).`,
      {control: event.currentTarget, busyMessage: "Suppression du journal diagnostic…", reloadAfter: false}
    );
    if (result) renderHealth(await messenger.pinInbox.getHealthReport().catch(() => null));
  });

  bindRun(
    "clear-rule-log",
    () => messenger.pinInbox.clearRuleLog(),
    result => `${result.cleared} entrée(s) supprimée(s).`,
    "Suppression du journal des règles…"
  );
  bindRun(
    "import-stars",
    () => messenger.pinInbox.importNativeStars($("clear-stars-after-import").checked),
    result => `${result.imported} étoile(s) importée(s).`,
    "Import des étoiles Thunderbird…"
  );
  bindRun("undo", () => messenger.pinInbox.undoLast(), result => result.message, "Annulation de la dernière action…");
  bindRun(
    "repair",
    () => messenger.pinInbox.repairReferences(),
    result => `${result.repaired} réparée(s), ${result.missing} introuvable(s).`,
    "Réparation des références…"
  );
  bindRun("rescan", () => messenger.pinInbox.rescanPinned(), "Rescan terminé.", "Analyse des messages épinglés…");
  bindRun("cleanup", () => messenger.pinInbox.cleanupBroken(), "Nettoyage terminé.", "Nettoyage des références introuvables…");
  bindRun(
    "reset-interface",
    () => messenger.pinInbox.resetInterface(),
    "Interface réinitialisée.",
    "Réinitialisation de l’interface…"
  );
  bindRun(
    "compat-check",
    () => messenger.pinInbox.runCompatibilityCheck(),
    "Vérification terminée.",
    "Vérification de la compatibilité Thunderbird…"
  );
  bindRun(
    "sync-calendar",
    () => messenger.pinInbox.syncCalendarLinks(),
    result => `${result.synced || 0} élément(s) synchronisé(s).`,
    "Synchronisation avec l’Agenda…"
  );
  bindRun(
    "run-backup",
    () => messenger.pinInbox.runBackup("manual"),
    result => `Sauvegarde créée : ${result.path}`,
    "Création de la sauvegarde locale…"
  );

  $("integrity-check").addEventListener("click", async event => {
    const result = await run(
      () => messenger.pinInbox.checkStorageIntegrity(),
      value => value.ok ? "Base SQLite intègre." : "Anomalie SQLite détectée.",
      {
        control: event.currentTarget,
        busyMessage: "Vérification de la base SQLite…"
      }
    );
    if (result) $("integrity-info").textContent = JSON.stringify(result, null, 2);
  });

  $("choose-backup").addEventListener("click", async event => {
    try {
      const result = await withBusy(
        event.currentTarget,
        "Sélection du dossier de sauvegarde…",
        () => messenger.pinInbox.chooseBackupDirectory()
      );
      if (!result.selected) {
        setStatus("Sélection du dossier annulée.", "success");
        return;
      }
      $("backupDirectory").value = result.path;
      if (!configuration?.settings) await reload();
      requireConfiguration().settings.backupDirectory = result.path;
      const backup = await messenger.pinInbox.getBackupStatus().catch(() => null);
      updateRuntimeSummary(configuration, backup);
      setStatus("Dossier de sauvegarde enregistré.", "success");
    } catch (error) {
      setStatus(`Sélection impossible : ${error.message || error}`, "error");
    }
  });

  $("dashboard").addEventListener("click", async event => {
    try {
      await withBusy(event.currentTarget, "Ouverture du tableau de bord…", () =>
        messenger.tabs.create({url: messenger.runtime.getURL("dashboard/dashboard.html")})
      );
      setStatus("Tableau de bord ouvert dans un nouvel onglet.", "success");
    } catch (error) {
      setStatus(`Ouverture impossible : ${error.message || error}`, "error");
    }
  });

  $("diagnostic").addEventListener("click", async event => {
    try {
      const report = await withBusy(
        event.currentTarget,
        "Préparation du diagnostic…",
        () => messenger.pinInbox.exportDiagnosticBundle()
      );
      downloadJson(
        `mailperch-diagnostic-${new Date().toISOString().slice(0, 10)}.json`,
        report
      );
      setStatus("Diagnostic exporté.", "success");
    } catch (error) {
      setStatus(`Export impossible : ${error.message || error}`, "error");
    }
  });

  $("export").addEventListener("click", async event => {
    try {
      const data = await withBusy(event.currentTarget, "Préparation de la sauvegarde…", async () => {
        const value = await messenger.pinInbox.exportConfiguration();
        value.shortcut = await getShortcut();
        return value;
      });
      downloadJson(`mailperch-${new Date().toISOString().slice(0, 10)}.json`, data);
      setStatus("Sauvegarde exportée.", "success");
    } catch (error) {
      setStatus(`Export impossible : ${error.message || error}`, "error");
    }
  });

  $("import-file").addEventListener("change", importFile);

  $("reset").addEventListener("click", async event => {
    if (!confirm("Réinitialiser les réglages, groupes, affaires, modèles et règles ? Les épingles sont conservées.")) {
      return;
    }
    const result = await run(
      () => messenger.pinInbox.resetConfiguration(),
      "Réglages réinitialisés.",
      {
        control: event.currentTarget,
        busyMessage: "Réinitialisation des réglages…"
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
