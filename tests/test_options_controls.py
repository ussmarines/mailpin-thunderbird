from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
JS = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")


class ControlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.buttons: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "button":
            return
        values = {key: value or "" for key, value in attrs}
        if values.get("id"):
            self.buttons.append(values)


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
    "save-dock",
    "setDirty",
    "withBusy",
    "preserveEdits",
    "beforeunload",
    "setStatus(\"Paramètres enregistrés.\"",
):
    assert required in HTML or required in JS, required

for required_guard in (
    "fetchConfigurationWithRetry",
    "requireConfiguration",
    "setConfigurationReady(false)",
    "setConfigurationReady(true)",
    "currentSettings({settingsExperience",
    "if (!configuration?.settings) await reload()",
):
    assert required_guard in JS, required_guard

assert "configuration.settings.preferredCalendarId" not in JS
assert "{...configuration.settings" not in JS

print("Options control and feedback guards: OK")
