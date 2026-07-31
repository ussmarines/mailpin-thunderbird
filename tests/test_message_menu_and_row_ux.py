#!/usr/bin/env python3
"""Regression guards for the 3.2.1 message-menu, group and row UX fixes."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
bg = (ROOT / "extension/background.js").read_text(encoding="utf-8")
impl = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
css = (ROOT / "extension/styles/pin.css").read_text(encoding="utf-8")

# Exactly one selection command and one clearly distinct conversation command.
assert 'pin-mails-pin-selection' not in bg
assert 'pin-mails-unpin-selection' not in bg
assert 'selectionMenuTitle(state)' in bg
assert 'conversationMenuTitle(state)' in bg
assert 'menuPinMessages' in bg and 'menuUnpinMessages' in bg
assert 'menuPinConversation' in bg and 'menuUnpinConversation' in bg
assert 'conversationCount' in impl and 'allConversationsPinned' in impl

# The historical privileged message-menu injection must not coexist with messenger.menus.
for forbidden in ['_menuWindows', '_ensureMainMenuWindow', '_updateMainMenuWindow', 'pin-mails-message-command']:
    assert forbidden not in impl, forbidden

# A group can be cleared from both the native card menu and its visible chip.
assert '["remove-group", this._t("removeFromGroup", "Retirer du groupe")]' in impl
assert 'if (action === "remove-group")' in impl
assert 'this._performReferenceAction([key], "group", {groupId: ""})' in impl
assert 'createQuickButton("remove-group"' in impl
assert '.pin-mails-group-remove' in css

# Native Thunderbird row states receive a strong but non-invasive visual treatment.
assert 'data-properties~="unread"' in css
assert 'data-properties~="new"' in css
assert 'min-block-size: 46px' in css
assert '--read-status-size: 20px' in css
assert 'padding-block-end: 6px' in css

for locale in ['fr', 'en']:
    data = json.loads((ROOT / f"extension/_locales/{locale}/messages.json").read_text(encoding="utf-8"))
    for key in ['menuPinMessage','menuUnpinMessage','menuPinMessages','menuUnpinMessages','menuPinConversation','menuUnpinConversation','removeFromGroup']:
        assert data.get(key, {}).get('message'), (locale, key)
print("Message menu, group removal and row readability guards: OK")
