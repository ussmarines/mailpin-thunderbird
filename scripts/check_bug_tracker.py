#!/usr/bin/env python3
"""Validate the persistent MailPin bug register."""
from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TRACKER = ROOT / "docs/BUG_TRACKER.md"
ALLOWED = {"OUVERT", "EN COURS", "BLOQUÉ", "À VALIDER", "CORRIGÉ"}


def main() -> None:
    text = TRACKER.read_text(encoding="utf-8")
    required = [
        "# Registre des bugs MailPin",
        "## Bugs ouverts",
        "## Bugs corrigés ou en validation",
        "## Procédure",
    ]
    missing = [item for item in required if item not in text]
    if missing:
        raise SystemExit(f"BUG_TRACKER incomplet: {', '.join(missing)}")

    rows = [line for line in text.splitlines() if re.match(r"^\| MP-\d{4}-\d{3} \|", line)]
    ids: list[str] = []
    for row in rows:
        cells = [cell.strip() for cell in row.strip("|").split("|")]
        if len(cells) != 9:
            raise SystemExit(f"ligne BUG_TRACKER invalide ({len(cells)} colonnes): {row}")
        bug_id, _introduced, symptom, cause, files, test, status, correction, validation = cells
        if bug_id in ids:
            raise SystemExit(f"identifiant de bug dupliqué: {bug_id}")
        ids.append(bug_id)
        if status not in ALLOWED:
            raise SystemExit(f"statut de bug invalide {bug_id}: {status}")
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
    print(f"Bug tracker: {len(rows)} entrée(s), statuts et identifiants valides")


if __name__ == "__main__":
    main()
