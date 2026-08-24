"use strict";

const paritySend = (type, payload = {}) => messenger.runtime.sendMessage({type, ...payload});
const coreSend = (type, payload = {}) => messenger.runtime.sendMessage({type, ...payload});
const byId = id => document.getElementById(id);
const parityText = (en, fr) => (messenger.i18n.getUILanguage().toLowerCase().startsWith("fr") ? fr : en);
let parityState = null;

function selectedPinIds() {
  return [...document.querySelectorAll(".pin-card")]
    .filter(card => card.querySelector(".pin-select")?.checked)
    .map(card => card.dataset.id)
    .filter(Boolean);
}

function selectedCards() {
  return [...document.querySelectorAll(".pin-card")].filter(card => card.querySelector(".pin-select")?.checked);
}

function selectedCardText(card) {
  return {
    id: card.dataset.id,
    subject: card.querySelector(".pin-title")?.textContent || "",
    meta: card.querySelector(".pin-meta")?.textContent || ""
  };
}

async function saveParity() {
  parityState = await paritySend("mailpin:parity:set", {state: parityState});
  renderParityControls();
}

function makeOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function installWorkbenchButton() {
  const actions = document.querySelector(".top-actions");
  if (!actions || byId("mailpin-workbench")) return;
  const button = document.createElement("button");
  button.id = "mailpin-workbench";
  button.type = "button";
  button.textContent = parityText("Workbench", "Outils");
  button.addEventListener("click", () => messenger.tabs.create({url: messenger.runtime.getURL("workbench/workbench.html")}));
  actions.append(button);
}

function installSavedViews() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar || byId("mailpin-saved-views")) return;
  const separator = document.createElement("hr");
  const title = document.createElement("div");
  title.className = "muted parity-section-title";
  title.textContent = parityText("Saved views", "Vues enregistrées");
  const select = document.createElement("select");
  select.id = "mailpin-saved-views";
  select.className = "parity-select";
  const save = document.createElement("button");
  save.type = "button";
  save.className = "view parity-save-view";
  save.textContent = parityText("Save current view", "Enregistrer la vue");
  save.addEventListener("click", async () => {
    const name = window.prompt(parityText("View name", "Nom de la vue"));
    if (!name?.trim()) return;
    const active = document.querySelector(".view.active")?.dataset.view || "all";
    const query = byId("search")?.value || "";
    const sort = byId("sort")?.value || "updated";
    parityState.savedViews = [...(parityState.savedViews || []), {
      id: `view-${Date.now()}`,
      name: name.trim().slice(0, 120),
      view: active,
      query: query.slice(0, 500),
      sort
    }].slice(-50);
    await saveParity();
  });
  select.addEventListener("change", () => {
    const view = (parityState.savedViews || []).find(item => item.id === select.value);
    if (!view) return;
    const viewButton = document.querySelector(`.view[data-view="${CSS.escape(view.view || "all")}"]`);
    if (viewButton) viewButton.click();
    if (byId("search")) {
      byId("search").value = view.query || "";
      byId("search").dispatchEvent(new Event("input", {bubbles: true}));
    }
    if (byId("sort") && [...byId("sort").options].some(option => option.value === view.sort)) {
      byId("sort").value = view.sort;
      byId("sort").dispatchEvent(new Event("change", {bubbles: true}));
    }
  });
  sidebar.append(separator, title, select, save);
}

function renderSavedViews() {
  const select = byId("mailpin-saved-views");
  if (!select) return;
  const current = select.value;
  select.replaceChildren(makeOption("", parityText("Choose a saved view…", "Choisir une vue…")));
  for (const view of parityState.savedViews || []) select.append(makeOption(view.id, view.name));
  if ([...select.options].some(option => option.value === current)) select.value = current;
}

function installBulkParityOptions() {
  const bulk = byId("bulk-action");
  if (!bulk || bulk.dataset.parityInstalled) return;
  bulk.dataset.parityInstalled = "1";
  const separator = makeOption("", "──────────");
  separator.disabled = true;
  separator.dataset.parity = "1";
  bulk.append(separator);
  bulk.append(
    makeOption("parity:snooze1h", parityText("Snooze 1 hour", "Reporter d’1 heure")),
    makeOption("parity:snooze1d", parityText("Snooze 1 day", "Reporter d’1 jour")),
    makeOption("parity:rules", parityText("Apply matching rules", "Appliquer les règles"))
  );
  bulk.addEventListener("change", handleParityBulkAction, true);
}

function rebuildDynamicBulkOptions() {
  const bulk = byId("bulk-action");
  if (!bulk) return;
  for (const option of [...bulk.options]) {
    if (option.dataset.dynamicParity === "1") option.remove();
  }
  for (const template of parityState.templates || []) {
    const option = makeOption(`parity:template:${template.id}`, `${parityText("Template", "Modèle")} · ${template.name}`);
    option.dataset.dynamicParity = "1";
    bulk.append(option);
  }
  for (const item of parityState.cases || []) {
    const option = makeOption(`parity:case:${item.id}`, `${parityText("Add to case", "Ajouter au dossier")} · ${item.name}`);
    option.dataset.dynamicParity = "1";
    bulk.append(option);
  }
}

function templatePatch(template) {
  const patch = {};
  if (["active", "planned", "waiting", "completed"].includes(template.status)) patch.status = template.status;
  if (["low", "normal", "high"].includes(template.priority)) patch.priority = template.priority;
  if (typeof template.project === "string") patch.project = template.project;
  if (Array.isArray(template.labels)) patch.labels = template.labels;
  if (typeof template.waitingForReply === "boolean") patch.waitingForReply = template.waitingForReply;
  if (Number.isFinite(template.dueInHours)) patch.dueAt = new Date(Date.now() + template.dueInHours * 3600000).toISOString();
  return patch;
}

async function applyRules(ids) {
  const cards = new Map(selectedCards().map(card => [card.dataset.id, selectedCardText(card)]));
  let applied = 0;
  for (const id of ids) {
    const info = cards.get(id) || {subject: "", meta: ""};
    for (const rule of parityState.rules || []) {
      if (rule.enabled === false) continue;
      const subjectNeedle = String(rule.subjectContains || "").toLocaleLowerCase();
      const senderNeedle = String(rule.senderContains || "").toLocaleLowerCase();
      const subjectMatches = !subjectNeedle || info.subject.toLocaleLowerCase().includes(subjectNeedle);
      const senderMatches = !senderNeedle || info.meta.toLocaleLowerCase().includes(senderNeedle);
      if (!subjectMatches || !senderMatches) continue;
      await coreSend("mailpin:update", {id, patch: templatePatch(rule)});
      applied += 1;
    }
  }
  parityState.ruleLog = [...(parityState.ruleLog || []), {
    at: new Date().toISOString(),
    selected: ids.length,
    applied
  }].slice(-200);
  await saveParity();
}

async function handleParityBulkAction(event) {
  const value = event.target.value;
  if (!value.startsWith("parity:")) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  event.target.value = "";
  const ids = selectedPinIds();
  if (!ids.length) return;

  if (value === "parity:snooze1h" || value === "parity:snooze1d") {
    const duration = value.endsWith("1h") ? 3600000 : 86400000;
    await Promise.all(ids.map(id => coreSend("mailpin:update", {
      id,
      patch: {status: "planned", dueAt: new Date(Date.now() + duration).toISOString()}
    })));
  } else if (value === "parity:rules") {
    await applyRules(ids);
  } else if (value.startsWith("parity:template:")) {
    const template = (parityState.templates || []).find(item => `parity:template:${item.id}` === value);
    if (template) await coreSend("mailpin:updateMany", {ids, patch: templatePatch(template)});
  } else if (value.startsWith("parity:case:")) {
    const caseId = value.slice("parity:case:".length);
    const target = (parityState.cases || []).find(item => item.id === caseId);
    if (target) {
      target.pinIds = [...new Set([...(target.pinIds || []), ...ids])].slice(0, 500);
      await saveParity();
    }
  }

  byId("refresh")?.click();
}

function renderParityControls() {
  renderSavedViews();
  rebuildDynamicBulkOptions();
}

async function initParityDashboard() {
  parityState = await paritySend("mailpin:parity:get");
  installWorkbenchButton();
  installSavedViews();
  installBulkParityOptions();
  renderParityControls();
}

initParityDashboard().catch(error => console.error("MailPin parity dashboard init failed", error));
