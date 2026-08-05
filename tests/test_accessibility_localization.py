#!/usr/bin/env python3
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / "extension"
files = [EXT / "options/options.html", EXT / "dashboard/dashboard.html"]
used: set[str] = set()
for path in files:
    text = path.read_text(encoding="utf-8")
    used.update(re.findall(r'data-i18n="([^"]+)"', text))
    used.update(re.findall(r'data-i18n-placeholder="([^"]+)"', text))
    used.update(re.findall(r'data-i18n-title="([^"]+)"', text))
    used.update(re.findall(r'data-i18n-aria-label="([^"]+)"', text))
    used.update(re.findall(r'data-nav-group-i18n="([^"]+)"', text))
dashboard_js = (EXT / "dashboard/dashboard.js").read_text(encoding="utf-8")
used.update(re.findall(r'msg\("([^"]+)"', dashboard_js))
used.update(re.findall(r'failureMessage\("([^"]+)"', dashboard_js))
used.update(re.findall(r'\["(dashboardAction[^"]+)"', dashboard_js))
options_source = (EXT / "options/options.js").read_text(encoding="utf-8")
used.update(re.findall(r'\bmsg\("([^"]+)"', options_source))
used.update(re.findall(r'failureMessage\("([^"]+)"', options_source))
used.update(re.findall(r':\s*"((?:controlHelp|buttonHelp)[^"]+)"', options_source))
used.update({
    "selectedMessageOne", "selectedMessageMany", "confirmBulkDelete",
    "confirmBulkArchive", "confirmBulkUnpin", "restoreMerged",
    "restoreCompleted", "sqliteHealthy", "sqliteIssue",
})

locales = {}
for locale in ("fr", "en"):
    data = json.loads((EXT / f"_locales/{locale}/messages.json").read_text(encoding="utf-8"))
    locales[locale] = data
    assert used <= data.keys(), f"Missing {locale} strings: {sorted(used - data.keys())}"
    assert all(isinstance(item.get("message"), str) and item["message"].strip() for item in data.values())
assert locales["fr"].keys() == locales["en"].keys(), "Locale key sets differ"

options = files[0].read_text(encoding="utf-8")
dashboard = files[1].read_text(encoding="utf-8")
options_js = options_source
pin_impl = (EXT / "api/pinInbox/implementation.js").read_text(encoding="utf-8")
experiment_i18n = (EXT / "api/pinInbox/modules/localization.js").read_text(encoding="utf-8")
all_css = "\n".join((EXT / path).read_text(encoding="utf-8") for path in ["options/options.css", "dashboard/dashboard.css", "styles/pin.css"])

experiment_blocks = re.search(
    r"fr:\s*Object\.freeze\(\{(?P<fr>.*?)\}\),\s*en:\s*Object\.freeze\(\{(?P<en>.*?)\}\)\s*\n\s*\}\);",
    experiment_i18n,
    re.DOTALL,
)
assert experiment_blocks, "Experiment localization dictionaries could not be parsed"
experiment_keys: dict[str, set[str]] = {}
for locale in ("fr", "en"):
    ordered_keys = re.findall(
        r"^\s*([A-Za-z][A-Za-z0-9]*):\s*\"",
        experiment_blocks.group(locale),
        re.MULTILINE,
    )
    assert len(ordered_keys) == len(set(ordered_keys)), f"Duplicate Experiment {locale} localization key"
    experiment_keys[locale] = set(ordered_keys)
assert experiment_keys["fr"] == experiment_keys["en"], "Experiment locale key sets differ"

literal_experiment_keys = set(re.findall(r"(?<![A-Za-z0-9_.])t\(\"([^\"]+)\"", pin_impl))
literal_context_keys = set(re.findall(r"this\._t\(\"([^\"]+)\"", pin_impl))
assert literal_experiment_keys <= experiment_keys["fr"], (
    f"Missing Experiment strings: {sorted(literal_experiment_keys - experiment_keys['fr'])}"
)
available_context_keys = set(locales["fr"]) | experiment_keys["fr"]
assert literal_context_keys <= available_context_keys, (
    f"Missing privileged UI strings: {sorted(literal_context_keys - available_context_keys)}"
)

about3pane_ui = pin_impl.split("  _setupAbout3Pane(about3Pane) {", 1)[1].split("  _formatTimestamp(", 1)[0]
about3pane_localization_refs: set[str] = set()
for source_line in about3pane_ui.splitlines():
    if re.search(r"(?<![._A-Za-z0-9])t\(", source_line):
        about3pane_localization_refs.update(re.findall(
            r'"((?:panel|calendar)[A-Z][A-Za-z0-9]+|continue|unpin)"',
            source_line,
        ))
assert about3pane_localization_refs <= available_context_keys, (
    "Missing dynamic privileged UI strings: "
    f"{sorted(about3pane_localization_refs - available_context_keys)}"
)
assert not re.search(r"\bshowToast\(\s*[\"'`]", about3pane_ui), "Panel toast must use a localization key"
assert not re.search(r"this\._pushUndo\(\s*[\"'`]", about3pane_ui), "Panel undo label must use a localization key"
for untranslated in (
    "Désépinglage multiple",
    "Épinglage de conversation",
    "Désépinglage de conversation",
    "Épinglage par glisser-déposer",
):
    assert untranslated not in about3pane_ui, f"Unlocalized privileged UI label remains: {untranslated}"

assert 'class="skip-link" href="#settings-form"' in options
assert 'class="skip-link" href="#dashboard-main"' in dashboard
assert 'id="dashboard-main"' in dashboard and 'tabindex="-1"' in dashboard
assert 'role="status"' in options and 'aria-live="polite"' in options
assert 'role="status"' in dashboard and 'aria-live="polite"' in dashboard
assert "IntersectionObserver" in options_js
assert 'aria-current", "location"' in options_js
assert 'event.key === "ContextMenu"' in pin_impl and 'event.shiftKey && event.key === "F10"' in pin_impl
for key in ('event.key === "ArrowDown"', 'event.key === "ArrowUp"', 'event.key === "Home"', 'event.key === "End"', 'event.key === "PageDown"', 'event.key === "PageUp"'):
    assert key in pin_impl
assert "@media (prefers-reduced-motion: reduce)" in all_css
assert "@media (forced-colors: active)" in all_css
assert ":focus-visible" in all_css
assert "data-i18n-aria-label" in options_js
assert "data-i18n-aria-label" in (EXT / "options/options-bootstrap.js").read_text(encoding="utf-8")
assert "data-i18n-aria-label" in (EXT / "dashboard/dashboard.js").read_text(encoding="utf-8")
assert "error.message" not in options_js
assert "error.message" not in dashboard_js
print(
    "Accessibility/localization guards: OK "
    f"({len(used)} WebExtension UI strings, {len(experiment_keys['fr'])} privileged UI strings, "
    f"{len(locales['fr'])} localized messages)"
)
