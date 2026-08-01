#!/usr/bin/env python3
"""Regression guards for the 3.2.7 settings persistence and native action rail."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPLEMENTATION = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
OPTIONS = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
CSS = (ROOT / "extension/styles/pin.css").read_text(encoding="utf-8")
TRACKER = (ROOT / "docs/BUG_TRACKER.md").read_text(encoding="utf-8")

# Pin is inserted beside the native star, while the star itself is never moved
# or absolutely positioned in independent mode.
assert 'const iconInfo = row.querySelector(".thread-card-icon-info");' in IMPLEMENTATION
assert 'iconInfo?.insertBefore(button, nativeStar || null);' in IMPLEMENTATION
assert '.thread-card-icon-info .button-star' not in CSS
assert '.thread-card-icon-info .pin-mails-independent-button' not in CSS
assert 'The two controls share the same native flex container' not in CSS

# Explicit save boundary is asynchronous and only returns after SQLite flush.
assert 'async _setConfiguration(configuration)' in IMPLEMENTATION
set_config = IMPLEMENTATION.split('async _setConfiguration(configuration)', 1)[1].split('_exportConfiguration()', 1)[0]
assert 'await this._storage?.flush();' in set_config
assert set_config.count('normalized.push(group);') == 1

# Critical controls bind before visual enhancement, have direct activation
# paths, validate numbers, and read back persisted state before success.
startup = OPTIONS.split('window.addEventListener("DOMContentLoaded"', 1)[1]
assert startup.index('installCriticalSettingsActions();') < startup.index('enhanceSettingsPage();')
assert 'save?.addEventListener("click", saveAll);' in OPTIONS
assert 'discard?.addEventListener("click", discardChanges);' in OPTIONS
assert 'document.addEventListener("click", event =>' not in OPTIONS
HTML = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
assert 'id="save-all-floating" type="submit"' in HTML
assert 'id="discard-changes" type="reset"' in HTML
assert 'readFiniteControlNumber' in OPTIONS
assert 'await messenger.pinInbox.getConfiguration();' in OPTIONS
assert 'if (!dirty)' not in OPTIONS.split('async function saveAll', 1)[1].split('async function discardChanges', 1)[0]

for bug_id in ("MP-2026-004", "MP-2026-005"):
    row = next(line for line in TRACKER.splitlines() if line.startswith(f"| {bug_id} |"))
    assert "| À VALIDER | 3.2.7 |" in row

print("MailPerch 3.2.7 persistence and action-rail guards: OK")
