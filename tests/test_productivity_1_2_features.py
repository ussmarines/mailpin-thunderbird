#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / "extension"
impl = (EXT / "api/pinInbox/implementation.js").read_text(encoding="utf-8")
schema = json.loads((EXT / "api/pinInbox/schema.json").read_text(encoding="utf-8"))[0]
manifest = json.loads((EXT / "manifest.json").read_text(encoding="utf-8"))
background = (EXT / "background.js").read_text(encoding="utf-8")
dashboard_html = (EXT / "dashboard/dashboard.html").read_text(encoding="utf-8")
dashboard_js = (EXT / "dashboard/dashboard.js").read_text(encoding="utf-8")
options_html = (EXT / "options/options.html").read_text(encoding="utf-8")
options_js = (EXT / "options/options.js").read_text(encoding="utf-8")
tokens_css = (EXT / "styles/tokens.css").read_text(encoding="utf-8")
tag_adapter = (EXT / "api/pinInbox/modules/thunderbird-tags.js").read_text(encoding="utf-8")

modules = ("checklists.js", "analytics.js", "saved-views.js", "tag-sync.js")
for module in modules:
    path = EXT / "api/pinInbox/modules" / module
    assert path.is_file(), module
    assert module in impl, f"{module} is not loaded by the Experiment"

functions = {item["name"] for item in schema["functions"]}
function_defs = {item["name"]: item for item in schema["functions"]}

for name in ("updateReferenceDetails", "createSavedView", "updateSavedView", "deleteSavedView", "syncTags"):
    assert name in functions, name
    assert name in impl, name

update_ref_schema = function_defs["updateReferenceDetails"]["parameters"][0]
sync_tags_schema = function_defs["syncTags"]["parameters"][0]["items"]
assert update_ref_schema["maxLength"] == 8192, update_ref_schema
assert sync_tags_schema["maxLength"] == 8192, sync_tags_schema

# 1 + 2: notes/checklists remain bounded and editable from both the privileged card editor and dashboard.
assert "MAX_NOTE_LENGTH = 4000" in impl
assert "checklist: PIN_MODULES.PinChecklists?.normalize" in impl
assert "pin-mails-editor-checklist" in impl
assert "updateReferenceDetails" in dashboard_js

# 3: global search includes the new local metadata without message bodies or attachments.
for token in ("PinChecklists?.searchableText", "item.tags", "item.groupName", "item.caseName", "item.responseState"):
    assert token in impl, token
assert "messageBody" not in impl and "attachmentContent" not in impl

# 4: optional tag synchronization stays in the existing privileged API and does not widen MV3 permissions.
assert 'enableThunderbirdTagSync' in options_html and 'sync-tags' in options_html
assert '_ensureMailPerchTags' in impl and '_clearReferenceTags' in impl and '_tagHeadersForReference' in impl
assert 'this._thunderbird?.tags?.ensureDefinitions' in impl and 'this._thunderbird?.tags?.removeDefinitions' in impl
assert 'tags.deleteKey' in tag_adapter
assert re.search(r'hardenImportedConfiguration[\s\S]*?settings\.enableThunderbirdTagSync = false;', impl), "Imported backups must not auto-enable Thunderbird tag side effects"
assert 'existing !== String(definition.label || "")' in tag_adapter, "Managed tag ownership must be exact"
assert tag_adapter.index('validateDefinitions(definitions);') < tag_adapter.index('tags.addTagForKey'), "Tag collision preflight must run before creation"
assert 'trackingMode !== "conversation"' in impl and '_conversationHeaders(resolved)' in impl
permissions = set(manifest.get("permissions", []))
assert "messagesTags" not in permissions and "messagesRead" not in permissions
assert permissions == {"menus"}, f"Unexpected permission expansion: {sorted(permissions)}"

# 5: the pre-existing two-way Calendar path remains wired and user controlled.
for token in ("enableBidirectionalCalendarSync", "_registerCalendarObservers", "_onCalendarItemChanged", "_syncReferenceToCalendar", "_syncCalendarLinks"):
    assert token in impl, token
assert 'id="enableBidirectionalCalendarSync"' in options_html
assert "_syncReferenceTags(ref).catch" not in impl, "Synchronous tag sync must not be treated as a Promise"
assert 'Synchronisation des tags après Agenda impossible' in impl

# 6: command palette is available from the dashboard and a global command without hijacking existing shortcuts.
assert "open-command-palette" in manifest.get("commands", {})
assert "open-command-palette" in background
for token in ('id="command-palette"', 'id="command-search"', 'id="command-list"'):
    assert token in dashboard_html, token
assert "commandDefinitions" in dashboard_js and "openCommandPalette" in dashboard_js

# 7: saved views persist through schema v7 and expose group/case/priority/response/checklist filters.
assert 'savedViews: []' in impl
assert 'schemaVersion: 7' in impl  # data schema remains v7
assert 'this._settings.schemaVersion = PIN_MODULES.PinSettings.SCHEMA_VERSION; this._data.schemaVersion = 7;' in impl
assert 'this._settings.schemaVersion = 7' not in impl
assert 'secure: Boolean(server.isSecure)' in impl
assert 'offlineSupport: Number(server.offlineSupportLevel || 0) >= 10' in impl
for token in ('id="saved-views"', 'id="saved-view-group"', 'id="saved-view-case"', 'id="saved-view-priority"'):
    assert token in dashboard_html, token
for field in ("groupId", "caseId", "priority", "responseState", "checklist"):
    assert field in (EXT / "api/pinInbox/modules/saved-views.js").read_text(encoding="utf-8")

# 8 + 9: reply-direction states and enhanced analytics are exposed to the dashboard.
for token in ("lastOutgoingAt", "lastReplyAt", "waitingForThem", "needsReply", "PinAnalytics"):
    assert token in impl, token
analytics_js = (EXT / "api/pinInbox/modules/analytics.js").read_text(encoding="utf-8")
for token in ("completedLast7Days", "averageOpenAgeMs", "averageWaitingAgeMs", "checklistPendingItems"):
    assert token in analytics_js and token in dashboard_js, token

# UI: local Fluent-style font stack, no remote font, and no explicit text size below 12 px.
assert '"Segoe UI Variable Text"' in tokens_css and '"Aptos"' in tokens_css
assert "@font-face" not in tokens_css
assert not re.search(r"https?://", tokens_css, re.I)

BASE_PX = 14.0
for relative in ("dashboard/dashboard.css", "options/options.css", "styles/pin.css"):
    css = (EXT / relative).read_text(encoding="utf-8")
    for match in re.finditer(r"font-size\s*:\s*([^;}]+)", css, re.I):
        value = match.group(1).strip()
        # max(..., 12px) explicitly establishes the requested floor.
        if re.search(r"\bmax\([^)]*12px[^)]*\)", value, re.I):
            continue
        px = [float(number) for number in re.findall(r"(?<![\w.-])(\d+(?:\.\d+)?)px\b", value)]
        rem = [float(number) * BASE_PX for number in re.findall(r"(?<![\w.-])(\d+(?:\.\d+)?)rem\b", value)]
        em = [float(number) * BASE_PX for number in re.findall(r"(?<![\w.-])(\d+(?:\.\d+)?)em\b", value)]
        candidates = px + rem + em
        assert not candidates or min(candidates) >= 12, f"{relative}: font-size below 12px: {value}"

# Options must keep every new control in the registry/help system rather than becoming a detached UI patch.
assert '"enableThunderbirdTagSync"' in options_js
assert 'buttonHelpSyncTags' in options_js

print("MailPerch productivity 1.2 feature guards: OK")

# 1.5.2 runtime-coverage regressions.
assert 'function msg(key, fallback, substitutions = undefined)' in dashboard_js
assert 'getMessage(key, values)' in dashboard_js
assert 'msg("checklistProgress", "Sous-tâches · $1/$2",' in dashboard_js
assert 'msg("healthSummary", "$1 point(s) détecté(s) · $2 événement(s) diagnostic récent(s).",' in dashboard_js
