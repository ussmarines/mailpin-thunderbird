from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
JS = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
CSS = (ROOT / "extension/options/options.css").read_text(encoding="utf-8")
SETTINGS = (ROOT / "extension/api/pinInbox/modules/settings.js").read_text(encoding="utf-8")
FR = json.loads((ROOT / "extension/_locales/fr/messages.json").read_text(encoding="utf-8"))
EN = json.loads((ROOT / "extension/_locales/en/messages.json").read_text(encoding="utf-8"))


class SectionParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.sections: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "section":
            return
        values = {key: value or "" for key, value in attrs}
        classes = set(values.get("class", "").split())
        if "settings-section" in classes:
            self.sections.append(values)


parser = SectionParser()
parser.feed(HTML)
assert parser.sections, "Options must expose navigable settings sections"

# The public UX taxonomy is deliberately small. Advanced sections are hidden in
# Recommended mode rather than deleting expert controls or changing stored keys.
groups = {section.get("data-nav-group") for section in parser.sections}
assert groups == {"Essentiel", "Organisation", "Automatisation", "Avancé"}, groups
assert all(section.get("data-nav-group-i18n") for section in parser.sections)
advanced_sections = [section for section in parser.sections if section.get("data-nav-group") == "Avancé"]
assert len(advanced_sections) == 3
assert all(section.get("data-experience") == "advanced" for section in advanced_sections)

# The persisted enum stays guided/advanced for backward compatibility. Only the
# user-facing name changes to Recommended; this consolidation needs no migration.
assert 'settingsExperience: "guided"' in SETTINGS
assert 'new Set(["guided", "advanced"])' in SETTINGS
assert '<option value="guided" data-i18n="settingsGuided">Recommandé</option>' in HTML
assert FR["settingsGuided"]["message"] == "Recommandé"
assert EN["settingsGuided"]["message"] == "Recommended"
assert "préparer un brouillon" in FR["guidedTipText"]["message"]
assert "prepare a draft" in EN["guidedTipText"]["message"]
assert "déjà actifs" not in FR["guidedTipText"]["message"]
assert "already enabled" not in EN["guidedTipText"]["message"]

for key in ("navEssential", "navOrganization", "navAutomation", "navAdvanced"):
    assert key in FR and key in EN, key

# Recommended mode is an explicit, reversible draft operation. It must neither
# save automatically nor overwrite account/calendar/file-location choices.
assert 'id="apply-recommended-settings"' in HTML
assert 'function applyRecommendedDraft(control = null)' in JS
assert 'PinSettings.normalize(config.recommendedSettings || PinSettings.defaults())' in JS
assert 'RECOMMENDED_PRESERVED_SETTING_KEYS' in JS
for key in ("preferredCalendarId", "waitingGroupId", "backupDirectory", "accountColors", "inboxEnabled"):
    assert f'"{key}"' in JS, key
function_match = re.search(r"function applyRecommendedDraft\(control = null\) \{(?P<body>.*?)\n\}", JS, re.S)
assert function_match, "Recommended draft function missing"
recommended_body = function_match.group("body")
assert "collectSettings()" in recommended_body
assert "syncDirtyState()" in recommended_body
assert "applyConfiguration(" not in recommended_body
assert "saveSettings" not in recommended_body

# Advanced sections must be removed from navigation/search as well as visually
# hidden. CSS is a defensive fallback if JS state is temporarily stale.
for required in (
    'section.dataset.experienceHidden = String(!advanced)',
    'section.hidden = !advanced',
    'section.dataset.experienceHidden !== "true"',
    'body[data-settings-experience="guided"] #settings-form > section[data-experience="advanced"]',
):
    assert required in JS or required in CSS, required

# Requested feature map: core daily work stays visible while organization and
# automation remain discoverable without exposing maintenance internals.
for key in (
    "sectionCalendarEssential",
    "sectionTagsAutomation",
    "workflowSettingsTitle",
    "organizationChecklistsTitle",
    "organizationSavedViewsTitle",
    "sectionThunderbirdTechnical",
):
    assert f'data-i18n="{key}"' in HTML, key
    assert key in FR and key in EN, key

print("Recommended Options taxonomy and progressive-disclosure guards: OK")
