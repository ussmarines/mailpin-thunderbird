#!/usr/bin/env python3
"""Keep all release-facing MailPerch version declarations aligned."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
manifest = json.loads((ROOT / "extension/manifest.json").read_text(encoding="utf-8"))
version = str(package["version"])
assert re.fullmatch(r"\d+\.\d+\.\d+", version), version
assert manifest["version"] == version, (manifest["version"], version)

checks = {
    "README.md": [f"**MailPerch :** `{version}`", f"MailPerch_v{version}.xpi"],
    "README.en.md": [f"**MailPerch:** `{version}`", f"MailPerch_v{version}.xpi"],
    "CHANGELOG.md": [f"## {version}"],
    "THIRD_PARTY_NOTICES.md": [f"MailPerch {version}"],
    "extension/styles/pin.css": [version],
    "PROJECT_MEMORY.md": [f"Version publique : **{version}**"],
    "docs/PROJECT_STATE.json": [f'"extensionVersion": "{version}"'],
    "docs/BUG_TRACKER.md": [f"Version publique : **{version}**"],
}
for relative, tokens in checks.items():
    text = (ROOT / relative).read_text(encoding="utf-8")
    for token in tokens:
        assert token in text, f"{relative}: missing version token {token!r}"
print(f"Version declarations {version}: OK")
