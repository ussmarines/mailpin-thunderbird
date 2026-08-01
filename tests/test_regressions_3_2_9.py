#!/usr/bin/env python3
"""Regression guards for the 3.2.9 terminal Options initialization flow."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
JS = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
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

row = next(line for line in TRACKER.splitlines() if line.startswith("| MP-2026-008 |"))
assert "| À VALIDER | 3.2.9 |" in row

print("MailPerch 3.2.9 terminal Options initialization guards: OK")
