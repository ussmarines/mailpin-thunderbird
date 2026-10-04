"""Native architecture guard; validates the actual packaging boundary."""
from pathlib import Path
import json
import re
import subprocess
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import build
manifest = json.loads((ROOT / "extension/manifest.json").read_text(encoding="utf-8"))
assert manifest["manifest_version"] == 3 and "experiment_apis" not in manifest
assert manifest["browser_specific_settings"]["gecko"]["id"] == "ussmarines.mailpin@addons.thunderbird.net"
assert "connect-src 'none'" in manifest["content_security_policy"]["extension_pages"]
assert set(manifest["permissions"]) == {"menus", "accountsRead", "messagesRead", "messagesUpdate", "messagesTagsList", "messagesTags", "storage", "alarms", "notifications"}
assert set(manifest["optional_permissions"]) == {"messagesMove", "messagesDelete", "compose"}
for source in build.tracked_repository_files():
    if not source.is_relative_to(build.EXTENSION): continue
    relative = source.relative_to(build.EXTENSION).as_posix()
    if relative.startswith(build.XPI_EXCLUDED_PREFIXES) or source.name == "AGENTS.md" or relative == "styles/pin.css": continue
    if source.suffix not in {".js", ".html", ".css"}: continue
    text = source.read_text(encoding="utf-8")
    for pattern in [r"\bpinInbox\b", r"\bChromeUtils\b", r"\bServices\b", r"\bXPCOM\b", r"\bComponents\b", r"about:3pane", r"\beval\s*\(", r"new\s+Function\s*\(", r"\.(?:innerHTML|outerHTML)\s*=", r"\bfetch\s*\(", r"\bXMLHttpRequest\b", r"\bWebSocket\b"]:
        assert not re.search(pattern, text), (relative, pattern)
    if source.suffix == ".js":
        result = subprocess.run(["node", "--check", str(source)], capture_output=True, text=True)
        assert result.returncode == 0, (relative, result.stderr)
en = json.loads((ROOT / "extension/_locales/en/messages.json").read_text(encoding="utf-8"))
fr = json.loads((ROOT / "extension/_locales/fr/messages.json").read_text(encoding="utf-8"))
assert en.keys() == fr.keys(), "FR/EN locale keys diverged"
for name in ["settings", "storage", "workflow", "rules", "smart", "bulk", "diagnostics", "providers", "health", "migrations", "performance", "localization", "review", "related", "checklists", "analytics", "saved-views", "tag-sync", "identity"]:
    old = (ROOT / f"extension/api/pinInbox/modules/{name}.js").read_text(encoding="utf-8")
    new = (ROOT / f"extension/native/models/{name}.js").read_text(encoding="utf-8")
    assert new == old.replace("})(this);", "})(globalThis);"), f"Unreviewed model drift: {name}"
print("PASS native MV3/package/identity/no-network/no-privilege/syntax/locales/model provenance")
