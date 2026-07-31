#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
impl = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
options_html = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
options_js = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
options_css = (ROOT / "extension/options/options.css").read_text(encoding="utf-8")
dashboard_html = (ROOT / "extension/dashboard/dashboard.html").read_text(encoding="utf-8")
dashboard_js = (ROOT / "extension/dashboard/dashboard.js").read_text(encoding="utf-8")
pin_css = (ROOT / "extension/styles/pin.css").read_text(encoding="utf-8")

# Card actions must share one dispatcher and must not depend on the DOM CSS global.
assert "CSS.escape" not in impl
assert "const findCardByStableKey" in impl
assert "const dispatchCardAction" in impl
assert "const runCardAction" in impl
assert "const openContextMenuForCard" in impl
assert impl.index("const runCardAction") < impl.index("const createPanel")
assert 'about3Pane.addEventListener("contextmenu", onPanelContextMenu, true)' in impl
assert 'list.addEventListener("contextmenu"' in impl
assert 'about3Pane.removeEventListener("contextmenu", onPanelContextMenu, true)' in impl
assert 'onPanelClickCapture' not in impl


# The native folder picker must receive a BrowsingContext on current Thunderbird.
assert 'const browsingContext=win?.browsingContext' in impl
assert 'picker.init(browsingContext' in impl
assert 'picker.init(win,' not in impl
assert 'Ci.nsIFilePicker.modeGetFolder' in impl

# The overflow menu must use Thunderbird's native popup layer and resist card dragging.
assert 'document.createXULElement("menupopup")' in impl
assert 'document.createXULElement("menuitem")' in impl
assert 'document.createXULElement("menuseparator")' in impl
assert 'let popupSet = document.querySelector("popupset") || document.getElementById("mainPopupSet")' in impl
assert 'contextMenu.openPopup(trigger, "after_end"' in impl
assert 'contextMenu.openPopupAtScreen(screenX, screenY, true, triggerEvent)' in impl
assert 'contextMenu.addEventListener("command"' in impl
assert 'contextMenu.addEventListener("popuphidden", resetContextMenuState)' in impl
assert 'more.addEventListener("click"' in impl
assert 'more.setAttribute("aria-expanded", "false")' in impl
assert 'dispatchCardAction(card, "more", more, event)' in impl
assert 'button.addEventListener("pointerdown"' in impl
assert 'createNode("div", "pin-mails-context-menu")' not in impl
assert 'contextMenu.style.left' not in impl

# Calendar inventory and writes must check ACL, disabled/read-only state and capabilities.
for token in [
    "lazy.cal.acl.isCalendarWritable",
    "capabilities.tasks.supported",
    "capabilities.events.supported",
    "taskCompatible",
    "eventCompatible",
    "_selectCalendarForItem",
    "_calendarOperationError",
    "MODIFICATION_FAILED",
]:
    assert token in impl
assert ".filter(calendar => !calendar.readOnly && !calendar.disabled)" not in impl
assert "caseItem.calendarItemType || \"task\"" in impl
assert "caseItem.calendarItemType=type" in impl

# Calendar choice is exposed from all user surfaces.
assert "pin-mails-editor-calendar" in impl
assert "pin-mails-calendar-dialog" in impl
assert 'id="preferredCalendarId"' in options_html
assert 'id="calendar-info"' in options_html
assert "calendar.taskCompatible" in options_js
assert "calendar.eventCompatible" in options_js
assert 'id="calendar-target"' in dashboard_html
assert "calendarIdFor" in dashboard_js
assert "pin-mails-calendar-dialog" in pin_css

# Settings remain understandable and feedback follows the active control.
assert 'id="settings-search"' in options_html
assert 'id="settings-nav"' in options_html
assert "enhanceSettingsPage" in options_js
assert "setLocalStatus" in options_js
assert "CONTROL_HELP" in options_js
assert "BUTTON_HELP" in options_js
assert ".settings-toolbar" in options_css and "position: sticky" in options_css
assert ".control-feedback" in options_css
assert ".status-toast" in options_css and "position: fixed" in options_css
assert ".save-dock" in options_css and "position: fixed" in options_css

print("Calendar and card action regression guards: OK")
