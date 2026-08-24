"use strict";

const STATE_KEY = "mailpinStateV2";
const MAX_HISTORY = 200;
const MAX_TEXT = 20000;
const MAX_LIST = 200;
const STATUS = new Set(["active", "planned", "waiting", "completed"]);
const PRIORITY = new Set(["low", "normal", "high"]);
const VIEWS = new Set(["all", "active", "today", "overdue", "planned", "waiting", "noReply", "completed", "planner", "stats"]);
const DEFAULT_SETTINGS = Object.freeze({
  notifications: true,
  defaultView: "active",
  openMessageIn: "tab"
});
const MENU = Object.freeze({
  toggle: "mailpin-toggle",
  today: "mailpin-today",
  tomorrow: "mailpin-tomorrow",
  waiting: "mailpin-waiting",
  noReply: "mailpin-no-reply",
  dashboard: "mailpin-dashboard"
});

let writeQueue = Promise.resolve();

const t = (key, substitutions) => messenger.i18n.getMessage(key, substitutions) || key;
const cleanText = (value, max = MAX_TEXT) => String(value ?? "").replace(/\u0000/g, "").slice(0, max);
const cleanList = (value, maxItems = MAX_LIST, maxLength = 120) => Array.isArray(value)
  ? value.slice(0, maxItems).map(item => cleanText(item, maxLength).trim()).filter(Boolean)
  : [];
const iso = (value = Date.now()) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

function stablePinId(headerMessageId, fallbackId) {
  const source = cleanText(headerMessageId || fallbackId, 1000).trim();
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `pin-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function normalizePin(raw, fallbackId = "") {
  const pin = raw && typeof raw === "object" ? raw : {};
  const id = cleanText(pin.id || fallbackId, 80).trim();
  if (!id) return null;
  const checklist = Array.isArray(pin.checklist)
    ? pin.checklist.slice(0, 100).map((item, index) => ({
        id: cleanText(item?.id || `task-${index}`, 80),
        text: cleanText(item?.text, 500).trim(),
        done: Boolean(item?.done)
      })).filter(item => item.text)
    : [];

  return {
    id,
    headerMessageId: cleanText(pin.headerMessageId, 1000),
    lastKnownMessageId: Number.isInteger(pin.lastKnownMessageId) ? pin.lastKnownMessageId : null,
    accountId: cleanText(pin.accountId, 200),
    folderId: cleanText(pin.folderId, 500),
    subject: cleanText(pin.subject, 1000),
    author: cleanText(pin.author, 1000),
    date: iso(pin.date) || iso(),
    nativeTags: cleanList(pin.nativeTags, 100, 100),
    status: STATUS.has(pin.status) ? pin.status : "active",
    priority: PRIORITY.has(pin.priority) ? pin.priority : "normal",
    dueAt: pin.dueAt ? iso(pin.dueAt) : null,
    waitingForReply: Boolean(pin.waitingForReply),
    note: cleanText(pin.note),
    checklist,
    labels: cleanList(pin.labels, 50, 80),
    project: cleanText(pin.project, 200).trim(),
    createdAt: iso(pin.createdAt) || iso(),
    updatedAt: iso(pin.updatedAt) || iso(),
    completedAt: pin.completedAt ? iso(pin.completedAt) : null
  };
}

function normalizeState(raw) {
  const state = raw && typeof raw === "object" ? raw : {};
  const pins = {};
  if (state.pins && typeof state.pins === "object" && !Array.isArray(state.pins)) {
    for (const [key, value] of Object.entries(state.pins).slice(0, 5000)) {
      const pin = normalizePin(value, key);
      if (pin) pins[pin.id] = pin;
    }
  }

  const settings = state.settings && typeof state.settings === "object" ? state.settings : {};
  return {
    schemaVersion: 2,
    pins,
    savedViews: Array.isArray(state.savedViews)
      ? state.savedViews.slice(0, 50).map(view => ({
          id: cleanText(view?.id, 80),
          name: cleanText(view?.name, 120),
          query: cleanText(view?.query, 500)
        })).filter(view => view.id && view.name)
      : [],
    settings: {
      notifications: settings.notifications !== false,
      defaultView: VIEWS.has(settings.defaultView) ? settings.defaultView : DEFAULT_SETTINGS.defaultView,
      openMessageIn: settings.openMessageIn === "window" ? "window" : "tab"
    },
    history: Array.isArray(state.history)
      ? state.history.slice(-MAX_HISTORY).map(item => ({
          at: iso(item?.at) || iso(),
          type: cleanText(item?.type, 40),
          pinId: cleanText(item?.pinId, 80),
          detail: cleanText(item?.detail, 200)
        }))
      : []
  };
}

async function loadState() {
  const stored = await messenger.storage.local.get(STATE_KEY);
  return normalizeState(stored[STATE_KEY]);
}

async function saveState(state) {
  await messenger.storage.local.set({[STATE_KEY]: normalizeState(state)});
}

function mutateState(mutator) {
  const run = writeQueue.then(async () => {
    const state = await loadState();
    const result = await mutator(state);
    await saveState(state);
    return result;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

function record(state, type, pinId, detail = "") {
  state.history.push({
    at: iso(),
    type: cleanText(type, 40),
    pinId: cleanText(pinId, 80),
    detail: cleanText(detail, 200)
  });
  if (state.history.length > MAX_HISTORY) {
    state.history.splice(0, state.history.length - MAX_HISTORY);
  }
}

async function collect(list) {
  const messages = [...(list?.messages || [])];
  let listId = list?.id || null;
  while (listId) {
    const next = await messenger.messages.continueList(listId);
    messages.push(...(next?.messages || []));
    listId = next?.id || null;
  }
  return messages;
}

async function selectedMessages(tabId) {
  if (!Number.isInteger(tabId)) return [];
  return collect(await messenger.mailTabs.getSelectedMessages(tabId));
}

async function displayedMessages(tabId) {
  if (!Number.isInteger(tabId)) return [];
  return collect(await messenger.messageDisplay.getDisplayedMessages(tabId));
}

function pinFromMessage(message, preset = "simple") {
  const now = Date.now();
  const pin = normalizePin({
    id: stablePinId(message.headerMessageId, message.id),
    headerMessageId: message.headerMessageId,
    lastKnownMessageId: Number.isInteger(message.id) ? message.id : null,
    accountId: message.folder?.accountId,
    folderId: message.folder?.id,
    subject: message.subject,
    author: message.author,
    date: message.date,
    nativeTags: message.tags,
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
  });

  const due = new Date(now);
  if (preset === "today") {
    due.setHours(23, 59, 59, 999);
    pin.dueAt = iso(due);
  } else if (preset === "tomorrow") {
    due.setDate(due.getDate() + 1);
    due.setHours(23, 59, 59, 999);
    pin.dueAt = iso(due);
  } else if (preset === "waiting") {
    pin.status = "waiting";
  } else if (preset === "noReply") {
    pin.status = "waiting";
    pin.waitingForReply = true;
  }
  return pin;
}

async function pinMessages(messages, preset = "simple") {
  if (!Array.isArray(messages) || !messages.length) return {changed: 0};
  const result = await mutateState(state => {
    let changed = 0;
    for (const message of messages.slice(0, MAX_LIST)) {
      if (!message?.headerMessageId && !Number.isInteger(message?.id)) continue;
      const fresh = pinFromMessage(message, preset);
      const old = state.pins[fresh.id];
      state.pins[fresh.id] = old
        ? {
            ...fresh,
            ...old,
            lastKnownMessageId: fresh.lastKnownMessageId,
            folderId: fresh.folderId || old.folderId,
            accountId: fresh.accountId || old.accountId,
            subject: fresh.subject || old.subject,
            author: fresh.author || old.author,
            nativeTags: fresh.nativeTags,
            updatedAt: iso()
          }
        : fresh;
      record(state, old ? "refresh" : "pin", fresh.id, preset);
      changed += 1;
    }
    return {changed};
  });
  await rescheduleAlarms();
  return result;
}

async function unpinIds(ids) {
  const result = await mutateState(state => {
    let changed = 0;
    for (const id of cleanList(ids, MAX_LIST, 80)) {
      if (!state.pins[id]) continue;
      delete state.pins[id];
      record(state, "unpin", id);
      changed += 1;
    }
    return {changed};
  });
  await rescheduleAlarms();
  return result;
}

async function toggleMessages(messages) {
  const state = await loadState();
  const candidates = (messages || []).slice(0, MAX_LIST).filter(message => message?.headerMessageId || Number.isInteger(message?.id));
  const ids = candidates.map(message => stablePinId(message.headerMessageId, message.id));
  return ids.length && ids.every(id => state.pins[id]) ? unpinIds(ids) : pinMessages(candidates);
}

async function resolveMessage(pin) {
  if (!pin?.headerMessageId) return null;
  if (pin.folderId) {
    const scoped = await collect(await messenger.messages.query({
      headerMessageId: pin.headerMessageId,
      folderId: pin.folderId
    }));
    if (scoped.length) return scoped[0];
  }
  const global = await collect(await messenger.messages.query({headerMessageId: pin.headerMessageId}));
  return global[0] || null;
}

async function listPins() {
  const state = await loadState();
  const pins = [];
  for (const pin of Object.values(state.pins).slice(0, 1000)) {
    try {
      const message = await resolveMessage(pin);
      pins.push(message
        ? {
            ...pin,
            missing: false,
            lastKnownMessageId: message.id,
            folderId: message.folder?.id || pin.folderId,
            accountId: message.folder?.accountId || pin.accountId,
            subject: cleanText(message.subject, 1000) || pin.subject,
            author: cleanText(message.author, 1000) || pin.author,
            nativeTags: cleanList(message.tags, 100, 100)
          }
        : {...pin, missing: true});
    } catch {
      pins.push({...pin, missing: true});
    }
  }
  return {
    pins,
    settings: state.settings,
    savedViews: state.savedViews,
    history: state.history.slice(-50)
  };
}

function sanitizePatch(patch) {
  const safe = {};
  if (!patch || typeof patch !== "object") return safe;
  if (STATUS.has(patch.status)) safe.status = patch.status;
  if (PRIORITY.has(patch.priority)) safe.priority = patch.priority;
  if ("note" in patch) safe.note = cleanText(patch.note);
  if ("project" in patch) safe.project = cleanText(patch.project, 200).trim();
  if ("labels" in patch) safe.labels = cleanList(patch.labels, 50, 80);
  if ("waitingForReply" in patch) safe.waitingForReply = Boolean(patch.waitingForReply);
  if ("dueAt" in patch) safe.dueAt = patch.dueAt ? iso(patch.dueAt) : null;
  if ("checklist" in patch) safe.checklist = normalizePin({id: "tmp", checklist: patch.checklist}).checklist;
  return safe;
}

async function updatePin(id, patch) {
  return mutateState(state => {
    const key = cleanText(id, 80);
    const pin = state.pins[key];
    if (!pin) throw new Error("Pin not found");
    const safe = sanitizePatch(patch);
    Object.assign(pin, safe, {updatedAt: iso()});
    if (safe.status === "completed") pin.completedAt = pin.completedAt || iso();
    else if (safe.status) pin.completedAt = null;
    record(state, "update", key, safe.status || "metadata");
    return {...pin};
  });
}

async function updateMany(ids, patch) {
  const safeIds = cleanList(ids, MAX_LIST, 80);
  for (const id of safeIds) await updatePin(id, patch);
  await rescheduleAlarms();
  return {changed: safeIds.length};
}

async function openPin(id) {
  const state = await loadState();
  const pin = state.pins[cleanText(id, 80)];
  if (!pin) throw new Error("Pin not found");
  const message = await resolveMessage(pin);
  if (!message) throw new Error("Message not found");
  return messenger.messageDisplay.open({
    messageId: message.id,
    location: state.settings.openMessageIn === "window" ? "window" : "tab",
    active: true
  });
}

async function actOnPin(id, action) {
  const state = await loadState();
  const pin = state.pins[cleanText(id, 80)];
  if (!pin) throw new Error("Pin not found");
  const message = await resolveMessage(pin);
  if (!message) throw new Error("Message not found");
  if (action === "reply") return messenger.compose.beginReply(message.id, "replyToSender");
  if (action === "replyAll") return messenger.compose.beginReply(message.id, "replyToAll");
  if (action === "archive") {
    await messenger.messages.archive([message.id]);
    return {ok: true};
  }
  if (action === "trash") {
    await messenger.messages.delete([message.id], {deletePermanently: false, isUserAction: true});
    return {ok: true};
  }
  throw new Error("Unsupported action");
}

async function listNativeTags() {
  return messenger.messages.tags.list();
}

async function setNativeTags(id, tags) {
  const state = await loadState();
  const key = cleanText(id, 80);
  const pin = state.pins[key];
  if (!pin) throw new Error("Pin not found");
  const message = await resolveMessage(pin);
  if (!message) throw new Error("Message not found");
  const allowed = new Set((await listNativeTags()).map(tag => tag.key));
  const selected = cleanList(tags, 100, 100).filter(tag => allowed.has(tag));
  await messenger.messages.update(message.id, {tags: selected});
  return mutateState(next => {
    if (next.pins[key]) {
      next.pins[key].nativeTags = selected;
      next.pins[key].updatedAt = iso();
      record(next, "tags", key);
    }
    return selected;
  });
}

async function rescheduleAlarms() {
  await messenger.alarms.clearAll();
  const state = await loadState();
  const now = Date.now();
  for (const pin of Object.values(state.pins)) {
    if (!pin.dueAt || pin.status === "completed") continue;
    const when = new Date(pin.dueAt).getTime();
    if (Number.isFinite(when)) {
      messenger.alarms.create(`pin:${pin.id}`, {when: Math.max(when, now + 1000)});
    }
  }
}

async function handleAlarm(alarm) {
  if (!alarm?.name?.startsWith("pin:")) return;
  const id = alarm.name.slice(4);
  const state = await loadState();
  const pin = state.pins[id];
  if (!pin || pin.status === "completed" || !state.settings.notifications) return;
  await messenger.notifications.create(`mailpin:${id}`, {
    type: "basic",
    iconUrl: messenger.runtime.getURL("icons/mailpin-icon.svg"),
    title: t("reminderTitle"),
    message: pin.subject || t("reminderBody")
  });
}

const openDashboard = () => messenger.tabs.create({url: messenger.runtime.getURL("dashboard/dashboard.html")});

async function createMenus() {
  await messenger.menus.removeAll();
  messenger.menus.create({id: MENU.toggle, title: t("menuToggle"), contexts: ["message_list"]});
  messenger.menus.create({id: MENU.today, title: t("menuToday"), contexts: ["message_list"]});
  messenger.menus.create({id: MENU.tomorrow, title: t("menuTomorrow"), contexts: ["message_list"]});
  messenger.menus.create({id: MENU.waiting, title: t("menuWaiting"), contexts: ["message_list"]});
  messenger.menus.create({id: MENU.noReply, title: t("menuNoReply"), contexts: ["message_list"]});
  messenger.menus.create({id: MENU.dashboard, title: t("menuDashboard"), contexts: ["tools_menu"]});
}

messenger.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU.dashboard) return openDashboard();
  if (!Number.isInteger(tab?.id)) return undefined;
  return selectedMessages(tab.id).then(messages => {
    if (info.menuItemId === MENU.toggle) return toggleMessages(messages);
    if (info.menuItemId === MENU.today) return pinMessages(messages, "today");
    if (info.menuItemId === MENU.tomorrow) return pinMessages(messages, "tomorrow");
    if (info.menuItemId === MENU.waiting) return pinMessages(messages, "waiting");
    if (info.menuItemId === MENU.noReply) return pinMessages(messages, "noReply");
    return undefined;
  });
});

messenger.commands.onCommand.addListener((command, tab) => {
  if (command === "open-pin-dashboard") return openDashboard();
  if (!Number.isInteger(tab?.id)) return undefined;
  return selectedMessages(tab.id).then(async messages => {
    if (command === "toggle-pin-selected") return toggleMessages(messages);
    if (command === "quick-today-selected") return pinMessages(messages, "today");
    const state = await loadState();
    const ids = messages
      .map(message => stablePinId(message.headerMessageId, message.id))
      .filter(id => state.pins[id]);
    if (command === "wait-selected-pin") return updateMany(ids, {status: "waiting"});
    if (command === "complete-selected-pin") return updateMany(ids, {status: "completed"});
    return undefined;
  });
});

messenger.messageDisplayAction.onClicked.addListener(tab => displayedMessages(tab.id).then(toggleMessages));
messenger.action.onClicked.addListener(openDashboard);
messenger.alarms.onAlarm.addListener(handleAlarm);
messenger.notifications.onClicked.addListener(notificationId => {
  if (!notificationId.startsWith("mailpin:")) return undefined;
  return openPin(notificationId.slice(8)).catch(() => openDashboard());
});

async function handleRuntimeMessage(request) {
  const type = cleanText(request?.type, 80);
  if (type === "mailpin:list") return listPins();
  if (type === "mailpin:update") {
    const result = await updatePin(request.id, request.patch);
    await rescheduleAlarms();
    return result;
  }
  if (type === "mailpin:updateMany") return updateMany(request.ids, request.patch);
  if (type === "mailpin:unpin") return unpinIds(request.ids);
  if (type === "mailpin:open") return openPin(request.id);
  if (type === "mailpin:action") return actOnPin(request.id, request.action);
  if (type === "mailpin:nativeTags") return listNativeTags();
  if (type === "mailpin:setNativeTags") return setNativeTags(request.id, request.tags);
  if (type === "mailpin:export") return loadState();
  if (type === "mailpin:import") {
    const incoming = normalizeState(request.state);
    await mutateState(state => {
      Object.assign(state, incoming);
      record(state, "import", "system");
    });
    await rescheduleAlarms();
    return {ok: true};
  }
  if (type === "mailpin:settings") {
    return mutateState(state => {
      const next = request.settings && typeof request.settings === "object" ? request.settings : {};
      state.settings.notifications = next.notifications !== false;
      if (VIEWS.has(next.defaultView)) state.settings.defaultView = next.defaultView;
      state.settings.openMessageIn = next.openMessageIn === "window" ? "window" : "tab";
      return {...state.settings};
    });
  }
  return undefined;
}

messenger.runtime.onMessage.addListener(request => handleRuntimeMessage(request));
messenger.runtime.onInstalled.addListener(() => Promise.all([createMenus(), rescheduleAlarms()]));
messenger.runtime.onStartup.addListener(rescheduleAlarms);

createMenus().catch(error => console.error("MailPin menu init failed", error));
rescheduleAlarms().catch(error => console.error("MailPin alarm init failed", error));
