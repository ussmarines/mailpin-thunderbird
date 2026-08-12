#!/usr/bin/env python3
"""Keep all release-facing MailPin version declarations aligned."""
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
    "README.md": [f"**MailPin :** `{version}`", f"MailPin_v{version}.xpi", f"release-v{version}"],
    "README.en.md": [f"**MailPin:** `{version}`", f"MailPin_v{version}.xpi", f"release-v{version}"],
    "CHANGELOG.md": [f"## {version}"],
    "THIRD_PARTY_NOTICES.md": [f"MailPin {version}"],
    "PROJECT_MEMORY.md": [f"Version publique : **{version}**"],
    "PRIVACY.md": [f"MailPin {version} ne contient", f"MailPin {version} contains"],
    "SECURITY.md": [f"SECURITY_AUDIT_{version}.md"],
    "STORE_RELEASE.md": [f"Version publique :** {version}", f"MailPin_v{version}.xpi", f"MailPin_GitHub_Repository_v{version}.zip"],
    "docs/ATN_RELEASE_CHECKLIST.md": [f"— {version}", f"version {version} synchronisée"],
    "docs/KNOWN_LIMITATIONS.md": [f"Version {version} et portée de validation"],
    "docs/MANUAL_TEST_PLAN.md": [f"— {version}"],
    "docs/PROJECT_STATE.json": [f'"extensionVersion": "{version}"'],
    "docs/BUG_TRACKER.md": [f"Version publique : **{version}**"],
    "release/ATN_REVIEW_NOTES_TEMPLATE.md": [f"— MailPin {version}", f"Version :** {version}"],
    "release/BUILD_INSTRUCTIONS.md": [f"build {version}", f"MailPin_v{version}.xpi", f"MailPin_GitHub_Repository_v{version}.zip"],
    "release/manifest-store-template.json": [f"publication {version}"],
}
for relative, tokens in checks.items():
    text = (ROOT / relative).read_text(encoding="utf-8")
    for token in tokens:
        assert token in text, f"{relative}: missing version token {token!r}"
print(f"Version declarations {version}: OK")
