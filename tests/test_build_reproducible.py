from __future__ import annotations

import hashlib
import importlib.util
from pathlib import Path
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("build_script", ROOT / "scripts/build.py")
module = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(module)

with tempfile.TemporaryDirectory() as directory:
    first = Path(directory) / "first.xpi"
    second = Path(directory) / "second.xpi"
    module.create_xpi(first)
    module.create_xpi(second)
    assert hashlib.sha256(first.read_bytes()).digest() == hashlib.sha256(second.read_bytes()).digest()
    with zipfile.ZipFile(first) as archive:
        assert not any(name.endswith("AGENTS.md") for name in archive.namelist())
    source_first = Path(directory) / "source-first.zip"
    source_second = Path(directory) / "source-second.zip"
    module.create_source_zip(source_first)
    module.create_source_zip(source_second)
    assert hashlib.sha256(source_first.read_bytes()).digest() == hashlib.sha256(source_second.read_bytes()).digest()
    with zipfile.ZipFile(source_first) as archive:
        names = set(archive.namelist())
        assert "AGENTS.md" in names
        assert "extension/manifest.json" in names
        assert "release/BUILD_INSTRUCTIONS.md" in names
        assert "dist/.gitkeep" in names
        assert not any(name.startswith(".git/") for name in names)
        assert not any(name.startswith("dist/") and name != "dist/.gitkeep" for name in names)
        assert not any("__pycache__" in name or name.endswith(".pyc") for name in names)
        assert not any(name.lower().endswith((".xpi", ".sqlite", ".sqlite-wal", ".sqlite-shm")) for name in names)
        assert not any(Path(name).match("CI_LOG_*.txt") or Path(name).match("ROUNDTRIP_CI_LOG_*.txt") for name in names)

build_source = (ROOT / "scripts/build.py").read_text(encoding="utf-8")
assert "source.is_symlink()" in build_source
assert "resolved.is_relative_to(root.resolve())" in build_source

print("Reproducible XPI/source builds: OK")
