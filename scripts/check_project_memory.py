#!/usr/bin/env python3
"""Keep the one-scan project memory aligned with the current build."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
manifest = json.loads((ROOT / "extension/manifest.json").read_text(encoding="utf-8"))
state = json.loads((ROOT / "docs/PROJECT_STATE.json").read_text(encoding="utf-8"))
memory = (ROOT / "PROJECT_MEMORY.md").read_text(encoding="utf-8")
version = str(package["version"])

assert manifest["version"] == version
assert state["extensionVersion"] == version
assert f"Version source : **{version}**" in memory
for path in state["entrypoints"].values():
    assert (ROOT / path).is_file(), path
    assert path in memory, f"PROJECT_MEMORY.md ne référence pas {path}"
for token in (
    "Invariants non négociables",
    "Carte complète des fichiers",
    "Où modifier quoi",
    "Commandes obligatoires",
    "Définition de terminé",
):
    assert token in memory, token
print(f"Project memory {version}: OK")
