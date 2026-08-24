"use strict";

const CORE_KEY = "mailpinStateV2";
const paritySend = (type, payload = {}) => messenger.runtime.sendMessage({type, ...payload});
const coreSend = (type, payload = {}) => messenger.runtime.sendMessage({type, ...payload});
const $ = selector => document.querySelector(selector);
const fr = messenger.i18n.getUILanguage().toLowerCase().startsWith("fr");
const text = (en, french) => fr ? french : en;
let parity = null;

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function splitLabels(value) {
  return String(value || "").split(",").map(item => item.trim()).filter(Boolean).slice(0, 50);
}

function stablePinId(headerMessageId, fallbackId) {
  const source = String(headerMessageId || fallbackId || "").slice(0, 1000).trim();
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `pin-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

async function collect(list) {
  const messages = [...(list?.messages || [])];
  let id = list?.id || null;
  while (id) {
    const next = await messenger.messages.continueList(id);
    messages.push(...(next?.messages || []));
    id = next?.id || null;
  }
  return messages;
}

async function saveParity() {
  parity = await paritySend("mailpin:parity:set", {state: parity});
  await render();
}

function makeButton(label, handler, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", handler);
  return button;
}

function itemRow(title, detail, actions = []) {
  const row = document.createElement("div");
  row.className = "item";
  const copy = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = title;
  const small = document.createElement("small");
  small.textContent = detail;
  copy.append(strong, small);
  const controls = document.createElement("div");
  controls.className = "item-actions";
  controls.append(...actions);
  row.append(copy, controls);
  return row;
}

function removeById(collection, id) {
  parity[collection] = (parity[collection] || []).filter(item => item.id !== id);
  return saveParity();
}

function installSavedViewsSection() {
  if ($("#saved-views-section")) return;
  const templateSection = $("#templates")?.closest("section");
  if (!templateSection) return;
  const section = document.createElement("section");
  section.id = "saved-views-section";
  const heading = document.createElement("h2");
  heading.textContent = text("Saved views", "Vues enregistrées");
  const help = document.createElement("p");
  help.textContent = text(
    "Saved views are created from the Dashboard and keep the current view, search and sort.",
    "Les vues enregistrées sont créées depuis le Dashboard et conservent la vue, la recherche et le tri."
  );
  const list = document.createElement("div");
  list.id = "saved-views";
  list.className = "items";
  section.append(heading, help, list);
  templateSection.before(section);
}

function renderSavedViews() {
  const target = $("#saved-views");
  if (!target) return;
  target.replaceChildren();
  for (const view of parity.savedViews || []) {
    target.append(itemRow(
      view.name || text("Unnamed view", "Vue sans nom"),
      `${view.view || "all"} · ${view.query || text("no search", "sans recherche")} · ${view.sort || "updated"}`,
      [makeButton(text("Delete", "Supprimer"), () => removeById("savedViews", view.id), "danger")]
    ));
  }
}

function renderTemplates() {
  const target = $("#templates");
  target.replaceChildren();
  for (const template of parity.templates || []) {
    const details = [template.status, template.priority, template.project, Number.isFinite(template.dueInHours) ? `+${template.dueInHours}h` : ""]
      .filter(Boolean).join(" · ");
    target.append(itemRow(
      template.name || text("Unnamed template", "Modèle sans nom"),
      details || text("Metadata preset", "Préréglage de métadonnées"),
      [makeButton(text("Delete", "Supprimer"), () => removeById("templates", template.id), "danger")]
    ));
  }
}

function renderCases() {
  const target = $("#cases");
  target.replaceChildren();
  for (const item of parity.cases || []) {
    target.append(itemRow(
      item.name || text("Unnamed case", "Dossier sans nom"),
      `${item.status || "open"} · ${(item.pinIds || []).length} ${text("follow-up(s)", "suivi(s)")}${item.note ? ` · ${item.note}` : ""}`,
      [makeButton(text("Delete", "Supprimer"), () => removeById("cases", item.id), "danger")]
    ));
  }
}

function renderRules() {
  const target = $("#rules");
  target.replaceChildren();
  for (const rule of parity.rules || []) {
    const conditions = [
      rule.subjectContains ? `${text("subject", "objet")}: ${rule.subjectContains}` : "",
      rule.senderContains ? `${text("sender", "expéditeur")}: ${rule.senderContains}` : ""
    ].filter(Boolean).join(" · ") || text("matches all selected follow-ups", "correspond à tous les suivis sélectionnés");
    target.append(itemRow(
      rule.name || text("Unnamed rule", "Règle sans nom"),
      `${conditions} → ${rule.status || "keep"}${rule.priority ? ` · ${rule.priority}` : ""}`,
      [
        makeButton(rule.enabled === false ? text("Enable", "Activer") : text("Disable", "Désactiver"), async () => {
          rule.enabled = rule.enabled === false;
          await saveParity();
        }),
        makeButton(text("Delete", "Supprimer"), () => removeById("rules", rule.id), "danger")
      ]
    ));
  }
}

async function renderHistory() {
  const target = $("#history");
  target.replaceChildren();
  const data = await coreSend("mailpin:list");
  const history = [...(data.history || [])].reverse().slice(0, 50);
  for (const entry of history) {
    const line = document.createElement("div");
    line.className = "history-entry";
    const date = new Date(entry.at);
    line.textContent = `${Number.isFinite(date.getTime()) ? date.toLocaleString() : entry.at} · ${entry.type} · ${entry.pinId}${entry.detail ? ` · ${entry.detail}` : ""}`;
    target.append(line);
  }
}

async function render() {
  $("#visual-tags").checked = parity.visualTagsEnabled !== false;
  renderSavedViews();
  renderTemplates();
  renderCases();
  renderRules();
  await renderHistory();
}

async function addTemplate() {
  const name = $("#template-name").value.trim();
  if (!name) return;
  parity.templates = [...(parity.templates || []), {
    id: uid("template"),
    name: name.slice(0, 120),
    status: $("#template-status").value,
    priority: $("#template-priority").value,
    project: $("#template-project").value.trim().slice(0, 200),
    labels: splitLabels($("#template-labels").value),
    dueInHours: safeNumber($("#template-due").value),
    waitingForReply: $("#template-waiting-reply").checked
  }].slice(-100);
  $("#template-name").value = "";
  await saveParity();
}

async function addCase() {
  const name = $("#case-name").value.trim();
  if (!name) return;
  parity.cases = [...(parity.cases || []), {
    id: uid("case"),
    name: name.slice(0, 120),
    status: $("#case-status").value,
    note: $("#case-note").value.slice(0, 4000),
    pinIds: []
  }].slice(-200);
  $("#case-name").value = "";
  $("#case-note").value = "";
  await saveParity();
}

async function addRule() {
  const name = $("#rule-name").value.trim();
  if (!name) return;
  parity.rules = [...(parity.rules || []), {
    id: uid("rule"),
    name: name.slice(0, 120),
    enabled: true,
    subjectContains: $("#rule-subject").value.trim().slice(0, 200),
    senderContains: $("#rule-sender").value.trim().slice(0, 200),
    status: $("#rule-status").value,
    priority: $("#rule-priority").value,
    project: $("#rule-project").value.trim().slice(0, 200),
    dueInHours: safeNumber($("#rule-due").value)
  }].slice(-200);
  $("#rule-name").value = "";
  await saveParity();
}

async function importStars() {
  const granted = await messenger.permissions.request({permissions: ["accountsRead"]});
  if (!granted) return;
  const messages = await collect(await messenger.messages.query({flagged: true}));
  const stored = await messenger.storage.local.get(CORE_KEY);
  const core = stored[CORE_KEY] && typeof stored[CORE_KEY] === "object" ? structuredClone(stored[CORE_KEY]) : {schemaVersion: 2, pins: {}, settings: {}, savedViews: [], history: []};
  if (!core.pins || typeof core.pins !== "object") core.pins = {};
  if (!Array.isArray(core.history)) core.history = [];
  let imported = 0;
  for (const message of messages.slice(0, 2000)) {
    if (!message.headerMessageId && !Number.isInteger(message.id)) continue;
    const id = stablePinId(message.headerMessageId, message.id);
    if (core.pins[id]) continue;
    const now = new Date().toISOString();
    core.pins[id] = {
      id,
      headerMessageId: String(message.headerMessageId || "").slice(0, 1000),
      lastKnownMessageId: Number.isInteger(message.id) ? message.id : null,
      accountId: String(message.folder?.accountId || "").slice(0, 200),
      folderId: String(message.folder?.id || "").slice(0, 500),
      subject: String(message.subject || "").slice(0, 1000),
      author: String(message.author || "").slice(0, 1000),
      date: new Date(message.date || Date.now()).toISOString(),
      nativeTags: Array.isArray(message.tags) ? message.tags.slice(0, 100) : [],
      status: "active",
      priority: "normal",
      dueAt: null,
      waitingForReply: false,
      note: "",
      checklist: [],
      labels: [],
      project: "",
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    core.history.push({at: now, type: "import-star", pinId: id, detail: "native"});
    imported += 1;
  }
  core.history = core.history.slice(-200);
  await messenger.storage.local.set({[CORE_KEY]: core});
  $("#diagnostic-output").textContent = text(`${imported} starred message(s) imported.`, `${imported} message(s) étoilé(s) importé(s).`);
  await renderHistory();
}

async function repairMissing() {
  const data = await coreSend("mailpin:list");
  const ids = (data.pins || []).filter(pin => pin.missing).map(pin => pin.id);
  if (!ids.length) {
    $("#diagnostic-output").textContent = text("No broken follow-up found.", "Aucun suivi cassé trouvé.");
    return;
  }
  if (!window.confirm(text(`Remove ${ids.length} broken follow-up(s)?`, `Supprimer ${ids.length} suivi(s) cassé(s) ?`))) return;
  await coreSend("mailpin:unpin", {ids});
  $("#diagnostic-output").textContent = text(`${ids.length} broken follow-up(s) removed.`, `${ids.length} suivi(s) cassé(s) supprimé(s).`);
  await renderHistory();
}

async function runDiagnostics() {
  const report = await paritySend("mailpin:parity:diagnostics");
  $("#diagnostic-output").textContent = JSON.stringify(report, null, 2);
}

function downloadJson(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportTools() {
  downloadJson(`mailpin-workbench-${new Date().toISOString().slice(0, 10)}.json`, parity);
}

async function importTools(event) {
  try {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) throw new Error(text("File too large", "Fichier trop volumineux"));
    const incoming = JSON.parse(await file.text());
    if (incoming?.schemaVersion !== 1) throw new Error(text("MailPin Workbench v1 data required", "Données MailPin Workbench v1 requises"));
    parity = incoming;
    await saveParity();
  } catch (error) {
    $("#diagnostic-output").textContent = String(error?.message || error);
  } finally {
    event.target.value = "";
  }
}

function localizeStaticPage() {
  if (!fr) return;
  document.documentElement.lang = "fr";
  document.title = "Outils MailPin";
  $("h1").textContent = "Outils MailPin";
  $("#subtitle").textContent = "Fonctions avancées WebExtension-native";
  $("#open-dashboard").textContent = "Dashboard";
  const headings = [...document.querySelectorAll("h2")];
  const labels = ["Intégration Thunderbird", "Modèles", "Dossiers", "Règles", "Migration et maintenance", "Activité récente"];
  headings.forEach((heading, index) => { if (labels[index]) heading.textContent = labels[index]; });
  $("#sync-tags").textContent = "Synchroniser les tags visuels";
  $("#add-template").textContent = "Ajouter le modèle";
  $("#add-case").textContent = "Ajouter le dossier";
  $("#add-rule").textContent = "Ajouter la règle";
  $("#import-stars").textContent = "Importer les messages étoilés";
  $("#repair-missing").textContent = "Supprimer les suivis cassés";
  $("#diagnostics").textContent = "Lancer le diagnostic";
  $("#export-tools").textContent = "Exporter les données Outils";
}

async function init() {
  localizeStaticPage();
  installSavedViewsSection();
  parity = await paritySend("mailpin:parity:get");
  $("#visual-tags").addEventListener("change", async event => {
    parity.visualTagsEnabled = event.target.checked;
    await saveParity();
  });
  $("#sync-tags").addEventListener("click", async () => {
    const result = await paritySend("mailpin:parity:syncTags");
    $("#sync-status").textContent = text(`${result.synced} synced`, `${result.synced} synchronisé(s)`);
  });
  $("#add-template").addEventListener("click", addTemplate);
  $("#add-case").addEventListener("click", addCase);
  $("#add-rule").addEventListener("click", addRule);
  $("#import-stars").addEventListener("click", importStars);
  $("#repair-missing").addEventListener("click", repairMissing);
  $("#diagnostics").addEventListener("click", runDiagnostics);
  $("#export-tools").addEventListener("click", exportTools);
  $("#import-tools").addEventListener("change", importTools);
  $("#open-dashboard").addEventListener("click", () => messenger.tabs.create({url: messenger.runtime.getURL("dashboard/dashboard.html")}));
  await render();
}

init().catch(error => {
  $("#diagnostic-output").textContent = String(error?.message || error);
  console.error("MailPin Workbench init failed", error);
});
