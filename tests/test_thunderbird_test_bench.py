#!/usr/bin/env python3
from pathlib import Path
import ast
import re

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = (ROOT / ".github/workflows/thunderbird-smoke.yml").read_text(encoding="utf-8")
HARNESS_PATH = ROOT / "tests/thunderbird/real_smoke.py"
HARNESS = HARNESS_PATH.read_text(encoding="utf-8")
BENCH_WORKFLOW = (ROOT / ".github/workflows/thunderbird-functional-bench.yml").read_text(encoding="utf-8")
BENCH_PATH = ROOT / "tests/thunderbird/functional_bench.py"
BENCH = BENCH_PATH.read_text(encoding="utf-8")
PIN_CSS = (ROOT / "extension/styles/pin.css").read_text(encoding="utf-8")

# The harness must remain stdlib-only so the runtime bench does not introduce a
# project package/dependency surface merely for CI automation.
ast.parse(HARNESS)
assert "selenium" not in HARNESS.lower()
assert "marionette_driver" not in HARNESS
assert "urllib.request" in HARNESS
assert "127.0.0.1" in HARNESS
assert 'ADDON_ID = "pin-mails@MailPerch.local"' in HARNESS
assert 'PANEL_ID = "pin-mails-panel"' in HARNESS
assert 'TOGGLE_ID = "pin-mails-qfb-toggle"' in HARNESS
assert 'SMOKE_FOLDER_NAME = "MailPerch Smoke"' in HARNESS
assert "/moz/addon/install" in HARNESS
assert "/moz/addon/uninstall" in HARNESS
assert "/moz/context" in HARNESS
assert "PROVISION_MAIL_VIEW_SCRIPT" in HARNESS
assert "createLocalMailAccount" in HARNESS
assert "displayFolder" in HARNESS
assert "synthetic-local-mail-view" in HARNESS
assert "native-mail-view-ready" in HARNESS
assert "threadTree" in HARNESS
assert "qfb-starred" in HARNESS
assert "quickFilterButtons" in HARNESS
assert "viewWrapper" in HARNESS
assert "quickFilterBar" in HARNESS
assert "currentFolderUri" in HARNESS
assert "selectedFolderUri" in HARNESS
assert "ExtensionParent.GlobalManager.getExtension" in HARNESS
assert "backgroundState" in HARNESS
assert "startupReason" in HARNESS
assert "hasWakeupBackground" in HARNESS
assert "afterInstallRuntime" in HARNESS
assert "lastRuntimeState" in HARNESS
assert "OPEN_DASHBOARD_SCRIPT" in HARNESS
assert "panel-dashboard-button-opens-dashboard-once" in HARNESS
assert "dashboardTabCount" in HARNESS
assert "runtime-cleanup-after-uninstall" in HARNESS
assert "clean-reinstall" in HARNESS

# Runtime-sensitive changes are checked on PRs and again after integration on main;
# manual dispatch remains available for explicit reruns.
assert "workflow_dispatch:" in WORKFLOW
assert re.search(r"branches:\s*\n\s*- main", WORKFLOW)
assert "pull_request:" in WORKFLOW
assert 'THUNDERBIRD_VERSION: "153.0.1esr"' in WORKFLOW
assert 'GECKODRIVER_VERSION: "0.37.1"' in WORKFLOW
assert "archive.mozilla.org/pub/thunderbird/releases" in WORKFLOW
assert "SHA256SUMS" in WORKFLOW
assert "sha256sum --check --strict" in WORKFLOW
assert "repos/mozilla/geckodriver/releases/tags" in WORKFLOW
assert "digest" in WORKFLOW
assert "--allow-system-access" in HARNESS
assert "xvfb-run -a" in WORKFLOW
assert "npm run check && npm run build" in WORKFLOW
assert "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a" in WORKFLOW
assert not re.search(r"uses:\s+[^\s]+@(main|master|latest)\b", WORKFLOW)

# The functional/scale bench stays separate from the PR smoke. It provisions
# only disposable local mail, installs the unchanged built XPI, records concise
# JSON evidence, and covers the complete agreed volume matrix.
ast.parse(BENCH)
assert "selenium" not in BENCH.lower()
assert "from real_smoke import" in BENCH
assert "SUPPORTED_VOLUMES = (50, 100, 500, 1000, 2000)" in BENCH
assert "nsIMsgLocalMailFolder" in BENCH
assert "Services.io.offline = true" in BENCH
assert "example.invalid" in BENCH
assert '"mailperch.installation":"mailperch-installation-v1"' in BENCH
assert 'path:"pin-mails-v2.sqlite"' in BENCH
assert "BEGIN IMMEDIATE TRANSACTION" in BENCH
assert "INSERT INTO refs" in BENCH
assert "trackingMode: conversation ? \"conversation\" : \"message\"" in BENCH
for varied_field in [
    "checklist", "dueAt", "priorityLevel", "workflowStatus", "followUpAt",
    "noReplyTracking", "groupId", "caseId", "templateId",
]:
    assert varied_field in BENCH
for required_measure in [
    "creationMs", "panelRenderAndInteractionMs", "searchMs", "filterMs",
    "openingMs", "finalPinnedCount", "jsExceptions", "timeouts",
]:
    assert required_measure in BENCH
for required_runtime_surface in [
    "currentInbox", "selectedAccounts", "global", "pin-mails-load-more",
    "thunderbird-light.png", "thunderbird-dark.png", "OPTIONS_CONTENT_SCRIPT",
    "OPEN_DASHBOARD_BENCH_SCRIPT", "DASHBOARD_CONTENT_SCRIPT",
    "SELECT_OPTIONS_BENCH_SCRIPT", "CONSOLE_ERRORS_SCRIPT", "THEME_BENCH_SCRIPT",
    "twoCompleteCards", "controlsAligned", "cleanup-and-clean-reinstall",
    "PROFILE_STATE_SCRIPT", "ACCOUNT_SCOPE_PANEL_SCRIPT",
    "same-profile-distinct-thunderbird-processes",
]:
    assert required_runtime_surface in BENCH
assert '"args": ["-profile", str(profile)]' in BENCH
assert "session-1-selected-account-runtime" in BENCH
assert "const searchExpected = Number(scopeExpected.searchCount || 0);" in BENCH
assert 'while (cards().length < searchExpected && list.querySelector(".pin-mails-load-more"))' in BENCH
assert "selected-account search rendered ${searchable}" in BENCH
assert "selected-account total preserved during search" in BENCH
assert "selected-account search count ${searchable}" not in BENCH
assert '("none", ())' in BENCH
assert "selected-account-runtime-after-process-restart" in BENCH
assert "A-and-C-settings-and-render-persistence" in BENCH
assert "--prepare-manual-scope-validation" in BENCH
assert "MailPerch manual selected-account validation is ready." in BENCH
assert "A: account.key=account1; incomingServer.key=server1; 18 pins" in BENCH
assert "B: account.key=account2; incomingServer.key=server2; 16 pins" in BENCH
assert "C: account.key=account3; incomingServer.key=server3; 16 pins" in BENCH
assert 'SEED_DATASET_SCRIPT, [50, []]' in BENCH
assert '"account1,account2,account3"' in BENCH
assert '"server1,server2,server3"' in BENCH
assert "Profile retained:" in BENCH
assert "userDisabled" not in BENCH
assert '"results.json"' in BENCH

assert "workflow_dispatch:" in BENCH_WORKFLOW
assert "pull_request:" not in BENCH_WORKFLOW
assert "push:" not in BENCH_WORKFLOW
assert "50,100,500,1000,2000" in BENCH_WORKFLOW
assert "tests/thunderbird/functional_bench.py" in BENCH_WORKFLOW
assert "xvfb-run -a" in BENCH_WORKFLOW
assert 'THUNDERBIRD_VERSION: "153.0.1esr"' in BENCH_WORKFLOW
assert 'GECKODRIVER_VERSION: "0.37.1"' in BENCH_WORKFLOW
assert "sha256sum --check --strict" in BENCH_WORKFLOW
assert "artifacts/thunderbird-bench/" in BENCH_WORKFLOW
assert not re.search(r"uses:\s+[^\s]+@(main|master|latest)\b", BENCH_WORKFLOW)
assert re.search(
    r"\.pin-mails-smart-view-select\s*\{[^}]*flex:\s*0 1 150px;[\s\S]*?"
    r"@container threadPane \(max-width: 390px\)[\s\S]*?"
    r"\.pin-mails-smart-view-select\s*\{[^}]*flex:\s*0 0 auto;"
    r"[^}]*block-size:\s*30px;",
    PIN_CSS,
)

print("Thunderbird real-runtime test bench guards: OK")
