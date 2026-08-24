#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / "extension"
impl = (EXT / "api/pinInbox/implementation.js").read_text(encoding="utf-8")
schema = json.loads((EXT / "api/pinInbox/schema.json").read_text(encoding="utf-8"))[0]
manifest = json.loads((EXT / "manifest.json").read_text(encoding="utf-8"))
background = (EXT / "background.js").read_text(encoding="utf-8")
dashboard = (EXT / "dashboard/dashboard.html").read_text(encoding="utf-8")
dash_js = (EXT / "dashboard/dashboard.js").read_text(encoding="utf-8")
options = (EXT / "options/options.js").read_text(encoding="utf-8")
pin_css = (EXT / "styles/pin.css").read_text(encoding="utf-8")
build = (ROOT / "scripts/build.py").read_text(encoding="utf-8")

functions = {item["name"] for item in schema["functions"]}
for name in ("quickCaptureSelected", "mergeRelatedReferences", "performReferenceAction", "simulateRules"):
    assert name in functions, name
    assert name in impl, name

for module in ("review.js", "related.js"):
    assert (EXT / "api/pinInbox/modules" / module).is_file(), module
    assert module in impl, module

for command in ("snooze-selected-pin", "track-no-reply-selected", "quick-today-selected"):
    assert command in manifest["commands"], command
    assert command in background, command

for token in (
    'id="today"', 'id="review"', 'id="reminder-center"', 'id="bulk-snooze"',
    'data-view="today"', 'data-view="review"'
):
    assert token in dashboard, token

for token in (
    "renderToday", "renderReview", "renderReminderCenter", "mergeRelatedReferences",
    'action === "snooze"', "data-review-mode", "lastSelectedKey"
):
    assert token in dash_js, token

assert "rules})," in options or "limit: 1000, rules" in options
assert "getShortcuts" in options and "collectShortcuts" in options
assert "pin-mails-reminder-center" in pin_css
assert "connect-src 'none'" in json.dumps(manifest)
assert "REVIEWED_ADDITIONAL_FILES" not in build
assert '"git", "ls-files", "-z"' in build

print("MailPin productivity 1.1 feature guards: OK")
