#!/usr/bin/env python3
"""Regression guards for the 3.2.8 settings registry and structural action rail."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPLEMENTATION = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
OPTIONS = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
SETTINGS = (ROOT / "extension/api/pinInbox/modules/settings.js").read_text(encoding="utf-8")
CSS = (ROOT / "extension/styles/pin.css").read_text(encoding="utf-8")
TRACKER = (ROOT / "docs/BUG_TRACKER.md").read_text(encoding="utf-8")

# One shared, immutable registry owns defaults and migration. Both the
# privileged implementation and the real options document consume it.
assert '"settings.js", "identity.js"' in IMPLEMENTATION
assert "DEFAULT_SETTINGS = PIN_MODULES.PinSettings.DEFAULTS;" in IMPLEMENTATION
assert "PIN_MODULES.PinSettings.normalize(value)" in IMPLEMENTATION
assert "globalThis.PinSettings?.DEFAULTS" in OPTIONS
assert "PinSettings.normalize" in OPTIONS
assert "MIGRATION_STRATEGY" in SETTINGS
assert "missing-or-invalid-to-recommended; explicit-values-preserved" in SETTINGS
assert "const DEFAULTS = deepFreeze({" in SETTINGS

# The icon-info node is promoted to a structural rail. The native star stays
# in that native node instead of being reparented to the header row.
assert 'cardActionRail?.classList.add(CARD_ACTION_RAIL_CLASS);' in IMPLEMENTATION
assert 'iconInfo?.insertBefore(button, nativeStar || null);' in IMPLEMENTATION
assert 'headerRow.appendChild(nativeStar)' not in IMPLEMENTATION
assert ".thread-card-dynamic-row {\n  display: contents;" in CSS
assert ".pin-mails-card-action-rail {" in CSS
assert "grid-row: 1 / 4;" in CSS
assert "align-self: center;" in CSS
assert "padding-block-end: 5px;" in CSS
assert '[data-pin-mails-native-star] {' in CSS
assert "position: relative !important;" in CSS
assert "inset: auto !important;" in CSS

# Save success is verified against the normalized request and a second API
# readback; all editable controls pass through the registry.
assert "SETTINGS_CONTROL_DEFINITIONS" in OPTIONS
assert "validateSettingsControlRegistry" in OPTIONS
assert "declaration.type !== entry.valueType" in OPTIONS
assert "persistenceSnapshot(saved) !== persistenceSnapshot(persisted)" in OPTIONS
assert "await messenger.pinInbox.getConfiguration();" in OPTIONS
assert 'save?.addEventListener("click", saveAll);' in OPTIONS
assert 'discard?.addEventListener("click", discardChanges);' in OPTIONS
assert "OptionsInitializationTimeout" in OPTIONS
assert "setInitializationState(\"error\", error);" in OPTIONS
assert "void renderCalendars(settings.preferredCalendarId);" in OPTIONS
assert 'id="settings-error"' in (ROOT / "extension/options/options.html").read_text(encoding="utf-8")

card_row = next(line for line in TRACKER.splitlines() if line.startswith("| MP-2026-004 |"))
assert "| À VALIDER | 3.2.8 |" in card_row
for bug_id in ("MP-2026-005", "MP-2026-007"):
    row = next(line for line in TRACKER.splitlines() if line.startswith(f"| {bug_id} |"))
    assert "| CORRIGÉ | 3.2.10 |" in row

print("MailPerch 3.2.8 defaults, persistence and action-rail guards: OK")
