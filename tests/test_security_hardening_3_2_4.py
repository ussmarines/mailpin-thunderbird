"""Security-boundary and uninstall regression guards for MailPerch 3.2.4."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / "extension"
IMPLEMENTATION = (EXT / "api/pinInbox/implementation.js").read_text(encoding="utf-8")
OPTIONS = (EXT / "options/options.js").read_text(encoding="utf-8")
PIN_CSS = (EXT / "styles/pin.css").read_text(encoding="utf-8")
SCANNER = (ROOT / "scripts/scan_secrets.py").read_text(encoding="utf-8")
MANIFEST = json.loads((EXT / "manifest.json").read_text(encoding="utf-8"))
SCHEMA = json.loads((EXT / "api/pinInbox/schema.json").read_text(encoding="utf-8"))[0]
PACKAGE = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
BUILD = (ROOT / "scripts/build.py").read_text(encoding="utf-8")
CHECK_REPO = (ROOT / "scripts/check_repo.py").read_text(encoding="utf-8")
CI_WORKFLOW = (ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
RELEASE_WORKFLOW = (ROOT / ".github/workflows/release.yml").read_text(encoding="utf-8")

assert PACKAGE["version"] == MANIFEST["version"] == "3.2.5"
assert MANIFEST["permissions"] == ["menus"]
assert "content_scripts" not in MANIFEST
assert "externally_connectable" not in MANIFEST
assert "web_accessible_resources" not in MANIFEST
assert "events" not in MANIFEST["experiment_apis"]["pinInbox"]["parent"]
assert MANIFEST["content_security_policy"]["extension_pages"] == (
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; "
    "object-src 'none'; connect-src 'none'; base-uri 'none'; "
    "frame-ancestors 'none'; form-action 'none'"
)

# No network/code injection sinks are permitted in extension runtime code.
for path in [*EXT.rglob("*.js"), *EXT.rglob("*.mjs")]:
    text = path.read_text(encoding="utf-8")
    for forbidden in (
        "eval(", "new Function", ".innerHTML", ".outerHTML",
        "insertAdjacentHTML", "XMLHttpRequest", "WebSocket(", "fetch("
    ):
        assert forbidden not in text, (path, forbidden)

# Privileged API inputs are bounded and imported configuration is inert.
for token in (
    "function assertStructuredInput(",
    "MAX_API_INPUT_NODES = 100_000",
    "MAX_API_INPUT_DEPTH = 24",
    "MAX_BULK_KEYS = 500",
    'assertStructuredInput(configuration, "Configuration"',
    'assertStructuredInput(configuration, "Sauvegarde"',
    "normalizeStableKeyList(stableKeys)",
    "if (!Number.isFinite(item))",
    'if (raw.length > MAX_IMPORT_BYTES)',
    'assertStructuredInput(parsed, `Préférence ${prefName}`',
):
    assert token in IMPLEMENTATION, token

for token in (
    "settings.enableAutomaticRules = false",
    "settings.enableAutomaticNoReplyTracking = false",
    "settings.enableWaitingWorkflow = false",
    "settings.moveToWaitingOnReply = false",
    "settings.reopenOnConversationReply = false",
    "settings.enableRecurringFollowUps = false",
    "settings.autoCompleteOnArchive = false",
    "settings.enableBidirectionalCalendarSync = false",
    "settings.calendarDeleteOnUnpin = false",
    "settings.calendarCompleteOnPinComplete = false",
    "settings.autoCleanup = false",
    "settings.confirmDelete = true",
    "settings.confirmBulkDestructiveActions = true",
    "settings.autoPinSenders = []",
    "settings.autoPinTags = []",
    "settings.safeMode = true",
    'settings.backupDirectory = String(currentBackupDirectory || "")',
):
    assert token in IMPLEMENTATION, token

for token in (
    "ref.noReplyTracking = false",
    "ref.noReplyAt = 0",
    "ref.noReplyStartedAt = 0",
    'ref.noReplyBaselineMessageId = ""',
):
    assert token in IMPLEMENTATION, token


for token in (
    'const SQLITE_LIST_TABLE_COLUMNS = Object.freeze({',
    'const SQLITE_REF_COLUMN_DEFINITIONS = Object.freeze([',
    'if (SQLITE_LIST_TABLE_COLUMNS[table] !== idColumn)',
    'if (table !== "refs" || !SQLITE_REF_COLUMN_DEFINITIONS.includes(definition))',
    'this.connection.execute("PRAGMA table_info(refs)")',
):
    assert token in IMPLEMENTATION, token

for token in (
    'const normalizedAction = boundedText(action, 64)',
    'if (!allowedActions.has(normalizedAction)) return {count: 0, unsupported: true}',
    'const id=boundedText(caseId, 64)',
    'const id=boundedText(templateId, 64)',
    'stableKey = boundedText(stableKey, 8192)',
    'boundedText(reason, 128) || "manual"',
):
    assert token in IMPLEMENTATION, token


for token in (
    "function portableSettingsSnapshot(value)",
    'settings.backupDirectory = ""',
    'settings.preferredCalendarId = ""',
    "function portableDataSnapshot(value)",
    "data.providerMatrix = clone(DEFAULT_DATA.providerMatrix)",
    "settings: portableSettingsSnapshot(this._settings)",
    "data: portableDataSnapshot(this._data)",
):
    assert token in IMPLEMENTATION, token

# Fresh installation defaults remain the recommended, non-destructive profile.
for token in (
    'settingsExperience: "guided"',
    'uiPreset: "balanced"',
    'density: "normal"',
    "enableAutomaticRules: false",
    "enableAutomaticNoReplyTracking: false",
    "enableBidirectionalCalendarSync: false",
    "calendarDeleteOnUnpin: false",
    "calendarCompleteOnPinComplete: false",
    "enableWaitingWorkflow: false",
    "reopenOnConversationReply: false",
    "enableRecurringFollowUps: false",
    "autoCleanup: false",
    "confirmDelete: true",
    "confirmBulkDestructiveActions: true",
):
    assert token in IMPLEMENTATION, token

# Experiments cannot use static uninstall manifest events. MailPerch instead
# listens to Gecko's awaited core Management lifecycle and uses AddonManager
# only for the early/cancellable `uninstalling` signal.
for token in (
    'ChromeUtils.importESModule(\n  "resource://gre/modules/Extension.sys.mjs"',
    'lazy.AddonManager.addAddonListener(handlers.addonListener)',
    'onUninstalling(addon)',
    'onOperationCancelled(addon)',
    'Management.on("uninstall", handlers.onUninstall)',
    'Management.on("update", handlers.onUpdate)',
    'lazy.AddonManager.removeAddonListener(this.addonListener)',
    'registerMailPerchLifecycle(context.extension.id)',
    'handlers.uninstallPending = true',
    'MAILPERCH_UNINSTALLING = false',
    'await this.beginPreparation()',
):
    assert token in IMPLEMENTATION, token
assert "static async onUninstall" not in IMPLEMENTATION
assert "MAILPERCH_UNINSTALLING = true" in IMPLEMENTATION
assert "Promise.allSettled" in IMPLEMENTATION
assert "instance._prepareForUninstall()" in IMPLEMENTATION
assert "await storage.close()" in IMPLEMENTATION
assert "await purgeMailPerchProfileData()" in IMPLEMENTATION
lifecycle_start = IMPLEMENTATION.index("async onUninstall(_eventName, details = {})")
assert IMPLEMENTATION.index("await this.beginPreparation()", lifecycle_start) < IMPLEMENTATION.index("await purgeMailPerchProfileData()", lifecycle_start)
assert '`${DB_FILENAME}-journal`' in IMPLEMENTATION
assert "Services.prefs.getBranch(PREF_BRANCH).deleteBranch" in IMPLEMENTATION
assert "async function isVerifiedMailPerchBackup(path)" in IMPLEMENTATION
assert "PIN_MODULES.PinStorageHelpers?.verifyBackupEnvelope?.(envelope)" in IMPLEMENTATION
assert "envelope?.checksum" in IMPLEMENTATION
assert "if (MAILPERCH_UNINSTALLING)" in IMPLEMENTATION

# A core-cleared extension-storage sentinel protects the disabled/reinstall edge:
# upgrades preserve pre-sentinel data once, while a later reinstall starts clean.
for token in (
    'ExtensionStorage: "resource://gre/modules/ExtensionStorage.sys.mjs"',
    'const INSTALL_SENTINEL_KEY = "mailperch.installation"',
    'const INSTALL_SENTINEL_VALUE = "mailperch-installation-v1"',
    'async function ensureMailPerchInstallationState(extensionId)',
    'const jsonFile = await lazy.ExtensionStorage.getFile(id)',
    'const marker = jsonFile?.data?.get(INSTALL_SENTINEL_KEY)',
    'const preserveExisting = await shouldPreservePreSentinelData(id)',
    'if (!preserveExisting) await purgeMailPerchProfileData()',
    'await lazy.ExtensionStorage.set(id, {[INSTALL_SENTINEL_KEY]: INSTALL_SENTINEL_VALUE})',
    'await ensureMailPerchInstallationState(context.extension.id)',
):
    assert token in IMPLEMENTATION, token
assert IMPLEMENTATION.index('await ensureMailPerchInstallationState(context.extension.id)') < IMPLEMENTATION.index('const rawSettings = parseStored(PREF_SETTINGS, DEFAULT_SETTINGS)')

# The settings page must not fail before Save/Cancel can be used.
assert "let configurationReady = false;" in OPTIONS
assert "let saveInFlight = false;" in OPTIONS
assert "if (!configurationReady || !dirty || saveInFlight) return;" in OPTIONS
assert "saveInFlight = false;" in OPTIONS
assert "backupDirectory = requireConfiguration().settings.backupDirectory" in OPTIONS
assert "this._settings.backupDirectory = currentBackupDirectory" in IMPLEMENTATION

# The row controller and CSS retain one canonical native star only.
assert 'data-pin-mails-duplicate-star' in IMPLEMENTATION
assert '[data-pin-mails-duplicate-star]' in PIN_CSS
assert ':root[pin-mails-inbox][pin-mails-native-star] #threadTree [data-pin-mails-duplicate-star]' in PIN_CSS
assert ':has(.button-star) .tree-button-flag:not(.button-star)' not in PIN_CSS

# There is deliberately no client-side administrator role or privilege switch.
for path in [*EXT.rglob("*.js"), *EXT.rglob("*.mjs"), *EXT.rglob("*.html")]:
    text = path.read_text(encoding="utf-8")
    assert not re.search(r"\b(?:isAdmin|adminMode|administratorMode|superuser)\b", text, re.I), path

# High-volume API arrays are constrained by schema as well as implementation.
functions = {item["name"]: item for item in SCHEMA["functions"]}
for name in ("setNoReplyTracking", "performReferenceAction", "setWorkflowStatus", "applyTemplate"):
    stable_keys = next(p for p in functions[name]["parameters"] if p["name"] == "stableKeys")
    assert stable_keys["maxItems"] == 500, name
    assert stable_keys["items"]["maxLength"] == 8192, name

# Secret scanning cannot exempt a credential merely by calling it an example.
assert 'ALLOW_MARKERS = ("secret-scan: allow",)' in SCANNER
assert "path.resolve() == Path(__file__).resolve()" in SCANNER
assert "source.is_symlink()" in BUILD
assert "resolved.is_relative_to(root.resolve())" in BUILD

# CI uses only the standard library for repository checks, pins every external
# action to an immutable commit and does not persist checkout credentials.
assert "BeautifulSoup" not in CHECK_REPO
assert "tinycss2" not in CHECK_REPO
assert "from html.parser import HTMLParser" in CHECK_REPO
assert "def validate_css_structure(" in CHECK_REPO
for workflow in (CI_WORKFLOW, RELEASE_WORKFLOW):
    assert "python -m pip install" not in workflow
    assert "beautifulsoup4" not in workflow
    assert "tinycss2" not in workflow
    assert "persist-credentials: false" in workflow
    assert "actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd" in workflow
    assert "actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e" in workflow
    assert "actions/setup-python@a309ff8b426b58ec0e2a45f0f869d46889d02405" in workflow
    assert "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a" in workflow
assert PACKAGE.get("dependencies") is None
assert PACKAGE.get("devDependencies") is None

print("MailPerch 3.2.4 security hardening guards: OK")
