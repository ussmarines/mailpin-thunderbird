#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / "extension"
impl = (EXT / "api/pinInbox/implementation.js").read_text(encoding="utf-8")
schema = json.loads((EXT / "api/pinInbox/schema.json").read_text(encoding="utf-8"))
options = (EXT / "options/options.html").read_text(encoding="utf-8")
dashboard = (EXT / "dashboard/dashboard.html").read_text(encoding="utf-8")
dash_js = (EXT / "dashboard/dashboard.js").read_text(encoding="utf-8")
pin_css = (EXT / "styles/pin.css").read_text(encoding="utf-8")

functions = {item["name"] for item in schema[0]["functions"]}
for name in (
    "exportDiagnosticBundle", "clearDiagnostics", "getHealthReport", "repairHealthIssues",
    "runProviderCompatibilityCheck", "previewImport", "restoreConfiguration", "setNoReplyTracking",
    "performReferenceAction",
):
    assert name in functions, name
    assert name in impl, name

for module in ("bulk.js", "diagnostics.js", "health.js", "localization.js", "migrations.js", "performance.js", "providers.js", "smart.js"):
    assert (EXT / "api/pinInbox/modules" / module).is_file(), module
    assert module in impl, module

for token in (
    "enableAutomaticNoReplyTracking", "noReplyCancelOnIncomingReply", "noReplyDefaultDays",
    "enableSmartViews", "enableBulkActions", "enableHealthCenter", "enableDiagnostics",
    "panelVirtualizationThreshold", "cardCache", "PIN_MODULES.PinPerformance?.listSignature",
    "PIN_MODULES.PinMigrations?.analyze", "PIN_MODULES.PinHealth?.build", "PIN_MODULES.PinProviders?.matrix", "bulk?.normalizeKeys",
):
    assert token in impl or token in options, token

assert 'id="smart-views"' in dashboard
assert 'id="selection-bar"' in dashboard
assert 'id="health"' in dashboard
assert 'actionButton("diagnostic-export"' in dash_js
assert 'actionButton("diagnostic-clear"' in dash_js
assert "downloadJson" in dash_js
assert "pin-mails-health-indicator" in pin_css
assert "min-block-size: 46px" in pin_css and "inline-size: 36px" in pin_css
print("MailPerch 3.2 feature guards: OK")
