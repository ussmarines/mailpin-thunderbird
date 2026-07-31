#!/usr/bin/env python3
"""Regression guards for the 3.2.3 visual polish and Codex memory pass."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
manifest = json.loads((ROOT / "extension/manifest.json").read_text(encoding="utf-8"))
state = json.loads((ROOT / "docs/PROJECT_STATE.json").read_text(encoding="utf-8"))
memory = (ROOT / "PROJECT_MEMORY.md").read_text(encoding="utf-8")
impl = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
pin_css = (ROOT / "extension/styles/pin.css").read_text(encoding="utf-8")
options_html = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
options_js = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
options_css = (ROOT / "extension/options/options.css").read_text(encoding="utf-8")
deep_audit = (ROOT / "scripts/deep_audit.py").read_text(encoding="utf-8")

VERSION = "3.2.4"
assert package["version"] == VERSION
assert manifest["version"] == VERSION
assert state["extensionVersion"] == VERSION
assert state["baseGitHub"]["commit"] == "3e8852d4ffcd05c3235000489452ffef6dc752b0"
assert f"Version de travail : **{VERSION}**" in memory

# Settings spacing must stay scoped to the settings page. Stale attributes are
# removed from about:3pane so presets can never compress native message rows.
assert 'setAttribute("pin-mails-ui-preset"' not in impl
assert 'removeAttribute("pin-mails-ui-preset")' in impl
assert 'uiPreset: "Ajuste uniquement l’espacement de la page des paramètres.' in options_js
for selector in (
    ':root[pin-mails-ui-preset="compact"] #pin-mails-panel',
    ':root[pin-mails-ui-preset="balanced"] #pin-mails-panel',
    ':root[pin-mails-ui-preset="comfortable"] #pin-mails-panel',
):
    assert selector not in pin_css, selector

# Native message action rail: equal vertical spacing, stable 24 px targets,
# touch-safe 28 px targets, and enough trailing room for three controls.
for token in (
    "inset-block-start: 50%",
    "transform: translateY(-50%)",
    "inline-size: 24px !important",
    "block-size: 24px !important",
    "inline-size: 28px !important",
    "block-size: 28px !important",
    "padding-inline-end: 86px",
):
    assert token in pin_css, token
for selector in (".tree-button-more", ".button-star", ".pin-mails-independent-button"):
    assert selector in pin_css, selector

# Pinned cards must remain readable in every density.
for minimum in ("--pin-mails-card-min-height: 48px", "--pin-mails-card-min-height: 56px", "--pin-mails-card-min-height: 66px"):
    assert minimum in pin_css, minimum
assert "min-block-size: var(--pin-mails-card-min-height)" in pin_css

# The toast close control belongs in the top-right cell, not under the message.
for token in (
    "grid-template-columns: auto minmax(0, 1fr) auto",
    ".status-close",
    "grid-column: 3",
    "grid-row: 1",
    "align-self: start",
):
    assert token in options_css, token

# All CSS classes emitted by options HTML/JS must have a matching style rule.
html_classes: set[str] = set()
for match in re.finditer(r'class=["\']([^"\']+)["\']', options_html):
    html_classes.update(value for value in match.group(1).split() if value)
js_classes: set[str] = set()
for match in re.finditer(r'node\([^,]+,\s*["\']([^"\']*)["\']', options_js):
    js_classes.update(value for value in match.group(1).split() if value)
for match in re.finditer(r'\.className\s*=\s*["\']([^"\']+)["\']', options_js):
    js_classes.update(value for value in match.group(1).split() if value)
for class_name in sorted(html_classes | js_classes):
    # Dynamic state classes are allowed when they are composed rather than
    # being standalone layout contracts.
    if class_name in {"success", "error", "busy", "hidden", "active", "dirty"}:
        continue
    assert re.search(rf"\.{re.escape(class_name)}(?=[\s,:.#>+~\[]|\{{)", options_css), f"Missing options CSS class: {class_name}"

# Screenshots exposed duplicated account labels and incorrect calendar fields.
assert "secondaryLabel.localeCompare(primaryLabel" in options_js
assert "calendar.taskCompatible" in options_js
assert "calendar.eventCompatible" in options_js
assert "calendar.taskSupported" not in options_js
assert "calendar.eventSupported" not in options_js
assert "Inscriptible" not in options_js
assert "group-editor-row" in options_js

# A single save action lives in the sticky dock; the footer is only a summary.
assert 'id="save-all"' not in options_html
assert 'id="save-all-floating"' in options_html
assert 'class="save-dock-actions"' in options_html
assert 'class="form-footer"' in options_html

# Windows git output can contain CRLF; never treat it as part of a tracked name.
assert 'value.strip("\\r\\n")' in deep_audit
assert 'relative != "dist/.gitkeep"' in deep_audit

# The one-scan Codex memory must remain complete and machine-checkable.
for token in (
    "Invariants non négociables",
    "Où modifier quoi",
    "Carte complète des fichiers",
    "Commandes obligatoires",
    "Définition de terminé",
):
    assert token in memory, token
for path in state["entrypoints"].values():
    assert (ROOT / path).is_file(), path
    assert path in memory, path

print("MailPerch 3.2.4 UI polish and project-memory guards: OK")
