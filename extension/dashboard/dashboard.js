"use strict";

const api = globalThis.messenger || globalThis.browser;
const selected = new Set();
let current = null;
let searchTimer = null;
let loadGeneration = 0;
let loading = false;

const $ = id => document.getElementById(id);

function normalizeTimestamp(value) {
  const number = Number(value) || 0;
  if (!number) return 0;
  if (number > 10_000_000_000_000) return Math.trunc(number / 1000); // PRTime microseconds.
  if (number < 10_000_000_000) return number * 1000; // Unix seconds.
  return number;
}

function formatDate(value) {
  const timestamp = normalizeTimestamp(value);
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {dateStyle: "short", timeStyle: "short"}).format(new Date(timestamp));
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
  loading = Boolean(value);
  document.body.toggleAttribute("data-loading", loading);
  for (const control of document.querySelectorAll("button, select, input")) {
    if (control.id !== "retry") control.disabled = loading;
  }
}

function setStatus(message, isError = false) {
  const status = $("status");
  status.textContent = message || "";
  status.classList.toggle("error", isError);
}

function button(action, label) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "button secondary";
  element.dataset.action = action;
  element.textContent = label;
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
    [item.dueAt || item.followUpAt, `${item.smartSection === "overdue" ? "En retard" : "Échéance"} ${formatDate(item.followUpAt || item.dueAt)}`, item.smartSection === "overdue" ? "overdue" : ""],
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
  meta.textContent = [item.author, item.accountName, item.folderName, formatDate(item.date)].filter(Boolean).join(" · ");
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
    button(item.workflowStatus === "completed" ? "active" : "complete", item.workflowStatus === "completed" ? "Rouvrir" : "Terminer"),
    button("waiting", "Attente"),
    button("planned", "Planifier"),
    button("snooze", "+1 h"),
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
  const columns = [["active", "À traiter"], ["waiting", "En attente"], ["planned", "Planifié"], ["completed", "Terminé"]];
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
    list.addEventListener("dragenter", event => { event.preventDefault(); clearKanbanDropState(); list.dataset.dropActive = "true"; });
    list.addEventListener("dragover", event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; });
    list.addEventListener("dragleave", event => { if (!list.contains(event.relatedTarget)) delete list.dataset.dropActive; });
    list.addEventListener("drop", async event => {
      event.preventDefault();
      clearKanbanDropState();
      const key = event.dataTransfer.getData("text/x-pin-mails-key");
      if (!key) return;
      await api.pinInbox.setWorkflowStatus([key], status, {});
      await load();
    });
    for (const item of items) {
      const card = createCard(item, {checkbox: false, compact: true});
      card.draggable = true;
      card.addEventListener("dragstart", event => event.dataTransfer.setData("text/x-pin-mails-key", item.stableKey));
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
      const agenda = button("case-calendar", caseItem.calendarItemId ? "Synchroniser Agenda" : "Créer une tâche Agenda");
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

function setView() {
  const view = $("view").value;
  const visibleId = {list: "items", kanban: "kanban", cases: "cases", history: "history"}[view] || "items";
  for (const id of ["items", "kanban", "cases", "history"]) $(id).hidden = id !== visibleId;
}

async function load() {
  const generation = ++loadGeneration;
  setLoading(true);
  setStatus("Chargement…");
  try {
    if (!api?.pinInbox?.getDashboardData) throw new Error("L’API interne des épingles n’est pas disponible.");
    const result = await api.pinInbox.getDashboardData({
      filter: $("filter").value,
      search: $("search").value,
      view: $("view").value
    });
    if (generation !== loadGeneration) return;
    current = result;
    const visibleKeys = new Set(current.items.map(item => item.stableKey));
    for (const key of [...selected]) if (!visibleKeys.has(key)) selected.delete(key);
    $("fatal-error").hidden = true;
    $("stats").replaceChildren(
      stat("Total", current.stats.total), stat("À traiter", current.stats.active),
      stat("En attente", current.stats.waiting), stat("Planifiés", current.stats.planned),
      stat("En retard", current.stats.overdue), stat("Terminés", current.stats.completed)
    );
    $("bulk-case").replaceChildren(option("", "Aucune affaire"), ...current.cases.map(item => option(item.id, item.name)));
    $("bulk-template").replaceChildren(option("", "Appliquer un modèle…"), ...current.templates.map(item => option(item.id, item.name)));
    renderList();
    renderKanban();
    renderCases();
    renderHistory();
    renderTechnical();
    setView();
    setStatus(`${current.items.length} élément(s) affiché(s).`);
  } catch (error) {
    console.error("Épingles : chargement du tableau de bord impossible", error);
    $("fatal-error-message").textContent = String(error?.message || error);
    $("fatal-error").hidden = false;
    setStatus("Chargement impossible.", true);
  } finally {
    if (generation === loadGeneration) setLoading(false);
  }
}

async function actionFor(key, action) {
  if (action === "snooze") return api.pinInbox.snoozeReminder(key, 3_600_000);
  if (action === "calendar") return api.pinInbox.createCalendarItem(key, "task", "");
  if (["active", "waiting", "planned"].includes(action)) return api.pinInbox.setWorkflowStatus([key], action, {});
  if (action === "complete") return api.pinInbox.setWorkflowStatus([key], "completed", {});
  return api.pinInbox.performReferenceAction([key], action, {});
}

for (const hostId of ["items", "kanban", "cases"]) {
  $(hostId).addEventListener("click", async event => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    try {
      actionButton.disabled = true;
      if (actionButton.dataset.action === "case-calendar" && actionButton.dataset.caseId) {
        await api.pinInbox.createCaseCalendarItem(actionButton.dataset.caseId, "task", "");
      } else {
        const card = event.target.closest(".item");
        if (!card) return;
        await actionFor(card.dataset.key, actionButton.dataset.action);
      }
      await load();
    } catch (error) {
      setStatus(String(error?.message || error), true);
    } finally {
      actionButton.disabled = false;
    }
  });
}

$("refresh").addEventListener("click", load);
$("retry").addEventListener("click", load);
$("filter").addEventListener("change", load);
$("view").addEventListener("change", () => { setView(); load(); });
$("search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(load, 220);
});

$("apply").addEventListener("click", async () => {
  if (!selected.size) {
    setStatus("Sélectionnez au moins un élément.", true);
    return;
  }
  const action = $("bulk").value;
  const caseId = $("bulk-case").value;
  const templateId = $("bulk-template").value;
  try {
    if (templateId) await api.pinInbox.applyTemplate([...selected], templateId);
    else if (caseId) await api.pinInbox.performReferenceAction([...selected], "case", {caseId});
    else if (["active", "waiting", "planned"].includes(action)) await api.pinInbox.setWorkflowStatus([...selected], action, {});
    else if (action === "complete") await api.pinInbox.setWorkflowStatus([...selected], "completed", {});
    else if (action) await api.pinInbox.performReferenceAction([...selected], action, {});
    else {
      setStatus("Choisissez une action, une affaire ou un modèle.", true);
      return;
    }
    $("bulk").value = "";
    $("bulk-template").value = "";
    selected.clear();
    await load();
  } catch (error) {
    setStatus(String(error?.message || error), true);
  }
});

document.addEventListener("visibilitychange", () => { if (!document.hidden && !loading) load(); });
window.addEventListener("blur", clearKanbanDropState);
window.addEventListener("DOMContentLoaded", load, {once: true});
