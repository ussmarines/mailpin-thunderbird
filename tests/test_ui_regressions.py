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
assert "onDashboardRequested.addListener(openDashboard)" in background
assert 'messenger.tabs.create({' in background
assert 'href="./dashboard.css"' in dashboard_html
assert 'src="./dashboard.js"' in dashboard_html
assert "fatal-error" in dashboard_html and "data-loading" in dashboard_css
assert "getDashboardData" in dashboard_js

# Pinned cards have a custom context menu reachable by mouse and keyboard.
assert 'list.addEventListener("contextmenu"' in impl
assert "event.stopImmediatePropagation()" in impl
assert 'event.key === "ContextMenu"' in impl
assert 'event.shiftKey && event.key === "F10"' in impl
assert 'selectedPanelKeys.add(card.dataset.stableKey)' in impl
assert "document.body.appendChild(contextMenu)" in impl
assert "contextMenu?.remove()" in impl
assert ".pin-mails-context-menu" in css and "position: fixed" in css

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
