from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
JS = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
CSS = (ROOT / "extension/options/options.css").read_text(encoding="utf-8")


class ControlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.buttons: list[dict[str, str]] = []
        self.settings_controls: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
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
    assert f'"{control_id}"' in JS, f"Unwired options button: {control_id}"

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
    "setStatus(\"Paramètres enregistrés.\"",
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

non_setting_controls = {"clear-stars-after-import", "import-file", "shortcut"}
for control in parser.settings_controls:
    control_id = control["id"]
    if control_id in non_setting_controls:
        continue
    assert f'"{control_id}"' in JS, f"Unregistered settings control: {control_id}"

assert '<script src="../api/pinInbox/modules/settings.js" defer></script>' in HTML
assert HTML.index('../api/pinInbox/modules/settings.js') < HTML.index('options.js')
assert 'id="settings-form"' in HTML and 'aria-busy="true" hidden' in HTML
assert 'id="save-all-floating" type="submit"' in HTML
assert 'id="discard-changes" type="reset"' in HTML

assert ".save-dock {" in CSS
assert ".save-dock { pointer-events: none" not in CSS
assert "pointer-events: none" not in CSS[CSS.index(".save-dock {"):CSS.index("@media (max-width: 1050px)")]

assert "configuration.settings.preferredCalendarId" not in JS
assert "{...configuration.settings" not in JS
assert "Object.assign(configuration.settings" not in JS

print(f"Options registry and feedback guards ({len(parser.settings_controls)} static controls): OK")
