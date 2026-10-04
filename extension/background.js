import {NativeCore, METHODS} from "./native/core.js";
const core = new NativeCore(messenger);
const Native = Object.fromEntries([...METHODS].map(method => [method, (...args) => core.dispatch(method, args)]));

const MENU_IDS = Object.freeze({
  toggle: "pin-mails-toggle-selection",
  conversation: "pin-mails-toggle-conversation",
  dashboard: "pin-mails-dashboard",
  options: "pin-mails-options",
  undo: "pin-mails-undo",
  quickRoot: "pin-mails-quick-root",
  quickSimple: "pin-mails-quick-simple",
  quickToday: "pin-mails-quick-today",
  quickTomorrow: "pin-mails-quick-tomorrow",
  quickWaiting: "pin-mails-quick-waiting",
  quickNoReply: "pin-mails-quick-no-reply"
});

const translate = (key, fallback) => messenger.i18n.getMessage(key) || fallback;

function errorName(error) {
  return String(error?.name || "Error").replace(/[^a-z0-9_.-]/gi, "").slice(0, 64) || "Error";
}

function logError(context, error) {
  console.error(`MailPin : ${context}`, errorName(error));
}

async function setupTab(tabId) {
  if (!Number.isInteger(tabId)) return;
  try {
    await Native.setup(tabId);
  } catch (error) {
    console.debug("MailPin : onglet non initialisé", errorName(error));
  }
}

async function setupExistingMailTabs() {
  try {
    const tabs = await messenger.mailTabs.query({});
    await Promise.all(tabs.map(tab => setupTab(tab.id ?? tab.tabId)));
  } catch (error) {
    logError("initialisation des onglets impossible", error);
  }
}

async function toggleSelected(tabId, state) {
  try {
    const args = typeof state === "boolean" ? [state] : [];
    return await Native.toggleSelected(tabId, ...args);
  } catch (error) {
    logError("action sur la sélection impossible", error);
    return undefined;
  }
}

async function toggleConversation(tabId, state) {
  try {
    const args = typeof state === "boolean" ? [state] : [];
    return await Native.toggleConversationSelected(tabId, ...args);
  } catch (error) {
    logError("action sur la conversation impossible", error);
    return undefined;
  }
}

async function toggleDisplayed(tabId, state) {
  try {
    const args = typeof state === "boolean" ? [state] : [];
    return await Native.toggleDisplayed(tabId, ...args);
  } catch (error) {
    logError("message affiché indisponible", error);
    return undefined;
  }
}

async function openDashboard(options = {}) {
  try {
    const palette = options?.palette === true;
    const page = palette ? "dashboard/dashboard.html?palette=1" : "dashboard/dashboard.html";
    if (!palette && messenger.spaces) {
      const space = await ensureSpace();
      return messenger.spaces.open(space.id);
    }
    return messenger.tabs.create({url: messenger.runtime.getURL(page)});
  } catch (error) {
    logError("ouverture du tableau de bord impossible", error);
    return undefined;
  }
}

function selectionMenuTitle(state) {
  const multiple = Number(state?.count || 0) > 1;
  if (state?.allPinned) {
    return translate(multiple ? "menuUnpinMessages" : "menuUnpinMessage", multiple ? "Désépingler les messages sélectionnés" : "Désépingler ce message");
  }
  return translate(multiple ? "menuPinMessages" : "menuPinMessage", multiple ? "Épingler les messages sélectionnés" : "Épingler ce message");
}

function conversationMenuTitle(state) {
  return state?.allConversationsPinned
    ? translate("menuUnpinConversation", "Désépingler toute la conversation liée")
    : translate("menuPinConversation", "Épingler toute la conversation liée");
}

function createMenus() {
  messenger.menus.create({
    id: MENU_IDS.toggle,
    title: translate("menuPinMessage", "Épingler ce message"),
    contexts: ["message_list"],
    icons: {16: "icons/pin-regular.svg", 32: "icons/pin-regular.svg"}
  });
  messenger.menus.create({
    id: MENU_IDS.conversation,
    title: translate("menuPinConversation", "Épingler toute la conversation liée"),
    contexts: ["message_list"]
  });
  messenger.menus.create({
    id: MENU_IDS.quickRoot,
    title: translate("menuQuickCapture", "Ajouter au suivi…"),
    contexts: ["message_list"]
  });
  for (const [id, title, preset] of [
    [MENU_IDS.quickSimple, translate("menuQuickSimple", "Épingler simplement"), "simple"],
    [MENU_IDS.quickToday, translate("menuQuickToday", "À traiter aujourd’hui"), "today"],
    [MENU_IDS.quickTomorrow, translate("menuQuickTomorrow", "À traiter demain"), "tomorrow"],
    [MENU_IDS.quickWaiting, translate("menuQuickWaiting", "Placer en attente"), "waiting"],
    [MENU_IDS.quickNoReply, translate("menuQuickNoReply", "Relancer si aucune réponse"), "noReply"]
  ]) {
    messenger.menus.create({id, parentId: MENU_IDS.quickRoot, title, contexts: ["message_list"], visible: true});
  }
  messenger.menus.create({
    id: MENU_IDS.dashboard,
    title: translate("menuDashboard", "Tableau de bord MailPin"),
    contexts: ["tools_menu"]
  });
  messenger.menus.create({
    id: MENU_IDS.undo,
    title: translate("menuUndo", "Annuler la dernière action MailPin"),
    contexts: ["tools_menu"]
  });
  messenger.menus.create({
    id: MENU_IDS.options,
    title: translate("menuOptions", "Paramètres de MailPin"),
    contexts: ["tools_menu"]
  });
}

messenger.menus.onShown.addListener(async (_info, tab) => {
  if (!tab?.id) return;
  try {
    const state = await Native.getSelectionState(tab.id);
    const usable = Boolean(state?.count);
    await Promise.all([
      messenger.menus.update(MENU_IDS.toggle, {
        visible: usable,
        title: selectionMenuTitle(state)
      }),
      messenger.menus.update(MENU_IDS.conversation, {
        visible: usable && state?.conversationEnabled !== false && Boolean(state?.conversationCount),
        title: conversationMenuTitle(state)
      }),
      messenger.menus.update(MENU_IDS.quickRoot, {visible: usable})
    ]);
    await messenger.menus.refresh();
  } catch (error) {
    console.debug("MailPin : menu contextuel non actualisé", errorName(error));
  }
});

messenger.menus.onClicked.addListener(async (info, tab) => {
  try {
    switch (info.menuItemId) {
      case MENU_IDS.options:
        return await messenger.runtime.openOptionsPage();
      case MENU_IDS.dashboard:
        return await openDashboard();
      case MENU_IDS.undo:
        return await Native.undoLast();
      default:
        break;
    }

    if (!tab?.id) return undefined;
    switch (info.menuItemId) {
      case MENU_IDS.toggle:
        return await toggleSelected(tab.id);
      case MENU_IDS.conversation:
        return await toggleConversation(tab.id);
      case MENU_IDS.quickSimple:
        return await Native.quickCaptureSelected(tab.id, "simple");
      case MENU_IDS.quickToday:
        return await Native.quickCaptureSelected(tab.id, "today");
      case MENU_IDS.quickTomorrow:
        return await Native.quickCaptureSelected(tab.id, "tomorrow");
      case MENU_IDS.quickWaiting:
        return await Native.quickCaptureSelected(tab.id, "waiting");
      case MENU_IDS.quickNoReply:
        return await Native.quickCaptureSelected(tab.id, "noReply");
      default:
        return undefined;
    }
  } catch (error) {
    logError("commande de menu impossible", error);
    return undefined;
  }
});

messenger.commands.onCommand.addListener(async (command, tab) => {
  try {
    if (command === "open-pin-dashboard") return await openDashboard();
    if (command === "open-command-palette") return await openDashboard({palette: true});
    if (!tab?.id) return undefined;

    switch (command) {
      case "toggle-pin-selected":
        return await toggleSelected(tab.id);
      case "toggle-conversation-selected":
        return await toggleConversation(tab.id);
      case "complete-selected-pin":
        return await Native.performSelected(tab.id, "complete");
      case "wait-selected-pin":
        return await Native.performSelected(tab.id, "waiting");
      case "plan-selected-pin":
        return await Native.performSelected(tab.id, "planned");
      case "activate-selected-pin":
        return await Native.performSelected(tab.id, "active");
      case "snooze-selected-pin":
        return await Native.performSelected(tab.id, "snooze");
      case "track-no-reply-selected":
        return await Native.quickCaptureSelected(tab.id, "noReply");
      case "quick-today-selected":
        return await Native.quickCaptureSelected(tab.id, "today");
      default:
        return undefined;
    }
  } catch (error) {
    logError(`raccourci ${command} impossible`, error);
    return undefined;
  }
});

messenger.messageDisplayAction?.onClicked.addListener(tab => toggleDisplayed(tab.id));
messenger.action?.onClicked.addListener(openDashboard);

messenger.runtime.onStartup.addListener(setupExistingMailTabs);
messenger.tabs.onCreated.addListener(tab => {
  if (tab.type === "mail") setupTab(tab.id);
});
messenger.tabs.onActivated.addListener(info => setupTab(info.tabId));

async function initializeMenus() {
  await messenger.menus.removeAll();
  createMenus();
}

initializeMenus().catch(error => logError("initialisation des menus impossible", error));
setupExistingMailTabs();

let spaceQueue = Promise.resolve();
function ensureSpace() {
  const run = spaceQueue.then(async () => {
    const spaces = await messenger.spaces.query({name: "MailPin", isSelfOwned: true});
    return spaces[0] || messenger.spaces.create("MailPin", {url: messenger.runtime.getURL("dashboard/dashboard.html")},
      {title: "MailPin", defaultIcons: "icons/mailpin-icon.svg"});
  });
  spaceQueue = run.catch(() => undefined);
  return run;
}

const PAGE_PATHS = new Set(["/dashboard/dashboard.html", "/options/options.html", "/workbench/workbench.html"]);
messenger.runtime.onMessage.addListener((request, sender) => {
  if (request?.type !== "mailpin:native") return undefined;
  try {
    const url = new URL(sender.url || "");
    if (sender.id !== messenger.runtime.id || url.origin !== new URL(messenger.runtime.getURL("dashboard/dashboard.html")).origin ||
        !PAGE_PATHS.has(url.pathname) || ["onMessages", "onAlarm", "setup", "toggleSelected", "toggleDisplayed", "toggleConversationSelected"].includes(request.method)) {
      return Promise.resolve({ok: false, error: "Unauthorized MailPin request"});
    }
  } catch { return Promise.resolve({ok: false, error: "Unauthorized MailPin request"}); }
  if (request.method === "openDashboard") {
    return ensureSpace().then(space => messenger.spaces.open(space.id)).then(
      tab => ({ok: true, result: {tabId: tab.id}}),
      () => ({ok: false, error: "MailPin Space unavailable"}));
  }
  return core.dispatch(request.method, request.args || []).then(result => ({ok: true, result}),
    error => ({ok: false, error: String(error.message || "MailPin operation failed").slice(0, 300)}));
});

messenger.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "mailpin-reminders") Native.onAlarm().catch(error => logError("rappel", error));
});
messenger.notifications.onClicked.addListener(id => {
  if (id.startsWith("mailpin:")) Native.openReference(id.slice(8)).catch(() => openDashboard());
});
messenger.messages.onNewMailReceived.addListener(async (_folder, list) => {
  try {
    const messages = await core.collect(list);
    await Native.onMessages(JSON.parse(JSON.stringify(messages)), "messageAdded");
  } catch (error) { logError("messages reçus", error); }
});
messenger.messages.onUpdated.addListener(async (message, changed) => {
  if (!Object.prototype.hasOwnProperty.call(changed, "read")) return;
  await Native.onMessages(JSON.parse(JSON.stringify([message])), "read").catch(error => logError("message actualisé", error));
});
messenger.messages.onMoved.addListener(async (_old, list) => {
  try { await Native.onMessages(JSON.parse(JSON.stringify(await core.collect(list))), "move"); }
  catch (error) { logError("message déplacé", error); }
});
messenger.messageDisplay.onMessagesDisplayed.addListener(tab => setupTab(tab.id));
messenger.runtime.onInstalled.addListener(() => setupExistingMailTabs());
messenger.runtime.onStartup.addListener(() => ensureSpace().catch(error => logError("Space", error)));
ensureSpace().catch(error => logError("Space", error));
