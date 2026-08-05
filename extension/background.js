"use strict";

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
  console.error(`MailPerch : ${context}`, errorName(error));
}

async function setupTab(tabId) {
  if (!Number.isInteger(tabId)) return;
  try {
    await messenger.pinInbox.setup(tabId);
  } catch (error) {
    console.debug("MailPerch : onglet non initialisé", errorName(error));
  }
}

async function toggleSelected(tabId, state) {
  try {
    const args = typeof state === "boolean" ? [state] : [];
    return await messenger.pinInbox.toggleSelected(tabId, ...args);
  } catch (error) {
    logError("action sur la sélection impossible", error);
    return undefined;
  }
}

async function toggleConversation(tabId, state) {
  try {
    const args = typeof state === "boolean" ? [state] : [];
    return await messenger.pinInbox.toggleConversationSelected(tabId, ...args);
  } catch (error) {
    logError("action sur la conversation impossible", error);
    return undefined;
  }
}

async function toggleDisplayed(tabId, state) {
  try {
    const args = typeof state === "boolean" ? [state] : [];
    return await messenger.pinInbox.toggleDisplayed(tabId, ...args);
  } catch (error) {
    logError("message affiché indisponible", error);
    return undefined;
  }
}

async function openDashboard() {
  try {
    return await messenger.tabs.create({
      url: messenger.runtime.getURL("dashboard/dashboard.html")
    });
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
    title: translate("menuDashboard", "Tableau de bord MailPerch"),
    contexts: ["tools_menu"]
  });
  messenger.menus.create({
    id: MENU_IDS.undo,
    title: translate("menuUndo", "Annuler la dernière action MailPerch"),
    contexts: ["tools_menu"]
  });
  messenger.menus.create({
    id: MENU_IDS.options,
    title: translate("menuOptions", "Paramètres de MailPerch"),
    contexts: ["tools_menu"]
  });
}

messenger.menus.onShown.addListener(async (_info, tab) => {
  if (!tab?.id) return;
  try {
    const state = await messenger.pinInbox.getSelectionState(tab.id);
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
    console.debug("MailPerch : menu contextuel non actualisé", errorName(error));
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
        return await messenger.pinInbox.undoLast();
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
        return await messenger.pinInbox.quickCaptureSelected(tab.id, "simple");
      case MENU_IDS.quickToday:
        return await messenger.pinInbox.quickCaptureSelected(tab.id, "today");
      case MENU_IDS.quickTomorrow:
        return await messenger.pinInbox.quickCaptureSelected(tab.id, "tomorrow");
      case MENU_IDS.quickWaiting:
        return await messenger.pinInbox.quickCaptureSelected(tab.id, "waiting");
      case MENU_IDS.quickNoReply:
        return await messenger.pinInbox.quickCaptureSelected(tab.id, "noReply");
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
    if (!tab?.id) return undefined;

    switch (command) {
      case "toggle-pin-selected":
        return await toggleSelected(tab.id);
      case "toggle-conversation-selected":
        return await toggleConversation(tab.id);
      case "complete-selected-pin":
        return await messenger.pinInbox.performSelected(tab.id, "complete");
      case "wait-selected-pin":
        return await messenger.pinInbox.performSelected(tab.id, "waiting");
      case "plan-selected-pin":
        return await messenger.pinInbox.performSelected(tab.id, "planned");
      case "activate-selected-pin":
        return await messenger.pinInbox.performSelected(tab.id, "active");
      case "snooze-selected-pin":
        return await messenger.pinInbox.performSelected(tab.id, "snooze");
      case "track-no-reply-selected":
        return await messenger.pinInbox.quickCaptureSelected(tab.id, "noReply");
      case "quick-today-selected":
        return await messenger.pinInbox.quickCaptureSelected(tab.id, "today");
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
messenger.pinInbox?.onDashboardRequested.addListener(openDashboard);
messenger.tabs.onCreated.addListener(tab => {
  if (tab.type === "mail") setupTab(tab.id);
});
messenger.tabs.onActivated.addListener(info => setupTab(info.tabId));

async function initializeMenus() {
  await messenger.menus.removeAll();
  createMenus();
}

initializeMenus().catch(error => logError("initialisation des menus impossible", error));
messenger.mailTabs.query({})
  .then(tabs => Promise.all(tabs.map(tab => setupTab(tab.id ?? tab.tabId))))
  .catch(error => logError("initialisation des onglets impossible", error));
