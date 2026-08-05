#!/usr/bin/env python3
"""Scan tracked files and Git history without printing matched private values."""
from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import unicodedata

MAX_SCAN_BYTES = 20 * 1024 * 1024
ALLOWED_ENV_NAMES = {".env.example", ".env.sample", ".env.template", ".env.dist"}
FORBIDDEN_BASENAMES = {".env", ".pypirc", ".netrc", "auth.json", "credentials.json", "service-account.json", "id_rsa", "id_ed25519"}
FORBIDDEN_SUFFIXES = {".pem", ".key", ".p12", ".pfx", ".jks", ".keystore", ".tfstate"}
# SHA-256 only: plaintext civil identity values are intentionally absent.
FORBIDDEN_IDENTITY_HASHES = {
    "01e76a28977874f8b72265d0d39fa47c4105083556013f84ded1dad7798d01f7",
    "ccb810ff1aea7ea61ea5c412bf549ca31b9d217d34357893d0ed97a54303b666",
    "ec29e4a50ab3326b494e6126f3299ed436b1c24d3c508e364ee48345fc6c7a0b",
    "a6710e26418bd4c6d2ee839605cd40c313ac3b79e599c1be31aa2bd711c665e3",
}
PRIVATE_KEY_MARKERS = tuple(
    b"-----BEGIN " + prefix + b" KEY-----"
    for prefix in (b"PRIVATE", b"ENCRYPTED PRIVATE", b"RSA PRIVATE", b"OPENSSH PRIVATE", b"EC PRIVATE")
)
SELF_PATH = ".github/scripts/security_guard.py"
APPROVED_HISTORY_PATH = Path(".security/approved-historical-identity-findings.json")
APPROVED_HISTORY_CATEGORY = "forbidden personal identifier in historical content"
APPROVED_HISTORY_LOCATION_RE = re.compile(r"^blob:[0-9a-f]{12}:.+:[1-9][0-9]*$")
TOKEN_RE = re.compile(r"[a-z0-9]+")
RAW_TOKEN_RE = re.compile(r"[^\W_]+", re.UNICODE)
EXTENSION_ID_RE = re.compile(r"pin-mails@[^\s`'\"<>]+\.local", re.IGNORECASE)
PUBLIC_IDENTITY = "ussmarines"
CANONICAL_EXTENSION_ID = "pin-mails@MailPerch.local"
ASCII_TOKEN_RE = re.compile(rb"[A-Za-z0-9]{3,}")

@dataclass(frozen=True)
class Finding:
    scope: str
    location: str
    category: str

def git(args: list[str], data: bytes | None = None) -> bytes:
    return subprocess.run(
        ["git", *args],
        input=data,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    ).stdout

def tokens(text: str) -> list[str]:
    normalized = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii").lower()
    return TOKEN_RE.findall(normalized)

def identity_match(items: list[str]) -> bool:
    candidates = list(items)
    candidates += ["".join(items[i:i + 2]) for i in range(max(0, len(items) - 1))]
    candidates += ["".join(items[i:i + 3]) for i in range(max(0, len(items) - 2))]
    return any(hashlib.sha256(item.encode()).hexdigest() in FORBIDDEN_IDENTITY_HASHES for item in candidates)

def identity_spans(text: str) -> list[tuple[int, int]]:
    """Locate forbidden identities without keeping their plaintext in the source."""
    raw_tokens = list(RAW_TOKEN_RE.finditer(text))
    result: list[tuple[int, int]] = []
    for width in (3, 2, 1):
        for index in range(len(raw_tokens) - width + 1):
            start = raw_tokens[index].start()
            end = raw_tokens[index + width - 1].end()
            candidate = "".join(tokens(text[start:end]))
            if not candidate:
                continue
            digest = hashlib.sha256(candidate.encode()).hexdigest()
            if digest not in FORBIDDEN_IDENTITY_HASHES:
                continue
            if any(start < existing_end and end > existing_start for existing_start, existing_end in result):
                continue
            result.append((start, end))
    return sorted(result)

def sanitize_identity_text(text: str) -> tuple[str, int]:
    """Replace forbidden civil identities while preserving the canonical add-on ID."""
    replacements = 0

    def canonicalize_extension_id(match: re.Match[str]) -> str:
        nonlocal replacements
        value = match.group(0)
        if not identity_match(tokens(value)):
            return value
        replacements += 1
        return CANONICAL_EXTENSION_ID

    sanitized = EXTENSION_ID_RE.sub(canonicalize_extension_id, text)
    for start, end in reversed(identity_spans(sanitized)):
        sanitized = sanitized[:start] + PUBLIC_IDENTITY + sanitized[end:]
        replacements += 1
    return sanitized, replacements

def sanitize_tree() -> int:
    """Sanitize tracked UTF-8 text files without ever printing matched values."""
    changed = 0
    paths = [Path(os.fsdecode(item)) for item in git(["ls-files", "-z"]).split(b"\0") if item]
    for path in paths:
        if path.as_posix() == SELF_PATH:
            continue
        try:
            data = path.read_bytes()
        except OSError:
            continue
        if len(data) > MAX_SCAN_BYTES or b"\0" in data:
            continue
        try:
            original = data.decode("utf-8")
        except UnicodeDecodeError:
            continue
        sanitized, replacements = sanitize_identity_text(original)
        if not replacements:
            continue
        path.write_bytes(sanitized.encode("utf-8"))
        changed += 1
        print(f"Sanitized personal identity: {path} ({replacements} replacement(s))")
    print(f"Sanitized {changed} tracked file(s); matched values were not printed.")
    return changed

def path_categories(path: Path) -> list[str]:
    name = path.name.lower()
    result: list[str] = []
    if name.startswith(".env") and name not in ALLOWED_ENV_NAMES:
        result.append("tracked environment file")
    if name in FORBIDDEN_BASENAMES:
        result.append("tracked credential file")
    if path.suffix.lower() in FORBIDDEN_SUFFIXES:
        result.append("tracked key or credential container")
    return result

def content_categories(data: bytes, check_keys: bool = True) -> list[tuple[int | None, str]]:
    result: list[tuple[int | None, str]] = []
    if check_keys and any(marker in data for marker in PRIVATE_KEY_MARKERS):
        result.append((None, "private-key material marker"))
    if b"\0" in data:
        if identity_match([item.decode("ascii", "ignore").lower() for item in ASCII_TOKEN_RE.findall(data)]):
            result.append((None, "forbidden personal identifier in binary data"))
        return result
    for number, line in enumerate(data.decode("utf-8", "replace").splitlines(), 1):
        if identity_match(tokens(line)):
            result.append((number, "forbidden personal identifier"))
    return result

def scan_tree() -> list[Finding]:
    findings: list[Finding] = []
    paths = [Path(os.fsdecode(item)) for item in git(["ls-files", "-z"]).split(b"\0") if item]
    for path in paths:
        findings += [Finding("tracked-tree", str(path), category) for category in path_categories(path)]
        try:
            if path.stat().st_size > MAX_SCAN_BYTES:
                continue
            data = path.read_bytes()
        except OSError:
            findings.append(Finding("tracked-tree", str(path), "unreadable tracked file"))
            continue
        for line, category in content_categories(data, path.as_posix() != SELF_PATH):
            location = f"{path}:{line}" if line else str(path)
            findings.append(Finding("tracked-tree", location, category))
    return findings

def scan_metadata() -> list[Finding]:
    output = git(["log", "--all", "--format=%H%x1f%an%x1f%ae%x1f%cn%x1f%ce%x1f%B%x1e"]).decode("utf-8", "replace")
    findings: list[Finding] = []
    names = ("author name", "author email", "committer name", "committer email", "message")
    for record in output.split("\x1e"):
        fields = record.strip("\n").split("\x1f", 5)
        if len(fields) != 6:
            continue
        sha, *values = fields
        for field, value in zip(names, values):
            if identity_match(tokens(value)):
                findings.append(Finding("git-history", f"commit:{sha[:12]}", f"forbidden personal identifier in {field}"))
    return findings

def scan_blobs() -> list[Finding]:
    objects: dict[str, str] = {}
    for line in git(["rev-list", "--objects", "--all"]).decode("utf-8", "replace").splitlines():
        oid, _, path = line.partition(" ")
        objects.setdefault(oid, path)
    checks = git(
        ["cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"],
        ("\n".join(objects) + "\n").encode(),
    ).decode()
    eligible = []
    for line in checks.splitlines():
        parts = line.split()
        if len(parts) == 3 and parts[1] == "blob" and int(parts[2]) <= MAX_SCAN_BYTES:
            eligible.append(parts[0])
    process = subprocess.Popen(
        ["git", "cat-file", "--batch"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    assert process.stdin and process.stdout
    findings: list[Finding] = []
    for oid in eligible:
        process.stdin.write((oid + "\n").encode())
        process.stdin.flush()
        header = process.stdout.readline().decode("ascii", "replace").split()
        if len(header) != 3:
            continue
        data = process.stdout.read(int(header[2]))
        process.stdout.read(1)
        path = objects.get(oid) or "<unknown-path>"
        for line, category in content_categories(data, path != SELF_PATH):
            suffix = f":{line}" if line else ""
            findings.append(Finding(
                "git-history",
                f"blob:{oid[:12]}:{path}{suffix}",
                category.replace(
                    "forbidden personal identifier",
                    "forbidden personal identifier in historical content",
                ),
            ))
    process.stdin.close()
    process.wait(timeout=30)
    return findings

def load_approved_history(path: Path = APPROVED_HISTORY_PATH) -> set[Finding]:
    if not path.exists():
        return set()
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"invalid approved-history manifest: {exc}") from exc
    if not isinstance(payload, dict) or set(payload) != {"schema_version", "findings"}:
        raise ValueError("approved-history manifest must contain only schema_version and findings")
    if payload["schema_version"] != 1 or not isinstance(payload["findings"], list):
        raise ValueError("approved-history manifest has an unsupported schema")
    approved: set[Finding] = set()
    for entry in payload["findings"]:
        if not isinstance(entry, dict) or set(entry) != {"location", "category"}:
            raise ValueError("approved-history entry must contain only location and category")
        location = entry["location"]
        category = entry["category"]
        if not isinstance(location, str) or not APPROVED_HISTORY_LOCATION_RE.fullmatch(location):
            raise ValueError("approved-history location must identify an exact historical blob line")
        if category != APPROVED_HISTORY_CATEGORY:
            raise ValueError("approved-history category is not permitted")
        finding = Finding("git-history", location, category)
        if finding in approved:
            raise ValueError("approved-history manifest contains a duplicate entry")
        approved.add(finding)
    return approved

def partition_findings(
    findings: list[Finding],
    approved: set[Finding],
) -> tuple[list[Finding], list[Finding], list[Finding]]:
    discovered = set(findings)
    matched = sorted(discovered & approved, key=lambda item: (item.location, item.category))
    active = sorted(discovered - approved, key=lambda item: (item.scope, item.location, item.category))
    stale = sorted(approved - discovered, key=lambda item: (item.location, item.category))
    return active, matched, stale

def write_report(
    path: Path,
    active: list[Finding],
    approved: list[Finding],
    stale: list[Finding],
    history: bool,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema_version": 2,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "history_enabled": history,
        "safe_output": True,
        "matched_values_included": False,
        "status": "findings" if active or stale else "passed",
        "finding_count": len(active),
        "approved_history_count": len(approved),
        "stale_approval_count": len(stale),
        "findings": [asdict(item) for item in active],
        "approved_history_findings": [asdict(item) for item in approved],
        "stale_approvals": [asdict(item) for item in stale],
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--history", action="store_true")
    parser.add_argument("--report", type=Path)
    parser.add_argument("--sanitize-tree", action="store_true")
    args = parser.parse_args()

    try:
        approved = load_approved_history()
    except ValueError as exc:
        print(f"Security guard configuration error: {exc}", file=sys.stderr)
        return 2

    if args.sanitize_tree:
        sanitize_tree()
    findings = scan_tree()
    if args.history:
        findings += scan_metadata() + scan_blobs()
    findings = sorted(set(findings), key=lambda item: (item.scope, item.location, item.category))
    active, matched, stale = partition_findings(findings, approved if args.history else set())

    if args.report:
        write_report(args.report, active, matched, stale, args.history)

    if active:
        for item in active:
            print(f"- {item.location}: {item.category} [{item.scope}]")
    if stale:
        for item in stale:
            print(f"- {item.location}: stale approved historical finding [git-history]")
    if active or stale:
        print("No matched value was printed. Review the sanitized report and rotate any exposed secret.")
        return 1

    if matched:
        print(f"Security guard passed with {len(matched)} approved historical findings.")
    else:
        print("Security guard passed without exposing matched values.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
