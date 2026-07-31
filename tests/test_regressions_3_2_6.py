#!/usr/bin/env python3
"""Regression guards for the 3.2.6 real-Thunderbird fixes."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPLEMENTATION = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
PIN_CSS = (ROOT / "extension/styles/pin.css").read_text(encoding="utf-8")
OPTIONS_JS = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
OPTIONS_HTML = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
TRACKER = (ROOT / "docs/BUG_TRACKER.md").read_text(encoding="utf-8")

# The MailPerch pin is a fully custom button. Thunderbird's generic icon
# classes must never be attached because they can paint an additional icon.
assert 'button = createNode("button", INDEPENDENT_BUTTON_CLASS);' in IMPLEMENTATION
assert '`${INDEPENDENT_BUTTON_CLASS} button icon-button icon-only`' not in IMPLEMENTATION
assert 'button.classList.remove("button", "icon-button", "icon-only", "button-star", "tree-button-flag");' in IMPLEMENTATION

# In independent mode, Thunderbird owns and positions its native star. The
# MailPerch rail contains only the pin and the More button.
rail = PIN_CSS.split('/* Le bouton « Plus » et la punaise MailPerch forment un rail centré.', 1)[1]
rail = rail.split('/* 3.2.4 — une seule étoile native par ligne.', 1)[0]
assert '.button-star' not in rail
assert 'padding-inline-end: 58px;' in rail
assert 'padding-inline-end: 66px;' in rail

# Save/cancel live inside the form and use direct click handlers. Native form
# events remain as a keyboard/assistive fallback, but no cross-form association
# is required by the visible controls.
form_start = OPTIONS_HTML.index('<form id="settings-form"')
form_end = OPTIONS_HTML.index('</form>', form_start)
dock_pos = OPTIONS_HTML.index('id="save-dock"')
assert form_start < dock_pos < form_end
assert 'id="discard-changes" type="button"' in OPTIONS_HTML
assert 'id="save-all-floating" type="button"' in OPTIONS_HTML
assert 'form="settings-form"' not in OPTIONS_HTML[OPTIONS_HTML.index('id="save-dock"'):form_end]
assert 'saveButton.addEventListener("click", saveAll);' in OPTIONS_JS
assert 'discardButton.addEventListener("click", discardChanges);' in OPTIONS_JS
assert 'form.addEventListener("submit", saveAll);' in OPTIONS_JS
assert 'event?.stopPropagation?.();' in OPTIONS_JS
assert 'form.requestSubmit($("save-all-floating"));' not in OPTIONS_JS

# Reopened bugs stay visible until real Thunderbird validation.
for bug_id in ("MP-2026-004", "MP-2026-005"):
    row = next(line for line in TRACKER.splitlines() if line.startswith(f"| {bug_id} |"))
    assert "| À VALIDER | 3.2.6 |" in row

print("MailPerch 3.2.6 real-interaction regression guards: OK")
