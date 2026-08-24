#!/usr/bin/env python3
"""Regression contract for pinned-card context and overflow menus."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPL = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
CSS = (ROOT / "extension/styles/pin.css").read_text(encoding="utf-8")

# The menu must be a native Thunderbird/XUL popup, not an HTML overlay.
for token in (
    'document.createXULElement("menupopup")',
    'document.createXULElement("menuitem")',
    'document.createXULElement("menuseparator")',
    'let popupSet = document.querySelector("popupset") || document.getElementById("mainPopupSet")',
    'popupSet = document.createXULElement("popupset")',
    'popupSet.appendChild(contextMenu)',
    'ownedPopupSet = popupSet',
    'ownedPopupSet?.remove()',
    'contextMenu.openPopup(trigger, "after_end"',
    'contextMenu.openPopupAtScreen(screenX, screenY, true, triggerEvent)',
    'contextMenu.addEventListener("command"',
    'contextMenu.addEventListener("popuphidden", () => {',
    'resetContextMenuState();',
    'trigger?.isConnected',
    'trigger.focus()',
):
    assert token in IMPL, token

for obsolete in (
    'createNode("div", "pin-mails-context-menu")',
    'contextMenu.style.left',
    'contextMenu.style.top',
    'contextMenu.hidden = false',
    'onPanelRightPointerDown',
):
    assert obsolete not in IMPL, obsolete

# Right-click is intercepted at the earliest window capture phase and again on
# the actual panel list as a fallback.
assert 'about3Pane.addEventListener("contextmenu", onPanelContextMenu, true)' in IMPL
assert 'list.addEventListener("contextmenu"' in IMPL
assert 'about3Pane.removeEventListener("contextmenu", onPanelContextMenu, true)' in IMPL

# The visible overflow button passes its real user event to the native popup.
assert 'more.addEventListener("click"' in IMPL
assert 'dispatchCardAction(card, "more", more, event)' in IMPL
assert 'return openContextMenuForCard(card, triggerEvent, sourceButton)' in IMPL

# Controls temporarily disable their draggable card so a short pointer motion
# cannot swallow the click before the menu is opened.
assert 'button.addEventListener("pointerdown"' in IMPL
assert 'card.draggable = false' in IMPL
assert 'about3Pane.addEventListener("pointerup", restoreDrag, true)' in IMPL
assert 'about3Pane.addEventListener("pointercancel", restoreDrag, true)' in IMPL

# Removed HTML overlay styles must not silently return.
for selector in (".pin-mails-context-menu", ".pin-mails-context-item", ".pin-mails-context-separator"):
    assert selector not in CSS, selector

print("Native pinned-card menu regression guards: OK")
