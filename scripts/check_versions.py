#!/usr/bin/env python3
"""Keep source-version and latest-public-version declarations truthful."""
from __future__ import annotations
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
manifest = json.loads((ROOT / "extension/manifest.json").read_text(encoding="utf-8"))
state = json.loads((ROOT / "docs/PROJECT_STATE.json").read_text(encoding="utf-8"))
version = str(package["version"])
public = str(state["latestPublicVersion"])
assert re.fullmatch(r"\d+\.\d+\.\d+", version), version
assert re.fullmatch(r"\d+\.\d+\.\d+", public), public
assert manifest["version"] == version
assert state["extensionVersion"] == version
assert state["releaseStatus"] in {"development", "candidate", "published"}
source_checks = {
    "README.md": [f"**Version source :** `{version}`", f"dist/MailPin_v{version}.xpi"],
    "README.en.md": [f"**Source version:** `{version}`", f"dist/MailPin_v{version}.xpi"],
    "CHANGELOG.md": [f"## {version}"],
    "THIRD_PARTY_NOTICES.md": [f"MailPin {version} source"],
    "PROJECT_MEMORY.md": [f"Version source : **{version}**"],
    "PRIVACY.md": [f"MailPin {version} ne contient", f"MailPin {version} contains"],
    "STORE_RELEASE.md": [f"Version source/candidate :** {version}", f"MailPin_v{version}.xpi"],
    "docs/ATN_RELEASE_CHECKLIST.md": [f"candidat {version}"],
    "docs/KNOWN_LIMITATIONS.md": [f"Source {version}"],
    "docs/MANUAL_TEST_PLAN.md": [f"— {version}"],
    "docs/BUG_TRACKER.md": [f"Version source : **{version}**"],
    "release/ATN_REVIEW_NOTES_TEMPLATE.md": [f"MailPin {version} (candidate)", f"**Version :** {version}"],
    "release/BUILD_INSTRUCTIONS.md": [f"candidat {version}", f"MailPin_v{version}.xpi"],
    "release/manifest-store-template.json": [f"candidat {version}"],
}
public_checks = {
    "README.md": [f"release `v{public}`", f"MailPin_v{public}.xpi", f"**Dernière release publique :** `{public}`"],
    "README.en.md": [f"release `v{public}`", f"MailPin_v{public}.xpi", f"**Latest public release:** `{public}`"],
    "STORE_RELEASE.md": [f"Dernière release publique :** {public}"],
    "docs/PROJECT_STATE.json": [f'"latestPublicVersion": "{public}"'],
}
for relative, tokens in {**source_checks, **public_checks}.items():
    text = (ROOT / relative).read_text(encoding="utf-8")
    for token in tokens:
        assert token in text, f"{relative}: missing version token {token!r}"
print(f"Version declarations: source {version}, latest public {public}: OK")
