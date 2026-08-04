#!/usr/bin/env python3
"""Repository-wide static, packaging and reviewability checks."""
from __future__ import annotations

import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / "extension"
errors: list[str] = []


class ResourceHTMLParser(HTMLParser):
    """Collect IDs and local script/style references using the standard library."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: set[str] = set()
        self.duplicate_ids: set[str] = set()
        self.resources: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name.lower(): value for name, value in attrs}
        node_id = values.get("id")
        if node_id:
            if node_id in self.ids:
                self.duplicate_ids.add(node_id)
            self.ids.add(node_id)
        if tag.lower() == "script" and values.get("src"):
            self.resources.append(str(values["src"]))
        elif tag.lower() == "link" and values.get("href"):
            self.resources.append(str(values["href"]))


def validate_css_structure(text: str) -> str | None:
    """Return a compact error for malformed comments, strings or delimiters."""

    stack: list[tuple[str, int]] = []
    pairs = {"}": "{", "]": "[", ")": "("}
    quote: str | None = None
    quote_line = 0
    escaped = False
    in_comment = False
    comment_line = 0
    line = 1
    index = 0
    while index < len(text):
        char = text[index]
        following = text[index + 1] if index + 1 < len(text) else ""
        if char == "\n":
            line += 1

        if in_comment:
            if char == "*" and following == "/":
                in_comment = False
                index += 2
                continue
            index += 1
            continue

        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            index += 1
            continue

        if char == "/" and following == "*":
            in_comment = True
            comment_line = line
            index += 2
            continue
        if char in {"'", '"'}:
            quote = char
            quote_line = line
            index += 1
            continue
        if char in "{[(":
            stack.append((char, line))
        elif char in "}])":
            expected = pairs[char]
            if not stack or stack[-1][0] != expected:
                return f"délimiteur inattendu {char!r} ligne {line}"
            stack.pop()
        index += 1

    if in_comment:
        return f"commentaire non terminé commencé ligne {comment_line}"
    if quote:
        return f"chaîne {quote!r} non terminée commencée ligne {quote_line}"
    if stack:
        char, opened_line = stack[-1]
        return f"délimiteur {char!r} non fermé commencé ligne {opened_line}"
    return None


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"JSON invalide {path.relative_to(ROOT)}: {exc}")
        return {}


manifest = load_json(EXT / "manifest.json")
check(manifest.get("manifest_version") == 3, "manifest_version doit être 3")
check(manifest.get("permissions") == ["menus"], "permissions WebExtension inattendues")
check(manifest.get("default_locale") == "fr", "default_locale doit être fr")
check(manifest.get("browser_specific_settings", {}).get("gecko", {}).get("id") == "pin-mails@MailPerch.local", "ID public MailPerch modifié")
check(manifest.get("content_security_policy", {}).get("extension_pages") == "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'", "CSP inattendue")
version = str(manifest.get("version", ""))
check(bool(re.fullmatch(r"\d+\.\d+\.\d+", version)), "version SemVer invalide")

package = load_json(ROOT / "package.json")
fr_locale = load_json(EXT / "_locales/fr/messages.json")
en_locale = load_json(EXT / "_locales/en/messages.json")
check(package.get("name") == "mailperch-thunderbird", "nom package MailPerch inattendu")
check(str(package.get("version", "")) == version, "versions package/manifest incohérentes")
check(fr_locale.get("extensionName", {}).get("message") == "MailPerch — Email Pins & Follow-up", "nom FR MailPerch incohérent")
check(en_locale.get("extensionName", {}).get("message") == "MailPerch — Email Pins & Follow-up", "nom EN MailPerch incohérent")
check(fr_locale.get("brandSubtitle", {}).get("message") == "Épinglez, organisez et suivez vos e-mails dans Thunderbird.", "sous-titre FR MailPerch incohérent")
check(en_locale.get("brandSubtitle", {}).get("message") == "Pin, organize and follow up on your emails in Thunderbird.", "sous-titre EN MailPerch incohérent")
check(en_locale.get("brandSlogan", {}).get("message") == "Keep important mail within reach.", "slogan MailPerch incohérent")

required_root = [
    "AGENTS.md", "PROJECT_MEMORY.md", "BRANDING.md", "README.md", "README.en.md", "LICENSE", "NOTICE.md", "CHANGELOG.md",
    "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "SECURITY_AUDIT_1.0.0.md", "SECURITY_AUDIT_1.1.0.md", "PRIVACY.md", "ROADMAP.md", "SUPPORT.md", "docs/BUG_TRACKER.md",
    "package.json", ".editorconfig", ".gitattributes", ".gitignore", "extension/AGENTS.md",
    "extension/api/pinInbox/AGENTS.md", "tests/AGENTS.md",
    "docs/PROJECT_STATE.json", "docs/ARCHITECTURE.md", "docs/CODEX_HANDOFF.md", "docs/DATA_MODEL.md", "docs/DEBUGGING.md", "docs/SECURITY_BOUNDARY.md",
    "docs/UI_SPEC.md", "docs/THREAT_MODEL.md", "docs/ATN_RELEASE_CHECKLIST.md",
    "docs/MANUAL_TEST_PLAN.md", "docs/SCREENSHOT_FINDINGS.md", "docs/DECISIONS.md",
    "docs/KNOWN_LIMITATIONS.md", "scripts/build.py", "scripts/check_repo.py", "scripts/check_versions.py", "scripts/check_project_memory.py", "scripts/deep_audit.py", "scripts/scan_secrets.py",
    "release/BUILD_INSTRUCTIONS.md", "release/ATN_REVIEW_NOTES_TEMPLATE.md", "release/manifest-store-template.json",
    "tests/test_build_reproducible.py", "tests/test_security_hardening_3_2_4.py", "tests/test_ui_regressions.py", "tests/test_api_schema_contract.py", "tests/test_data_integrity_guards.py", "tests/test_native_card_menu.py", "tests/test_accessibility_localization.py", "tests/test_ux_3_2_features.py", "tests/ux_3_2_model_tests.mjs"
]
for relative in required_root:
    check((ROOT / relative).is_file(), f"fichier dépôt manquant: {relative}")

# Text hygiene and local Markdown links.
text_suffixes = {".md", ".js", ".mjs", ".json", ".css", ".html", ".py", ".yml", ".yaml", ".txt"}
for path in ROOT.rglob("*"):
    if not path.is_file() or any(part in {".git", "dist", "__pycache__"} for part in path.relative_to(ROOT).parts):
        continue
    if path.suffix.lower() not in text_suffixes and path.name not in {"LICENSE", ".editorconfig", ".gitattributes", ".gitignore"}:
        continue
    try:
        raw = path.read_bytes()
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        errors.append(f"texte non UTF-8 {path.relative_to(ROOT)}: {exc}")
        continue
    check(b"\r\n" not in raw and b"\r" not in raw, f"fin de ligne non LF: {path.relative_to(ROOT)}")
    for line_number, line in enumerate(text.splitlines(), 1):
        check(line == line.rstrip(" \t"), f"espace final {path.relative_to(ROOT)}:{line_number}")

for markdown in ROOT.rglob("*.md"):
    if any(part in {".git", "dist"} for part in markdown.relative_to(ROOT).parts):
        continue
    text = markdown.read_text(encoding="utf-8")
    for target in re.findall(r"(?<!!)\[[^\]]*\]\(([^)]+)\)", text):
        target = target.strip().split()[0].strip("<>")
        if not target or target.startswith(("#", "http://", "https://", "mailto:")):
            continue
        local = target.split("#", 1)[0]
        check((markdown.parent / local).resolve().exists(), f"lien Markdown local invalide {markdown.relative_to(ROOT)} -> {target}")

# Every declared manifest resource must exist.
def resource(path: str | None, label: str) -> None:
    if path:
        check((EXT / path).is_file(), f"ressource manifeste manquante ({label}): {path}")

resource(manifest.get("options_ui", {}).get("page"), "options")
for script in manifest.get("background", {}).get("scripts", []):
    resource(script, "background")
for action_name in ("action", "message_display_action"):
    icons = manifest.get(action_name, {}).get("default_icon", {})
    if isinstance(icons, str):
        resource(icons, action_name)
    else:
        for size, path in icons.items(): resource(path, f"{action_name}:{size}")
for size, path in manifest.get("icons", {}).items(): resource(path, f"icon:{size}")
for api_name, details in manifest.get("experiment_apis", {}).items():
    resource(details.get("schema"), f"schema:{api_name}")
    resource(details.get("parent", {}).get("script"), f"experiment:{api_name}")

# Syntax and risky-code checks.
network_pattern = re.compile(r"(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(")
for path in sorted(EXT.rglob("*.js")) + sorted(EXT.rglob("*.mjs")):
    result = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
    check(result.returncode == 0, f"syntaxe JS invalide {path.relative_to(ROOT)}: {result.stderr.strip()}")
    text = path.read_text(encoding="utf-8")
    for forbidden in ("eval(", "new Function", ".innerHTML", ".outerHTML", "insertAdjacentHTML"):
        check(forbidden not in text, f"motif risqué {forbidden} dans {path.relative_to(ROOT)}")
    check(not network_pattern.search(text), f"API réseau dans {path.relative_to(ROOT)}")
    check(not re.search(r"https?://", text), f"URL distante dans le code JS {path.relative_to(ROOT)}")

for path in ROOT.rglob("*.json"):
    if ".git" not in path.parts:
        load_json(path)

for path in EXT.rglob("*.svg"):
    try:
        ET.parse(path)
    except Exception as exc:
        errors.append(f"SVG invalide {path.relative_to(ROOT)}: {exc}")
    text = path.read_text(encoding="utf-8").lower()
    check("<script" not in text and "foreignobject" not in text, f"contenu actif dans {path.relative_to(ROOT)}")

# HTML references and JS ID references.
for html_path in EXT.rglob("*.html"):
    parser = ResourceHTMLParser()
    try:
        parser.feed(html_path.read_text(encoding="utf-8"))
        parser.close()
    except Exception as exc:
        errors.append(f"HTML invalide {html_path.relative_to(ROOT)}: {exc}")
    for duplicate_id in sorted(parser.duplicate_ids):
        errors.append(f"ID HTML dupliqué {duplicate_id} dans {html_path.relative_to(ROOT)}")
    for value in parser.resources:
        if urlparse(value).scheme or value.startswith("#"):
            continue
        target = (html_path.parent / value).resolve()
        check(target.is_file(), f"sous-ressource HTML manquante {html_path.relative_to(ROOT)} -> {value}")
    sibling_js = html_path.with_suffix(".js")
    if sibling_js.is_file():
        js = sibling_js.read_text(encoding="utf-8")
        for match in re.finditer(r'\$\(["\']([^"\']+)["\']\)', js):
            check(match.group(1) in parser.ids, f"ID HTML manquant {match.group(1)} référencé par {sibling_js.relative_to(ROOT)}")

# CSS structural validation and local url() targets.
for css_path in EXT.rglob("*.css"):
    text = css_path.read_text(encoding="utf-8")
    css_error = validate_css_structure(text)
    if css_error:
        errors.append(f"CSS invalide {css_path.relative_to(ROOT)}: {css_error}")
    for raw in re.findall(r"url\(([^)]+)\)", text):
        value = raw.strip().strip('"\'')
        if not value or value.startswith(("data:", "#")) or urlparse(value).scheme:
            continue
        check((css_path.parent / value).resolve().is_file(), f"ressource CSS manquante {css_path.relative_to(ROOT)} -> {value}")

schema = load_json(EXT / "api/pinInbox/schema.json")
functions = {item.get("name") for item in schema[0].get("functions", [])} if schema else set()
events = {item.get("name") for item in schema[0].get("events", [])} if schema else set()
implementation = (EXT / "api/pinInbox/implementation.js").read_text(encoding="utf-8")
for name in functions:
    check(re.search(rf"\b{re.escape(name)}\s*:", implementation) is not None, f"fonction API sans implémentation apparente: {name}")
check("onDashboardRequested" in events, "événement tableau de bord absent du schéma")
for needle in (
    "event.stopImmediatePropagation()", "event.key === \"ContextMenu\"", "position: fixed",
    "onDashboardRequested", "clearDropTargets", "startupcache-invalidate",
    "settings.showFolderBadge = false", "PRAGMA journal_mode=WAL", "_writeIncremental"
):
    haystack = implementation if needle != "position: fixed" else (EXT / "styles/pin.css").read_text(encoding="utf-8")
    check(needle in haystack, f"garde attendue absente: {needle}")
check("contentTab" not in implementation, "le tableau de bord ne doit pas être ouvert directement depuis l’Experiment")
check("threadTree.scrollToIndex" not in implementation, "défilement forcé de la liste détecté")
check("threadTree.selectedIndex =" not in implementation, "sélection native imposée détectée")
check("host.appendChild(badge)" not in implementation, "badge de dossier interdit détecté")

# Repository/release reviewability guards.
workflow = (ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
check("cache: npm" not in workflow, "cache npm déclaré sans lockfile")
store_template = load_json(ROOT / "release/manifest-store-template.json")
store_id = str(store_template.get("browser_specific_settings", {}).get("gecko", {}).get("id", ""))
check(store_id == manifest.get("browser_specific_settings", {}).get("gecko", {}).get("id"), "identifiant store/manifeste incohérent")
check((ROOT / "dist/.gitkeep").is_file(), "dist/.gitkeep manquant")
readme = (ROOT / "README.md").read_text(encoding="utf-8")
check("actions/workflows/ci.yml/badge.svg?branch=main" in readme, "badge QA manquant")
check(f"release-v{version}" in readme, "badge release incohérent")
check("MailPerch%20Source--Available%201.0" in readme, "badge licence incohérent")
check(not (ROOT / ".github/workflows/FUNDING.yml").exists(), "FUNDING.yml ne doit pas être placé dans workflows")
release_workflow = (ROOT / ".github/workflows/release.yml").read_text(encoding="utf-8")
check("gh release create" in release_workflow and "npm run ci" in release_workflow, "workflow release incomplet")


# Avoid symlink-based source exfiltration, accidental secret/config files and oversized sources.
for candidate in ROOT.rglob("*"):
    if candidate.is_symlink():
        errors.append(f"lien symbolique interdit dans le dépôt: {candidate.relative_to(ROOT)}")

for path in ROOT.rglob("*"):
    if not path.is_file() or ".git" in path.parts:
        continue
    relative = path.relative_to(ROOT)
    check(path.stat().st_size < 3_500_000, f"fichier source trop volumineux: {relative}")
    check(path.name not in {".env", "id_rsa", "id_ed25519"} and path.suffix.lower() not in {".pem", ".p12", ".pfx", ".key"}, f"fichier secret potentiel: {relative}")

if errors:
    print("\n".join(f"ERROR: {message}" for message in errors))
    raise SystemExit(1)
print(f"Repository checks {version}: OK")
