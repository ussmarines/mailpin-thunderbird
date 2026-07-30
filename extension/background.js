"use strict";

const MENU_IDS = Object.freeze({
  toggle: "pin-mails-toggle-selection",
  pin: "pin-mails-pin-selection",
  unpin: "pin-mails-unpin-selection",
  conversation: "pin-mails-toggle-conversation",
  displayed: "pin-mails-toggle-displayed",
  dashboard: "pin-mails-dashboard",
  options: "pin-mails-options",
  undo: "pin-mails-undo"
});

const translate = (key, fallback) => messenger.i18n.getMessage(key) || fallback;

function logError(context, error) {
  console.error(`MailPerch : ${context}`, error);
}

async function setupTab(tabId) {
  if (!Number.isInteger(tabId)) return;
  try {
    await messenger.pinInbox.setup(tabId);
  } catch (error) {
    console.debug("MailPerch : onglet non initialisé", error);
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

function createMenus() {
  messenger.menus.create({
    id: MENU_IDS.toggle,
    title: translate("menuToggle", "Épingler ou désépingler la sélection"),
    contexts: ["message_list"],
    icons: {16: "icons/pin-regular.svg", 32: "icons/pin-regular.svg"}
  });
  messenger.menus.create({
    id: MENU_IDS.pin,
    title: translate("menuPin", "Épingler la sélection"),
    contexts: ["message_list"],
    visible: false
  });
  messenger.menus.create({
    id: MENU_IDS.unpin,
    title: translate("menuUnpin", "Désépingler la sélection"),
    contexts: ["message_list"],
    visible: false
  });
  messenger.menus.create({
    id: MENU_IDS.conversation,
    title: translate("menuConversation", "Épingler ou désépingler la conversation"),
    contexts: ["message_list"]
  });
  messenger.menus.create({
    id: MENU_IDS.displayed,
    title: translate("menuDisplayed", "Épingler ou désépingler ce message"),
    contexts: ["message_display"]
  });
  messenger.menus.create({
    id: MENU_IDS.dashboard,
    title: translate("menuDashboard", "Tableau de bord des MailPerch"),
    contexts: ["tools_menu"]
  });
  messenger.menus.create({
    id: MENU_IDS.undo,
    title: translate("menuUndo", "Annuler la dernière action des MailPerch"),
    contexts: ["tools_menu"]
  });
  messenger.menus.create({
    id: MENU_IDS.options,
    title: translate("menuOptions", "Paramètres des MailPerch"),
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
        title: state?.allPinned
          ? translate("menuUnpin", "Désépingler la sélection")
          : translate("menuPin", "Épingler la sélection")
      }),
      messenger.menus.update(MENU_IDS.pin, {visible: usable && !state?.allPinned}),
      messenger.menus.update(MENU_IDS.unpin, {visible: usable && Boolean(state?.anyPinned)}),
      messenger.menus.update(MENU_IDS.conversation, {visible: usable})
    ]);
    await messenger.menus.refresh();
  } catch (error) {
    console.debug("MailPerch : menu contextuel non actualisé", error);
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
      case MENU_IDS.pin:
        return await toggleSelected(tab.id, true);
      case MENU_IDS.unpin:
        return await toggleSelected(tab.id, false);
      case MENU_IDS.conversation:
        return await toggleConversation(tab.id);
      case MENU_IDS.displayed:
        return await toggleDisplayed(tab.id);
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

createMenus();
messenger.mailTabs.query({})
  .then(tabs => Promise.all(tabs.map(tab => setupTab(tab.id ?? tab.tabId))))
  .catch(error => logError("initialisation des onglets impossible", error));
