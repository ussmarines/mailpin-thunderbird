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
used.update(re.findall(r'msg\("([^"]+)"', (EXT / "dashboard/dashboard.js").read_text(encoding="utf-8")))

locales = {}
for locale in ("fr", "en"):
    data = json.loads((EXT / f"_locales/{locale}/messages.json").read_text(encoding="utf-8"))
    locales[locale] = data
    assert used <= data.keys(), f"Missing {locale} strings: {sorted(used - data.keys())}"
    assert all(isinstance(item.get("message"), str) and item["message"].strip() for item in data.values())
assert locales["fr"].keys() == locales["en"].keys(), "Locale key sets differ"

options = files[0].read_text(encoding="utf-8")
dashboard = files[1].read_text(encoding="utf-8")
options_js = (EXT / "options/options.js").read_text(encoding="utf-8")
pin_impl = (EXT / "api/pinInbox/implementation.js").read_text(encoding="utf-8")
all_css = "\n".join((EXT / path).read_text(encoding="utf-8") for path in ["options/options.css", "dashboard/dashboard.css", "styles/pin.css"])

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
print(f"Accessibility/localization guards: OK ({len(used)} UI strings, {len(locales['fr'])} localized messages)")
