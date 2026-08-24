#!/usr/bin/env python3
"""Fail on common secrets, credentials, private keys, and credential-bearing URLs."""
from pathlib import Path
import math
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SCAN_SUFFIXES = {".js", ".mjs", ".json", ".md", ".py", ".yml", ".yaml", ".html", ".css", ".txt"}
SKIP_PARTS = {".git", "dist", "node_modules", "__pycache__"}
PATTERNS = {
    "private-key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
    "github-token": re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{40,})\b"),
    "aws-access-key": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "google-api-key": re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b"),
    "openai-key": re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b"),
    "stripe-key": re.compile(r"\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}\b"),
    "slack-token": re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{20,}\b"),
    "jwt": re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b"),
    "credential-url": re.compile(r"\b(?:https?|ssh|git)://[^\s/:]+:[^\s/@]+@", re.I),
    "generic-secret-assignment": re.compile(r"(?i)\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|password|passwd)\b\s*[:=]\s*['\"][^'\"]{12,}['\"]"),
}
ALLOW_MARKERS = ("secret-scan: allow",)

def entropy(value: str) -> float:
    if not value: return 0.0
    counts = {char: value.count(char) for char in set(value)}
    return -sum((count / len(value)) * math.log2(count / len(value)) for count in counts.values())

def suspicious_literal(line: str) -> bool:
    # High-entropy assignments catch provider tokens not covered by a prefix.
    match = re.search(r"(?i)\b(?:secret|token|key|password)\b\s*[:=]\s*['\"]([A-Za-z0-9_+/=-]{28,})['\"]", line)
    return bool(match and entropy(match.group(1)) >= 4.1)

findings = []
for path in sorted(ROOT.rglob("*")):
    if not path.is_file() or path.suffix.lower() not in SCAN_SUFFIXES: continue
    if path.resolve() == Path(__file__).resolve(): continue
    if any(part in SKIP_PARTS for part in path.parts): continue
    try: text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError: continue
    for number, line in enumerate(text.splitlines(), 1):
        lowered = line.lower()
        if any(marker in lowered for marker in ALLOW_MARKERS): continue
        for name, pattern in PATTERNS.items():
            if pattern.search(line): findings.append((path.relative_to(ROOT), number, name))
        if suspicious_literal(line): findings.append((path.relative_to(ROOT), number, "high-entropy-secret"))

if findings:
    for path, line, kind in findings: print(f"SECRET: {kind} {path}:{line}")
    sys.exit(1)
print("Secret scan: OK")
