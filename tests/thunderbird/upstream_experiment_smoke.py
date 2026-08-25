#!/usr/bin/env python3
"""Real Thunderbird smoke for the staged MessageListAction Experiment.

The profile is disposable and local-only. The harness creates one synthetic
message in Local Folders, installs the staged Experiment as a temporary add-on,
checks table/cards rendering and click state, then verifies uninstall cleanup.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import subprocess
import time
from typing import Any

from real_smoke import SmokeFailure, WebDriverClient, _free_port, _validate_path

ADDON_ID = "MessageListAction@thunderbird.api.development"
BUTTON_CLASS = "webext-message-list-action"


PROVISION_MESSAGE_SCRIPT = r"""
const done = arguments[arguments.length - 1];
(async () => {
  const { MailServices } = ChromeUtils.importESModule(
    "resource:///modules/MailServices.sys.mjs"
  );
  const { interfaces: Ci } = Components;
  const win = Services.wm.getMostRecentWindow("mail:3pane");
  if (!win) {
    throw new Error("No mail:3pane window");
  }
  const pane = win.document.getElementById("tabmail")?.currentAbout3Pane;
  if (!pane) {
    throw new Error("No current about:3pane");
  }

  const readyDeadline = Date.now() + 10000;
  while (
    Date.now() < readyDeadline &&
    (!pane.document?.getElementById("threadTree") || typeof pane.displayFolder !== "function")
  ) {
    await new Promise(resolve => win.setTimeout(resolve, 50));
  }

  let localServer = null;
  try {
    localServer = MailServices.accounts.localFoldersServer;
  } catch {}
  if (!localServer) {
    const account = MailServices.accounts.createLocalMailAccount();
    localServer = account?.incomingServer || MailServices.accounts.localFoldersServer;
  }
  const root = localServer.rootFolder;
  const folderName = "MessageListAction Smoke";
  let folder = null;
  try {
    folder = root.getChildNamed(folderName);
  } catch {}
  if (!folder) {
    root.createSubfolder(folderName, null);
    folder = root.getChildNamed(folderName);
  }
  if (!folder) {
    throw new Error("Could not create local smoke folder");
  }

  const localFolder = folder.QueryInterface(Ci.nsIMsgLocalMailFolder);
  const raw = [
    "From - Mon Aug 25 10:00:00 2026",
    "From: Sender <sender@example.invalid>",
    "To: Recipient <recipient@example.invalid>",
    "Subject: MessageListAction smoke message",
    "Date: Tue, 25 Aug 2026 10:00:00 +0000",
    "Message-ID: <message-list-action-smoke@example.invalid>",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    "Synthetic local-only message for the MessageListAction runtime smoke.",
    ""
  ].join("\r\n");
  const header = localFolder.addMessage(raw);

  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      pane.displayFolder(folder);
    } catch {}
    if (pane.gFolder?.URI === folder.URI && (pane.gDBView?.rowCount || 0) > 0) {
      break;
    }
    await new Promise(resolve => win.setTimeout(resolve, 100));
  }
  if ((pane.gDBView?.rowCount || 0) < 1) {
    throw new Error("Synthetic message did not appear in the message list");
  }

  const listedHeader = pane.gDBView.getMsgHdrAt(0);
  done({
    folderUri: String(folder.URI || ""),
    rowCount: Number(pane.gDBView.rowCount || 0),
    messageKey: Number(listedHeader.messageKey),
    flags: Number(listedHeader.flags),
    totalMessages: Number(folder.getTotalMessages(false)),
    unreadMessages: Number(folder.getNumUnread(false)),
    insertedMessageKey: Number(header.messageKey),
  });
})().catch(error => done({
  __mailperchSmokeError: `${String(error?.name || "Error")}: ${String(error?.message || error)}\n${String(error?.stack || "")}`,
}));
"""


STATE_SCRIPT = rf"""
const done = arguments[arguments.length - 1];
(async () => {{
  const {{ AddonManager }} = ChromeUtils.importESModule(
    "resource://gre/modules/AddonManager.sys.mjs"
  );
  const addon = await AddonManager.getAddonByID("{ADDON_ID}");
  const win = Services.wm.getMostRecentWindow("mail:3pane");
  const pane = win?.document.getElementById("tabmail")?.currentAbout3Pane;
  const document = pane?.document;
  const threadTree = document?.getElementById("threadTree");
  const rows = Array.from(document?.querySelectorAll("#threadTree tr") || []);
  const buttons = Array.from(document?.querySelectorAll(".{BUTTON_CLASS}") || []);
  let header = null;
  try {{
    header = (pane?.gDBView?.rowCount || 0) > 0 ? pane.gDBView.getMsgHdrAt(0) : null;
  }} catch {{}}
  const folder = pane?.gFolder || null;
  done({{
    addonActive: Boolean(addon?.isActive),
    addonPresent: Boolean(addon),
    rowCount: Number(pane?.gDBView?.rowCount || 0),
    renderedRows: rows.length,
    cardRows: rows.filter(row => row.classList.contains("card-layout")).length,
    threadRowsMode: String(threadTree?.getAttribute("rows") || ""),
    buttonCount: buttons.length,
    buttonPressed: buttons[0]?.getAttribute("aria-pressed") || "",
    buttonTitle: buttons[0]?.getAttribute("title") || "",
    flags: header ? Number(header.flags) : null,
    messageKey: header ? Number(header.messageKey) : null,
    totalMessages: folder ? Number(folder.getTotalMessages(false)) : null,
    unreadMessages: folder ? Number(folder.getNumUnread(false)) : null,
  }});
}})().catch(error => done({{
  __mailperchSmokeError: `${{String(error?.name || "Error")}}: ${{String(error?.message || error)}}`,
}}));
"""


CLICK_ACTION_SCRIPT = rf"""
const done = arguments[arguments.length - 1];
(async () => {{
  const win = Services.wm.getMostRecentWindow("mail:3pane");
  const pane = win?.document.getElementById("tabmail")?.currentAbout3Pane;
  const button = pane?.document?.querySelector(".{BUTTON_CLASS}");
  if (!button) {{
    throw new Error("MessageListAction button is missing");
  }}
  button.click();
  done({{clicked: true}});
}})().catch(error => done({{
  __mailperchSmokeError: `${{String(error?.name || "Error")}}: ${{String(error?.message || error)}}`,
}}));
"""


SWITCH_LAYOUT_SCRIPT = r"""
const target = arguments[0];
const done = arguments[arguments.length - 1];
(async () => {
  const win = Services.wm.getMostRecentWindow("mail:3pane");
  const pane = win?.document.getElementById("tabmail")?.currentAbout3Pane;
  if (!pane) {
    throw new Error("No current about:3pane");
  }
  const itemId = target === "cards" ? "threadPaneCardsView" : "threadPaneTableView";
  const menuitem = pane.document.getElementById(itemId);
  if (!menuitem) {
    throw new Error(`Missing Thunderbird layout menuitem: ${itemId}`);
  }
  if (typeof menuitem.doCommand === "function") {
    menuitem.doCommand();
  } else {
    menuitem.dispatchEvent(new pane.Event("command", {bubbles: true, cancelable: true}));
  }
  await new Promise(resolve => win.setTimeout(resolve, 250));
  done({target, itemId});
})().catch(error => done({
  __mailperchSmokeError: `${String(error?.name || "Error")}: ${String(error?.message || error)}`,
}));
"""


def _write_json(path: pathlib.Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _wait_state(client: WebDriverClient, predicate, description: str, timeout: float) -> dict[str, Any]:
    deadline = time.monotonic() + timeout
    last: dict[str, Any] = {}
    while time.monotonic() < deadline:
        value = client.execute_async(STATE_SCRIPT)
        if isinstance(value, dict):
            last = value
            if predicate(value):
                return value
        time.sleep(0.25)
    raise SmokeFailure(f"Timed out waiting for {description}: {json.dumps(last, sort_keys=True)}")


def _install(client: WebDriverClient, xpi: pathlib.Path) -> str:
    response = client.request(
        "POST",
        client._session_path("/moz/addon/install"),
        {"path": str(xpi), "temporary": True},
    )
    addon_id = (response or {}).get("value")
    if addon_id != ADDON_ID:
        raise SmokeFailure(f"Unexpected add-on id: {addon_id!r}")
    return str(addon_id)


def _uninstall(client: WebDriverClient) -> None:
    client.request(
        "POST",
        client._session_path("/moz/addon/uninstall"),
        {"id": ADDON_ID},
    )


def _assert_native_state_unchanged(baseline: dict[str, Any], current: dict[str, Any]) -> None:
    for key in ("flags", "totalMessages", "unreadMessages", "messageKey"):
        if current.get(key) != baseline.get(key):
            raise SmokeFailure(
                f"Native message state changed for {key}: "
                f"{baseline.get(key)!r} -> {current.get(key)!r}"
            )


def run(args: argparse.Namespace) -> int:
    binary = _validate_path(args.binary, "Thunderbird binary", executable=True)
    xpi = _validate_path(args.xpi, "MessageListAction XPI")
    geckodriver = _validate_path(args.geckodriver, "geckodriver", executable=True)
    output_dir = pathlib.Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    gecko_log = output_dir / "geckodriver.log"
    result_path = output_dir / "result.json"

    client = WebDriverClient("127.0.0.1", _free_port(), timeout=max(10.0, args.timeout))
    process: subprocess.Popen[str] | None = None
    result: dict[str, Any] = {"status": "failed", "checks": []}

    try:
        with gecko_log.open("w", encoding="utf-8") as log_handle:
            process = subprocess.Popen(
                [
                    str(geckodriver),
                    "--host", "127.0.0.1",
                    "--port", str(client.port),
                    "--allow-system-access",
                    "--log", "trace",
                ],
                stdout=log_handle,
                stderr=subprocess.STDOUT,
                text=True,
            )
            client.wait_ready(time.monotonic() + args.timeout)
            result["checks"].append("geckodriver-ready")
            result["capabilities"] = client.new_session(binary)
            result["checks"].append("thunderbird-session")
            client.set_context("chrome")

            provisioning = client.execute_async(PROVISION_MESSAGE_SCRIPT)
            if not isinstance(provisioning, dict) or provisioning.get("rowCount") != 1:
                raise SmokeFailure(f"Unexpected provisioning state: {provisioning!r}")
            result["provisioning"] = provisioning
            baseline = {
                key: provisioning[key]
                for key in ("flags", "totalMessages", "unreadMessages", "messageKey")
            }
            result["checks"].append("one-local-message-provisioned")

            _install(client, xpi)
            installed = _wait_state(
                client,
                lambda state: state.get("addonActive") and state.get("buttonCount") == 1,
                "one MessageListAction button",
                args.timeout,
            )
            _assert_native_state_unchanged(baseline, installed)
            result["installed"] = installed
            result["checks"].append("action-injected-once")

            client.execute_async(CLICK_ACTION_SCRIPT)
            clicked = _wait_state(
                client,
                lambda state: state.get("buttonPressed") == "true"
                and state.get("buttonTitle") == "Stop tracking message",
                "clicked active state",
                args.timeout,
            )
            _assert_native_state_unchanged(baseline, clicked)
            result["clicked"] = clicked
            result["checks"].append("onclick-message-conversion-and-state")
            result["checks"].append("native-message-state-unchanged")

            client.execute_async(SWITCH_LAYOUT_SCRIPT, ["table"])
            table = _wait_state(
                client,
                lambda state: state.get("renderedRows", 0) >= 1
                and state.get("cardRows") == 0
                and state.get("buttonCount") == 1,
                "table layout action",
                args.timeout,
            )
            _assert_native_state_unchanged(baseline, table)
            result["table"] = table
            result["checks"].append("table-layout")

            client.execute_async(SWITCH_LAYOUT_SCRIPT, ["cards"])
            cards = _wait_state(
                client,
                lambda state: state.get("cardRows", 0) >= 1 and state.get("buttonCount") == 1,
                "cards layout action",
                args.timeout,
            )
            _assert_native_state_unchanged(baseline, cards)
            result["cards"] = cards
            result["checks"].append("cards-layout")

            screenshot = client.full_screenshot()
            if screenshot:
                (output_dir / "message-list-action.png").write_bytes(screenshot)

            _uninstall(client)
            cleaned = _wait_state(
                client,
                lambda state: not state.get("addonPresent") and state.get("buttonCount") == 0,
                "Experiment cleanup",
                args.timeout,
            )
            _assert_native_state_unchanged(baseline, cleaned)
            result["cleaned"] = cleaned
            result["checks"].append("uninstall-cleanup")
            result["status"] = "passed"
    except Exception as error:
        result["error"] = f"{type(error).__name__}: {error}"
        raise
    finally:
        _write_json(result_path, result)
        try:
            client.delete_session()
        except Exception:
            pass
        if process is not None and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True)
    parser.add_argument("--xpi", required=True)
    parser.add_argument("--geckodriver", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--timeout", type=float, default=45.0)
    return run(parser.parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
