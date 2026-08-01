from __future__ import annotations

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
EXT = ROOT / "extension"
manifest = json.loads((EXT / "manifest.json").read_text(encoding="utf-8"))
version = manifest["version"]

assert manifest["manifest_version"] == 3
assert version == "3.2.12"
assert manifest["permissions"] == ["menus"]
assert manifest["browser_specific_settings"]["gecko"]["id"] == "pin-mails@MailPerch.local"
assert manifest["browser_specific_settings"]["gecko"]["strict_min_version"] == "128.0"
assert manifest["browser_specific_settings"]["gecko"]["strict_max_version"] == "153.*"
assert manifest["default_locale"] == "fr"
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
fr_locale = json.loads((EXT / "_locales/fr/messages.json").read_text(encoding="utf-8"))
en_locale = json.loads((EXT / "_locales/en/messages.json").read_text(encoding="utf-8"))
assert package["name"] == "mailperch-thunderbird"
assert fr_locale["extensionName"]["message"] == "MailPerch — Email Pins & Follow-up"
assert en_locale["extensionName"]["message"] == "MailPerch — Email Pins & Follow-up"
assert fr_locale["brandSubtitle"]["message"] == "Épinglez, organisez et suivez vos e-mails dans Thunderbird."
assert en_locale["brandSubtitle"]["message"] == "Pin, organize and follow up on your emails in Thunderbird."
assert en_locale["brandSlogan"]["message"] == "Keep important mail within reach."
assert manifest["options_ui"]["page"] == "options/options.html"
assert manifest["content_security_policy"]["extension_pages"] == "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"

required_commands = {
    "toggle-pin-selected", "toggle-conversation-selected", "complete-selected-pin",
    "open-pin-dashboard", "wait-selected-pin", "plan-selected-pin", "activate-selected-pin"
}
assert required_commands <= set(manifest["commands"])
assert "message_display_action" in manifest and "action" in manifest
assert "pinInbox" in manifest["experiment_apis"]

schema = json.loads((EXT / "api/pinInbox/schema.json").read_text(encoding="utf-8"))
names = {item["name"] for item in schema[0]["functions"]}
events = {item["name"] for item in schema[0].get("events", [])}
required_api = {
    "setup", "toggleSelected", "toggleConversationSelected", "toggleDisplayed",
    "getSelectionState", "performSelected", "getConfiguration", "setConfiguration",
    "exportConfiguration", "importConfiguration", "resetConfiguration", "cleanupBroken",
    "rescanPinned", "undoLast", "repairReferences", "resetInterface", "importNativeStars",
    "getDiagnosticReport", "getDashboardData", "openReference", "performReferenceAction",
    "getCalendars", "createCalendarItem", "createCaseCalendarItem", "snoozeReminder",
    "runCompatibilityCheck", "getPerformanceReport", "checkStorageIntegrity", "runBackup",
    "getBackupStatus", "chooseBackupDirectory", "simulateRules", "clearRuleLog", "getCases",
    "getTemplates", "getHistory", "setWorkflowStatus", "createCase", "updateCase", "deleteCase",
    "createTemplate", "updateTemplate", "deleteTemplate", "applyTemplate", "syncCalendarLinks"
}
assert required_api <= names, sorted(required_api - names)
assert "onDashboardRequested" in events

required_runtime = [
    "background.js", "api/pinInbox/implementation.js", "api/pinInbox/schema.json",
    "api/pinInbox/modules/identity.js", "api/pinInbox/modules/storage.js",
    "api/pinInbox/modules/workflow.js", "api/pinInbox/modules/rules.js",
    "api/pinInbox/modules/calendar.js", "options/options.html", "options/options.css",
    "options/options-bootstrap.js", "options/options.js", "dashboard/dashboard.html", "dashboard/dashboard.css",
    "dashboard/dashboard.js", "styles/pin.css", "icons/pin.svg",
    "icons/pin-regular.svg", "icons/pin-filled.svg", "icons/conversation.svg",
    "icons/dashboard.svg", "icons/add.svg", "_locales/fr/messages.json",
    "_locales/en/messages.json"
]
for relative in required_runtime:
    assert (EXT / relative).is_file(), relative

for path in EXT.rglob("*.js"):
    text = path.read_text(encoding="utf-8")
    assert "eval(" not in text, path
    assert "new Function" not in text, path
    assert ".innerHTML" not in text, path
    assert ".outerHTML" not in text, path
    assert "insertAdjacentHTML" not in text, path
    assert not re.search(r"(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(", text), path
    assert not re.search(r"https?://", text), path

for path in EXT.rglob("*.json"):
    json.loads(path.read_text(encoding="utf-8"))

impl = (EXT / "api/pinInbox/implementation.js").read_text(encoding="utf-8")
for needle in [
    'DB_FILENAME = "pin-mails-v2.sqlite"', "DB_SCHEMA_VERSION = 5", "class PinStructuredStore",
    "PRAGMA journal_mode=WAL", "PRAGMA quick_check", "PRAGMA optimize", "PRAGMA wal_checkpoint",
    "_writeIncremental", "mapDiff", "listDiff", "databaseRevision", "concurrentWrite",
    "_checkCompatibility", "_registerFolderListener", "msgsMoveCopyCompleted", "msgKeyChanged",
    "_toggleConversationSelectedByTab", "_getDashboardData", "_createCalendarItem",
    "_syncReferenceToCalendar", "_applyCustomRules", "_simulateRules", "_scheduleCounterRegressionCheck",
    "MailUtils.displayMessageInFolderTab", "pin-mails-independent-button", "about3Pane.messagePane.displayMessage",
    "onDashboardRequested", "event.stopImmediatePropagation()", 'event.key === "ContextMenu"',
    'document.createXULElement("menupopup")', 'contextMenu.openPopupAtScreen',
    "clearDropTargets", "startupcache-invalidate"
]:
    assert needle in impl, needle

assert "threadTree.scrollToIndex" not in impl
assert "threadTree.selectedIndex =" not in impl
assert "host.appendChild(badge)" not in impl
assert "contentTab" not in impl
assert "settings.showFolderBadge = false" in impl
assert 'this._extensionVersion = String(context.extension.manifest?.version || "0.0.0")' in impl
assert 'extension: {version: this._extensionVersion || "0.0.0"' in impl
assert 'let popupSet = document.querySelector("popupset") || document.getElementById("mainPopupSet")' in impl
assert 'contextMenu?.remove()' in impl

css = (EXT / "styles/pin.css").read_text(encoding="utf-8")
for needle in [
    "#pin-mails-qfb-toggle", ".pin-mails-independent-button",
    "position: fixed", ".pin-mails-action-dashboard", "#pin-mails-panel [data-drop-target]",
    "@media (prefers-reduced-motion: reduce)", "@media (forced-colors: active)",
    ".pin-mails-folder-badge { display: none !important; }"
]:
    assert needle in css, needle
assert ".pin-mails-context-menu" not in css

background = (EXT / "background.js").read_text(encoding="utf-8")
assert "messenger.pinInbox?.onDashboardRequested.addListener(openDashboard)" in background
assert 'messenger.tabs.create({' in background

for icon in EXT.glob("icons/*.svg"):
    text = icon.read_text(encoding="utf-8")
    assert 'viewBox="0 0 24 24"' in text
    assert "<script" not in text.lower()
    assert "foreignObject" not in text

for path in ROOT.rglob("*"):
    if path.is_file() and ".git" not in path.parts:
        assert path.stat().st_size < 3_500_000, path

print(f"Static checks {version}: OK")
