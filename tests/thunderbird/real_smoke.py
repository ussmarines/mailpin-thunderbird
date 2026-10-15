#!/usr/bin/env python3
"""Launch a real Thunderbird binary through geckodriver and smoke-test MailPin.

This harness deliberately uses only Python's standard library. It is a
release-binary smoke test, not a replacement for Thunderbird's own mach
xpcshell/mochitest harness.

The WebDriver profile is disposable. Before MailPin is installed, the harness
creates a local-only Thunderbird account and a synthetic folder so about:3pane
has a real message-list view. No network account, credential, or user profile is
ever configured.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import pathlib
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

ADDON_ID = "ussmarines.mailpin@addons.thunderbird.net"
PANEL_ID = "pin-mails-panel"
TOGGLE_ID = "pin-mails-qfb-toggle"
SMOKE_FOLDER_NAME = "MailPin Smoke"


class SmokeFailure(RuntimeError):
    pass


@dataclass
class WebDriverClient:
    host: str
    port: int
    timeout: float = 30.0
    session_id: str | None = None

    @property
    def base_url(self) -> str:
        return f"http://{self.host}:{self.port}"

    def request(self, method: str, path: str, payload: Any | None = None) -> Any:
        data = None
        headers = {"Accept": "application/json"}
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json; charset=utf-8"
        request = urllib.request.Request(
            f"{self.base_url}{path}", data=data, headers=headers, method=method
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                raw = response.read()
        except urllib.error.HTTPError as error:
            raw = error.read()
            detail = raw.decode("utf-8", "replace")[:4000]
            raise SmokeFailure(
                f"WebDriver {method} {path} failed with HTTP {error.code}: {detail}"
            ) from error
        except OSError as error:
            raise SmokeFailure(f"WebDriver {method} {path} failed: {error}") from error
        if not raw:
            return None
        parsed = json.loads(raw)
        if isinstance(parsed, dict) and isinstance(parsed.get("value"), dict):
            value = parsed["value"]
            if value.get("error"):
                raise SmokeFailure(
                    f"WebDriver {method} {path} failed: {value.get('error')}: "
                    f"{value.get('message', '')}"
                )
        return parsed

    def wait_ready(self, deadline: float) -> None:
        last_error: Exception | None = None
        while time.monotonic() < deadline:
            try:
                response = self.request("GET", "/status")
                value = (response or {}).get("value", {})
                if value.get("ready") is True:
                    return
            except Exception as error:  # startup race only
                last_error = error
            time.sleep(0.25)
        raise SmokeFailure(f"geckodriver did not become ready: {last_error}")

    def new_session(self, binary: pathlib.Path) -> dict[str, Any]:
        payload = {
            "capabilities": {
                "alwaysMatch": {
                    "browserName": "firefox",
                    "acceptInsecureCerts": True,
                    "moz:firefoxOptions": {
                        "binary": str(binary),
                        "prefs": {
                            "app.update.auto": False,
                            "app.update.enabled": False,
                            "browser.shell.checkDefaultBrowser": False,
                            "mail.provider.enabled": False,
                            "mail.shell.checkDefaultClient": False,
                            "mailnews.start_page.enabled": False,
                            "toolkit.telemetry.enabled": False,
                        },
                    },
                }
            }
        }
        response = self.request("POST", "/session", payload)
        value = (response or {}).get("value", {})
        session_id = value.get("sessionId") or (response or {}).get("sessionId")
        if not session_id:
            raise SmokeFailure(f"WebDriver session id missing: {response}")
        self.session_id = str(session_id)
        return value.get("capabilities", {})

    def _session_path(self, suffix: str) -> str:
        if not self.session_id:
            raise SmokeFailure("WebDriver session has not been created")
        return f"/session/{self.session_id}{suffix}"

    def set_context(self, context: str) -> None:
        self.request("POST", self._session_path("/moz/context"), {"context": context})

    def install_addon(self, xpi: pathlib.Path, *, temporary: bool = True) -> str:
        response = self.request(
            "POST",
            self._session_path("/moz/addon/install"),
            {"path": str(xpi), "temporary": bool(temporary)},
        )
        addon_id = (response or {}).get("value")
        if addon_id != ADDON_ID:
            raise SmokeFailure(f"Unexpected add-on id: {addon_id!r}")
        return addon_id

    def uninstall_addon(self, addon_id: str) -> None:
        self.request(
            "POST", self._session_path("/moz/addon/uninstall"), {"id": addon_id}
        )

    def execute_async(self, script: str, args: list[Any] | None = None) -> Any:
        response = self.request(
            "POST",
            self._session_path("/execute/async"),
            {"script": script, "args": args or []},
        )
        value = (response or {}).get("value")
        if isinstance(value, dict) and value.get("__mailperchSmokeError"):
            raise SmokeFailure(f"Chrome script failed: {value['__mailperchSmokeError']}")
        return value

    def full_screenshot(self) -> bytes | None:
        try:
            response = self.request("GET", self._session_path("/moz/screenshot/full"))
            encoded = (response or {}).get("value")
            if isinstance(encoded, str) and encoded:
                return base64.b64decode(encoded)
        except Exception:
            return None
        return None

    def delete_session(self) -> None:
        if not self.session_id:
            return
        try:
            self.request("DELETE", self._session_path(""))
        finally:
            self.session_id = None


PROVISION_MAIL_VIEW_SCRIPT = r"""
const done = arguments[arguments.length - 1];
(async () => {
  const { MailServices } = ChromeUtils.importESModule(
    "resource:///modules/MailServices.sys.mjs"
  );
  const { classes: Cc, interfaces: Ci } = Components;
  const windowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(
    Ci.nsIWindowMediator
  );

  const win = windowMediator.getMostRecentWindow("mail:3pane");
  if (!win) {
    throw new Error("No mail:3pane window is available");
  }

  let pane = null;
  try {
    pane = win.document.getElementById("tabmail")?.currentAbout3Pane || null;
  } catch {}
  if (!pane) {
    for (const browser of win.document.querySelectorAll("browser")) {
      try {
        if (browser.contentWindow?.location?.href === "about:3pane") {
          pane = browser.contentWindow;
          break;
        }
      } catch {}
    }
  }
  if (!pane) {
    throw new Error("No about:3pane content window is available");
  }

  const deadline = Date.now() + 10000;
  while (
    Date.now() < deadline &&
    (
      pane.document?.readyState !== "complete" ||
      typeof pane.displayFolder !== "function" ||
      !pane.document?.getElementById("folderTree") ||
      !pane.document?.getElementById("threadTree")
    )
  ) {
    await new Promise(resolve => win.setTimeout(resolve, 50));
  }

  if (typeof pane.displayFolder !== "function") {
    throw new Error("about:3pane displayFolder() is not available");
  }

  let localServer = null;
  try {
    localServer = MailServices.accounts.localFoldersServer;
  } catch {}
  const createdLocalAccount = !localServer;
  if (!localServer) {
    const account = MailServices.accounts.createLocalMailAccount();
    localServer = account?.incomingServer || null;
    if (!localServer) {
      localServer = MailServices.accounts.localFoldersServer;
    }
  }
  if (!localServer?.rootFolder) {
    throw new Error("Local Folders server was not created");
  }

  const root = localServer.rootFolder;
  const folderName = "MailPin Smoke";
  let folder = null;
  try {
    folder = root.getChildNamed(folderName);
  } catch {}
  const createdFolder = !folder;
  if (!folder) {
    root.createSubfolder(folderName, null);
    folder = root.getChildNamed(folderName);
  }
  if (!folder) {
    throw new Error("Synthetic local smoke folder was not created");
  }

  // Folder/server notifications can update the folder tree asynchronously.
  // Give them a bounded opportunity to settle before selecting the folder.
  let displayError = null;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      pane.displayFolder(folder);
      displayError = null;
    } catch (error) {
      displayError = error;
    }
    if (
      pane.gFolder?.URI === folder.URI &&
      pane.gViewWrapper &&
      pane.quickFilterBar
    ) {
      break;
    }
    await new Promise(resolve => win.setTimeout(resolve, 100));
  }
  if (displayError && pane.gFolder?.URI !== folder.URI) {
    throw displayError;
  }

  done({
    createdLocalAccount,
    createdFolder,
    accountCount: Array.from(MailServices.accounts.accounts || []).length,
    localServerKey: String(localServer.key || ""),
    rootUri: String(root.URI || ""),
    folderUri: String(folder.URI || ""),
    selectedFolderUri: String(
      pane.document?.getElementById("folderTree")?.selectedRow?.uri || ""
    ),
    currentFolderUri: String(pane.gFolder?.URI || ""),
    hasViewWrapper: Boolean(pane.gViewWrapper),
    hasQuickFilterBar: Boolean(pane.quickFilterBar),
  });
})().catch(error => done({
  __mailperchSmokeError: [
    `${String(error?.name || "Error")}: ${String(error?.message || error)}`,
    String(error?.stack || ""),
  ].filter(Boolean).join("\n"),
}));
"""


RUNTIME_STATE_SCRIPT = r"""
const done = arguments[arguments.length - 1];
(async () => {
const { AddonManager } = ChromeUtils.importESModule(
  "resource://gre/modules/AddonManager.sys.mjs"
);
const { ExtensionParent } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionParent.sys.mjs"
);
const { MailServices } = ChromeUtils.importESModule(
  "resource:///modules/MailServices.sys.mjs"
);
const { classes: Cc, interfaces: Ci } = Components;
const windowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(
  Ci.nsIWindowMediator
);
const addon = await AddonManager.getAddonByID("ussmarines.mailpin@addons.thunderbird.net");
let extensionInternals = null;
try {
  const extension = ExtensionParent.GlobalManager.getExtension(
    "ussmarines.mailpin@addons.thunderbird.net"
  );
  if (extension) {
    extensionInternals = {
      state: String(extension.state || ""),
      startupReason: String(extension.startupReason || ""),
      backgroundState: String(extension.backgroundState || ""),
      manifestVersion: Number(extension.manifestVersion || 0),
      hasWakeupBackground: typeof extension.wakeupBackground === "function",
      startupStates: extension.startupStates
        ? Array.from(extension.startupStates, value => String(value))
        : [],
    };
  }
} catch (error) {
  extensionInternals = {error: String(error?.name || error)};
}
const windows = [];
for (const win of windowMediator.getEnumerator("mail:3pane")) {
  windows.push(win);
}
const panes = [];
for (const win of windows) {
  const candidates = new Set();
  try {
    const current = win.document.getElementById("tabmail")?.currentAbout3Pane;
    if (current) candidates.add(current);
  } catch {}
  try {
    for (const browser of win.document.querySelectorAll("browser")) {
      const pane = browser.contentWindow;
      if (pane?.location?.href === "about:3pane") candidates.add(pane);
    }
  } catch {}
  for (const pane of candidates) {
    try {
      if (pane?.location?.href !== "about:3pane") continue;
      const document = pane.document;
      const threadTree = Boolean(document?.getElementById("threadTree"));
      const folderTree = Boolean(document?.getElementById("folderTree"));
      const qfbStarred = Boolean(document?.getElementById("qfb-starred"));
      const quickFilterButtons = Boolean(
        document?.querySelector(".quickFilterButtons")
      );
      const viewWrapper = Boolean(pane.gViewWrapper);
      const quickFilterBar = Boolean(pane.quickFilterBar);
      panes.push({
        href: pane.location.href,
        documentReadyState: String(document?.readyState || ""),
        folderTree,
        threadTree,
        qfbStarred,
        quickFilterButtons,
        viewWrapper,
        quickFilterBar,
        displayFolder: typeof pane.displayFolder === "function",
        currentFolderUri: String(pane.gFolder?.URI || ""),
        selectedFolderUri: String(
          document?.getElementById("folderTree")?.selectedRow?.uri || ""
        ),
        nativeReady: Boolean(
          threadTree &&
          qfbStarred &&
          quickFilterButtons &&
          viewWrapper &&
          quickFilterBar
        ),
        panel: Boolean(document?.getElementById("pin-mails-panel")),
        toggle: Boolean(document?.getElementById("pin-mails-qfb-toggle")),
        panelCount: document?.querySelectorAll("#pin-mails-panel")?.length || 0,
        toggleCount:
          document?.querySelectorAll("#pin-mails-qfb-toggle")?.length || 0,
      });
    } catch (error) {
      panes.push({error: String(error?.name || error)});
    }
  }
}
let localServer = null;
try {
  localServer = MailServices.accounts.localFoldersServer;
} catch {}
done({
  addon: addon ? {
    id: addon.id,
    active: Boolean(addon.isActive),
    version: String(addon.version || ""),
    temporarilyInstalled: Boolean(addon.temporarilyInstalled),
  } : null,
  extensionInternals,
  accountCount: Array.from(MailServices.accounts.accounts || []).length,
  localFoldersAvailable: Boolean(localServer),
  windowCount: windows.length,
  panes,
});
})().catch(error => done({
  __mailperchSmokeError: [
    `${String(error?.name || "Error")}: ${String(error?.message || error)}`,
    String(error?.stack || ""),
  ].filter(Boolean).join("\n"),
}));
"""


OPEN_DASHBOARD_SCRIPT = r"""
const done = arguments[arguments.length - 1];
(async () => {
  const { classes: Cc, interfaces: Ci } = Components;
  const windowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(
    Ci.nsIWindowMediator
  );
  const win = windowMediator.getMostRecentWindow("mail:3pane");
  const pane = win?.document.getElementById("tabmail")?.currentAbout3Pane;
  const button = pane?.document?.querySelector(".pin-mails-action-dashboard");
  if (!button || button.hidden) throw new Error("MailPin dashboard button is unavailable");
  button.click();
  const deadline = Date.now() + 10000;
  let dashboardTabs = [];
  while (Date.now() < deadline) {
    const tabs = Array.from(win?.document.getElementById("tabmail")?.tabInfo || []);
    dashboardTabs = tabs.filter(tab => String(
      tab.browser?.currentURI?.spec || tab.chromeBrowser?.currentURI?.spec || ""
    ).includes("dashboard/dashboard.html"));
    if (dashboardTabs.length) break;
    await new Promise(resolve => win.setTimeout(resolve, 100));
  }
  done({opened: dashboardTabs.length === 1, dashboardTabCount: dashboardTabs.length});
})().catch(error => done({
  __mailperchSmokeError: `${String(error?.name || "Error")}: ${String(error?.message || error)}`,
}));
"""


MAIL_BEHAVIOR_SCRIPT = r"""
const done = arguments[arguments.length - 1];
const stage = String(arguments[0]);
(async () => {
  const win = Services.wm.getMostRecentWindow("mail:3pane");
  const tabmail = win.document.getElementById("tabmail");
  const pane = tabmail.currentAbout3Pane;
  const doc = pane.document;
  const folder = pane.gFolder;
  const tree = doc.getElementById("threadTree");
  const sleep = ms => new Promise(resolve => win.setTimeout(resolve, ms));
  const wait = async (test, label) => {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) { if (test()) return; await sleep(50); }
    throw new Error(`Mail behavior timeout: ${label}`);
  };
  const cards = () => [...doc.querySelectorAll(".pin-mails-card")];
  if (stage === "prepare") {
    Services.io.offline = true;
    Services.prefs.setBoolPref("mailnews.mark_message_read.auto", false);
    for (let i = 0; i < 40; i++) {
      folder.QueryInterface(Ci.nsIMsgLocalMailFolder).addMessage([
        "From: smoke@example.invalid", "To: smoke@example.invalid",
        `Subject: MailPin synthetic ${i}`, `Message-ID: <mailpin-smoke-${i}@example.invalid>`,
        `Date: ${new Date(Date.now() - i * 60000).toUTCString()}`,
        `X-Mozilla-Status: ${i % 2 ? "0001" : "0000"}`, "X-Mozilla-Status2: 00000000",
        "Content-Type: text/plain; charset=UTF-8", "", "Synthetic test only.", ""
      ].join("\r\n"));
    }
    pane.displayFolder(folder);
    await wait(() => pane.gDBView?.rowCount === 40, "40 synthetic messages");
    const snapshot = () => ({
      total:folder.getTotalMessages(false), unread:folder.getNumUnread(false),
      newMessages:folder.getNumNewMessages(false),
      flags:Array.from(folder.messages, header => [header.messageId, header.flags]).sort()
    });
    const before = snapshot();
    const button = () => doc.querySelector("#threadTree tr .pin-mails-independent-button");
    await wait(() => button(), "native row pin button");
    button().click(); await wait(() => cards().length === 1, "pin");
    cards()[0].querySelector('[data-card-action="unpin"]').click();
    await wait(() => cards().length === 0, "unpin");
    button().click(); await wait(() => cards().length === 1, "repin");
    const after = snapshot();
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("Pin/unpin changed native flags or counters");
    tree.selectedIndex = 0;
    pane.gDBView.selection.select(0);
    tree.focus();
    done({nativeFlagsAndCountersUnchanged:true, before, after});
    return;
  }
  if (stage === "shortcut-unpin" || stage === "shortcut-pin") {
    const expected = stage === "shortcut-pin" ? 1 : 0;
    await wait(() => cards().length === expected, stage);
    tree.focus();
    done({stage, count:cards().length});
    return;
  }
  const countersAfterShortcuts = {
    total:folder.getTotalMessages(false), unread:folder.getNumUnread(false),
    newMessages:folder.getNumNewMessages(false),
    flags:Array.from(folder.messages, header => [header.messageId, header.flags]).sort()
  };
  const countersBeforeShortcuts = arguments[1];
  for (const key of ["total", "unread", "newMessages", "flags"]) {
    if (JSON.stringify(countersAfterShortcuts[key]) !== JSON.stringify(countersBeforeShortcuts[key])) throw new Error(`Keyboard pin/unpin changed native ${key}: ${JSON.stringify({before:countersBeforeShortcuts[key], after:countersAfterShortcuts[key]})}`);
  }
  // Scroll to a different native row before opening the pinned message.
  tree.scrollToIndex(39, true);
  await sleep(200);
  const scrollBefore = tree.scrollTop;
  if (scrollBefore <= 0) throw new Error("Native scroll precondition was not exercised");
  const header = cards()[0]._pinMessageHeader;
  if (!header) throw new Error("Pinned header unavailable");
  cards()[0].dispatchEvent(new pane.MouseEvent("click", {bubbles:true}));
  await wait(() => pane.messagePane.messageBrowser.contentWindow.gMessage?.messageId === header.messageId, "pinned message displayed");
  await sleep(200);
  const scrollAfter = tree.scrollTop;
  if (scrollAfter !== scrollBefore) throw new Error(`Native list scrolled ${scrollBefore} -> ${scrollAfter}`);
  const unread = folder.getNumUnread(false);
  const unreadButton = doc.getElementById("qfb-unread");
  if (!unreadButton) throw new Error("Native Quick Filter unread button missing");
  unreadButton.click();
  await wait(() => pane.gDBView.rowCount === unread, "Quick Filter unread results");
  if (cards().length !== 1) throw new Error("Quick Filter removed the independent pin card");
  unreadButton.click();
  await wait(() => pane.gDBView.rowCount === 40, "Quick Filter cleared");
  const root = folder.parent;
  root.createSubfolder("MailPin Smoke Empty", null);
  const other = root.getChildNamed("MailPin Smoke Empty");
  pane.displayFolder(other);
  await wait(() => pane.gFolder?.URI === other.URI && pane.gDBView?.rowCount === 0, "empty folder switch");
  pane.displayFolder(folder);
  await wait(() => pane.gFolder?.URI === folder.URI && pane.gDBView?.rowCount === 40 && cards().length === 1, "folder return");
  const originalTab = tabmail.currentTabInfo;
  const newTab = tabmail.openTab("mail3PaneTab", {folderURI:folder.URI});
  await wait(() => tabmail.currentAbout3Pane !== pane && tabmail.currentAbout3Pane?.document.querySelectorAll("#pin-mails-panel").length === 1, "new mail tab single injection");
  tabmail.closeTab(newTab);
  tabmail.switchToTab(originalTab);
  await wait(() => tabmail.currentAbout3Pane === pane && cards().length === 1, "original mail tab restored");
  done({shortcutFlagsAndCountersUnchanged:true, scrollBefore, scrollAfter, messageOpened:true, quickFilterUnread:unread,
    nativeRowsRestored:40, pinCardPreserved:true, folderSwitch:true, mailTabSwitch:true});
})().catch(error => done({__mailperchSmokeError: `${error?.name}: ${error?.message}\n${error?.stack || ""}`}));
"""


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _validate_path(path: str, label: str, executable: bool = False) -> pathlib.Path:
    resolved = pathlib.Path(path).expanduser().resolve()
    if not resolved.is_file():
        raise SmokeFailure(f"{label} does not exist: {resolved}")
    if executable and not os.access(resolved, os.X_OK):
        raise SmokeFailure(f"{label} is not executable: {resolved}")
    return resolved


def _wait_for_state(
    client: WebDriverClient,
    predicate,
    description: str,
    timeout: float,
) -> dict[str, Any]:
    deadline = time.monotonic() + timeout
    last: dict[str, Any] = {}
    while time.monotonic() < deadline:
        value = client.execute_async(RUNTIME_STATE_SCRIPT)
        if isinstance(value, dict):
            last = value
            if predicate(value):
                return value
        time.sleep(0.5)
    raise SmokeFailure(
        f"Timed out waiting for {description}. Last runtime state: "
        f"{json.dumps(last, ensure_ascii=False, sort_keys=True)}"
    )


def _native_mail_view_is_ready(state: dict[str, Any]) -> bool:
    panes = state.get("panes") or []
    return any(
        pane.get("nativeReady")
        and pane.get("currentFolderUri")
        and pane.get("selectedFolderUri")
        for pane in panes
        if isinstance(pane, dict)
    )


def _panel_is_ready(state: dict[str, Any]) -> bool:
    addon = state.get("addon") or {}
    panes = state.get("panes") or []
    return bool(
        addon.get("active")
        and addon.get("id") == ADDON_ID
        and any(
            pane.get("nativeReady")
            and pane.get("panel")
            and pane.get("toggle")
            and pane.get("panelCount") == 1
            and pane.get("toggleCount") == 1
            for pane in panes
            if isinstance(pane, dict)
        )
    )


def _panel_is_cleaned(state: dict[str, Any]) -> bool:
    addon = state.get("addon")
    panes = state.get("panes") or []
    return addon is None and all(
        not pane.get("panel") and not pane.get("toggle")
        for pane in panes
        if isinstance(pane, dict)
    )


def _write_json(path: pathlib.Path, value: Any) -> None:
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def run(args: argparse.Namespace) -> int:
    binary = _validate_path(args.binary, "Thunderbird binary", executable=True)
    xpi = _validate_path(args.xpi, "MailPin XPI")
    geckodriver = _validate_path(args.geckodriver, "geckodriver", executable=True)
    output_dir = pathlib.Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    gecko_log = output_dir / "geckodriver.log"
    result_path = output_dir / "result.json"

    port = _free_port()
    client = WebDriverClient("127.0.0.1", port, timeout=max(10.0, args.timeout))
    process: subprocess.Popen[str] | None = None
    result: dict[str, Any] = {
        "status": "failed",
        "binary": str(binary),
        "xpi": str(xpi),
        "geckodriver": str(geckodriver),
        "port": port,
        "checks": [],
    }

    try:
        with gecko_log.open("w", encoding="utf-8") as log_handle:
            process = subprocess.Popen(
                [
                    str(geckodriver),
                    "--host",
                    "127.0.0.1",
                    "--port",
                    str(port),
                    "--allow-system-access",
                    "--log",
                    "trace",
                ],
                stdout=log_handle,
                stderr=subprocess.STDOUT,
                text=True,
            )
            client.wait_ready(time.monotonic() + args.timeout)
            result["checks"].append("geckodriver-ready")

            capabilities = client.new_session(binary)
            result["capabilities"] = capabilities
            result["checks"].append("thunderbird-webdriver-session")

            client.set_context("chrome")
            result["checks"].append("chrome-context")

            # A pristine Thunderbird profile opens about:3pane without an active
            # message folder. MailPin intentionally waits for gViewWrapper and
            # quickFilterBar before touching Thunderbird's DOM, so create a
            # local-only folder first. This mirrors the precondition present on
            # a configured user profile without introducing network traffic.
            provisioning = client.execute_async(PROVISION_MAIL_VIEW_SCRIPT)
            if not isinstance(provisioning, dict) or not provisioning.get("folderUri"):
                raise SmokeFailure(
                    f"Synthetic local mail view provisioning failed: {provisioning!r}"
                )
            result["provisioning"] = provisioning
            result["checks"].append("synthetic-local-mail-view")

            native_state = _wait_for_state(
                client,
                _native_mail_view_is_ready,
                "native Thunderbird mail view readiness",
                args.timeout,
            )
            result["nativeMailView"] = native_state
            result["checks"].append("native-mail-view-ready")

            addon_id = client.install_addon(xpi)
            result["checks"].append("temporary-addon-install")
            after_install = client.execute_async(RUNTIME_STATE_SCRIPT)
            if isinstance(after_install, dict):
                result["afterInstallRuntime"] = after_install

            first = _wait_for_state(
                client,
                _panel_is_ready,
                "MailPin panel injection",
                args.timeout,
            )
            result["firstInstall"] = first
            result["checks"].append("panel-and-toggle-injected-once")
            result["pinInvariants"] = client.execute_async(MAIL_BEHAVIOR_SCRIPT, ["prepare"])
            result["checks"].append("pin-unpin-native-flags-and-counters")
            for stage in ("shortcut-unpin", "shortcut-pin"):
                client.request("POST", client._session_path("/actions"), {"actions": [{
                    "type": "key", "id": "mailpin-keyboard", "actions": [
                        {"type": "keyDown", "value": "\ue00a"},
                        {"type": "keyDown", "value": "p"},
                        {"type": "keyUp", "value": "p"},
                        {"type": "keyUp", "value": "\ue00a"},
                    ]
                }]})
                result[stage] = client.execute_async(MAIL_BEHAVIOR_SCRIPT, [stage])
                result["checks"].append(stage)
            result["mailBehavior"] = client.execute_async(MAIL_BEHAVIOR_SCRIPT, ["finish", result["pinInvariants"]["before"]])
            result["checks"].append("message-open-scroll-quick-filter-folder-and-tab")
            dashboard_open = client.execute_async(OPEN_DASHBOARD_SCRIPT)
            if not isinstance(dashboard_open, dict) or not dashboard_open.get("opened"):
                raise SmokeFailure(f"Dashboard did not open exactly once: {dashboard_open!r}")
            result["dashboardOpen"] = dashboard_open
            result["checks"].append("panel-dashboard-button-opens-dashboard-once")
            screenshot = client.full_screenshot()
            if screenshot:
                (output_dir / "mailperch-installed.png").write_bytes(screenshot)

            client.uninstall_addon(addon_id)
            cleaned = _wait_for_state(
                client,
                _panel_is_cleaned,
                "MailPin runtime cleanup after temporary uninstall",
                args.timeout,
            )
            result["afterUninstall"] = cleaned
            result["checks"].append("runtime-cleanup-after-uninstall")

            client.install_addon(xpi)
            reinstalled = _wait_for_state(
                client,
                _panel_is_ready,
                "MailPin panel reinjection after reinstall",
                args.timeout,
            )
            result["afterReinstall"] = reinstalled
            result["checks"].append("clean-reinstall")
            screenshot = client.full_screenshot()
            if screenshot:
                (output_dir / "mailperch-reinstalled.png").write_bytes(screenshot)

            result["status"] = "passed"
            _write_json(result_path, result)
            print("Real Thunderbird runtime smoke: OK")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            return 0
    except Exception as error:
        result["error"] = f"{type(error).__name__}: {error}"
        try:
            state = client.execute_async(RUNTIME_STATE_SCRIPT)
            if isinstance(state, dict):
                result["lastRuntimeState"] = state
        except Exception:
            pass
        _write_json(result_path, result)
        print(f"Real Thunderbird runtime smoke: FAILED: {error}", file=sys.stderr)
        return 1
    finally:
        try:
            client.delete_session()
        except Exception:
            pass
        if process is not None:
            try:
                process.terminate()
                process.wait(timeout=10)
            except Exception:
                try:
                    process.kill()
                except Exception:
                    pass
        if not result_path.exists():
            _write_json(result_path, result)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, help="Path to the Thunderbird executable")
    parser.add_argument("--xpi", required=True, help="Path to the MailPin XPI")
    parser.add_argument("--geckodriver", required=True, help="Path to geckodriver")
    parser.add_argument("--output-dir", default="artifacts/thunderbird-smoke")
    parser.add_argument("--timeout", type=float, default=45.0)
    return parser.parse_args()


if __name__ == "__main__":
    raise SystemExit(run(parse_args()))
