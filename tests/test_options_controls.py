from __future__ import annotations

import re
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
JS = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
BOOTSTRAP = (ROOT / "extension/options/options-bootstrap.js").read_text(encoding="utf-8")
CSS = (ROOT / "extension/options/options.css").read_text(encoding="utf-8")


class ControlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.buttons: list[dict[str, str]] = []
        self.settings_controls: list[dict[str, str]] = []
        self.ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if values.get("id"):
            self.ids.add(values["id"])
        if tag == "button" and values.get("id"):
            self.buttons.append(values)
        if tag in {"input", "select", "textarea"} and values.get("id"):
            self.settings_controls.append(values)


parser = ControlParser()
parser.feed(HTML)

# Submit buttons are handled by the form submit listener. Every other explicit
# button must be wired in options.js, preventing silent/dead controls.
for button in parser.buttons:
    if button.get("type", "submit") == "submit":
        continue
    control_id = button["id"]
    runtime = BOOTSTRAP if control_id in {"retry-settings-load", "copy-settings-diagnostic"} else JS
    assert f'"{control_id}"' in runtime, f"Unwired options button: {control_id}"

for required in (
    "status-toast",
    "settings-loading",
    "settings-error",
    "retry-settings-load",
    "copy-settings-diagnostic",
    "save-dock",
    "withBusy",
    "preserveEdits",
    "beforeunload",
    "setStatus(msg(\"settingsSaved\"), \"success\")",
):
    assert required in HTML or required in JS, required

for required_guard in (
    "fetchConfigurationWithRetry",
    "withTimeout",
    "OptionsInitializationTimeout",
    "setInitializationState",
    "initializeOptions",
    "refreshOptionalConfiguration",
    "requireConfiguration",
    "setConfigurationReady(false)",
    "setConfigurationReady(true)",
    "SETTINGS_CONTROL_DEFINITIONS",
    "SETTINGS_CONTROL_REGISTRY",
    "CONTROL_VALUE_TYPES",
    "validateSettingsControlRegistry",
    "PinSettings.normalize",
    "dataset.settingKey",
    "dataset.settingType",
    "dataset.settingMigration",
    "if (!configuration?.settings) await reload()",
    "function currentDraftSnapshot()",
    "function rememberPersistedDraft()",
    "function syncDirtyState()",
    "const saveDisabled = !configurationReady || saveInFlight || !dirty || Boolean(draftStateError);",
    "await applyConfiguration(config);",
    "void renderCalendars(settings.preferredCalendarId);",
):
    assert required_guard in JS, required_guard

for required_bootstrap_guard in (
    'window.addEventListener("error"',
    'window.addEventListener("unhandledrejection"',
    "STARTUP_WATCHDOG_MS",
    'loadClassicScript("../api/pinInbox/modules/settings.js")',
    'import("./options.js")',
    'mark("main:requested")',
    'mark("main:evaluated")',
    'mark("dom:ready")',
    'byId("retry-settings-load")',
    'location.reload()',
):
    assert required_bootstrap_guard in BOOTSTRAP, required_bootstrap_guard

non_setting_controls = {"clear-stars-after-import", "import-file", "shortcut"}
for control in parser.settings_controls:
    control_id = control["id"]
    if control_id in non_setting_controls:
        continue
    assert f'"{control_id}"' in JS, f"Unregistered settings control: {control_id}"

# Keep the reverse mapping as well: every statically declared settings control
# must exist in the production HTML. The runtime validates this too, but this
# guard catches a missing control without requiring a browser.
definitions = re.search(
    r"const SETTINGS_CONTROL_DEFINITIONS = Object\.freeze\(\[(?P<body>.*?)\n\]\);",
    JS,
    re.S,
)
assert definitions, "Settings control definitions missing"
definition_body = definitions.group("body")
registered_ids = set(re.findall(r'settingControl\("([^"]+)"', definition_body))
for mapped in re.finditer(
    r"\.\.\.\[(?P<ids>.*?)\]\.map\(id => settingControl\(id, \"(?:boolean|string|number)\"\)\)",
    definition_body,
    re.S,
):
    registered_ids.update(re.findall(r'"([A-Za-z0-9-]+)"', mapped.group("ids")))
missing_registered_ids = sorted(registered_ids - parser.ids)
assert not missing_registered_ids, f"Registered settings controls missing from HTML: {missing_registered_ids}"

assert '<script src="options-bootstrap.js" defer></script>' in HTML
assert '<script src="options.js"' not in HTML
assert '<script src="../api/pinInbox/modules/settings.js"' not in HTML
assert '<span data-i18n="previewRestore">' in HTML
assert '<label class="file-button secondary" data-i18n="previewRestore">' not in HTML
assert 'id="settings-form"' in HTML and 'aria-busy="true" hidden' in HTML
assert 'id="save-all-floating" type="submit"' in HTML
assert 'id="discard-changes" type="reset"' in HTML

# Selected accounts remain stable Thunderbird keys in the draft. The UI must
# make this scope self-explanatory without imposing a pin-volume hard limit.
for required in (
    'value="selectedAccounts"',
    'id="selected-accounts-setting"',
    'id="selected-accounts-list"',
    'id="selected-accounts-summary"',
    'data-i18n="panelScopeHelp"',
    'data-i18n="recommendedPinVolume"',
    'data-i18n="recommendedPinVolumeHelp"',
    'function renderSelectedAccounts(accounts, selectedKeys)',
    'function syncSelectedAccountsSummary()',
    'unavailableSelectedAccountKeys',
    '"selectedAccountKeys"',
):
    assert required in HTML or required in JS, required
assert not re.search(r'panelScope[^<]{0,300}max="2000"', HTML)
assert not re.search(r'selectedAccountKeys[^\n]{0,160}(?:2000|MAX_PIN)', JS)
assert HTML.index('id="selected-accounts-setting"') < HTML.index('class="volume-guidance"')
fr_messages = json.loads((ROOT / "extension/_locales/fr/messages.json").read_text(encoding="utf-8"))
en_messages = json.loads((ROOT / "extension/_locales/en/messages.json").read_text(encoding="utf-8"))
assert "2 000" in fr_messages["recommendedPinVolume"]["message"]
assert "2 000" in fr_messages["recommendedPinVolumeHelp"]["message"]
assert "2,000" in en_messages["recommendedPinVolume"]["message"]
assert "2,000" in en_messages["recommendedPinVolumeHelp"]["message"]

assert ".save-dock {" in CSS
assert ".save-dock { pointer-events: none" not in CSS
assert "pointer-events: none" not in CSS[CSS.index(".save-dock {"):CSS.index("@media (max-width: 1050px)")]

assert "configuration.settings.preferredCalendarId" not in JS
assert "{...configuration.settings" not in JS
assert "Object.assign(configuration.settings" not in JS

# Generated settings entities must explain their business values, and a card's
# appearance must be synchronized from its checkbox rather than a stale class.
for required in (
    "function syncToggleCards()",
    "dataset.enabled",
    "toggle-recommended-badge",
    "function entityField(labelKey, control, helpKey = \"\")",
    'entityField("deadline"',
    'entityField("dynamicLead"',
    "dynamicRuleLimitHelp",
    "dynamicChooseCalendar",
    "dynamicCalendarDueRequired",
):
    assert required in JS, required
for required in (
    ".setting-toggle[data-enabled=\"true\"]",
    ".setting-toggle.featured[data-enabled=\"true\"]",
    ".toggle-recommended-badge",
    ".subsection-header:has(+ #rule-simulation)",
    "calc(7rem + env(safe-area-inset-bottom))",
):
    assert required in CSS, required

print(f"Options registry and feedback guards ({len(parser.settings_controls)} static controls): OK")
