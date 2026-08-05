#!/usr/bin/env python3
"""Behavioral tests for the redacted identity and secret guard."""
from __future__ import annotations

import hashlib
import importlib.util
from pathlib import Path
import sys

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

assert all(marker.startswith(b"-----BEGIN ") for marker in GUARD.PRIVATE_KEY_MARKERS)
assert GUARD.content_categories(GUARD.PRIVATE_KEY_MARKERS[0]) == [
    (None, "private-key material marker")
]

security_workflow = (ROOT / ".github/workflows/security-audit.yml").read_text(encoding="utf-8")
installer = (ROOT / "tools/security/install-security-tools.ps1").read_text(encoding="utf-8")
assert "6a958d8a0941d7e1d0de8436670b5cb7fc64c8028b4d16e3f519ccc77f953cef" in security_workflow
assert "--no-index --force-reinstall" in security_workflow
assert "windows_x64\\.zip$" in installer
assert "windows_x32\\.zip$" not in installer
assert "Assert-ToolChildPath" in installer
assert "Remove-Item -LiteralPath $Path -Recurse -Force" in installer

print("Security guard behavior: OK")
