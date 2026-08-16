#!/usr/bin/env python3
"""Validate the persistent MailPin bug register."""
from __future__ import annotations

import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TRACKER = ROOT / "docs/BUG_TRACKER.md"
ALLOWED = {"OUVERT", "EN COURS", "BLOQUÉ", "À VALIDER", "CORRIGÉ"}


def main() -> None:
    text = TRACKER.read_text(encoding="utf-8")
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    state = json.loads((ROOT / "docs/PROJECT_STATE.json").read_text(encoding="utf-8"))
    source = str(package["version"])
    public = str(state["latestPublicVersion"])
    required = [
        "# Registre des bugs MailPin",
        f"Version source : **{source}**",
        f"Dernière release publique : **{public}**",
        "## Bugs ouverts",
        "## Bugs corrigés ou en validation",
        "## Procédure",
    ]
    missing = [item for item in required if item not in text]
    if missing:
        raise SystemExit(f"BUG_TRACKER incomplet: {', '.join(missing)}")

    ids: list[str] = []
    section = ""
    rows = 0
    for line in text.splitlines():
        if line.startswith("## "):
            section = line[3:].strip()
            continue
        if not re.match(r"^\| MP-\d{4}-\d{3} \|", line):
            continue
        rows += 1
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) != 9:
            raise SystemExit(f"ligne BUG_TRACKER invalide ({len(cells)} colonnes): {line}")
        bug_id, _introduced, symptom, cause, files, test, status, correction, validation = cells
        if bug_id in ids:
            raise SystemExit(f"identifiant de bug dupliqué: {bug_id}")
        ids.append(bug_id)
        if status not in ALLOWED:
            raise SystemExit(f"statut de bug invalide {bug_id}: {status}")
        if section == "Bugs ouverts" and status == "CORRIGÉ":
            raise SystemExit(f"bug corrigé classé dans Bugs ouverts: {bug_id}")
        if section == "Bugs corrigés ou en validation" and status in {"OUVERT", "EN COURS", "BLOQUÉ"}:
            raise SystemExit(f"bug non résolu classé dans Bugs corrigés ou en validation: {bug_id}")
        for label, value in {
            "symptôme": symptom,
            "cause": cause,
            "fichiers": files,
            "test": test,
            "validation": validation,
        }.items():
            if not value or value == "—":
                raise SystemExit(f"champ {label} manquant pour {bug_id}")
        if status == "CORRIGÉ" and correction == "—":
            raise SystemExit(f"version de correction manquante pour {bug_id}")

    if not rows:
        raise SystemExit("aucune entrée historique dans BUG_TRACKER")
    print(f"Bug tracker: {rows} entrée(s), versions, sections, statuts et identifiants valides")


if __name__ == "__main__":
    main()
