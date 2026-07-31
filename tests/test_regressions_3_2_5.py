#!/usr/bin/env python3
"""Regression guards for the 3.2.5 star, settings and Windows CI fixes."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPLEMENTATION = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
PIN_CSS = (ROOT / "extension/styles/pin.css").read_text(encoding="utf-8")
OPTIONS_JS = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
OPTIONS_HTML = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
DEEP_AUDIT = (ROOT / "scripts/deep_audit.py").read_text(encoding="utf-8")
PACKAGE = (ROOT / "package.json").read_text(encoding="utf-8")
TRACKER = (ROOT / "docs/BUG_TRACKER.md").read_text(encoding="utf-8")

# Independent pin mode leaves Thunderbird's stars untouched and clears all
# annotations that a virtualized row may retain from native-star mode.
assert 'const nativeStarMode = this._settings.pinMode === "nativeStar" && isEnabled();' in IMPLEMENTATION
assert 'for (const candidate of starCandidates) restoreNativeButton(candidate);' in IMPLEMENTATION
assert 'const nativeButtonSnapshots = new WeakMap();' in IMPLEMENTATION
assert 'snapshotNativeButton(star);' in IMPLEMENTATION
assert ':root[pin-mails-inbox][pin-mails-native-star] #threadTree [data-pin-mails-duplicate-star]' in PIN_CSS
assert ':has(.button-star) .tree-button-flag:not(.button-star)' not in PIN_CSS
assert ':root[pin-mails-inbox] #threadTree [data-pin-mails-duplicate-star]' not in PIN_CSS

# Save and cancel are native form actions. This preserves keyboard activation
# and avoids a click-only path outside the form.
assert 'id="discard-changes" type="reset" form="settings-form"' in OPTIONS_HTML
assert 'id="save-all-floating" type="submit" form="settings-form"' in OPTIONS_HTML
assert 'form.addEventListener("submit", saveAll);' in OPTIONS_JS
assert 'form.addEventListener("reset", discardChanges);' in OPTIONS_JS
assert '$("save-all-floating").addEventListener("click", saveAll);' not in OPTIONS_JS
assert 'async function discardChanges(event = null)' in OPTIONS_JS
assert 'settings: {...saved.settings}' in OPTIONS_JS
assert 'form.requestSubmit($("save-all-floating"));' in OPTIONS_JS

# Windows subprocesses use NUL-delimited binary streams, so CRLF conversion
# can never become part of a Git pathname.
assert '["git", "check-ignore", "--no-index", "-z", "--stdin"]' in DEEP_AUDIT
assert 'input=b"\\0".join(tracked_names) + b"\\0"' in DEEP_AUDIT
assert 'text=False' in DEEP_AUDIT
assert '"\\n".join(sorted(tracked_names))' not in DEEP_AUDIT

# The bug register is permanent and is checked by the standard validation path.
assert 'docs/BUG_TRACKER.md' in TRACKER or '# Registre des bugs MailPerch' in TRACKER
assert 'python scripts/check_bug_tracker.py' in PACKAGE
for bug_id in ("MP-2026-004", "MP-2026-005", "MP-2026-006"):
    assert bug_id in TRACKER

print("MailPerch 3.2.5 regression guards: OK")
