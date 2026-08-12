#!/usr/bin/env python3
"""Create reproducible Thunderbird XPI and source archives without dependencies."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXTENSION = ROOT / "extension"
DIST = ROOT / "dist"
FIXED_TIME = (2026, 1, 1, 0, 0, 0)
SOURCE_EXCLUDED_GLOBS = ("CI_LOG_*.txt", "ROUNDTRIP_CI_LOG_*.txt")
XPI_EXCLUDED_NAMES = {"AGENTS.md"}
SOURCE_FILE_MANIFEST = ".mailpin-source-files.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def archive_file(archive: zipfile.ZipFile, source: Path, target: str, *, root: Path = ROOT) -> None:
    if source.is_symlink():
        raise SystemExit(f"Lien symbolique refusé dans l’archive : {source}")
    resolved = source.resolve(strict=True)
    if not resolved.is_relative_to(root.resolve()) or not resolved.is_file():
        raise SystemExit(f"Source d’archive hors dépôt ou invalide : {source}")
    info = zipfile.ZipInfo(target.replace(os.sep, "/"), FIXED_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = (0o100644 & 0xFFFF) << 16
    archive.writestr(info, source.read_bytes())


def tracked_repository_files() -> list[Path]:
    """Return the reviewed file set, never arbitrary worktree contents.

    A local Thunderbird profile, export, or secret can be ignored by Git while
    still being present below the repository root. Packaging from ``rglob``
    would leak it. A checkout has Git metadata; a previously created source
    archive carries the same reviewed list for rebuilds outside Git.
    """
    command = ["git", "ls-files", "-z"]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, check=False)
    if result.returncode == 0:
        names = [item.decode("utf-8") for item in result.stdout.split(b"\0") if item]
    else:
        manifest_path = ROOT / SOURCE_FILE_MANIFEST
        if not manifest_path.is_file():
            raise SystemExit("Build refusé : liste des fichiers suivis Git indisponible")
        try:
            names = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise SystemExit(f"Build refusé : manifeste source invalide : {error}") from error
        if not isinstance(names, list) or not all(isinstance(name, str) for name in names):
            raise SystemExit("Build refusé : manifeste source invalide")

    files: list[Path] = []
    for name in names:
        relative = Path(name)
        if relative.is_absolute() or ".." in relative.parts or name == SOURCE_FILE_MANIFEST:
            raise SystemExit(f"Build refusé : chemin source invalide : {name!r}")
        source = ROOT / relative
        if not source.is_file() or source.is_symlink():
            raise SystemExit(f"Build refusé : fichier source suivi absent ou invalide : {name}")
        files.append(source)
    return sorted(files, key=lambda path: path.relative_to(ROOT).as_posix())


def create_xpi(output: Path) -> None:
    if not (EXTENSION / "manifest.json").is_file():
        raise SystemExit("extension/manifest.json est introuvable")
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for source in tracked_repository_files():
            if not source.is_relative_to(EXTENSION) or source.name in XPI_EXCLUDED_NAMES:
                continue
            archive_file(archive, source, source.relative_to(EXTENSION).as_posix(), root=EXTENSION)


def create_source_zip(output: Path) -> None:
    sources = tracked_repository_files()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for source in sources:
            relative = source.relative_to(ROOT)
            if any(relative.match(pattern) for pattern in SOURCE_EXCLUDED_GLOBS):
                continue
            if relative.parts and relative.parts[0] == "dist" and relative.as_posix() != "dist/.gitkeep":
                continue
            archive_file(archive, source, relative.as_posix(), root=ROOT)
        info = zipfile.ZipInfo(SOURCE_FILE_MANIFEST, FIXED_TIME)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o100644 & 0xFFFF) << 16
        names = [source.relative_to(ROOT).as_posix() for source in sources]
        archive.writestr(info, json.dumps(names, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", action="store_true", help="Créer aussi l’archive source du dépôt")
    args = parser.parse_args()

    manifest = json.loads((EXTENSION / "manifest.json").read_text(encoding="utf-8"))
    version = manifest["version"]
    DIST.mkdir(exist_ok=True)
    xpi = DIST / f"MailPin_v{version}.xpi"
    create_xpi(xpi)
    outputs = [xpi]
    if args.source:
        source_zip = DIST / f"MailPin_GitHub_Repository_v{version}.zip"
        create_source_zip(source_zip)
        outputs.append(source_zip)

    checksum_path = DIST / "SHA256SUMS.txt"
    checksum_path.write_text("".join(f"{sha256(path)}  {path.name}\n" for path in outputs), encoding="utf-8")
    for path in outputs:
        print(f"{path}: {sha256(path)}")
    print(checksum_path)


if __name__ == "__main__":
    main()
