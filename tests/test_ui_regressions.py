from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / "extension"
impl = (EXT / "api/pinInbox/implementation.js").read_text(encoding="utf-8")
css = (EXT / "styles/pin.css").read_text(encoding="utf-8")
background = (EXT / "background.js").read_text(encoding="utf-8")
dashboard_html = (EXT / "dashboard/dashboard.html").read_text(encoding="utf-8")
dashboard_css = (EXT / "dashboard/dashboard.css").read_text(encoding="utf-8")
dashboard_js = (EXT / "dashboard/dashboard.js").read_text(encoding="utf-8")

# Dashboard must be opened from the WebExtension background, not from chrome UI.
assert "onDashboardRequested" in impl
assert "contentTab" not in impl
assert "_dashboardRequestPending" in impl
assert "onDashboardRequested.addListener(openDashboard)" in background
assert 'messenger.tabs.create({' in background
assert 'href="./dashboard.css"' in dashboard_html
assert 'src="./dashboard.js"' in dashboard_html
assert "fatal-error" in dashboard_html and "data-loading" in dashboard_css
assert "getDashboardData" in dashboard_js

# Pinned cards have a context menu captured before Thunderbird's native menu.
assert 'document.addEventListener("contextmenu", onPanelContextMenu, true)' in impl
assert 'list.addEventListener("contextmenu"' not in impl
assert "event.composedPath()" in impl
assert "event.stopImmediatePropagation()" in impl
assert 'event.key === "ContextMenu"' in impl
assert 'event.shiftKey && event.key === "F10"' in impl
assert "document.body.appendChild(contextMenu)" in impl
assert "contextMenu?.remove()" in impl
assert ".pin-mails-context-menu" in css and "position: fixed" in css

# Reading a card is an active state, not a persistent bulk selection.
click_start = impl.index('list.addEventListener("click"')
click_end = impl.index('list.addEventListener("keydown"', click_start)
click_handler = impl[click_start:click_end]
assert "selectedPanelKeys.clear();" in click_handler
assert "selectPanelMessage(ref, hdr, card);" in click_handler
assert "selectedPanelKeys.add(key);\n        selectionAnchorKey = key;\n        selectPanelMessage" not in click_handler
assert 'card.toggleAttribute("data-active", active)' in impl
assert '.pin-mails-card[data-active]' in css
assert '.pin-mails-card[data-selected]' in css
assert '.pin-mails-card[data-selected] .pin-mails-card-actions' not in css

# Pin colours and hover states must be driven by account variables, not white.
assert "color: var(--pin-account-color);" in css
assert "background-color: var(--pin-row-account-color, var(--pin-mails-accent));" in css
assert "tr[data-pin-mails-pinned] .pin-mails-independent-button::before" in css
assert "#threadTree tr:is(:hover, :focus-within) .pin-mails-independent-button" in css
assert ".pin-mails-card-pin:hover::before" in css
assert 'light-dark(color-mix(in srgb, var(--pin-account-color)' not in css

# Group creation uses an extension-owned accessible dialog, never native prompt().
assert "createGroupDialog" in impl
assert "openGroupAssignmentDialog" in impl
assert ".pin-mails-group-dialog" in css
assert "prompt(" not in impl
for icon_name in ("pin-filled.svg", "pin-regular.svg"):
    icon = (EXT / "icons" / icon_name).read_text(encoding="utf-8")
    assert 'transform="translate(0 -0.375)"' in icon

# Drag feedback is always scoped and cleared.
assert "clearDropTargets" in impl and "clearDropFeedback" in impl
assert "onViewportChange" in impl
assert "#pin-mails-panel [data-drop-target]" in css
assert "\n[data-drop-target]" not in css

# Header no longer exposes unexplained one-character labels.
assert 'headerAction("pin-mails-action-conversation"' in impl
assert 'headerAction("pin-mails-action-dashboard"' in impl
assert 'headerAction("pin-mails-action-add-group"' in impl
assert 'createNode("button", "pin-mails-header-action", "C")' not in impl

print("UI regression guards: OK")
