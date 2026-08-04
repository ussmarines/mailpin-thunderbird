#!/usr/bin/env python3
"""Ensure npm and Actions remain cross-platform and supply-chain constrained."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
ci = (ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
release = (ROOT / ".github/workflows/release.yml").read_text(encoding="utf-8")
dependabot = (ROOT / ".github/dependabot.yml").read_text(encoding="utf-8")
check_repo = (ROOT / "scripts/check_repo.py").read_text(encoding="utf-8")
deep_audit = (ROOT / "scripts/deep_audit.py").read_text(encoding="utf-8")

for name in ("check", "test", "build"):
    command = package["scripts"][name]
    assert "python3 " not in command, (name, command)
    assert "python " in command, (name, command)

assert "runs-on: windows-latest" in ci
assert "npm run check && npm test" in ci
assert "npm run ci" in release
assert "gh release create" in release

expected_actions = {
    "actions/checkout": "3d3c42e5aac5ba805825da76410c181273ba90b1",
    "actions/setup-node": "820762786026740c76f36085b0efc47a31fe5020",
    "actions/setup-python": "5fda3b95a4ea91299a34e894583c3862153e4b97",
    "actions/upload-artifact": "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
}
for workflow in (ci, release):
    for action, sha in expected_actions.items():
        if action == "actions/upload-artifact" and workflow is ci:
            assert f"{action}@{sha}" in workflow
        elif action == "actions/upload-artifact" and workflow is release:
            assert f"{action}@{sha}" not in workflow
        elif action != "actions/upload-artifact":
            assert f"{action}@{sha}" in workflow
    assert not re.search(r"uses:\s+[^\s]+@v\d", workflow), workflow
    assert "python -m pip install" not in workflow
    assert "beautifulsoup4" not in workflow
    assert "tinycss2" not in workflow

assert ci.count("persist-credentials: false") == 2
assert release.count("persist-credentials: false") == 1
assert "retention-days: 14" in ci
assert "--latest" in release
assert "include-hidden-files: false" in ci
assert "MailPerch_GitHub_Repository_v${VERSION}.zip" in release
assert "package-ecosystem: github-actions" in dependabot
assert "BeautifulSoup" not in check_repo
assert "tinycss2" not in check_repo
assert "from html.parser import HTMLParser" in check_repo

assert '["git", "check-ignore", "--no-index", "-z", "--stdin"]' in deep_audit
assert 'input=b"\\0".join(tracked_names) + b"\\0"' in deep_audit
assert 'text=False' in deep_audit
assert '"\n".join(sorted(tracked_names))' not in deep_audit

print("Cross-platform CI tooling guards: OK")
