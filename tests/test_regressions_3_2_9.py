#!/usr/bin/env python3
"""Regression guards for the terminal Options initialization flow."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
JS = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
BOOTSTRAP = (ROOT / "extension/options/options-bootstrap.js").read_text(encoding="utf-8")
CSS = (ROOT / "extension/options/options.css").read_text(encoding="utf-8")
SCENARIO = (ROOT / "tests/options_dom_flow.playwright.js").read_text(encoding="utf-8")
TRACKER = (ROOT / "docs/BUG_TRACKER.md").read_text(encoding="utf-8")

for required in (
    "class OptionsInitializationTimeout",
    "function withTimeout",
    "function setInitializationState",
    "async function initializeOptions",
    "async function refreshOptionalConfiguration",
    "options:init:timeout:",
    "void renderCalendars(settings.preferredCalendarId);",
    "setInitializationState(\"error\", error);",
):
    assert required in JS, required

assert 'id="settings-error"' in HTML
assert 'id="retry-settings-load"' in HTML
assert 'id="copy-settings-diagnostic"' in HTML
assert ".settings-error" in CSS
assert "configuration-never" in SCENARIO
assert "calendar-never" in SCENARIO
assert "options:init:timeout:configuration" in SCENARIO
assert "api-absent" in SCENARIO and "api-delayed" in SCENARIO
assert "main-absent" in SCENARIO and "import-rejected" in SCENARIO
assert "top-level-exception" in SCENARIO and "settings-absent" in SCENARIO
assert 'window.addEventListener("error"' in BOOTSTRAP
assert 'window.addEventListener("unhandledrejection"' in BOOTSTRAP
assert 'import("./options.js")' in BOOTSTRAP
assert 'loadClassicScript("../api/pinInbox/modules/settings.js")' in BOOTSTRAP
assert '<label class="file-button secondary" data-i18n="previewRestore">' not in HTML

row = next(line for line in TRACKER.splitlines() if line.startswith("| MP-2026-008 |"))
assert "| CORRIGÉ | 3.2.10 |" in row

print("MailPin terminal Options initialization guards: OK")
