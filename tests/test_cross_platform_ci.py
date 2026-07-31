#!/usr/bin/env python3
"""Ensure npm and Actions use the Python launcher available on every runner."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
ci = (ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
release = (ROOT / ".github/workflows/release.yml").read_text(encoding="utf-8")

for name in ("check", "test", "build"):
    command = package["scripts"][name]
    assert "python3 " not in command, (name, command)
    assert "python " in command, (name, command)

assert "runs-on: windows-latest" in ci
assert "npm run check && npm test" in ci
assert "python3 scripts/check_versions.py" not in release
assert "python scripts/check_versions.py" in release
for workflow in (ci, release):
    assert "actions/checkout@v6" in workflow
    assert "actions/setup-node@v6" in workflow
    assert "actions/setup-python@v6" in workflow
    assert "actions/checkout@v4" not in workflow
    assert "actions/setup-node@v4" not in workflow
    assert "actions/setup-python@v5" not in workflow
assert "actions/upload-artifact@v7" in ci
assert "actions/upload-artifact@v7" in release
print("Cross-platform CI tooling guards: OK")
