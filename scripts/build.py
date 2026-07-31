#!/usr/bin/env python3
"""Create reproducible Thunderbird XPI and source archives without dependencies."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXTENSION = ROOT / "extension"
DIST = ROOT / "dist"
FIXED_TIME = (2026, 1, 1, 0, 0, 0)
SOURCE_EXCLUDES = {".git", ".venv", "node_modules", "__pycache__", ".pytest_cache"}
XPI_EXCLUDED_NAMES = {"AGENTS.md"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def archive_file(archive: zipfile.ZipFile, source: Path, target: str) -> None:
    info = zipfile.ZipInfo(target.replace(os.sep, "/"), FIXED_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = (0o100644 & 0xFFFF) << 16
    archive.writestr(info, source.read_bytes())


def create_xpi(output: Path) -> None:
    if not (EXTENSION / "manifest.json").is_file():
        raise SystemExit("extension/manifest.json est introuvable")
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for source in sorted(path for path in EXTENSION.rglob("*") if path.is_file() and path.name not in XPI_EXCLUDED_NAMES):
            archive_file(archive, source, source.relative_to(EXTENSION).as_posix())


def create_source_zip(output: Path) -> None:
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for source in sorted(path for path in ROOT.rglob("*") if path.is_file()):
            relative = source.relative_to(ROOT)
            if any(part in SOURCE_EXCLUDES for part in relative.parts):
                continue
            if relative.parts and relative.parts[0] == "dist" and relative.as_posix() != "dist/.gitkeep":
                continue
            archive_file(archive, source, relative.as_posix())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", action="store_true", help="Créer aussi l’archive source du dépôt")
    args = parser.parse_args()

    manifest = json.loads((EXTENSION / "manifest.json").read_text(encoding="utf-8"))
    version = manifest["version"]
    DIST.mkdir(exist_ok=True)
    xpi = DIST / f"MailPerch_v{version}.xpi"
    create_xpi(xpi)
    outputs = [xpi]
    if args.source:
        source_zip = DIST / f"MailPerch_GitHub_Repository_v{version}.zip"
        create_source_zip(source_zip)
        outputs.append(source_zip)

    checksum_path = DIST / "SHA256SUMS.txt"
    checksum_path.write_text("".join(f"{sha256(path)}  {path.name}\n" for path in outputs), encoding="utf-8")
    for path in outputs:
        print(f"{path}: {sha256(path)}")
    print(checksum_path)


if __name__ == "__main__":
    main()
