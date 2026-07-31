#!/usr/bin/env python3
"""Regression guards for data normalization, concurrency and lifecycle fixes."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
impl = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
storage = (ROOT / "extension/api/pinInbox/modules/storage.js").read_text(encoding="utf-8")
workflow = (ROOT / "extension/api/pinInbox/modules/workflow.js").read_text(encoding="utf-8")
options = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
dashboard = (ROOT / "extension/dashboard/dashboard.js").read_text(encoding="utf-8")

# Imported maps and stable keys must reject prototype-polluting names and use
# own-property checks rather than inherited membership.
for token in [
    "UNSAFE_RECORD_KEYS",
    "isSafeRecordKey",
    "Object.prototype.hasOwnProperty.call",
    "uniqueStrings",
    "uniqueById",
    "normalizeRuleLog",
]:
    assert token in impl, token
assert " in this._data.refs" not in impl
assert "key in data.refs" not in impl
assert "key in previous" not in storage
assert "key in next" not in storage

# Thunderbird priorities increase from low to high; duplicate Message-IDs must
# not bypass the stored identity fingerprint.
assert "Number(hdr.priority) >= Number(Ci.nsMsgPriority.high)" in impl
assert "if (found && ref.headerMessageId) return found;" not in impl
assert "!ref.identityFingerprint && ref.headerMessageId" in impl

# Recovery writes must preserve the Promise<void> chain, and the panel scroll
# listener must be installed only after the panel exists.
assert "then(async () =>" in impl
create_panel_call = impl.index("    createPanel();", impl.index("const cleanup ="))
scroll_listener = impl.index('panel?.querySelector(".pin-mails-panel-list")?.addEventListener', create_panel_call)
assert create_panel_call < scroll_listener

# UI races: overlapping dashboard loads cannot permanently disable controls or
# let stale loads overwrite state. Programmatic color reset is a real edit.
assert "if (next === loading) return;" in dashboard
assert "if (generation !== loadGeneration) return false;" in dashboard
assert "if (generation !== loadGeneration) return;" in dashboard
assert "calendarRenderGeneration" in options
assert "uniqueEntityId" in options
assert "account.defaultColor);" in options and "setDirty();" in options
assert "account.defaultColor);" in options and "setDirty();" in options

# Recurrence guard and protected archive fields remain present in the pure model.
assert "const jumps = Math.floor" in workflow
assert workflow.index("...extra") < workflow.index("id: `history-")

print("Data integrity and lifecycle guards: OK")
