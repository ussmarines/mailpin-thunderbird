/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global ExtensionCommon, Services */

"use strict";

(function(exports) {
  const {EventEmitter, EventManager, ExtensionAPI} = ExtensionCommon;
  const BUTTON_CLASS = "webext-message-list-action";

  function normalizeState(state = {}) {
    return {
      visible: state.visible !== false,
      enabled: state.enabled !== false,
      active: Boolean(state.active),
      title: typeof state.title === "string" ? state.title.slice(0, 128) : "",
    };
  }

  class MessageListActionAPI extends ExtensionAPI {
    constructor(extension) {
      super(extension);
      this.extension = extension;
      this.context = null;
      this.emitter = new EventEmitter();
      this.details = null;
      this.states = new Map();
      this.panes = new Set();
    }

    getAPI(context) {
      this.context = context;
      context.callOnClose(this);

      return {
        MessageListAction: {
          register: async details => {
            this.details = {
              title: String(details?.title || "").slice(0, 128),
              icons: details?.icons || {},
            };
            this._attachOpenPanes();
            this._refreshAll();
          },
          update: async details => {
            if (!this.details) {
              throw new ExtensionCommon.ExtensionError("MessageListAction is not registered");
            }
            this.details = {
              ...this.details,
              title: String(details?.title || this.details.title || "").slice(0, 128),
              icons: details?.icons || this.details.icons || {},
            };
            this._refreshAll();
          },
          unregister: async () => {
            this.details = null;
            this.states.clear();
            this._detachAllPanes();
          },
          setState: async (messageId, state) => {
            if (!this.details) {
              throw new ExtensionCommon.ExtensionError("MessageListAction is not registered");
            }

            // Current Thunderbird exposes MessageManager.get(id) as the
            // message-id -> nsIMsgDBHdr bridge. Keep that privileged detail
            // here so the public API remains expressed in WebExtension ids.
            const header = context.extension.messageManager.get(messageId);
            if (!header) {
              throw new ExtensionCommon.ExtensionError(`Unknown message id: ${messageId}`);
            }
            this.states.set(messageId, {header, state: normalizeState(state)});
            this._attachOpenPanes();
            this._refreshAll();
          },
          clearState: async messageId => {
            this.states.delete(messageId);
            this._refreshAll();
          },
          clearAllStates: async () => {
            this.states.clear();
            this._refreshAll();
          },
          onClicked: new EventManager({
            context,
            name: "MessageListAction.onClicked",
            register: fire => {
              const listener = async (_event, messageId, nativeTab) => {
                const message = await context.extension.messageManager.convert(
                  this.states.get(messageId)?.header
                );
                const tab = context.extension.tabManager.convert(nativeTab);
                return fire.async(message, tab);
              };
              this.emitter.on("clicked", listener);
              return () => this.emitter.off("clicked", listener);
            },
          }).api(),
        },
      };
    }

    _headersEqual(left, right) {
      if (!left || !right) {
        return false;
      }
      if (left === right) {
        return true;
      }
      try {
        return left.folder === right.folder && left.messageKey === right.messageKey;
      } catch {
        return false;
      }
    }

    _entryForHeader(header) {
      for (const [messageId, entry] of this.states) {
        if (this._headersEqual(entry.header, header)) {
          return {messageId, ...entry};
        }
      }
      return null;
    }

    _resolveIcon() {
      const icons = this.details?.icons || {};
      const path = icons["16"] || icons[16] || icons["32"] || icons[32] || "";
      return path ? this.extension.baseURI.resolve(path) : "";
    }

    _attachOpenPanes() {
      for (const window of Services.wm.getEnumerator("mail:3pane")) {
        const tabmail = window.document.getElementById("tabmail");
        for (const tab of tabmail?.tabInfo || []) {
          const pane = tab?.chromeBrowser?.contentWindow;
          if (pane?.document?.getElementById("threadTree")) {
            this._attachPane(pane, tab);
          }
        }
      }
    }

    _attachPane(pane, nativeTab) {
      if ([...this.panes].some(item => item.pane === pane)) {
        return;
      }
      const threadTree = pane.document.getElementById("threadTree");
      if (!threadTree) {
        return;
      }

      const refresh = () => this._patchPane(pane, nativeTab);
      const observer = new pane.MutationObserver(refresh);
      observer.observe(threadTree, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["data-properties"],
      });
      threadTree.addEventListener("rowcountchange", refresh);
      pane.addEventListener("folderURIChanged", refresh);

      const click = event => {
        const button = event.target?.closest?.(`.${BUTTON_CLASS}`);
        if (!button) {
          return;
        }
        const row = button.closest("tr");
        const index = Number(row?.index);
        if (!Number.isInteger(index) || index < 0) {
          return;
        }
        let header = null;
        try {
          header = pane.gDBView?.getMsgHdrAt(index) || null;
        } catch {}
        const entry = this._entryForHeader(header);
        if (!entry || entry.state.enabled === false) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.emitter.emit("clicked", entry.messageId, nativeTab);
      };
      pane.document.addEventListener("click", click, true);

      const cleanup = () => {
        observer.disconnect();
        threadTree.removeEventListener("rowcountchange", refresh);
        pane.removeEventListener("folderURIChanged", refresh);
        pane.document.removeEventListener("click", click, true);
        for (const button of pane.document.querySelectorAll(`.${BUTTON_CLASS}`)) {
          button.remove();
        }
        this.panes.delete(record);
      };
      const record = {pane, nativeTab, refresh, cleanup};
      this.panes.add(record);
      pane.addEventListener("unload", cleanup, {once: true});
      refresh();
    }

    _patchPane(pane) {
      if (!this.details) {
        return;
      }
      const icon = this._resolveIcon();
      for (const row of pane.document.querySelectorAll("#threadTree tr")) {
        const index = Number(row?.index);
        if (!Number.isInteger(index) || index < 0 || index >= (pane.gDBView?.rowCount || 0)) {
          continue;
        }
        let header = null;
        try {
          header = pane.gDBView.getMsgHdrAt(index);
        } catch {}
        const entry = this._entryForHeader(header);
        let button = row.querySelector(`.${BUTTON_CLASS}`);
        if (!entry || entry.state.visible === false) {
          button?.remove();
          continue;
        }
        if (!button) {
          button = pane.document.createElement("button");
          button.type = "button";
          button.className = BUTTON_CLASS;
          const host = row.classList.contains("card-layout")
            ? row.querySelector(".thread-card-icon-info")
            : row.querySelector("td.subjectcol-column") || row.lastElementChild;
          host?.appendChild(button);
        }
        const title = entry.state.title || this.details.title;
        button.title = title;
        button.setAttribute("aria-label", title);
        button.setAttribute("aria-pressed", String(entry.state.active));
        button.disabled = entry.state.enabled === false;
        button.toggleAttribute("data-active", entry.state.active);
        if (icon) {
          button.style.backgroundImage = `url(${JSON.stringify(icon).slice(1, -1)})`;
          button.style.backgroundRepeat = "no-repeat";
          button.style.backgroundPosition = "center";
          button.style.backgroundSize = "16px 16px";
        }
      }
    }

    _refreshAll() {
      for (const {refresh} of this.panes) {
        try {
          refresh();
        } catch (error) {
          console.error("MessageListAction refresh failed", error);
        }
      }
    }

    _detachAllPanes() {
      for (const {cleanup} of [...this.panes]) {
        try {
          cleanup();
        } catch (error) {
          console.error("MessageListAction cleanup failed", error);
        }
      }
      this.panes.clear();
    }

    close() {
      this.details = null;
      this.states.clear();
      this._detachAllPanes();
      this.context = null;
    }

    onShutdown(isAppShutdown) {
      this.close();
      if (!isAppShutdown) {
        Services.obs.notifyObservers(null, "startupcache-invalidate");
      }
    }
  }

  exports.MessageListAction = MessageListActionAPI;
})(this);
