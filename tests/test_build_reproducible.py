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
        assert module.SOURCE_FILE_MANIFEST in names

    # A source archive has no .git directory. Its embedded file list must keep
    # the same packaging boundary when a reviewer rebuilds the XPI.
    extracted = Path(directory) / "source-tree"
    with zipfile.ZipFile(source_first) as archive:
        archive.extractall(extracted)
    extracted_spec = importlib.util.spec_from_file_location("archived_build_script", extracted / "scripts/build.py")
    archived_module = importlib.util.module_from_spec(extracted_spec)
    assert extracted_spec.loader
    extracted_spec.loader.exec_module(archived_module)
    rebuilt_from_source = extracted / "dist" / "rebuilt.xpi"
    archived_module.create_xpi(rebuilt_from_source)
    assert hashlib.sha256(first.read_bytes()).digest() == hashlib.sha256(rebuilt_from_source.read_bytes()).digest()

    # Ignored local material must not be selected merely because it is located
    # below the repository root while the distribution is built.
    ignored_extension_file = ROOT / "extension" / ".env"
    ignored_source_file = ROOT / "profiles" / "personal-export.json"
    ignored_source_file.parent.mkdir(exist_ok=True)
    ignored_extension_file.write_text("MAILPERCH_TEST_SECRET=not-a-real-secret\n", encoding="utf-8")
    ignored_source_file.write_text('{"account":"person@example.invalid"}\n', encoding="utf-8")
    try:
        isolated_xpi = Path(directory) / "tracked-only.xpi"
        isolated_source = Path(directory) / "tracked-only-source.zip"
        module.create_xpi(isolated_xpi)
        module.create_source_zip(isolated_source)
        with zipfile.ZipFile(isolated_xpi) as archive:
            assert ".env" not in archive.namelist()
        with zipfile.ZipFile(isolated_source) as archive:
            assert "profiles/personal-export.json" not in archive.namelist()
    finally:
        ignored_extension_file.unlink(missing_ok=True)
        ignored_source_file.unlink(missing_ok=True)
        ignored_source_file.parent.rmdir()

build_source = (ROOT / "scripts/build.py").read_text(encoding="utf-8")
assert "source.is_symlink()" in build_source
assert "resolved.is_relative_to(root.resolve())" in build_source
assert '"git", "ls-files", "-z"' in build_source
assert "SOURCE_FILE_MANIFEST" in build_source

print("Reproducible XPI/source builds: OK")
