"use strict";

function localize() {
  document.documentElement.lang = (messenger.i18n.getUILanguage?.() || "fr").split("-")[0];
  for (const element of document.querySelectorAll("[data-i18n]")) {
    const value = messenger.i18n.getMessage(element.dataset.i18n);
    if (value) element.textContent = value;
  }
}

const api = globalThis.messenger || globalThis.browser;
const selected = new Set();
let current = null;
let searchTimer = null;
let statusTimer = null;
let loadGeneration = 0;
let loading = false;
let calendarDescriptors = [];

const $ = id => document.getElementById(id);

function eventElement(event) {
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  return path.find(candidate => candidate?.nodeType === Node.ELEMENT_NODE) ||
    (event.target?.nodeType === Node.ELEMENT_NODE ? event.target : null);
}

function normalizeTimestamp(value) {
  const number = Number(value) || 0;
  if (!number) return 0;
  if (number > 10_000_000_000_000) return Math.trunc(number / 1000);
  if (number < 10_000_000_000) return number * 1000;
  return number;
}

function formatDate(value) {
  const timestamp = normalizeTimestamp(value);
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

function clearKanbanDropState() {
  for (const list of document.querySelectorAll(".kanban-list[data-drop-active]")) {
    delete list.dataset.dropActive;
  }
}

function setLoading(value) {
  const next = Boolean(value);
  if (next === loading) return;
  loading = next;
  document.body.toggleAttribute("data-loading", loading);
  for (const control of document.querySelectorAll("button, select, input")) {
    if (control.id === "retry") continue;
    if (loading) {
      control.dataset.mailperchLoadingWasDisabled = String(control.disabled);
      control.disabled = true;
    } else {
      control.disabled = control.dataset.mailperchLoadingWasDisabled === "true";
      delete control.dataset.mailperchLoadingWasDisabled;
    }
  }
}

function clearStatus() {
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  const status = $("status");
  status.textContent = "";
  status.className = "status";
  status.hidden = true;
}

function setStatus(message, type = "", {persistent = false} = {}) {
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  const status = $("status");
  status.textContent = String(message || "");
  status.className = `status ${type}`.trim();
  status.hidden = !message;
  if (message && !persistent && type !== "busy") {
    statusTimer = setTimeout(clearStatus, type === "error" ? 12000 : 6500);
  }
}

function setButtonBusy(control, busy) {
  if (!(control instanceof HTMLButtonElement)) return;
  if (busy) {
    control.dataset.mailperchBusyWasDisabled = String(control.disabled);
    control.disabled = true;
    control.dataset.busy = "true";
    control.setAttribute("aria-busy", "true");
  } else {
    control.disabled = control.dataset.mailperchBusyWasDisabled === "true";
    delete control.dataset.mailperchBusyWasDisabled;
    delete control.dataset.busy;
    control.removeAttribute("aria-busy");
  }
}

function button(action, label) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "button secondary";
  element.dataset.action = action;
  element.textContent = label;
  element.title = label;
  element.setAttribute("aria-label", label);
  return element;
}

function stat(label, value) {
  const element = document.createElement("div");
  element.className = "stat";
  const strong = document.createElement("strong");
  strong.textContent = String(value ?? 0);
  element.append(strong, document.createTextNode(label));
  return element;
}

function option(value, label) {
  const element = document.createElement("option");
  element.value = value;
  element.textContent = label;
  return element;
}

function createEmpty(message) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = message;
  return element;
}

function badgesFor(item) {
  const badges = document.createElement("div");
  badges.className = "badges";
  const entries = [
    [item.unread, "Non lu", ""],
    [item.workflowStatus === "waiting", "En attente", "waiting"],
    [item.workflowStatus === "planned", "Planifié", "planned"],
    [
      item.dueAt || item.followUpAt,
      `${item.smartSection === "overdue" ? "En retard" : "Échéance"} ${formatDate(item.followUpAt || item.dueAt)}`,
      item.smartSection === "overdue" ? "overdue" : ""
    ],
    [item.completedAt, "Terminé", ""],
    [item.trackingMode === "conversation", `${item.conversationCount || 1} messages`, ""],
    [item.caseName, `Affaire : ${item.caseName}`, ""],
    [item.recurrenceRule, `Récurrent : ${item.recurrenceRule}`, ""],
    [item.missing, "Introuvable", "overdue"]
  ];
  for (const [condition, label, className] of entries) {
    if (!condition) continue;
    const badge = document.createElement("span");
    badge.className = `badge ${className}`.trim();
    badge.textContent = label;
    badges.append(badge);
  }
  return badges;
}

function createCard(item, {checkbox = true, compact = false} = {}) {
  const card = document.createElement("article");
  card.className = `item${compact ? " compact" : ""}`;
  card.dataset.key = item.stableKey;
  card.dataset.status = item.workflowStatus;
  card.dataset.completed = String(Boolean(item.completedAt));
  card.style.setProperty("--item-color", item.accountColor || "var(--accent)");

  if (checkbox) {
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = selected.has(item.stableKey);
    check.setAttribute("aria-label", `Sélectionner ${item.subject || "ce message"}`);
    check.addEventListener("change", () => {
      if (check.checked) selected.add(item.stableKey);
      else selected.delete(item.stableKey);
    });
    card.append(check);
  }

  const body = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = item.subject || "(sans objet)";
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = [item.author, item.accountName, item.folderName, formatDate(item.date)]
    .filter(Boolean)
    .join(" · ");
  body.append(title, meta);
  if (item.note) {
    const note = document.createElement("div");
    note.className = "note";
    note.textContent = item.note;
    body.append(note);
  }
  body.append(badgesFor(item));

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(
    button("open", "Ouvrir"),
    button(
      item.workflowStatus === "completed" ? "active" : "complete",
      item.workflowStatus === "completed" ? "Rouvrir" : "Terminer"
    ),
    button("waiting", "Attente"),
    button("planned", "Planifier"),
    button("snooze", "Reporter 1 h"),
    button("calendar", "Agenda"),
    button("unpin", "Désépingler")
  );
  card.append(body, actions);
  return card;
}

function renderList() {
  const host = $("items");
  host.replaceChildren();
  if (!current.items.length) {
    host.append(createEmpty("Aucune épingle ne correspond aux filtres actuels."));
    return;
  }
  for (const item of current.items) host.append(createCard(item));
}

function renderKanban() {
  const host = $("kanban");
  host.replaceChildren();
  const columns = [
    ["active", "À traiter"],
    ["waiting", "En attente"],
    ["planned", "Planifié"],
    ["completed", "Terminé"]
  ];
  for (const [status, label] of columns) {
    const column = document.createElement("section");
    column.className = "kanban-column";
    const title = document.createElement("h2");
    const items = current.items.filter(item => item.workflowStatus === status);
    title.textContent = `${label} · ${items.length}`;
    column.append(title);
    const list = document.createElement("div");
    list.className = "kanban-list";
    list.dataset.status = status;
    list.addEventListener("dragenter", event => {
      event.preventDefault();
      clearKanbanDropState();
      list.dataset.dropActive = "true";
    });
    list.addEventListener("dragover", event => {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    });
    list.addEventListener("dragleave", event => {
      if (!list.contains(event.relatedTarget)) delete list.dataset.dropActive;
    });
    list.addEventListener("drop", async event => {
      event.preventDefault();
      clearKanbanDropState();
      const key = event.dataTransfer?.getData("text/x-pin-mails-key") || "";
      if (!key) return;
      setStatus("Déplacement de la carte…", "busy", {persistent: true});
      try {
        await api.pinInbox.setWorkflowStatus([key], status, {});
        await load({announce: false});
        setStatus("Carte déplacée.", "success");
      } catch (error) {
        setStatus(`Déplacement impossible : ${error?.message || error}`, "error");
      }
    });
    for (const item of items) {
      const card = createCard(item, {checkbox: false, compact: true});
      card.draggable = true;
      card.addEventListener("dragstart", event => {
        if (!event.dataTransfer) return;
        event.dataTransfer.setData("text/x-pin-mails-key", item.stableKey);
        event.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", clearKanbanDropState);
      list.append(card);
    }
    column.append(list);
    host.append(column);
  }
}

function renderCases() {
  const host = $("cases");
  host.replaceChildren();
  const byCase = new Map();
  for (const item of current.items) {
    const key = item.caseId || "__none";
    const list = byCase.get(key) || [];
    list.push(item);
    byCase.set(key, list);
  }
  const allCases = [...current.cases, {id: "__none", name: "Sans affaire", color: "#777777"}];
  let rendered = 0;
  for (const caseItem of allCases) {
    const entries = byCase.get(caseItem.id) || [];
    if (!entries.length) continue;
    rendered++;
    const section = document.createElement("section");
    section.className = "case-section";
    section.style.setProperty("--case-color", caseItem.color || "#777777");
    const header = document.createElement("div");
    header.className = "case-header";
    const heading = document.createElement("h2");
    heading.textContent = `${caseItem.name} · ${entries.length}`;
    header.append(heading);
    if (caseItem.id !== "__none") {
      const agenda = button(
        "case-calendar",
        caseItem.calendarItemId ? "Synchroniser Agenda" : "Créer une tâche Agenda"
      );
      agenda.dataset.caseId = caseItem.id;
      header.append(agenda);
    }
    section.append(header);
    for (const item of entries) section.append(createCard(item, {checkbox: false, compact: true}));
    host.append(section);
  }
  if (!rendered) host.append(createEmpty("Aucune affaire ne correspond aux filtres actuels."));
}

function renderHistory() {
  const host = $("history");
  host.replaceChildren();
  if (!current.history.length) {
    host.append(createEmpty("Aucun élément dans l’historique."));
    return;
  }
  for (const item of current.history) {
    const row = document.createElement("article");
    row.className = "history-item";
    const title = document.createElement("strong");
    title.textContent = item.subject || "(sans objet)";
    const meta = document.createElement("span");
    meta.textContent = `${item.action} · ${formatDate(item.completedAt)} · durée ${Math.round((item.durationMs || 0) / 3_600_000)} h`;
    row.append(title, meta);
    host.append(row);
  }
}

function renderTechnical() {
  $("technical").textContent = JSON.stringify({
    revision: current.revision,
    compatibility: current.compatibility,
    performance: current.performance,
    counterRegressionEvents: current.counterRegressionEvents
  }, null, 2);

  const activity = $("activity");
  activity.replaceChildren();
  for (const event of current.activity.slice(0, 30)) {
    const row = document.createElement("div");
    row.className = "activity";
    row.textContent = `${formatDate(event.time)} · ${event.type} · ${event.label || ""}`;
    activity.append(row);
  }
  if (!activity.childElementCount) activity.append(createEmpty("Aucune activité récente."));

  const log = $("rule-log");
  log.replaceChildren();
  for (const event of current.ruleLog.slice(0, 30)) {
    const row = document.createElement("div");
    row.className = "activity";
    row.textContent = `${formatDate(event.time)} · ${event.ruleName} · ${event.result} · ${event.subject || ""}`;
    log.append(row);
  }
  if (!log.childElementCount) log.append(createEmpty("Aucune règle exécutée récemment."));
}

async function renderCalendarTarget(generation) {
  const select = $("calendar-target");
  const previous = select.value;
  const [calendars, configuration] = await Promise.all([
    api.pinInbox.getCalendars(),
    api.pinInbox.getConfiguration().catch(() => ({settings: {}}))
  ]);
  if (generation !== loadGeneration) return false;
  calendarDescriptors = calendars;
  select.replaceChildren(option("", "Choisir un calendrier…"));
  for (const calendar of calendars) {
    const item = option(
      calendar.id,
      `${calendar.name} — tâches ${calendar.taskCompatible ? "✓" : "✕"} · événements ${calendar.eventCompatible ? "✓" : "✕"}${calendar.reason ? ` · ${calendar.reason}` : ""}`
    );
    item.disabled = !calendar.taskCompatible && !calendar.eventCompatible;
    item.dataset.taskCompatible = String(calendar.taskCompatible);
    item.dataset.eventCompatible = String(calendar.eventCompatible);
    item.dataset.reason = calendar.reason || "";
    select.appendChild(item);
  }
  const preferred = previous || configuration.settings?.preferredCalendarId || "";
  select.value = [...select.options].some(item => item.value === preferred && !item.disabled) ? preferred : "";
  updateCalendarTargetHelp();
  return true;
}

function updateCalendarTargetHelp() {
  const select = $("calendar-target");
  const help = $("calendar-target-help");
  const calendar = calendarDescriptors.find(item => item.id === select.value);
  if (!calendar) {
    help.textContent = "Choisissez le calendrier utilisé par les actions Agenda. Les calendriers incompatibles sont affichés mais désactivés.";
    return;
  }
  help.textContent = `${calendar.name} · tâches ${calendar.taskCompatible ? "autorisées" : "indisponibles"} · événements ${calendar.eventCompatible ? "autorisés" : "indisponibles"}${calendar.reason ? ` · ${calendar.reason}` : ""}.`;
}

function calendarIdFor(itemType) {
  const select = $("calendar-target");
  const calendar = calendarDescriptors.find(item => item.id === select.value);
  if (!calendar) throw new Error("Choisissez d’abord un calendrier Agenda dans la barre d’outils.");
  const compatible = itemType === "event" ? calendar.eventCompatible : calendar.taskCompatible;
  if (!compatible) {
    throw new Error(`Le calendrier « ${calendar.name} » n’est pas compatible avec ${itemType === "event" ? "les événements" : "les tâches"}${calendar.reason ? ` : ${calendar.reason}` : ""}.`);
  }
  return calendar.id;
}

function setView() {
  const view = $("view").value;
  const visibleId = {
    list: "items",
    kanban: "kanban",
    cases: "cases",
    history: "history"
  }[view] || "items";
  for (const id of ["items", "kanban", "cases", "history"]) {
    $(id).hidden = id !== visibleId;
  }
}

async function load({announce = true} = {}) {
  const generation = ++loadGeneration;
  setLoading(true);
  if (announce) setStatus("Chargement…", "busy", {persistent: true});
  try {
    if (!api?.pinInbox?.getDashboardData) {
      throw new Error("L’API interne des épingles n’est pas disponible.");
    }
    if (!await renderCalendarTarget(generation)) return;
    const result = await api.pinInbox.getDashboardData({
      filter: $("filter").value,
      search: $("search").value,
      view: $("view").value
    });
    if (generation !== loadGeneration) return;
    current = result;
    const visibleKeys = new Set(current.items.map(item => item.stableKey));
    for (const key of [...selected]) {
      if (!visibleKeys.has(key)) selected.delete(key);
    }
    $("fatal-error").hidden = true;
    $("stats").replaceChildren(
      stat("Total", current.stats.total),
      stat("À traiter", current.stats.active),
      stat("En attente", current.stats.waiting),
      stat("Planifiés", current.stats.planned),
      stat("En retard", current.stats.overdue),
      stat("Terminés", current.stats.completed)
    );
    $("bulk-case").replaceChildren(
      option("", "Aucune affaire"),
      ...current.cases.map(item => option(item.id, item.name))
    );
    $("bulk-template").replaceChildren(
      option("", "Appliquer un modèle…"),
      ...current.templates.map(item => option(item.id, item.name))
    );
    renderList();
    renderKanban();
    renderCases();
    renderHistory();
    renderTechnical();
    setView();
    if (announce) setStatus(`${current.items.length} élément(s) affiché(s).`, "success");
  } catch (error) {
    if (generation !== loadGeneration) return;
    console.error("MailPerch : chargement du tableau de bord impossible", error);
    $("fatal-error-message").textContent = String(error?.message || error);
    $("fatal-error").hidden = false;
    setStatus("Chargement impossible.", "error");
    throw error;
  } finally {
    if (generation === loadGeneration) setLoading(false);
  }
}

async function actionFor(key, action) {
  if (action === "snooze") return api.pinInbox.snoozeReminder(key, 3_600_000);
  if (action === "calendar") return api.pinInbox.createCalendarItem(key, "task", calendarIdFor("task"));
  if (["active", "waiting", "planned"].includes(action)) {
    return api.pinInbox.setWorkflowStatus([key], action, {});
  }
  if (action === "complete") {
    return api.pinInbox.setWorkflowStatus([key], "completed", {});
  }
  return api.pinInbox.performReferenceAction([key], action, {});
}

const ACTION_MESSAGES = {
  open: "Message ouvert.",
  active: "Message replacé à traiter.",
  complete: "Message marqué comme terminé.",
  waiting: "Message placé en attente.",
  planned: "Message planifié.",
  snooze: "Rappel reporté d’une heure.",
  calendar: "Élément Agenda créé ou synchronisé.",
  unpin: "Message désépinglé.",
  "case-calendar": "Affaire synchronisée avec l’Agenda."
};

for (const hostId of ["items", "kanban", "cases"]) {
  $(hostId).addEventListener("click", async event => {
    const target = eventElement(event);
    const actionButton = target?.closest?.("[data-action]");
    if (!actionButton) return;
    event.preventDefault();
    event.stopPropagation();
    const action = actionButton.dataset.action;
    setButtonBusy(actionButton, true);
    setStatus("Application de l’action…", "busy", {persistent: true});
    try {
      if (action === "case-calendar" && actionButton.dataset.caseId) {
        await api.pinInbox.createCaseCalendarItem(actionButton.dataset.caseId, "task", calendarIdFor("task"));
      } else {
        const card = target.closest(".item");
        if (!card) throw new Error("La carte ciblée est introuvable.");
        await actionFor(card.dataset.key, action);
      }
      await load({announce: false});
      setStatus(ACTION_MESSAGES[action] || "Action appliquée.", "success");
    } catch (error) {
      setStatus(`Action impossible : ${error?.message || error}`, "error");
    } finally {
      setButtonBusy(actionButton, false);
    }
  });
}

$("calendar-target").addEventListener("change", updateCalendarTargetHelp);

$("refresh").addEventListener("click", async event => {
  setButtonBusy(event.currentTarget, true);
  try {
    await load();
  } catch {
    // load() already provides a visible error.
  } finally {
    setButtonBusy(event.currentTarget, false);
  }
});
$("retry").addEventListener("click", () => load().catch(() => {}));
$("filter").addEventListener("change", () => load().catch(() => {}));
$("view").addEventListener("change", () => {
  setView();
  load().catch(() => {});
});
$("search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => load().catch(() => {}), 220);
});

$("apply").addEventListener("click", async event => {
  if (!selected.size) {
    setStatus("Sélectionnez au moins un élément.", "error");
    return;
  }
  const action = $("bulk").value;
  const caseId = $("bulk-case").value;
  const templateId = $("bulk-template").value;
  setButtonBusy(event.currentTarget, true);
  setStatus("Application de l’action groupée…", "busy", {persistent: true});
  try {
    if (templateId) await api.pinInbox.applyTemplate([...selected], templateId);
    else if (caseId) await api.pinInbox.performReferenceAction([...selected], "case", {caseId});
    else if (["active", "waiting", "planned"].includes(action)) {
      await api.pinInbox.setWorkflowStatus([...selected], action, {});
    } else if (action === "complete") {
      await api.pinInbox.setWorkflowStatus([...selected], "completed", {});
    } else if (action) {
      await api.pinInbox.performReferenceAction([...selected], action, {});
    } else {
      setStatus("Choisissez une action, une affaire ou un modèle.", "error");
      return;
    }
    $("bulk").value = "";
    $("bulk-case").value = "";
    $("bulk-template").value = "";
    selected.clear();
    await load({announce: false});
    setStatus("Action groupée appliquée.", "success");
  } catch (error) {
    setStatus(`Action groupée impossible : ${error?.message || error}`, "error");
  } finally {
    setButtonBusy(event.currentTarget, false);
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !loading) load({announce: false}).catch(() => {});
});
window.addEventListener("blur", clearKanbanDropState);
window.addEventListener("DOMContentLoaded", () => {
  localize();
  load().catch(() => {});
}, {once: true});
