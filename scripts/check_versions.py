#!/usr/bin/env python3
"""Keep source-version and latest-public-version declarations truthful."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
manifest = json.loads((ROOT / "extension/manifest.json").read_text(encoding="utf-8"))
state = json.loads((ROOT / "docs/PROJECT_STATE.json").read_text(encoding="utf-8"))
version = str(package["version"])
public = str(state["latestPublicVersion"])
status = str(state["releaseStatus"])

SEMVER = re.compile(r"\d+\.\d+\.\d+")
assert SEMVER.fullmatch(version), version
assert SEMVER.fullmatch(public), public
assert manifest["version"] == version
assert state["extensionVersion"] == version
assert status in {"development", "candidate", "published"}
if status == "published":
    assert version == public, "published source must equal latest public version"
elif status == "candidate":
    assert version != public, "candidate source must not reuse the latest public version"

source_checks = {
    "README.md": [f"**Version source :** `{version}`", f"dist/MailPin_v{version}.xpi"],
    "README.en.md": [f"**Source version:** `{version}`", f"dist/MailPin_v{version}.xpi"],
    "CHANGELOG.md": [f"## {version}"],
    "THIRD_PARTY_NOTICES.md": [f"MailPin {version} source"],
    "PROJECT_MEMORY.md": [f"Version source : **{version}**"],
    "PRIVACY.md": [f"MailPin {version} ne contient", f"MailPin {version} contains"],
    "STORE_RELEASE.md": [f"Version source/candidate :** {version}", f"MailPin_v{version}.xpi"],
    "docs/ATN_RELEASE_CHECKLIST.md": [f"candidat {version}", f"version source {version}"],
    "docs/KNOWN_LIMITATIONS.md": [f"Source {version}"],
    "docs/MANUAL_TEST_PLAN.md": [f"— {version}"],
    "docs/BUG_TRACKER.md": [f"Version source : **{version}**"],
    "docs/CODEX_HANDOFF.md": [f"version source : **{version}**"],
    "release/ATN_REVIEW_NOTES_TEMPLATE.md": [f"MailPin {version} (candidate)", f"**Version :** {version}"],
    "release/BUILD_INSTRUCTIONS.md": [f"candidat {version}", f"MailPin_v{version}.xpi"],
    "release/manifest-store-template.json": [f"candidat {version}"],
    f"SECURITY_AUDIT_{version}.md": [f"MailPin {version}"],
    f"VALIDATION_REPORT_{version}.md": [f"MailPin {version}"],
}
public_checks = {
    "README.md": [f"release `v{public}`", f"MailPin_v{public}.xpi", f"**Dernière release publique :** `{public}`"],
    "README.en.md": [f"release `v{public}`", f"MailPin_v{public}.xpi", f"**Latest public release:** `{public}`"],
    "PROJECT_MEMORY.md": [f"Dernière release publique : **{public}**"],
    "STORE_RELEASE.md": [f"Dernière release publique :** {public}"],
    "docs/PROJECT_STATE.json": [f'"latestPublicVersion": "{public}"'],
    "docs/BUG_TRACKER.md": [f"Dernière release publique : **{public}**"],
    "docs/KNOWN_LIMITATIONS.md": [f"release publique {public}"],
    "docs/MANUAL_TEST_PLAN.md": [f"dernière release publique est {public}"],
    "docs/ATN_RELEASE_CHECKLIST.md": [f"publique : **{public}**"],
    "docs/CODEX_HANDOFF.md": [f"dernière release publique : **{public}**"],
    "release/BUILD_INSTRUCTIONS.md": [f"dernière release publique est **{public}**"],
    "release/manifest-store-template.json": [f"Dernière release publique : {public}"],
}


def assert_tokens(checks: dict[str, list[str]], kind: str) -> None:
    for relative, tokens in checks.items():
        text = (ROOT / relative).read_text(encoding="utf-8")
        for token in tokens:
            assert token in text, f"{relative}: missing {kind} version token {token!r}"


# Keep these passes separate: overlapping paths must validate both source and
# public declarations. A dict merge here previously hid source checks.
assert_tokens(source_checks, "source")
assert_tokens(public_checks, "public")
print(f"Version declarations: source {version}, latest public {public}, status {status}: OK")
