"use strict";

const CORE_KEY = "mailpinStateV2";
const PARITY_KEY = "mailpinNativeParityV1";
const OWNED_TAG_SPECS = Object.freeze({
  followup: {name: "MailPin", color: "#6d5dfc"},
  today: {name: "MailPin · Today", color: "#d97706"},
  waiting: {name: "MailPin · Waiting", color: "#2563eb"},
  overdue: {name: "MailPin · Overdue", color: "#dc2626"}
});

let syncQueue = Promise.resolve();

function emptyParityState() {
  return {
    schemaVersion: 1,
    visualTagsEnabled: true,
    ownedTags: {},
    savedViews: [],
    templates: [],
    cases: [],
    rules: [],
    ruleLog: []
  };
}

function normalizeParityState(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const cleanArray = (value, max) => Array.isArray(value) ? value.slice(0, max) : [];
  return {
    schemaVersion: 1,
    visualTagsEnabled: source.visualTagsEnabled !== false,
    ownedTags: source.ownedTags && typeof source.ownedTags === "object" ? {...source.ownedTags} : {},
    savedViews: cleanArray(source.savedViews, 50),
    templates: cleanArray(source.templates, 100),
    cases: cleanArray(source.cases, 200),
    rules: cleanArray(source.rules, 200),
    ruleLog: cleanArray(source.ruleLog, 200)
  };
}

async function loadParityState() {
  const stored = await messenger.storage.local.get(PARITY_KEY);
  return normalizeParityState(stored[PARITY_KEY]);
}

async function saveParityState(state) {
  await messenger.storage.local.set({[PARITY_KEY]: normalizeParityState(state)});
}

async function loadCoreState() {
  const stored = await messenger.storage.local.get(CORE_KEY);
  const value = stored[CORE_KEY];
  return value && typeof value === "object" ? value : {pins: {}};
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

async function resolvePinMessage(pin) {
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

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toDateString() === new Date().toDateString();
}

function isOverdue(pin) {
  if (!pin?.dueAt || pin.status === "completed") return false;
  const due = new Date(pin.dueAt).getTime();
  return Number.isFinite(due) && due < Date.now() && !isToday(pin.dueAt);
}

async function ensureOwnedTags() {
  const state = await loadParityState();
  if (!state.visualTagsEnabled) return state;
  const existing = await messenger.messages.tags.list();
  const existingKeys = new Set(existing.map(tag => tag.key));
  let changed = false;

  for (const [role, spec] of Object.entries(OWNED_TAG_SPECS)) {
    const storedKey = state.ownedTags[role];
    if (storedKey && existingKeys.has(storedKey)) continue;
    const key = await messenger.messages.tags.create(undefined, spec.name, spec.color);
    state.ownedTags[role] = key;
    existingKeys.add(key);
    changed = true;
  }

  if (changed) await saveParityState(state);
  return state;
}

function desiredOwnedKeys(pin, parity) {
  if (!parity.visualTagsEnabled || pin?.status === "completed") return [];
  const keys = [];
  if (parity.ownedTags.followup) keys.push(parity.ownedTags.followup);
  if (isOverdue(pin) && parity.ownedTags.overdue) keys.push(parity.ownedTags.overdue);
  else if (isToday(pin?.dueAt) && parity.ownedTags.today) keys.push(parity.ownedTags.today);
  else if (pin?.status === "waiting" && parity.ownedTags.waiting) keys.push(parity.ownedTags.waiting);
  return keys;
}

function ownedKeySet(parity) {
  return new Set(Object.values(parity.ownedTags).filter(Boolean));
}

async function updateMessageOwnedTags(message, pin, parity) {
  if (!message) return;
  const owned = ownedKeySet(parity);
  const preserved = (message.tags || []).filter(key => !owned.has(key));
  const desired = desiredOwnedKeys(pin, parity);
  const next = [...new Set([...preserved, ...desired])];
  const current = [...(message.tags || [])].sort();
  const sortedNext = [...next].sort();
  if (current.length === sortedNext.length && current.every((value, index) => value === sortedNext[index])) return;
  await messenger.messages.update(message.id, {tags: next});
}

async function syncPin(pin, parity) {
  try {
    const message = await resolvePinMessage(pin);
    await updateMessageOwnedTags(message, pin, parity);
  } catch (error) {
    console.warn("MailPin native tag sync failed", error);
  }
}

async function clearRemovedPin(oldPin, parity) {
  try {
    const message = await resolvePinMessage(oldPin);
    await updateMessageOwnedTags(message, {status: "completed"}, parity);
  } catch (error) {
    console.warn("MailPin native tag cleanup failed", error);
  }
}

async function syncAllVisualTags() {
  const parity = await ensureOwnedTags();
  if (!parity.visualTagsEnabled) return {synced: 0};
  const core = await loadCoreState();
  const pins = Object.values(core.pins || {}).slice(0, 1000);
  for (const pin of pins) await syncPin(pin, parity);
  await updateGlobalActionBadge(core);
  return {synced: pins.length};
}

function queueSync(task) {
  syncQueue = syncQueue.then(task, task).catch(error => console.error("MailPin parity sync failed", error));
  return syncQueue;
}

async function handleCoreStorageChange(change) {
  const parity = await ensureOwnedTags();
  const oldPins = change.oldValue?.pins && typeof change.oldValue.pins === "object" ? change.oldValue.pins : {};
  const newPins = change.newValue?.pins && typeof change.newValue.pins === "object" ? change.newValue.pins : {};
  const touched = new Set([...Object.keys(oldPins), ...Object.keys(newPins)]);
  for (const id of touched) {
    const before = oldPins[id];
    const after = newPins[id];
    if (!after && before) await clearRemovedPin(before, parity);
    else if (after) await syncPin(after, parity);
  }
  await updateGlobalActionBadge(change.newValue || {pins: {}});
}

async function updateGlobalActionBadge(core = null) {
  const state = core || await loadCoreState();
  const active = Object.values(state.pins || {}).filter(pin => pin.status !== "completed").length;
  await messenger.action.setBadgeText({text: active ? String(Math.min(active, 999)) : ""});
  await messenger.action.setTitle({title: active ? `MailPin — ${active} active` : "MailPin"});
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

async function updateMessageDisplayState(tabId, list = null) {
  if (!Number.isInteger(tabId)) return;
  const messages = list ? await collect(list) : await collect(await messenger.messageDisplay.getDisplayedMessages(tabId));
  const message = messages[0];
  const core = await loadCoreState();
  const id = message ? stablePinId(message.headerMessageId, message.id) : null;
  const pin = id ? core.pins?.[id] : null;
  const pinned = Boolean(pin && pin.status !== "completed");
  await messenger.messageDisplayAction.setBadgeText({tabId, text: pinned ? "PIN" : ""});
  await messenger.messageDisplayAction.setTitle({
    tabId,
    title: pinned ? "MailPin — Unpin this message" : "MailPin — Pin this message"
  });
  await messenger.messageDisplayAction.setLabel({tabId, label: pinned ? "MailPin ✓" : "MailPin"});
  await messenger.messageDisplayAction.setIcon({
    tabId,
    path: pinned ? "icons/pin-filled.svg" : "icons/pin-regular.svg"
  });
}

async function refreshVisibleMessageAction() {
  try {
    const tabs = await messenger.tabs.query({active: true, currentWindow: true});
    for (const tab of tabs) await updateMessageDisplayState(tab.id).catch(() => undefined);
  } catch {
    // Some Thunderbird windows expose a limited tabs surface. Ignore safely.
  }
}

async function updateContextMenu(data, tab) {
  if (!data?.contexts?.includes("message_list") || !Number.isInteger(tab?.id)) return;
  const messages = data.selectedMessages ? await collect(data.selectedMessages) : await collect(await messenger.mailTabs.getSelectedMessages(tab.id));
  const core = await loadCoreState();
  const ids = messages.map(message => stablePinId(message.headerMessageId, message.id));
  const allPinned = ids.length > 0 && ids.every(id => core.pins?.[id] && core.pins[id].status !== "completed");
  await messenger.menus.update("mailpin-toggle", {title: allPinned ? "MailPin — Unpin" : "MailPin — Pin"});
  await messenger.menus.refresh();
}

async function diagnostics() {
  const [core, parity, tagList, browserInfo] = await Promise.all([
    loadCoreState(),
    loadParityState(),
    messenger.messages.tags.list(),
    messenger.runtime.getBrowserInfo()
  ]);
  const pins = Object.values(core.pins || {});
  let missing = 0;
  for (const pin of pins.slice(0, 250)) {
    try {
      if (!await resolvePinMessage(pin)) missing += 1;
    } catch {
      missing += 1;
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    browser: browserInfo,
    schemaVersion: core.schemaVersion || 2,
    pins: pins.length,
    activePins: pins.filter(pin => pin.status !== "completed").length,
    missingSample: missing,
    sampledPins: Math.min(pins.length, 250),
    historyEntries: Array.isArray(core.history) ? core.history.length : 0,
    storageMode: "storage.local",
    experimentApis: 0,
    runtimeNetwork: false,
    visualTagsEnabled: parity.visualTagsEnabled,
    ownedTagKeys: {...parity.ownedTags},
    availableTagCount: tagList.length
  };
}

function handleRuntimeMessage(request) {
  if (request?.type === "mailpin:parity:get") {
    return loadParityState();
  }
  if (request?.type === "mailpin:parity:set") {
    const next = normalizeParityState(request.state);
    return saveParityState(next).then(() => queueSync(syncAllVisualTags)).then(() => next);
  }
  if (request?.type === "mailpin:parity:diagnostics") {
    return diagnostics();
  }
  if (request?.type === "mailpin:parity:syncTags") {
    return queueSync(syncAllVisualTags);
  }
  return undefined;
}

messenger.runtime.onMessage.addListener(request => handleRuntimeMessage(request));
messenger.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes[CORE_KEY]) queueSync(() => handleCoreStorageChange(changes[CORE_KEY])).then(refreshVisibleMessageAction);
  if (changes[PARITY_KEY]) queueSync(syncAllVisualTags);
});
messenger.messageDisplay.onMessagesDisplayed.addListener((tab, messages) => updateMessageDisplayState(tab.id, messages));
messenger.menus.onShown.addListener((data, tab) => updateContextMenu(data, tab).catch(() => undefined));
messenger.runtime.onInstalled.addListener(() => queueSync(syncAllVisualTags));
messenger.runtime.onStartup.addListener(() => queueSync(syncAllVisualTags));

queueSync(syncAllVisualTags);
refreshVisibleMessageAction();
