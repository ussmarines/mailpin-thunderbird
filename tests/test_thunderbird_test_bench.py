#!/usr/bin/env python3
from pathlib import Path
import ast
import re

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = (ROOT / ".github/workflows/thunderbird-smoke.yml").read_text(encoding="utf-8")
HARNESS_PATH = ROOT / "tests/thunderbird/real_smoke.py"
HARNESS = HARNESS_PATH.read_text(encoding="utf-8")

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
assert "runtime-cleanup-after-uninstall" in HARNESS
assert "clean-reinstall" in HARNESS

# The workflow is intentionally not a required main-branch push job yet. It
# runs on this consolidation branch, PRs that touch runtime-sensitive paths,
# and explicit manual dispatch while we establish reliability.
assert "workflow_dispatch:" in WORKFLOW
assert "refactor/thunderbird-integration-and-ux" in WORKFLOW
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

print("Thunderbird real-runtime test bench guards: OK")
