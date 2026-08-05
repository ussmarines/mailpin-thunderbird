#!/usr/bin/env python3
"""Deep, dependency-light audit of every tracked repository file."""
from __future__ import annotations

import ast
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
TEXT_NAMES = {"LICENSE", ".editorconfig", ".gitattributes", ".gitignore"}
TEXT_SUFFIXES = {
    ".css", ".html", ".js", ".json", ".md", ".mjs", ".py", ".svg",
    ".txt", ".yaml", ".yml",
}
BIDI_CONTROLS = {
    "\u202a", "\u202b", "\u202c", "\u202d", "\u202e",
    "\u2066", "\u2067", "\u2068", "\u2069",
}
errors: list[str] = []
line_count = 0


def fail(message: str) -> None:
    errors.append(message)


def run(*command: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, capture_output=True, text=True, check=False)


def repository_files() -> list[Path]:
    excluded = {
        ".git", ".playwright-cli", ".pytest_cache", ".reports", ".security-reports",
        "__pycache__", "dist", "node_modules",
    }
    files = [
        path for path in ROOT.rglob("*")
        if (
            path.is_file()
            and path.name != ".mailperch-source-files.json"
            and path.relative_to(ROOT).parts[:2] != ("output", "playwright")
            and not any(part in excluded for part in path.relative_to(ROOT).parts)
        )
    ]
    return sorted(files, key=lambda path: path.relative_to(ROOT).as_posix())


class IdParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: dict[str, int] = {}

    def handle_starttag(self, _tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name == "id" and value:
                self.ids[value] = self.ids.get(value, 0) + 1


def json_without_duplicate_keys(path: Path, text: str) -> object:
    def hook(pairs: list[tuple[str, object]]) -> dict[str, object]:
        result: dict[str, object] = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"clé JSON dupliquée: {key}")
            result[key] = value
        return result

    try:
        return json.loads(text, object_pairs_hook=hook)
    except Exception as exc:
        fail(f"JSON invalide {path.relative_to(ROOT)}: {exc}")
        return {}


def check_python(path: Path, text: str) -> None:
    try:
        tree = ast.parse(text, filename=str(path))
    except SyntaxError as exc:
        fail(f"syntaxe Python invalide {path.relative_to(ROOT)}:{exc.lineno}: {exc.msg}")
        return
    imported: dict[str, int] = {}
    used: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imported[alias.asname or alias.name.split(".")[0]] = node.lineno
        elif isinstance(node, ast.ImportFrom):
            if node.module == "__future__":
                continue
            for alias in node.names:
                imported[alias.asname or alias.name] = node.lineno
        elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
            used.add(node.id)
    for name, lineno in imported.items():
        if name not in used:
            fail(f"import Python inutilisé {path.relative_to(ROOT)}:{lineno}: {name}")


def check_locales() -> None:
    locale_dir = ROOT / "extension/_locales"
    locales: dict[str, dict[str, object]] = {}
    for path in sorted(locale_dir.glob("*/messages.json")):
        locales[path.parent.name] = json.loads(path.read_text(encoding="utf-8"))
    if not locales:
        fail("aucun catalogue de traduction")
        return
    reference_name, reference = next(iter(locales.items()))
    reference_keys = set(reference)
    placeholder_re = re.compile(r"\$([A-Z0-9_]+)\$", re.I)
    for name, catalog in locales.items():
        if set(catalog) != reference_keys:
            missing = sorted(reference_keys - set(catalog))
            extra = sorted(set(catalog) - reference_keys)
            fail(f"catalogue {name} incohérent avec {reference_name}: manquants={missing}, supplémentaires={extra}")
        for key in reference_keys & set(catalog):
            left = set(placeholder_re.findall(str(reference[key].get("message", ""))))
            right = set(placeholder_re.findall(str(catalog[key].get("message", ""))))
            if left != right:
                fail(f"placeholders de traduction incohérents {key}: {reference_name}={sorted(left)}, {name}={sorted(right)}")


def main() -> None:
    global line_count
    files = repository_files()
    if not files:
        raise SystemExit("aucun fichier source")

    seen_casefold: dict[str, str] = {}
    relative_names = [path.relative_to(ROOT).as_posix() for path in files]
    for relative in relative_names:
        folded = relative.casefold()
        previous = seen_casefold.get(folded)
        if previous and previous != relative:
            fail(f"collision de chemin insensible à la casse: {previous} / {relative}")
        seen_casefold[folded] = relative

    if (ROOT / ".git").exists():
        # Use NUL-delimited binary streams. Text-mode stdin on Windows rewrites
        # ``\n`` to ``\r\n``; git check-ignore then interprets the carriage
        # return as part of the path and reports a fake ``dist/.gitkeep\r``.
        tracked = subprocess.run(
            ["git", "ls-files", "-z"],
            cwd=ROOT,
            capture_output=True,
            text=False,
            check=False,
        )
        if tracked.returncode:
            fail(f"git ls-files a échoué: {tracked.stderr.decode('utf-8', 'replace').strip()}")
        else:
            tracked_names = sorted({value for value in tracked.stdout.split(b"\0") if value})
            ignored = subprocess.run(
                ["git", "check-ignore", "--no-index", "-z", "--stdin"],
                cwd=ROOT,
                input=b"\0".join(tracked_names) + b"\0",
                capture_output=True,
                text=False,
                check=False,
            )
            if ignored.returncode not in {0, 1}:
                fail(f"git check-ignore a échoué: {ignored.stderr.decode('utf-8', 'replace').strip()}")
            for raw_relative in ignored.stdout.split(b"\0"):
                if not raw_relative:
                    continue
                relative = raw_relative.decode("utf-8", "replace")
                if relative != "dist/.gitkeep":
                    fail(f"fichier versionné également ignoré: {relative}")

    for path in files:
        relative = path.relative_to(ROOT)
        if not path.is_file():
            fail(f"fichier versionné absent: {relative}")
            continue
        if path.stat().st_size == 0 and relative.as_posix() != "dist/.gitkeep":
            fail(f"fichier vide inattendu: {relative}")
        if path.suffix.lower() not in TEXT_SUFFIXES and path.name not in TEXT_NAMES:
            continue
        raw = path.read_bytes()
        if b"\x00" in raw:
            fail(f"octet NUL dans {relative}")
            continue
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError as exc:
            fail(f"texte non UTF-8 {relative}: {exc}")
            continue
        lines = text.splitlines()
        line_count += len(lines)
        if text and not text.endswith("\n"):
            fail(f"fin de fichier sans saut de ligne: {relative}")
        if "\r" in text:
            fail(f"fin de ligne non LF: {relative}")
        if any(char in text for char in BIDI_CONTROLS):
            fail(f"caractère de contrôle bidirectionnel dans {relative}")
        for number, line in enumerate(lines, 1):
            if line != line.rstrip(" \t"):
                fail(f"espace final {relative}:{number}")
            for char in line:
                code = ord(char)
                if code < 32 and char != "\t":
                    fail(f"caractère de contrôle U+{code:04X} {relative}:{number}")
                    break

        suffix = path.suffix.lower()
        if suffix == ".json":
            json_without_duplicate_keys(path, text)
        elif suffix == ".py":
            check_python(path, text)
        elif suffix in {".js", ".mjs"}:
            result = run("node", "--check", str(path))
            if result.returncode:
                fail(f"syntaxe JavaScript invalide {relative}: {result.stderr.strip()}")
        elif suffix in {".svg"}:
            try:
                ET.fromstring(text)
            except ET.ParseError as exc:
                fail(f"SVG invalide {relative}: {exc}")
        elif suffix == ".html":
            parser = IdParser()
            parser.feed(text)
            for item_id, count in parser.ids.items():
                if count > 1:
                    fail(f"ID HTML dupliqué {relative}: {item_id} ({count})")

    check_locales()

    if errors:
        for message in errors:
            print(f"ERROR: {message}")
        raise SystemExit(1)
    print(f"Deep audit: {len(files)} fichiers source, {line_count} lignes, aucune anomalie structurelle")


if __name__ == "__main__":
    main()
