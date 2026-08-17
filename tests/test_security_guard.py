#!/usr/bin/env python3
"""Behavioral tests for the redacted identity and secret guard."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
GUARD_PATH = ROOT / ".github/scripts/security_guard.py"
SPEC = importlib.util.spec_from_file_location("mailperch_security_guard", GUARD_PATH)
assert SPEC and SPEC.loader
GUARD = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = GUARD
SPEC.loader.exec_module(GUARD)

original_hashes = GUARD.FORBIDDEN_IDENTITY_HASHES
try:
    GUARD.FORBIDDEN_IDENTITY_HASHES = {
        hashlib.sha256("janedoe".encode()).hexdigest(),
    }
    source = "Copyright Jane Doe. ID: pin-mails@Jane-Doe.local.\n"
    sanitized, replacements = GUARD.sanitize_identity_text(source)
    assert sanitized == (
        f"Copyright {GUARD.PUBLIC_IDENTITY}. ID: {GUARD.CANONICAL_EXTENSION_ID}.\n"
    )
    assert replacements == 2
finally:
    GUARD.FORBIDDEN_IDENTITY_HASHES = original_hashes

# Reviewer-source archives deliberately have no .git directory. The embedded,
# bounded source-file manifest must be the only fallback; broad filesystem
# discovery would risk scanning unrelated local material.
with tempfile.TemporaryDirectory() as directory:
    previous = Path.cwd()
    try:
        os.chdir(directory)
        Path("safe.txt").write_text("reviewed\n", encoding="utf-8")

        def write_manifest(paths: list[str]) -> None:
            Path(GUARD.SOURCE_FILE_MANIFEST).write_text(
                json.dumps(paths),
                encoding="utf-8",
            )

        def assert_manifest_rejected(paths: list[str], expected: str) -> None:
            write_manifest(paths)
            try:
                GUARD.reviewed_tree_paths()
            except ValueError as exc:
                assert expected in str(exc)
            else:
                raise AssertionError(f"unsafe reviewer manifest was accepted: {paths!r}")

        write_manifest(["safe.txt"])
        assert GUARD.reviewed_tree_paths() == [Path("safe.txt")]

        assert_manifest_rejected([str(Path("safe.txt").resolve())], "invalid reviewed path")
        assert_manifest_rejected(["../escape.txt"], "invalid reviewed path")
        assert_manifest_rejected(["safe.txt", "./safe.txt"], "duplicate reviewed path")
        assert_manifest_rejected(["missing.txt"], "reviewed file missing or invalid")

        write_manifest(["safe.txt"])
        with mock.patch.object(GUARD.Path, "is_symlink", return_value=True):
            try:
                GUARD.reviewed_tree_paths()
            except ValueError as exc:
                assert "reviewed file missing or invalid" in str(exc)
            else:
                raise AssertionError("reviewer-manifest symlink was accepted")
    finally:
        os.chdir(previous)

assert all(marker.startswith(b"-----BEGIN ") for marker in GUARD.PRIVATE_KEY_MARKERS)
assert GUARD.content_categories(GUARD.PRIVATE_KEY_MARKERS[0]) == [
    (None, "private-key material marker")
]

security_workflow = (ROOT / ".github/workflows/security-audit.yml").read_text(encoding="utf-8")
installer = (ROOT / "tools/security/install-security-tools.ps1").read_text(encoding="utf-8")
assert "8556289a64e7aaf2400cd516f61a471aa91c5902cc56ad96a82fd12f90c2ef73" in security_workflow
assert "zizmor/releases/download/v${version}" in security_workflow
assert "sha256sum -c --strict" in security_workflow
assert '"$RUNNER_TEMP/zizmor" --offline --format json' in security_workflow
assert "pip install" not in security_workflow
assert "windows_x64\\.zip$" in installer
assert "windows_x32\\.zip$" not in installer
assert "Assert-ToolChildPath" in installer
assert "Remove-Item -LiteralPath $Path -Recurse -Force" in installer

print("Security guard behavior: OK")
