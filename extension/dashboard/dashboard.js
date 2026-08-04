"use strict";

const api = globalThis.messenger || globalThis.browser;
const $ = id => document.getElementById(id);
const selected = new Set();
let current = null;
let configuration = null;
let calendars = [];
let loadGeneration = 0;
let searchTimer = null;
let statusTimer = null;
let pendingCalendarKeys = [];
let loading = false;
let lastSelectedKey = "";

const ACTION_MESSAGES = Object.freeze({
  open: "Message ouvert.", reply: "Fenêtre de réponse ouverte.", active: "Message remis à traiter.",
  waiting: "Message placé en attente.", planned: "Message planifié.", complete: "Message terminé.",
  uncomplete: "Message rouvert.", read: "Message marqué comme lu.", unread: "Message marqué comme non lu.",
  archive: "Message archivé.", delete: "Message supprimé.", unpin: "Message désépinglé.",
  trackNoReply: "Suivi sans réponse activé.", cancelNoReply: "Suivi sans réponse arrêté.",
  priority: "Priorité mise à jour.", deadline: "Échéance mise à jour.", group: "Groupe mis à jour.",
  case: "Affaire mise à jour.", template: "Modèle appliqué.", calendar: "Élément Agenda créé.",
  snooze: "Message mis en veille.", wake: "Message réveillé.", dismissReminder: "Rappel ignoré."
});

function msg(key, fallback) {
  try { return api.i18n.getMessage(key) || fallback; } catch { return fallback; }
}

function localize() {
  document.documentElement.lang = (api.i18n.getUILanguage?.() || "fr").split("-")[0];
  for (const element of document.querySelectorAll("[data-i18n]")) {
    const value = msg(element.dataset.i18n, "");
    if (value) element.textContent = value;
  }
  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    const value = msg(element.dataset.i18nPlaceholder, "");
    if (value) element.placeholder = value;
  }
}

function node(tag, className = "", text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
}

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
  try { return new Intl.DateTimeFormat(undefined, {dateStyle: "short", timeStyle: "short"}).format(new Date(timestamp)); }
  catch { return new Date(timestamp).toLocaleString(); }
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function setLoading(value) {
  const next = Boolean(value);
  if (next === loading) return;
  loading = next;
  document.body.toggleAttribute("data-loading", loading);
  for (const control of document.querySelectorAll("button, select, input")) {
    if (control.id === "retry" || control.closest("dialog")) continue;
    if (loading) {
      control.dataset.mailperchLoadingWasDisabled = String(control.disabled);
      control.disabled = true;
      control.setAttribute("aria-busy", "true");
    } else if (Object.prototype.hasOwnProperty.call(control.dataset, "mailperchLoadingWasDisabled")) {
      control.disabled = control.dataset.mailperchLoadingWasDisabled === "true";
      delete control.dataset.mailperchLoadingWasDisabled;
      control.removeAttribute("aria-busy");
    }
  }
}

function setButtonBusy(control, busy) {
  if (!(control instanceof HTMLButtonElement)) return;
  if (busy) {
    if (!Object.prototype.hasOwnProperty.call(control.dataset, "mailperchBusyWasDisabled")) {
      control.dataset.mailperchBusyWasDisabled = String(control.disabled);
    }
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

function clearStatus() {
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = null;
  const host = $("status");
  host.hidden = true;
  host.className = "status";
  $("status-message").textContent = "";
}

function setStatus(message, type = "", {persistent = false} = {}) {
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = null;
  const host = $("status");
  $("status-message").textContent = String(message || "");
  host.className = `status ${type}`.trim();
  host.hidden = !message;
  if (message && !persistent && type !== "busy") {
    statusTimer = setTimeout(clearStatus, type === "error" ? 12000 : 6500);
  }
}

function setFatal(error) {
  $("fatal-message").textContent = String(error?.message || error || "Erreur inconnue");
  $("fatal-error").hidden = false;
  setLoading(false);
}

function option(value, label) {
  const element = document.createElement("option");
  element.value = value;
  element.textContent = label;
  return element;
}

function calendarIdFor(itemType = "task") {
  const preferred = configuration?.settings?.preferredCalendarId || "";
  const compatible = calendars.filter(calendar => itemType === "event" ? calendar.eventCompatible : calendar.taskCompatible);
  return compatible.some(calendar => calendar.id === preferred) ? preferred : (compatible[0]?.id || "");
}

function statCard(label, value, tone = "") {
  const card = node("article", `stat ${tone}`.trim());
  card.append(node("strong", "", value ?? 0), node("span", "", label));
  return card;
}

function actionButton(action, label, tone = "") {
  const button = node("button", `button ${tone || "secondary"}`.trim(), label);
  button.type = "button";
  button.dataset.action = action;
  return button;
}

function createEmpty(message) {
  const host = node("div", "empty-state");
  host.append(node("div", "", message));
  return host;
}

function badge(host, condition, label, className = "") {
  if (!condition) return;
  host.append(node("span", `badge ${className}`.trim(), label));
}

function badgesFor(item) {
  const host = node("div", "badges");
  badge(host, item.unread, msg("unread", "Non lu"));
  badge(host, item.workflowStatus === "waiting", msg("statusWaiting", "En attente"), "waiting");
  badge(host, item.workflowStatus === "planned", msg("statusPlanned", "Planifié"), "planned");
  badge(host, Number(item.snoozeUntil || 0) > Date.now(), msg("snoozedUntil", "En veille jusqu’au $1").replace("$1", formatDate(item.snoozeUntil)), "snoozed");
  badge(host, item.noReplyTracking, item.noReplyAt && item.noReplyAt <= Date.now()
    ? msg("noReplyDue", "Sans réponse · à relancer")
    : `${msg("noReplyTracking", "Sans réponse")} · ${formatDate(item.noReplyAt)}`, "no-reply");
  badge(host, item.dueAt || item.followUpAt,
    `${item.smartSection === "overdue" ? msg("overdue", "En retard") : msg("deadline", "Échéance")} · ${formatDate(item.followUpAt || item.dueAt)}`,
    item.smartSection === "overdue" ? "overdue" : "");
  badge(host, item.completedAt, msg("statusComplete", "Terminé"));
  badge(host, item.priorityLevel === "high", msg("priorityHigh", "Priorité haute"));
  badge(host, item.priorityLevel === "urgent", msg("priorityUrgent", "Priorité urgente"), "overdue");
  badge(host, item.trackingMode === "conversation", `${item.conversationCount || 1} ${msg("messages", "messages")}`);
  badge(host, item.groupName, `${msg("group", "Groupe")} · ${item.groupName}`);
  badge(host, item.caseName, `${msg("case", "Affaire")} · ${item.caseName}`);
  badge(host, item.calendarSyncError, msg("calendarError", "Agenda à vérifier"), "error");
  badge(host, item.missing, msg("missingMessage", "Message introuvable"), "error");
  return host;
}

function updateSelectionBar() {
  const count = selected.size;
  $("selection-bar").hidden = count === 0 || configuration?.settings?.enableBulkActions === false;
  $("selection-count").textContent = count === 1 ? "1 message sélectionné" : `${count} messages sélectionnés`;
  for (const input of document.querySelectorAll('.item input[type="checkbox"]')) {
    const card = input.closest(".item");
    input.checked = selected.has(card?.dataset.key || "");
  }
}

function createCard(item, {compact = false, selectable = true} = {}) {
  const card = node("article", `item${compact ? " compact" : ""}`);
  card.dataset.key = item.stableKey;
  card.dataset.status = item.workflowStatus || "active";
  card.draggable = !compact;
  card.style.setProperty("--item-color", item.accountColor || "var(--accent)");

  if (selectable && !compact) {
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = selected.has(item.stableKey);
    check.setAttribute("aria-label", `Sélectionner ${item.subject || "ce message"}`);
    check.addEventListener("click", event => {
      const key = item.stableKey;
      if (event.shiftKey && lastSelectedKey && lastSelectedKey !== key) {
        const visibleKeys = [...document.querySelectorAll('.dashboard-content section:not([hidden]) .item input[type="checkbox"]')]
          .map(input => input.closest(".item")?.dataset.key || "")
          .filter(Boolean);
        const start = visibleKeys.indexOf(lastSelectedKey);
        const end = visibleKeys.indexOf(key);
        if (start >= 0 && end >= 0) {
          for (const rangeKey of visibleKeys.slice(Math.min(start, end), Math.max(start, end) + 1)) {
            if (check.checked) selected.add(rangeKey); else selected.delete(rangeKey);
          }
        }
      } else if (check.checked) selected.add(key); else selected.delete(key);
      lastSelectedKey = key;
      updateSelectionBar();
    });
    card.append(check);
  }

  const body = node("div", "item-body");
  body.append(node("h3", "", item.subject || msg("noSubject", "(sans objet)")));
  body.append(node("div", "meta", [item.author, item.accountName, item.folderName, formatDate(item.date)].filter(Boolean).join(" · ")));
  if (item.note) body.append(node("div", "note", item.note));
  body.append(badgesFor(item));
  card.append(body);

  if (!compact) {
    const actions = node("div", "item-actions");
    actions.append(
      actionButton("open", msg("open", "Ouvrir")),
      actionButton("reply", msg("reply", "Répondre")),
      actionButton(item.completedAt ? "active" : "complete", item.completedAt ? msg("reopen", "Rouvrir") : msg("statusComplete", "Terminer")),
      actionButton(Number(item.snoozeUntil || 0) > Date.now() ? "wake" : "snooze", Number(item.snoozeUntil || 0) > Date.now() ? msg("wakeNow", "Réveiller maintenant") : msg("snoozeOneHour", "Reporter d’une heure")),
      actionButton("waiting", msg("statusWaiting", "Attente")),
      actionButton(item.noReplyTracking ? "cancelNoReply" : "trackNoReply", item.noReplyTracking ? msg("cancelNoReplyTracking", "Arrêter la relance") : msg("trackNoReply", "Relancer sans réponse")),
      actionButton("calendar", msg("calendar", "Agenda")),
      actionButton("unpin", msg("unpin", "Désépingler"))
    );
    card.append(actions);
  }
  return card;
}

function renderStats() {
  const stats = current?.stats || {};
  $("stats").replaceChildren(
    statCard(msg("allPins", "Toutes"), stats.total || 0),
    statCard(msg("statusActive", "À traiter"), stats.active || 0),
    statCard(msg("statusWaiting", "En attente"), stats.waiting || 0),
    statCard(msg("statusPlanned", "Planifiées"), stats.planned || 0),
    statCard(msg("overdue", "En retard"), stats.overdue || 0, stats.overdue ? "warning" : ""),
    statCard(msg("noReplyTracking", "Sans réponse"), stats.noReply || 0),
    statCard(msg("smartViewSnoozed", "En veille"), stats.snoozed || 0),
    statCard(msg("statusComplete", "Terminées"), stats.completed || 0)
  );
}

function renderSmartViews() {
  const host = $("smart-views");
  host.replaceChildren();
  const views = current?.smartViews?.length ? current.smartViews : [
    {id: "all", fallback: "Toutes"}, {id: "today", fallback: "Aujourd’hui"},
    {id: "overdue", fallback: "En retard"}, {id: "week", fallback: "Cette semaine"},
    {id: "waiting", fallback: "En attente"}, {id: "noReply", fallback: "Relances sans réponse"},
    {id: "snoozed", fallback: "En veille"}, {id: "noDue", fallback: "Sans échéance"}, {id: "unread", fallback: "Non lus"},
    {id: "missing", fallback: "Messages introuvables"}, {id: "calendarError", fallback: "Agenda à vérifier"},
    {id: "recentCompleted", fallback: "Récemment terminés"}
  ];
  for (const view of views) {
    const button = node("button", "smart-view");
    button.type = "button";
    button.dataset.smartView = view.id;
    button.setAttribute("aria-pressed", String((current.smartView || "all") === view.id));
    button.append(node("span", "", msg(view.labelKey || "", view.fallback || view.id)), node("span", "smart-view-count", current.smartCounts?.[view.id] || 0));
    host.append(button);
  }
}


function reviewBucketLabel(id) {
  const labels = {
    overdue: ["reviewOverdue", "En retard"], today: ["reviewToday", "À faire aujourd’hui"],
    noReply: ["reviewNoReply", "Sans réponse"], waking: ["reviewWaking", "Réveillés aujourd’hui"],
    waiting: ["reviewWaiting", "En attente"], stale: ["reviewStale", "Sans activité récente"],
    upcoming: ["reviewUpcoming", "À venir"]
  };
  const [key, fallback] = labels[id] || ["", id];
  return msg(key, fallback);
}

function appendBucket(host, id, items, {empty = false} = {}) {
  const section = node("section", "focus-section");
  const heading = node("header", "focus-section-header");
  heading.append(node("h2", "", reviewBucketLabel(id)), node("span", "focus-count", items.length));
  section.append(heading);
  const list = node("div", "focus-list");
  if (!items.length && empty) list.append(createEmpty(msg("reviewEmpty", "Aucun élément dans cette section.")));
  for (const item of items) list.append(createCard(item));
  section.append(list);
  host.append(section);
}

function renderReminderCenter() {
  const host = $("reminder-center");
  const reminders = current?.pendingReminders || [];
  host.replaceChildren();
  host.hidden = reminders.length === 0;
  if (!reminders.length) return;
  const header = node("header", "reminder-center-header");
  const copy = node("div", "");
  copy.append(node("h2", "", msg("pendingReminders", "Rappels à traiter")), node("p", "", msg("reminderCenterHelp", "Agissez directement sur les rappels récents ou reportez-les sans perdre le contexte.")));
  header.append(copy, node("span", "focus-count", reminders.length));
  host.append(header);
  const list = node("div", "reminder-list");
  for (const item of reminders) {
    const card = node("article", "reminder-item");
    card.dataset.key = item.stableKey;
    const body = node("div", "");
    body.append(node("strong", "", item.subject || msg("noSubject", "(sans objet)")), node("span", "", [item.author, formatDate(item.reminderFiredAt)].filter(Boolean).join(" · ")));
    const actions = node("div", "reminder-actions");
    actions.append(
      actionButton("open", msg("open", "Ouvrir")),
      actionButton("complete", msg("statusComplete", "Terminer")),
      actionButton("snooze-hour", msg("snoozeOneHour", "Reporter d’une heure")),
      actionButton("snooze-tomorrow", msg("snoozeTomorrow", "Reporter à demain")),
      actionButton("dismissReminder", msg("dismissReminder", "Ignorer le rappel"))
    );
    card.append(body, actions);
    list.append(card);
  }
  host.append(list);
}

function renderToday() {
  const host = $("today");
  host.replaceChildren();
  const plan = current?.todayPlan || {buckets: {}, actionable: 0};
  const hero = node("header", "board-intro");
  const copy = node("div", "");
  copy.append(node("h2", "", msg("todayHeading", "Votre journée")), node("p", "", msg("todayIntro", "Les messages qui demandent une action aujourd’hui, regroupés par priorité de suivi.")));
  hero.append(copy, node("strong", "board-total", msg("reviewActionable", "$1 élément(s) demandent votre attention.").replace("$1", plan.actionable || 0)));
  host.append(hero);
  let visible = 0;
  for (const id of ["overdue", "today", "noReply", "waking"]) {
    const items = plan.buckets?.[id] || [];
    visible += items.length;
    if (items.length) appendBucket(host, id, items);
  }
  if (!visible) host.append(createEmpty(msg("reviewEmpty", "Aucun élément ne demande votre attention aujourd’hui.")));
}

function renderReview() {
  const host = $("review");
  host.replaceChildren();
  const review = current?.review || {mode: "daily", buckets: {}, actionable: 0, total: 0};
  const hero = node("header", "board-intro");
  const copy = node("div", "");
  copy.append(node("h2", "", msg("reviewHeading", "Revue de suivi")), node("p", "", msg("reviewIntro", "Passez en revue les retards, attentes, relances et conversations associées sans parcourir toute la boîte mail.")));
  const modes = node("div", "review-mode");
  for (const [mode, key, fallback] of [["daily", "reviewDaily", "Revue quotidienne"], ["weekly", "reviewWeekly", "Revue hebdomadaire"]]) {
    const button = node("button", "", msg(key, fallback));
    button.type = "button";
    button.dataset.reviewMode = mode;
    button.setAttribute("aria-pressed", String(review.mode === mode));
    modes.append(button);
  }
  hero.append(copy, modes);
  host.append(hero);
  const buckets = node("div", "review-buckets");
  for (const id of ["overdue", "today", "noReply", "waking", "waiting", "stale", "upcoming"]) appendBucket(buckets, id, review.buckets?.[id] || [], {empty: false});
  host.append(buckets);

  const related = node("section", "related-section");
  related.append(node("h2", "", msg("relatedItems", "Conversations associées")), node("p", "", msg("relatedItemsHelp", "MailPerch ne propose une fusion que lorsqu’un identifiant de conversation fiable est partagé.")));
  const groups = current?.relatedGroups || [];
  if (!groups.length) related.append(createEmpty(msg("noRelatedItems", "Aucun doublon de conversation fiable détecté.")));
  for (const group of groups) {
    const card = node("article", "related-card");
    card.dataset.relatedId = group.id;
    const body = node("div", "");
    body.append(node("strong", "", group.subject || msg("noSubject", "(sans objet)")), node("span", "", `${group.count} ${msg("messages", "messages")}`));
    const merge = actionButton("merge-related", msg("mergeRelated", "Fusionner en conversation"), "primary");
    card.append(body, merge);
    related.append(card);
  }
  host.append(related);
}

function renderList() {
  const host = $("items");
  host.replaceChildren();
  if (!current.items?.length) {
    host.append(createEmpty(msg("noPinsForFilters", "Aucune épingle ne correspond à cette vue.")));
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const item of current.items) fragment.append(createCard(item));
  host.append(fragment);
}

function clearKanbanDropState() {
  for (const list of document.querySelectorAll(".kanban-list[data-drop-active]")) delete list.dataset.dropActive;
}

function renderKanban() {
  const host = $("kanban");
  host.replaceChildren();
  const columns = [["active", "À traiter"], ["waiting", "En attente"], ["planned", "Planifié"], ["completed", "Terminé"]];
  for (const [status, label] of columns) {
    const items = (current.items || []).filter(item => (item.workflowStatus || "active") === status);
    const column = node("section", "kanban-column");
    column.append(node("h2", "", `${label} · ${items.length}`));
    const list = node("div", "kanban-list");
    list.dataset.status = status;
    list.addEventListener("dragover", event => { event.preventDefault(); clearKanbanDropState(); list.dataset.dropActive = "true"; });
    list.addEventListener("dragleave", () => delete list.dataset.dropActive);
    list.addEventListener("drop", async event => {
      event.preventDefault();
      clearKanbanDropState();
      const key = event.dataTransfer.getData("text/x-mailperch-key");
      if (!key) return;
      await perform([key], status === "completed" ? "complete" : status);
    });
    for (const item of items) {
      const card = createCard(item, {compact: true, selectable: false});
      card.draggable = true;
      card.addEventListener("dragstart", event => { event.dataTransfer.setData("text/x-mailperch-key", item.stableKey); event.dataTransfer.effectAllowed = "move"; });
      card.addEventListener("dblclick", () => perform([item.stableKey], "open", {}, {reload: false}));
      list.append(card);
    }
    column.append(list);
    host.append(column);
  }
}

function renderCases() {
  const host = $("cases");
  host.replaceChildren();
  if (!current.cases?.length) { host.append(createEmpty(msg("noCases", "Aucune affaire."))); return; }
  for (const caseItem of current.cases) {
    const refs = (current.items || []).filter(item => item.caseId === caseItem.id);
    const card = node("article", "case-card");
    card.style.setProperty("--case-color", caseItem.color || "var(--accent)");
    card.append(node("h2", "", caseItem.name || "Affaire"));
    card.append(node("p", "case-meta", `${refs.length} message(s) · ${caseItem.status || "active"}${caseItem.dueAt ? ` · ${formatDate(caseItem.dueAt)}` : ""}`));
    if (caseItem.note) card.append(node("p", "", caseItem.note));
    const actions = node("div", "item-actions");
    const selectCase = actionButton("select-case", msg("selectMessages", "Sélectionner les messages"));
    selectCase.dataset.caseId = caseItem.id;
    actions.append(selectCase);
    card.append(actions);
    host.append(card);
  }
}

function renderHistory() {
  const host = $("history");
  host.replaceChildren();
  if (!current.history?.length) { host.append(createEmpty(msg("noHistory", "Aucun élément dans l’historique."))); return; }
  for (const item of current.history) {
    const entry = node("article", "history-entry");
    entry.append(node("strong", "", item.subject || "(sans objet)"));
    entry.append(node("div", "history-meta", [item.author, item.accountName, item.action, formatDate(item.completedAt)].filter(Boolean).join(" · ")));
    host.append(entry);
  }
}

function renderHealth() {
  const host = $("health");
  host.replaceChildren();
  const report = current.health || {score: 0, status: "unknown", issues: [], counts: {}};
  const hero = node("section", "health-hero");
  const score = node("div", "health-score");
  score.style.setProperty("--score", String(report.score || 0));
  score.append(node("strong", "", `${report.score || 0}/100`));
  const copy = node("div", "");
  copy.append(node("h2", "", report.status === "healthy" ? "MailPerch est en bonne santé" : report.status === "attention" ? "Quelques points sont à surveiller" : "Une intervention est recommandée"));
  copy.append(node("p", "", `${report.issues?.length || 0} point(s) détecté(s) · ${current.diagnostics?.total || 0} événement(s) diagnostic récent(s).`));
  const actions = node("div", "item-actions");
  actions.classList.add("health-tools");
  actions.append(actionButton("health-refresh", msg("runHealthCheck", "Analyser")), actionButton("health-repair", msg("repairSafeIssues", "Réparer les anomalies sûres")), actionButton("provider-check", msg("checkProviders", "Tester les fournisseurs")), actionButton("diagnostic-export", msg("exportDiagnostic", "Exporter le diagnostic")), actionButton("diagnostic-clear", msg("clearDiagnostics", "Vider le journal")));
  hero.append(score, copy, actions);
  host.append(hero);

  const issues = node("section", "health-card");
  issues.append(node("h2", "", "Points à examiner"));
  const issueList = node("div", "health-issues");
  for (const issue of report.issues || []) {
    const card = node("article", `health-issue ${issue.severity || "info"}`);
    card.append(node("strong", "", issue.title || "Information"), node("span", "", issue.detail || ""));
    issueList.append(card);
  }
  if (!issueList.childElementCount) issueList.append(node("p", "", "Aucune anomalie détectée par les contrôles locaux."));
  issues.append(issueList);
  host.append(issues);

  const matrix = current.providerMatrix || {};
  const providers = node("section", "health-card");
  providers.append(node("h2", "", "Compatibilité des comptes et calendriers"));
  const rows = node("div", "provider-matrix");
  for (const row of matrix.accounts || []) {
    const line = node("div", "provider-row");
    line.append(node("strong", "", row.accountName || row.accountKey || "Compte"), node("span", "", row.provider || "inconnu"), node("span", "", (row.protocol || "inconnu").toUpperCase()), node("span", "", row.supportsFolders ? "Dossiers ✓" : "Dossiers limités"), node("span", "", row.offlineSupport ? "Hors ligne ✓" : "Hors ligne —"));
    rows.append(line);
  }
  if (!rows.childElementCount) rows.append(node("p", "", "La matrice n’a pas encore été exécutée."));
  providers.append(rows);
  host.append(providers);
}

function renderActivity() {
  const renderEntries = (host, entries, formatter) => {
    host.replaceChildren();
    if (!entries?.length) { host.append(node("p", "", "Aucune activité.")); return; }
    for (const entry of entries) host.append(node("div", "activity-entry", formatter(entry)));
  };
  renderEntries($("activity"), current.activity, item => `${formatDate(item.time)} · ${item.action || item.type || "action"} · ${item.subject || item.details || ""}`);
  renderEntries($("rule-log"), current.ruleLog, item => `${formatDate(item.time)} · ${item.ruleName || "Règle"} · ${item.result || ""} · ${item.subject || ""}`);
  $("technical").textContent = JSON.stringify({revision: current.revision, compatibility: current.compatibility, performance: current.performance, diagnostics: current.diagnostics, providerMatrix: current.providerMatrix}, null, 2);
}

function populateBulkControls() {
  const fill = (id, first, values) => {
    const select = $(id);
    const previous = select.value;
    select.replaceChildren(option("", first), ...values.map(([value, label]) => option(value, label)));
    select.value = [...select.options].some(item => item.value === previous) ? previous : "";
  };
  fill("bulk-group", "Sans groupe", (current.groups || []).map(item => [item.id, item.name]));
  fill("bulk-case", "Sans affaire", (current.cases || []).map(item => [item.id, item.name]));
  fill("bulk-template", "Choisir un modèle…", (current.templates || []).map(item => [item.id, item.name]));
}

const VIEW_SECTION_IDS = Object.freeze({
  today: "today",
  list: "items",
  kanban: "kanban",
  cases: "cases",
  review: "review",
  history: "history",
  health: "health"
});

function setView(view) {
  const next = Object.prototype.hasOwnProperty.call(VIEW_SECTION_IDS, view) ? view : "today";
  for (const button of document.querySelectorAll("[data-view]")) {
    button.setAttribute("aria-pressed", String(button.dataset.view === next));
  }
  for (const [name, sectionId] of Object.entries(VIEW_SECTION_IDS)) {
    const section = $(sectionId);
    if (!section) throw new Error(`Section du tableau de bord introuvable : ${sectionId}`);
    section.hidden = name !== next;
  }
}

function render() {
  renderStats();
  renderReminderCenter();
  renderSmartViews();
  populateBulkControls();
  renderToday();
  renderList();
  renderKanban();
  renderCases();
  renderReview();
  renderHistory();
  renderHealth();
  renderActivity();
  setView(current.view || "today");
  updateSelectionBar();
}

async function load({silent = false} = {}) {
  const generation = ++loadGeneration;
  if (!silent) setLoading(true);
  try {
    if (!configuration) configuration = await api.pinInbox.getConfiguration();
    const options = {
      search: $("search").value.trim(),
      smartView: current?.smartView || configuration.settings?.defaultSmartView || "today",
      view: current?.view || "today",
      reviewMode: current?.reviewMode || "daily",
      useSmartView: true
    };
    const [data, calendarList] = await Promise.all([
      api.pinInbox.getDashboardData(options),
      api.pinInbox.getCalendars().catch(() => [])
    ]);
    if (generation !== loadGeneration) return false;
    current = data;
    calendars = calendarList;
    $("search").value = data.search || options.search;
    selected.forEach(key => { if (!(data.items || []).some(item => item.stableKey === key)) selected.delete(key); });
    render();
    $("fatal-error").hidden = true;
    if (!silent) clearStatus();
    return true;
  } catch (error) {
    if (generation === loadGeneration) setFatal(error);
  } finally {
    if (generation === loadGeneration) setLoading(false);
  }
}

function destructive(action) { return ["delete", "archive", "unpin"].includes(action); }

function actionOptions(action) {
  if (action === "priority") return {priorityLevel: $("bulk-priority").value};
  if (action === "deadline") return {dueAt: $("bulk-deadline").value ? new Date($("bulk-deadline").value).getTime() : 0};
  if (action === "group") return {groupId: $("bulk-group").value};
  if (action === "case") return {caseId: $("bulk-case").value};
  if (action === "template") return {templateId: $("bulk-template").value};
  if (action === "trackNoReply") return {days: configuration?.settings?.noReplyDefaultDays || 5};
  if (action === "snooze") {
    const value = $("bulk-snooze").value;
    if (value === "tomorrow") {
      const target = new Date();
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
      return {until: target.getTime()};
    }
    return {durationMs: Number(value) || 60 * 60_000};
  }
  return {};
}

async function perform(keys, action, options = {}, {reload = true, control = null} = {}) {
  const safeKeys = [...new Set((keys || []).map(String).filter(Boolean))];
  if (!safeKeys.length || !action) return null;
  if (destructive(action) && configuration?.settings?.confirmBulkDestructiveActions !== false) {
    const label = action === "delete" ? "supprimer" : action === "archive" ? "archiver" : "désépingler";
    if (!confirm(`${label[0].toUpperCase()}${label.slice(1)} ${safeKeys.length} message(s) ?`)) return null;
  }
  setButtonBusy(control, true);
  setStatus("Action en cours…", "busy", {persistent: true});
  try {
    const result = await api.pinInbox.performReferenceAction(safeKeys, action, options);
    if (action !== "open" && action !== "reply") safeKeys.forEach(key => selected.delete(key));
    if (reload) await load({silent: true});
    setStatus(ACTION_MESSAGES[action] || `${result?.count || safeKeys.length} élément(s) mis à jour.`, "success");
    return result;
  } catch (error) {
    setStatus(`Action impossible : ${error.message || error}`, "error", {persistent: true});
    return null;
  } finally {
    setButtonBusy(control, false);
  }
}

function updateBulkVisibility() {
  const action = $("bulk-action").value;
  for (const [id, visible] of [
    ["bulk-priority-wrap", action === "priority"], ["bulk-deadline-wrap", action === "deadline"],
    ["bulk-snooze-wrap", action === "snooze"], ["bulk-group-wrap", action === "group"],
    ["bulk-case-wrap", action === "case"], ["bulk-template-wrap", action === "template"]
  ]) $(id).hidden = !visible;
}

function openCalendarDialog(keys) {
  pendingCalendarKeys = [...keys];
  const type = $("calendar-item-type").value || configuration?.settings?.calendarItemType || "task";
  const target = $("calendar-target");
  target.replaceChildren();
  for (const calendar of calendars) {
    const compatible = type === "event" ? calendar.eventCompatible : calendar.taskCompatible;
    const item = option(calendar.id, `${calendar.name}${calendar.reason ? ` · ${calendar.reason}` : ""}`);
    item.disabled = !compatible;
    target.append(item);
  }
  const preferred = configuration?.settings?.preferredCalendarId || "";
  target.value = [...target.options].some(item => item.value === preferred && !item.disabled) ? preferred : ([...target.options].find(item => !item.disabled)?.value || "");
  $("calendar-confirm").disabled = !target.value;
  $("calendar-dialog").showModal();
}

async function refreshHealth(control = null) {
  setButtonBusy(control, true);
  setStatus("Analyse de la santé MailPerch…", "busy", {persistent: true});
  try {
    current.health = await api.pinInbox.getHealthReport();
    renderHealth();
    setStatus(`Analyse terminée : score ${current.health.score}/100.`, "success");
  } catch (error) { setStatus(`Analyse impossible : ${error.message || error}`, "error", {persistent: true}); }
  finally { setButtonBusy(control, false); }
}


function snoozeUntilTomorrow() {
  const target = new Date();
  target.setDate(target.getDate() + 1);
  target.setHours(9, 0, 0, 0);
  return target.getTime();
}

async function handleActionClick(event) {
  const control = eventElement(event)?.closest("[data-action]");
  if (!control) return;
  const card = control.closest(".item, .reminder-item, .related-card");
  const action = control.dataset.action;
  if (action === "merge-related") {
    const group = (current?.relatedGroups || []).find(item => item.id === card?.dataset.relatedId);
    if (!group) return;
    const prompt = msg("mergeRelatedConfirm", "Fusionner ces $1 épingles en une seule conversation ?").replace("$1", group.count);
    if (!confirm(prompt)) return;
    setButtonBusy(control, true);
    setStatus("Fusion de la conversation…", "busy", {persistent: true});
    try {
      await api.pinInbox.mergeRelatedReferences(group.stableKeys);
      await load({silent: true});
      setStatus(msg("mergeRelated", "Conversation fusionnée."), "success");
    } catch (error) { setStatus(`Fusion impossible : ${error.message || error}`, "error", {persistent: true}); }
    finally { setButtonBusy(control, false); }
    return;
  }
  const key = card?.dataset.key;
  if (!key) return;
  if (action === "calendar") { openCalendarDialog([key]); return; }
  if (action === "snooze-hour") return perform([key], "snooze", {durationMs: 60 * 60_000}, {control});
  if (action === "snooze-tomorrow") return perform([key], "snooze", {until: snoozeUntilTomorrow()}, {control});
  if (action === "snooze") return perform([key], "snooze", {durationMs: 60 * 60_000}, {control});
  return perform([key], action, actionOptions(action), {reload: !["open", "reply"].includes(action), control});
}

function bindEvents() {
  $("status-close").addEventListener("click", clearStatus);
  $("retry").addEventListener("click", () => load());
  $("refresh").addEventListener("click", () => load());
  $("settings").addEventListener("click", () => api.runtime.openOptionsPage());
  $("search").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => load({silent: true}), 220);
  });
  $("clear-filters").addEventListener("click", () => {
    $("search").value = "";
    if (current) current.smartView = "all";
    load({silent: true});
  });
  $("smart-views").addEventListener("click", event => {
    const button = eventElement(event)?.closest("[data-smart-view]");
    if (!button || !current) return;
    current.smartView = button.dataset.smartView;
    load({silent: true});
  });
  $("select-visible").addEventListener("click", () => { for (const item of current?.items || []) selected.add(item.stableKey); updateSelectionBar(); });
  $("clear-selection").addEventListener("click", () => { selected.clear(); updateSelectionBar(); });
  $("bulk-action").addEventListener("change", updateBulkVisibility);
  $("apply").addEventListener("click", event => {
    const action = $("bulk-action").value;
    if (!action) { setStatus("Choisissez une action groupée.", "error"); return; }
    perform([...selected], action, actionOptions(action), {control: event.currentTarget});
  });
  for (const button of document.querySelectorAll("[data-view]")) {
    button.addEventListener("click", () => {
      if (!current) return;
      current.view = button.dataset.view;
      if (current.view === "health") current.smartView = "all";
      load({silent: true});
    });
  }

  for (const id of ["items", "today", "review", "reminder-center"]) $(id).addEventListener("click", handleActionClick);
  $("review").addEventListener("click", event => {
    const button = eventElement(event)?.closest("[data-review-mode]");
    if (!button || !current) return;
    current.reviewMode = button.dataset.reviewMode;
    load({silent: true});
  });

  $("cases").addEventListener("click", event => {
    const control = eventElement(event)?.closest('[data-action="select-case"]');
    if (!control) return;
    selected.clear();
    for (const item of current.items || []) if (item.caseId === control.dataset.caseId) selected.add(item.stableKey);
    current.view = "list";
    setView("list");
    updateSelectionBar();
  });

  $("health").addEventListener("click", async event => {
    const control = eventElement(event)?.closest("[data-action]");
    const action = control?.dataset.action;
    if (!action) return;
    if (action === "health-refresh") return refreshHealth(control);
    if (action === "health-repair") {
      if (!confirm("Exécuter les réparations non destructives ?")) return;
      setButtonBusy(control, true);
      setStatus("Réparation en cours…", "busy", {persistent: true});
      try {
        const result = await api.pinInbox.repairHealthIssues({actions: ["orphan-links", "repair-references"]});
        current.health = result.health;
        await load({silent: true});
        setStatus(`${result.repaired || 0} élément(s) réparé(s).`, "success");
      } catch (error) { setStatus(`Réparation impossible : ${error.message || error}`, "error", {persistent: true}); }
      finally { setButtonBusy(control, false); }
    }
    if (action === "diagnostic-export") {
      setButtonBusy(control, true);
      setStatus(msg("diagnosticExportBusy", "Préparation du diagnostic…"), "busy", {persistent: true});
      try {
        const bundle = await api.pinInbox.exportDiagnosticBundle();
        const date = new Date().toISOString().slice(0, 10);
        downloadJson(`mailperch-diagnostic-${date}.json`, bundle);
        setStatus(msg("diagnosticExported", "Diagnostic local exporté."), "success");
      } catch (error) { setStatus(`${msg("diagnosticExportFailed", "Export impossible")} : ${error.message || error}`, "error", {persistent: true}); }
      finally { setButtonBusy(control, false); }
      return;
    }
    if (action === "diagnostic-clear") {
      if (!confirm(msg("diagnosticClearConfirm", "Vider le journal diagnostic local ?"))) return;
      setButtonBusy(control, true);
      try {
        await api.pinInbox.clearDiagnostics();
        await load({silent: true});
        setStatus(msg("diagnosticCleared", "Journal diagnostic vidé."), "success");
      } catch (error) { setStatus(`${msg("diagnosticClearFailed", "Nettoyage impossible")} : ${error.message || error}`, "error", {persistent: true}); }
      finally { setButtonBusy(control, false); }
      return;
    }
    if (action === "provider-check") {
      setButtonBusy(control, true);
      setStatus("Analyse des fournisseurs…", "busy", {persistent: true});
      try { current.providerMatrix = await api.pinInbox.runProviderCompatibilityCheck(); renderHealth(); setStatus("Matrice de compatibilité actualisée.", "success"); }
      catch (error) { setStatus(`Analyse impossible : ${error.message || error}`, "error", {persistent: true}); }
      finally { setButtonBusy(control, false); }
    }
  });

  $("calendar-item-type").addEventListener("change", () => openCalendarDialog(pendingCalendarKeys));
  $("calendar-target").addEventListener("change", () => { $("calendar-confirm").disabled = !$("calendar-target").value; });
  $("calendar-dialog").addEventListener("close", async () => {
    if ($("calendar-dialog").returnValue !== "default" || !pendingCalendarKeys.length) { pendingCalendarKeys = []; return; }
    const key = pendingCalendarKeys[0];
    const type = $("calendar-item-type").value;
    const calendarId = $("calendar-target").value;
    pendingCalendarKeys = [];
    await perform([key], "calendar", {itemType: type, calendarId});
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  localize();
  $("app-version").textContent = `v${api.runtime.getManifest().version}`;
  bindEvents();
  await load();
});
