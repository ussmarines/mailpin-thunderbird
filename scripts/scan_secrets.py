#!/usr/bin/env python3
"""Conservative repository secret scanner for committed source files."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = {".git", "dist", "node_modules", "__pycache__"}
BINARY_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".xpi", ".zip", ".sqlite"}
PATTERNS = {
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "generic API secret": re.compile(r"(?i)(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*['\"][A-Za-z0-9_\-./+=]{16,}['\"]"),
    "GitHub token": re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    "AWS access key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "OpenAI key": re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b"),
}

findings: list[str] = []
for path in ROOT.rglob("*"):
    if not path.is_file() or any(part in SKIP for part in path.relative_to(ROOT).parts):
        continue
    if path.suffix.lower() in BINARY_SUFFIXES or path.name == "scan_secrets.py":
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    for label, pattern in PATTERNS.items():
        for match in pattern.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            findings.append(f"{path.relative_to(ROOT)}:{line}: {label}")

if findings:
    print("\n".join(findings))
    raise SystemExit(1)
print("Secret scan: OK")
