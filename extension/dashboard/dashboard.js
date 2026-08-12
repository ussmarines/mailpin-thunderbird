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
let pendingNoReplyKey = "";
let loading = false;
let lastSelectedKey = "";

const ACTION_MESSAGES = Object.freeze({
  open: ["dashboardActionOpen", "Message ouvert."], reply: ["dashboardActionReply", "Fenêtre de réponse ouverte."], active: ["dashboardActionActive", "Message remis à traiter."],
  waiting: ["dashboardActionWaiting", "Message placé en attente."], planned: ["dashboardActionPlanned", "Message planifié."], complete: ["dashboardActionComplete", "Message terminé."],
  uncomplete: ["dashboardActionUncomplete", "Message rouvert."], read: ["dashboardActionRead", "Message marqué comme lu."], unread: ["dashboardActionUnread", "Message marqué comme non lu."],
  archive: ["dashboardActionArchive", "Message archivé."], delete: ["dashboardActionDelete", "Message supprimé."], unpin: ["dashboardActionUnpin", "Message désépinglé."],
  trackNoReply: ["dashboardActionTrackNoReply", "Suivi sans réponse activé."], cancelNoReply: ["dashboardActionCancelNoReply", "Suivi sans réponse arrêté."],
  priority: ["dashboardActionPriority", "Priorité mise à jour."], deadline: ["dashboardActionDeadline", "Échéance mise à jour."], group: ["dashboardActionGroup", "Groupe mis à jour."],
  case: ["dashboardActionCase", "Affaire mise à jour."], template: ["dashboardActionTemplate", "Modèle appliqué."], calendar: ["dashboardActionCalendar", "Élément Agenda créé."],
  snooze: ["dashboardActionSnooze", "Message mis en veille."], wake: ["dashboardActionWake", "Message réveillé."], dismissReminder: ["dashboardActionDismissReminder", "Rappel ignoré."]
});

function msg(key, fallback, substitutions = undefined) {
  const values = substitutions === undefined
    ? undefined
    : (Array.isArray(substitutions) ? substitutions : [substitutions]);
  try {
    const localized = api.i18n.getMessage(key, values);
    if (localized) return localized;
  } catch {}
  if (values === undefined) return fallback;
  return values.reduce(
    (text, value, index) => String(text).split(`$${index + 1}`).join(String(value ?? "")),
    String(fallback || "")
  );
}

function safeErrorName(error) {
  return String(error?.name || "Error").replace(/[^a-z0-9_-]/gi, "").slice(0, 48) || "Error";
}

function failureMessage(key, fallback, error) {
  return `${msg(key, fallback)} (${safeErrorName(error)})`;
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
  for (const element of document.querySelectorAll("[data-i18n-aria-label]")) {
    const value = msg(element.getAttribute("data-i18n-aria-label"), "");
    if (value) element.setAttribute("aria-label", value);
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

function padLocalPart(value) {
  return String(value).padStart(2, "0");
}

function localDateValue(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${padLocalPart(date.getMonth() + 1)}-${padLocalPart(date.getDate())}`;
}

function localTimeValue(timestamp) {
  const date = new Date(timestamp);
  return `${padLocalPart(date.getHours())}:${padLocalPart(date.getMinutes())}`;
}

function localTimestamp(dateValue, timeValue) {
  if (!dateValue || !timeValue) return 0;
  const timestamp = new Date(`${dateValue}T${timeValue}`).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function setLocalDateTime(dateId, timeId, timestamp) {
  $(dateId).value = localDateValue(timestamp);
  $(timeId).value = localTimeValue(timestamp);
}

function formatDurationDays(value) {
  const ms = Math.max(0, Number(value) || 0);
  if (!ms) return "0";
  const days = ms / 86_400_000;
  return days < 1 ? "<1" : String(Math.round(days * 10) / 10);
}

function displayCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
}

function formatCount(value) {
  return new Intl.NumberFormat(document.documentElement.lang || undefined).format(displayCount(value));
}

function checklistElement(item) {
  const stats = item.checklistStats || {total: 0, completed: 0, pending: 0};
  if (!stats.total) return null;
  const host = node("div", "item-checklist");
  const title = node("div", "item-checklist-title", msg("checklistProgress", "Sous-tâches · $1/$2", [displayCount(stats.completed), displayCount(stats.total)]));
  host.append(title);
  const list = node("div", "item-checklist-list");
  const visible = (item.checklist || []).filter(entry => !entry.completed).slice(0, 4);
  for (const entry of visible) {
    const label = node("label", "item-checklist-row");
    const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = false;
    checkbox.addEventListener("click", event => event.stopPropagation());
    checkbox.addEventListener("change", async () => {
      const next = (item.checklist || []).map(candidate => candidate.id === entry.id ? {...candidate, completed: true, completedAt: Date.now()} : candidate);
      checkbox.disabled = true;
      try {
        await api.pinInbox.updateReferenceDetails(item.stableKey, {checklist: next});
        if (!await loadAfterMutation()) checkbox.disabled = false;
      }
      catch (error) { checkbox.disabled = false; setStatus(failureMessage("actionFailed", "Action impossible", error), "error", {persistent: true}); }
    });
    label.append(checkbox, node("span", "", entry.text)); list.append(label);
  }
  if (stats.pending > visible.length) list.append(node("span", "item-checklist-more", `+${stats.pending - visible.length}`));
  host.append(list);
  return host;
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
  $("fatal-message").textContent = failureMessage("dashboardLoadFailed", "Chargement impossible", error);
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
  badge(host, item.responseState === "waitingForThem" && item.workflowStatus !== "waiting", msg("waitingForThem", "J’attends"), "waiting");
  badge(host, item.responseState === "needsReply", msg("needsReply", "Je dois répondre"), "reply-needed");
  badge(host, item.workflowStatus === "waiting", msg("statusWaiting", "En attente"), "waiting");
  badge(host, item.workflowStatus === "planned", msg("statusPlanned", "Planifié"), "planned");
  badge(host, Number(item.snoozeUntil || 0) > Date.now(), msg("snoozedUntil", "En veille jusqu’au $1", [formatDate(item.snoozeUntil)]), "snoozed");
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
  badge(host, item.tagSyncError, msg("tagSyncTitle", "Tags Thunderbird"), "error");
  badge(host, item.missing, msg("missingMessage", "Message introuvable"), "error");
  return host;
}

function updateSelectionBar() {
  const count = selected.size;
  $("selection-bar").hidden = count === 0 || configuration?.settings?.enableBulkActions === false;
  $("selection-count").textContent = msg(count === 1 ? "selectedMessageOne" : "selectedMessageMany", count === 1 ? "1 message sélectionné" : "$1 messages sélectionnés", count === 1 ? undefined : [displayCount(count)]);
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
    check.setAttribute("aria-label", msg("selectMessage", "Sélectionner $1", [item.subject || msg("thisMessage", "ce message")]));
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
  const checklist = checklistElement(item); if (checklist) body.append(checklist);
  body.append(badgesFor(item));
  card.append(body);

  if (!compact) {
    const actions = node("div", "item-actions");
    const waitingAction = item.workflowStatus === "waiting" ? "active" : "waiting";
    const waitingButton = actionButton(waitingAction, item.workflowStatus === "waiting" ? msg("returnToActive", "Repasser à traiter") : msg("statusWaiting", "En attente"));
    waitingButton.setAttribute("aria-pressed", String(item.workflowStatus === "waiting"));
    actions.append(
      actionButton("open", msg("open", "Ouvrir")),
      actionButton("reply", msg("reply", "Répondre")),
      actionButton(item.completedAt ? "active" : "complete", item.completedAt ? msg("reopen", "Rouvrir") : msg("statusComplete", "Terminer")),
      actionButton(Number(item.snoozeUntil || 0) > Date.now() ? "wake" : "snooze", Number(item.snoozeUntil || 0) > Date.now() ? msg("wakeNow", "Réveiller maintenant") : msg("snoozeOneHour", "Reporter d’une heure")),
      waitingButton,
      actionButton("trackNoReply", item.noReplyTracking ? msg("changeNoReplyTracking", "Modifier la relance") : msg("trackNoReply", "Relancer sans réponse")),
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
    statCard(msg("allPins", "Toutes"), displayCount(stats.total)),
    statCard(msg("statusActive", "À traiter"), displayCount(stats.active)),
    statCard(msg("waitingForThem", "J’attends"), displayCount(stats.waitingForThem)),
    statCard(msg("needsReply", "Je dois répondre"), displayCount(stats.needsReply), displayCount(stats.needsReply) ? "warning" : ""),
    statCard(msg("overdue", "En retard"), displayCount(stats.overdue), displayCount(stats.overdue) ? "warning" : ""),
    statCard(msg("pendingSubtasks", "Sous-tâches en attente"), displayCount(stats.checklistPendingItems)),
    statCard(msg("completedLast7Days", "Terminés sur 7 jours"), displayCount(stats.completedLast7Days)),
    statCard(msg("averageOpenAge", "Âge moyen des suivis"), `${formatDurationDays(stats.averageOpenAgeMs)} ${msg("daysShort", "j")}`),
    statCard(msg("averageWaitingAge", "Attente moyenne"), `${formatDurationDays(stats.averageWaitingAgeMs)} ${msg("daysShort", "j")}`)
  );
}

function renderSmartViews() {
  const host = $("smart-views");
  host.replaceChildren();
  const views = current?.smartViews?.length ? current.smartViews : [
    {id: "all", labelKey: "smartViewAll", fallback: "Toutes"}, {id: "today", labelKey: "smartViewToday", fallback: "Aujourd’hui"},
    {id: "overdue", labelKey: "smartViewOverdue", fallback: "En retard"}, {id: "week", labelKey: "smartViewWeek", fallback: "Cette semaine"},
    {id: "waiting", labelKey: "smartViewWaiting", fallback: "En attente"}, {id: "waitingForThem", labelKey: "smartViewWaitingForThem", fallback: "J’attends"},
    {id: "needsReply", labelKey: "smartViewNeedsReply", fallback: "Je dois répondre"}, {id: "noReply", labelKey: "smartViewNoReply", fallback: "Relances sans réponse"},
    {id: "snoozed", labelKey: "smartViewSnoozed", fallback: "En veille"}, {id: "noDue", labelKey: "smartViewNoDue", fallback: "Sans échéance"}, {id: "unread", labelKey: "smartViewUnread", fallback: "Non lus"},
    {id: "missing", labelKey: "smartViewMissing", fallback: "Messages introuvables"}, {id: "calendarError", labelKey: "smartViewCalendarError", fallback: "Agenda à vérifier"},
    {id: "recentCompleted", labelKey: "smartViewRecentCompleted", fallback: "Récemment terminés"}, {id: "checklistPending", labelKey: "smartViewChecklistPending", fallback: "Sous-tâches en attente"}
  ];
  for (const view of views) {
    const button = node("button", "smart-view");
    button.type = "button";
    button.dataset.smartView = view.id;
    button.setAttribute("aria-pressed", String((current.smartView || "all") === view.id));
    button.append(node("span", "", msg(view.labelKey || "", view.fallback || view.id)), node("span", "smart-view-count", displayCount(current.smartCounts?.[view.id])));
    host.append(button);
  }
}


function renderSavedViews() {
  const host = $("saved-views");
  host.replaceChildren();
  const views = current?.savedViews || [];
  if (!views.length) { host.append(node("p", "saved-view-empty", msg("noSavedViews", "Aucune vue enregistrée."))); return; }
  for (const view of views) {
    const row = node("div", "saved-view-row");
    const button = node("button", "saved-view", view.name); button.type = "button"; button.dataset.savedView = view.id; button.setAttribute("aria-pressed", String(current.savedViewId === view.id));
    const remove = node("button", "saved-view-delete", "×"); remove.type = "button"; remove.dataset.deleteSavedView = view.id; remove.setAttribute("aria-label", msg("deleteSavedView", "Supprimer la vue")); remove.title = remove.getAttribute("aria-label");
    row.append(button, remove); host.append(row);
  }
}

function openSavedViewDialog() {
  const smart = $("saved-view-smart"); smart.replaceChildren();
  for (const view of current?.smartViews || []) smart.append(option(view.id, msg(view.labelKey || "", view.fallback || view.id)));
  smart.value = current?.smartView || "all";
  const group = $("saved-view-group");
  group.replaceChildren(option("", "—"), ...(current?.groups || []).map(item => option(item.id, item.name)));
  const caseSelect = $("saved-view-case");
  caseSelect.replaceChildren(option("", "—"), ...(current?.cases || []).map(item => option(item.id, item.name)));
  $("saved-view-name").value = "";
  $("saved-view-priority").value = "";
  $("saved-view-response").value = "";
  $("saved-view-checklist").value = "";
  $("saved-view-dialog").showModal(); $("saved-view-name").focus();
}

function commandDefinitions() {
  return [
    {label: msg("viewToday", "Aujourd’hui"), run: () => { current.view="today"; current.savedViewId=""; return load({silent:true}); }},
    {label: msg("viewList", "Liste"), run: () => { current.view="list"; current.savedViewId=""; return load({silent:true}); }},
    {label: msg("viewKanban", "Kanban"), run: () => { current.view="kanban"; current.savedViewId=""; return load({silent:true}); }},
    {label: msg("viewReview", "Revue"), run: () => { current.view="review"; current.savedViewId=""; return load({silent:true}); }},
    {label: msg("searchPins", "Rechercher"), run: () => $("search").focus()},
    {label: msg("saveCurrentView", "Enregistrer la vue"), run: openSavedViewDialog},
    configuration?.settings?.enableThunderbirdTagSync ? {label: msg("syncTags", "Synchroniser les tags"), run: async () => { const result=await api.pinInbox.syncTags([]); setStatus(msg("tagSyncComplete", "Tags synchronisés : $1 message(s), $2 erreur(s).", [displayCount(result.synced), displayCount(result.errors)]), result.errors ? "error" : "success"); }} : null,
    {label: msg("settings", "Paramètres"), run: () => api.runtime.openOptionsPage()}
  ].filter(Boolean);
}

async function runCommand(command) {
  if (!command) return;
  $("command-palette").close();
  try { await command.run(); }
  catch (error) { setStatus(failureMessage("actionFailed", "Action impossible", error), "error", {persistent: true}); }
}

function renderCommands(query = "") {
  const host = $("command-list"); host.replaceChildren();
  const normalized = String(query || "").trim().toLocaleLowerCase();
  for (const command of commandDefinitions().filter(item => !normalized || item.label.toLocaleLowerCase().includes(normalized))) {
    const button = node("button", "command-item", command.label);
    button.type = "button";
    button.addEventListener("click", () => runCommand(command));
    host.append(button);
  }
}

function openCommandPalette() {
  const dialog = $("command-palette");
  $("command-search").value = "";
  renderCommands();
  if (!dialog.open) dialog.showModal();
  $("command-search").focus();
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
  hero.append(copy, node("strong", "board-total", msg("reviewActionable", "$1 élément(s) demandent votre attention.", [displayCount(plan.actionable)])));
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
  related.append(node("h2", "", msg("relatedItems", "Conversations associées")), node("p", "", msg("relatedItemsHelp", "MailPin ne propose une fusion que lorsqu’un identifiant de conversation fiable est partagé.")));
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
  const columns = [["active", msg("statusActive", "À traiter")], ["waiting", msg("statusWaiting", "En attente")], ["planned", msg("statusPlanned", "Planifié")], ["completed", msg("statusComplete", "Terminé")]];
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
  const search = String(current?.search || "").trim().toLocaleLowerCase();
  const cases = (current.cases || []).filter(caseItem => !search || [caseItem.name, caseItem.note, caseItem.status].filter(Boolean).join(" ").toLocaleLowerCase().includes(search));
  if (!cases.length) { host.append(createEmpty(search ? msg("noPinsForFilters", "Aucun élément ne correspond à cette recherche.") : msg("noCases", "Aucune affaire."))); return; }
  for (const caseItem of cases) {
    const refs = (current.items || []).filter(item => item.caseId === caseItem.id);
    const card = node("article", "case-card");
    card.style.setProperty("--case-color", caseItem.color || "var(--accent)");
    card.append(node("h2", "", caseItem.name || msg("case", "Affaire")));
    card.append(node("p", "case-meta", `${msg("messageCount", "$1 message(s)", [displayCount(refs.length)])} · ${caseItem.status || "active"}${caseItem.dueAt ? ` · ${formatDate(caseItem.dueAt)}` : ""}`));
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
    entry.append(node("strong", "", item.subject || msg("noSubject", "(sans objet)")));
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
  copy.append(node("h2", "", report.status === "healthy" ? msg("healthHealthy", "MailPin est en bonne santé") : report.status === "attention" ? msg("healthAttention", "Quelques points sont à surveiller") : msg("healthCritical", "Une intervention est recommandée")));
  copy.append(node("p", "", msg("healthSummary", "$1 point(s) détecté(s) · $2 événement(s) diagnostic récent(s).", [displayCount(report.issues?.length), displayCount(current.diagnostics?.total)])));
  const pinCount = displayCount(current.stats?.total);
  copy.append(node("p", "volume-guidance", pinCount >= 2000
    ? msg("pinsBeyondRecommendedVolume", "$1 pins — beyond the currently validated volume.", [formatCount(pinCount)])
    : msg("pinsWithinRecommendedVolume", "$1 / 2,000 recommended pins", [formatCount(pinCount)])));
  const actions = node("div", "item-actions");
  actions.classList.add("health-tools");
  actions.append(actionButton("health-refresh", msg("runHealthCheck", "Analyser")), actionButton("health-repair", msg("repairSafeIssues", "Réparer les anomalies sûres")), actionButton("provider-check", msg("checkProviders", "Tester les fournisseurs")), actionButton("diagnostic-export", msg("exportDiagnostic", "Exporter le diagnostic")), actionButton("diagnostic-clear", msg("clearDiagnostics", "Vider le journal")));
  hero.append(score, copy, actions);
  host.append(hero);

  const issues = node("section", "health-card");
  issues.append(node("h2", "", msg("healthIssuesHeading", "Points à examiner")));
  const issueList = node("div", "health-issues");
  for (const issue of report.issues || []) {
    const card = node("article", `health-issue ${issue.severity || "info"}`);
    card.append(node("strong", "", issue.title || msg("information", "Information")), node("span", "", issue.detail || ""));
    issueList.append(card);
  }
  if (!issueList.childElementCount) issueList.append(node("p", "", msg("healthNoIssues", "Aucune anomalie détectée par les contrôles locaux.")));
  issues.append(issueList);
  host.append(issues);

  const matrix = current.providerMatrix || {};
  const providers = node("section", "health-card");
  providers.append(node("h2", "", msg("providerCompatibilityHeading", "Compatibilité des comptes et calendriers")));
  const rows = node("div", "provider-matrix");
  for (const row of matrix.accounts || []) {
    const line = node("div", "provider-row");
    line.append(node("strong", "", row.accountName || row.accountKey || msg("account", "Compte")), node("span", "", row.provider || msg("unknown", "inconnu")), node("span", "", (row.protocol || msg("unknown", "inconnu")).toUpperCase()), node("span", "", row.supportsFolders ? msg("foldersSupported", "Dossiers ✓") : msg("foldersLimited", "Dossiers limités")), node("span", "", row.offlineSupport ? msg("offlineSupported", "Hors ligne ✓") : msg("offlineUnavailable", "Hors ligne —")));
    rows.append(line);
  }
  if (!rows.childElementCount) rows.append(node("p", "", msg("providerMatrixNotRun", "La matrice n’a pas encore été exécutée.")));
  providers.append(rows);
  host.append(providers);
}

function renderActivity() {
  const renderEntries = (host, entries, formatter) => {
    host.replaceChildren();
    if (!entries?.length) { host.append(node("p", "", msg("noActivity", "Aucune activité."))); return; }
    for (const entry of entries) host.append(node("div", "activity-entry", formatter(entry)));
  };
  renderEntries($("activity"), current.activity, item => `${formatDate(item.time)} · ${item.action || item.type || "action"} · ${item.subject || item.details || ""}`);
  renderEntries($("rule-log"), current.ruleLog, item => `${formatDate(item.time)} · ${item.ruleName || msg("rule", "Règle")} · ${item.result || ""} · ${item.subject || ""}`);
}

function populateBulkControls() {
  const fill = (id, first, values) => {
    const select = $(id);
    const previous = select.value;
    select.replaceChildren(option("", first), ...values.map(([value, label]) => option(value, label)));
    select.value = [...select.options].some(item => item.value === previous) ? previous : "";
  };
  fill("bulk-group", msg("withoutGroup", "Sans groupe"), (current.groups || []).map(item => [item.id, item.name]));
  fill("bulk-case", msg("withoutCase", "Sans affaire"), (current.cases || []).map(item => [item.id, item.name]));
  fill("bulk-template", msg("chooseTemplate", "Choisir un modèle…"), (current.templates || []).map(item => [item.id, item.name]));
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
  renderSavedViews();
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
      search: current ? $("search").value.trim() : undefined,
      smartView: current?.smartView || configuration.settings?.defaultSmartView || "today",
      view: current?.view || "today",
      reviewMode: current?.reviewMode || "daily",
      savedViewId: current ? (current.savedViewId || "") : undefined,
      useSmartView: true
    };
    const [data, calendarList] = await Promise.all([
      api.pinInbox.getDashboardData(options),
      api.pinInbox.getCalendars().catch(() => [])
    ]);
    if (generation !== loadGeneration) return false;
    current = data;
    calendars = calendarList;
    $("search").value = data.search || options.search || "";
    selected.forEach(key => { if (!(data.items || []).some(item => item.stableKey === key)) selected.delete(key); });
    render();
    $("fatal-error").hidden = true;
    if (!silent) clearStatus();
    return true;
  } catch (error) {
    if (generation === loadGeneration) setFatal(error);
    return false;
  } finally {
    if (generation === loadGeneration) setLoading(false);
  }
}

async function loadAfterMutation() {
  const refreshed = await load({silent: true});
  if (refreshed) return true;
  setStatus(msg("actionSavedRefreshFailed", "The action was saved, but the dashboard could not refresh. Try again."), "error", {persistent: true});
  return false;
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
    const promptKey = action === "delete" ? "confirmBulkDelete" : action === "archive" ? "confirmBulkArchive" : "confirmBulkUnpin";
    const fallbackPrompt = action === "delete" ? "Supprimer ces $1 message(s) ?" : action === "archive" ? "Archiver ces $1 message(s) ?" : "Désépingler ces $1 message(s) ?";
    if (!confirm(msg(promptKey, fallbackPrompt, [displayCount(safeKeys.length)]))) return null;
  }
  setButtonBusy(control, true);
  setStatus(msg("actionInProgress", "Action en cours…"), "busy", {persistent: true});
  try {
    const result = await api.pinInbox.performReferenceAction(safeKeys, action, options);
    if (reload && !await loadAfterMutation()) return result;
    if (action !== "open" && action !== "reply") {
      safeKeys.forEach(key => selected.delete(key));
      updateSelectionBar();
    }
    const actionMessage = ACTION_MESSAGES[action];
    setStatus(actionMessage ? msg(...actionMessage) : msg("itemsUpdated", "$1 élément(s) mis à jour.", [displayCount(result?.count || safeKeys.length)]), "success");
    return result;
  } catch (error) {
    setStatus(failureMessage("actionFailed", "Action impossible", error), "error", {persistent: true});
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

function selectedCalendarItem() {
  return (current?.items || []).find(item => item.stableKey === pendingCalendarKeys[0]) || null;
}

function populateCalendarTargets() {
  const type = $("calendar-item-type").value || "event";
  const target = $("calendar-target");
  const field = $("calendar-target-field");
  const availability = $("calendar-availability");
  target.replaceChildren();
  const compatible = calendars.filter(calendar => type === "event" ? calendar.eventCompatible : calendar.taskCompatible);
  for (const calendar of compatible) {
    target.append(option(calendar.id, `${calendar.name}${calendar.reason ? ` · ${calendar.reason}` : ""}`));
  }
  target.value = compatible.some(calendar => calendar.id === calendarIdFor(type)) ? calendarIdFor(type) : (compatible[0]?.id || "");
  const noCompatibleCalendar = !compatible.length;
  field.hidden = noCompatibleCalendar;
  availability.textContent = noCompatibleCalendar
    ? msg(type === "event" ? "calendarNoCompatibleEvent" : "calendarNoCompatibleTask", type === "event" ? "No compatible event calendar is available." : "Aucun agenda compatible avec les tâches n’est disponible.")
    : "";
  availability.hidden = !noCompatibleCalendar;
  target.disabled = noCompatibleCalendar;
}

function updateCalendarScheduleVisibility() {
  const event = $("calendar-item-type").value === "event";
  $("calendar-event-schedule").hidden = !event;
  $("calendar-task-schedule").hidden = event;
}

function calendarScheduleOptions() {
  if ($("calendar-item-type").value === "event") {
    return {
      startAt: localTimestamp($("calendar-event-start-date").value, $("calendar-event-start-time").value),
      endAt: localTimestamp($("calendar-event-end-date").value, $("calendar-event-end-time").value)
    };
  }
  return {dueAt: localTimestamp($("calendar-task-due-date").value, $("calendar-task-due-time").value)};
}

function validateCalendarSchedule() {
  const error = $("calendar-error");
  let message = "";
  const schedule = calendarScheduleOptions();
  if (!$("calendar-target").value) message = $("calendar-availability").textContent || msg("calendarRequired", "Choisissez un calendrier inscriptible.");
  else if ($("calendar-item-type").value === "event" && (!schedule.startAt || !schedule.endAt)) message = msg("eventDatesRequired", "Renseignez les dates et heures de début et de fin.");
  else if ($("calendar-item-type").value === "event" && schedule.endAt <= schedule.startAt) message = msg("eventEndAfterStart", "La fin doit être postérieure au début.");
  else if ($("calendar-item-type").value === "task" && !schedule.dueAt) message = msg("taskDueRequired", "Renseignez la date et l’heure d’échéance.");
  error.textContent = message;
  error.hidden = !message;
  $("calendar-confirm").disabled = Boolean(message);
  return !message;
}

function openCalendarDialog(keys) {
  pendingCalendarKeys = [...keys];
  const now = Date.now();
  const item = selectedCalendarItem();
  const relevant = normalizeTimestamp(item?.dueAt || item?.followUpAt || 0);
  const nextHour = new Date(now); nextHour.setMinutes(0, 0, 0); nextHour.setHours(nextHour.getHours() + 1);
  const eventStart = relevant > now ? relevant : nextHour.getTime();
  const taskDefault = new Date(now); taskDefault.setDate(taskDefault.getDate() + 1); taskDefault.setHours(9, 0, 0, 0);
  const taskDue = relevant > now ? relevant : taskDefault.getTime();
  $("calendar-item-type").value = item?.calendarItemId ? (item.calendarItemType === "task" ? "task" : "event") : "event";
  setLocalDateTime("calendar-event-start-date", "calendar-event-start-time", eventStart);
  setLocalDateTime("calendar-event-end-date", "calendar-event-end-time", eventStart + 60 * 60_000);
  setLocalDateTime("calendar-task-due-date", "calendar-task-due-time", taskDue);
  updateCalendarScheduleVisibility();
  populateCalendarTargets();
  validateCalendarSchedule();
  $("calendar-dialog").showModal();
}

function noReplyDueAt() {
  const preset = $("no-reply-preset").value;
  const now = Date.now();
  if (preset === "custom") return localTimestamp($("no-reply-date").value, $("no-reply-time").value);
  if (preset === "tomorrow") {
    const target = new Date(now); target.setDate(target.getDate() + 1); target.setHours(9, 0, 0, 0); return target.getTime();
  }
  const days = preset === "default" ? Number(configuration?.settings?.noReplyDefaultDays || 5) : Number(preset);
  return now + Math.max(1, days || 5) * 86_400_000;
}

function updateNoReplyPreview() {
  const custom = $("no-reply-preset").value === "custom";
  $("no-reply-custom").hidden = !custom;
  const dueAt = noReplyDueAt();
  const valid = dueAt > Date.now();
  $("no-reply-preview").textContent = dueAt ? formatDate(dueAt) : msg("invalidDate", "Date invalide");
  $("no-reply-error").textContent = valid ? "" : msg("noReplyDateFuture", "Choisissez une date et une heure futures.");
  $("no-reply-error").hidden = valid;
  $("no-reply-confirm").disabled = !valid;
}

function openNoReplyDialog(key) {
  pendingNoReplyKey = String(key || "");
  const item = (current?.items || []).find(candidate => candidate.stableKey === pendingNoReplyKey);
  $("no-reply-preset").value = item?.noReplyTracking ? "custom" : "default";
  const customAt = normalizeTimestamp(item?.noReplyAt || 0) || noReplyDueAt();
  setLocalDateTime("no-reply-date", "no-reply-time", customAt);
  $("no-reply-stop").hidden = !item?.noReplyTracking;
  updateNoReplyPreview();
  $("no-reply-dialog").showModal();
}

async function refreshHealth(control = null) {
  setButtonBusy(control, true);
  setStatus(msg("healthCheckBusy", "Analyse de la santé MailPin…"), "busy", {persistent: true});
  try {
    current.health = await api.pinInbox.getHealthReport();
    renderHealth();
    setStatus(msg("healthCheckComplete", "Analyse terminée : score $1/100.", [displayCount(current.health.score)]), "success");
  } catch (error) { setStatus(failureMessage("healthCheckFailed", "Analyse impossible", error), "error", {persistent: true}); }
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
    const prompt = msg("mergeRelatedConfirm", "Fusionner ces $1 épingles en une seule conversation ?", [displayCount(group.count)]);
    if (!confirm(prompt)) return;
    setButtonBusy(control, true);
    setStatus(msg("mergeRelatedBusy", "Fusion de la conversation…"), "busy", {persistent: true});
    try {
      await api.pinInbox.mergeRelatedReferences(group.stableKeys);
      if (!await loadAfterMutation()) return;
      setStatus(msg("mergeRelated", "Conversation fusionnée."), "success");
    } catch (error) { setStatus(failureMessage("mergeRelatedFailed", "Fusion impossible", error), "error", {persistent: true}); }
    finally { setButtonBusy(control, false); }
    return;
  }
  const key = card?.dataset.key;
  if (!key) return;
  if (action === "calendar") { openCalendarDialog([key]); return; }
  if (action === "trackNoReply" || action === "cancelNoReply") { openNoReplyDialog(key); return; }
  if (action === "snooze-hour") return perform([key], "snooze", {durationMs: 60 * 60_000}, {control});
  if (action === "snooze-tomorrow") return perform([key], "snooze", {until: snoozeUntilTomorrow()}, {control});
  if (action === "snooze") return perform([key], "snooze", {durationMs: 60 * 60_000}, {control});
  return perform([key], action, actionOptions(action), {reload: !["open", "reply"].includes(action), control});
}

function bindEvents() {
  $("status-close").addEventListener("click", clearStatus);
  $("retry").addEventListener("click", () => load());
  $("refresh").addEventListener("click", () => load());
  $("header-support").addEventListener("click", async event => {
    event.preventDefault();
    try { await api.tabs.create({url: event.currentTarget.href}); }
    catch (error) { setStatus(failureMessage("supportOpenFailed", "Impossible d’ouvrir ce lien externe.", error), "error", {persistent: true}); }
  });
  $("settings").addEventListener("click", () => api.runtime.openOptionsPage());
  $("commands").addEventListener("click", openCommandPalette);
  $("command-close").addEventListener("click", () => $("command-palette").close());
  $("command-search").addEventListener("input", event => renderCommands(event.currentTarget.value));
  $("command-search").addEventListener("keydown", event => {
    const commands = [...$("command-list").querySelectorAll(".command-item")];
    if (event.key === "ArrowDown" && commands.length) { event.preventDefault(); commands[0].focus(); }
    else if (event.key === "Enter" && commands.length) { event.preventDefault(); commands[0].click(); }
  });
  $("command-list").addEventListener("keydown", event => {
    const commands = [...$("command-list").querySelectorAll(".command-item")];
    const index = commands.indexOf(document.activeElement);
    if (event.key === "ArrowDown" && commands.length) { event.preventDefault(); commands[(index + 1 + commands.length) % commands.length].focus(); }
    else if (event.key === "ArrowUp" && commands.length) { event.preventDefault(); if (index <= 0) $("command-search").focus(); else commands[index - 1].focus(); }
  });
  document.addEventListener("keydown", event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openCommandPalette(); } });
  $("save-current-view").addEventListener("click", openSavedViewDialog);
  $("saved-views").addEventListener("click", async event => {
    const apply = eventElement(event)?.closest("[data-saved-view]");
    const remove = eventElement(event)?.closest("[data-delete-saved-view]");
    if (remove) { await api.pinInbox.deleteSavedView(remove.dataset.deleteSavedView); if (current?.savedViewId === remove.dataset.deleteSavedView) current.savedViewId = ""; await load({silent:true}); return; }
    if (!apply || !current) return;
    const view = (current.savedViews || []).find(item => item.id === apply.dataset.savedView); if (!view) return;
    current.savedViewId = view.id; current.smartView = view.smartView || "all"; $("search").value = view.search || ""; await load({silent:true});
  });
  $("saved-view-dialog").addEventListener("close", async () => {
    if ($("saved-view-dialog").returnValue !== "default") return;
    const name = $("saved-view-name").value.trim(); if (!name) return;
    const created = await api.pinInbox.createSavedView({name,smartView:$("saved-view-smart").value || "all",search:$("search").value.trim(),groupId:$("saved-view-group").value,caseId:$("saved-view-case").value,priority:$("saved-view-priority").value,responseState:$("saved-view-response").value,checklist:$("saved-view-checklist").value});
    if (current) current.savedViewId = created.id; await load({silent:true});
  });
  $("search").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => load({silent: true}), 220);
  });
  $("clear-filters").addEventListener("click", () => {
    $("search").value = "";
    if (current) { current.smartView = "all"; current.savedViewId = ""; }
    load({silent: true});
  });
  $("smart-views").addEventListener("click", event => {
    const button = eventElement(event)?.closest("[data-smart-view]");
    if (!button || !current) return;
    current.smartView = button.dataset.smartView; current.savedViewId = "";
    load({silent: true});
  });
  $("select-visible").addEventListener("click", () => { for (const item of current?.items || []) selected.add(item.stableKey); updateSelectionBar(); });
  $("clear-selection").addEventListener("click", () => { selected.clear(); updateSelectionBar(); });
  $("bulk-action").addEventListener("change", updateBulkVisibility);
  $("apply").addEventListener("click", event => {
    const action = $("bulk-action").value;
    if (!action) { setStatus(msg("chooseBulkAction", "Choisissez une action groupée."), "error"); return; }
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
      if (!confirm(msg("healthRepairConfirm", "Exécuter les réparations non destructives ?"))) return;
      setButtonBusy(control, true);
      setStatus(msg("healthRepairBusy", "Réparation en cours…"), "busy", {persistent: true});
      try {
        const result = await api.pinInbox.repairHealthIssues({actions: ["orphan-links", "repair-references"]});
        current.health = result.health;
        if (!await loadAfterMutation()) return;
        setStatus(msg("healthRepairComplete", "$1 élément(s) réparé(s).", [displayCount(result.repaired)]), "success");
      } catch (error) { setStatus(failureMessage("healthRepairFailed", "Réparation impossible", error), "error", {persistent: true}); }
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
      } catch (error) { setStatus(failureMessage("diagnosticExportFailed", "Export impossible", error), "error", {persistent: true}); }
      finally { setButtonBusy(control, false); }
      return;
    }
    if (action === "diagnostic-clear") {
      if (!confirm(msg("diagnosticClearConfirm", "Vider le journal diagnostic local ?"))) return;
      setButtonBusy(control, true);
      try {
        await api.pinInbox.clearDiagnostics();
        if (!await loadAfterMutation()) return;
        setStatus(msg("diagnosticCleared", "Journal diagnostic vidé."), "success");
      } catch (error) { setStatus(failureMessage("diagnosticClearFailed", "Nettoyage impossible", error), "error", {persistent: true}); }
      finally { setButtonBusy(control, false); }
      return;
    }
    if (action === "provider-check") {
      setButtonBusy(control, true);
      setStatus(msg("providerCheckBusy", "Analyse des fournisseurs…"), "busy", {persistent: true});
      try { current.providerMatrix = await api.pinInbox.runProviderCompatibilityCheck(); renderHealth(); setStatus(msg("providerCheckComplete", "Matrice de compatibilité actualisée."), "success"); }
      catch (error) { setStatus(failureMessage("providerCheckFailed", "Analyse impossible", error), "error", {persistent: true}); }
      finally { setButtonBusy(control, false); }
    }
  });

  $("calendar-item-type").addEventListener("change", () => { updateCalendarScheduleVisibility(); populateCalendarTargets(); validateCalendarSchedule(); });
  $("calendar-target").addEventListener("change", validateCalendarSchedule);
  for (const id of ["calendar-event-start-date", "calendar-event-start-time", "calendar-event-end-date", "calendar-event-end-time", "calendar-task-due-date", "calendar-task-due-time"]) $(id).addEventListener("input", validateCalendarSchedule);
  $("calendar-dialog").querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();
    if (event.submitter?.value === "cancel") { $("calendar-dialog").close("cancel"); pendingCalendarKeys = []; return; }
    if (!pendingCalendarKeys.length || !validateCalendarSchedule()) return;
    const key = pendingCalendarKeys[0];
    const type = $("calendar-item-type").value;
    const calendarId = $("calendar-target").value;
    const result = await perform([key], "calendar", {itemType: type, calendarId, ...calendarScheduleOptions()});
    if (result) { pendingCalendarKeys = []; $("calendar-dialog").close("created"); }
  });
  $("no-reply-preset").addEventListener("change", updateNoReplyPreview);
  $("no-reply-date").addEventListener("input", updateNoReplyPreview);
  $("no-reply-time").addEventListener("input", updateNoReplyPreview);
  $("no-reply-dialog").querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();
    const key = pendingNoReplyKey;
    if (!key || event.submitter?.value === "cancel") { pendingNoReplyKey = ""; $("no-reply-dialog").close("cancel"); return; }
    const action = event.submitter?.value === "stop" ? "cancelNoReply" : "trackNoReply";
    const dueAt = noReplyDueAt();
    if (action === "trackNoReply" && dueAt <= Date.now()) { updateNoReplyPreview(); return; }
    const result = await perform([key], action, action === "trackNoReply" ? {at: dueAt} : {});
    if (result) { pendingNoReplyKey = ""; $("no-reply-dialog").close(action); }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  localize();
  $("app-version").textContent = `v${api.runtime.getManifest().version}`;
  bindEvents();
  await load();
  if (new URLSearchParams(location.search).get("palette") === "1") openCommandPalette();
});
