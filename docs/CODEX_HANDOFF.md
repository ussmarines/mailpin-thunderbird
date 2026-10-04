# Passage de relais — candidate native MailPin 2.2.0

- branche : `codex/native-2.2.0-zero-experiment` ;
- version source : **2.2.0** ;
- dernière release publique : **1.7.10** ;
- base : `origin/main` `4d38862c55ea4c7fc3e4c440fbfed80e3aa197e3` ;
- Thunderbird 157.0.1, manifeste min 157.0 / max 157.* ;
- ID : `ussmarines.mailpin@addons.thunderbird.net`.

Contrat courant : [handoff natif](NATIVE_2.2.0_HANDOFF.md), [matrice](NATIVE_2.2.0_MATRIX.md), [validation](../VALIDATION_REPORT_2.2.0.md). XPI `dist/MailPin_v2.2.0.xpi`, reproductible. Candidate uniquement : aucun merge, tag, release ou ATN. Les règles externes ChatGPT restent externes, aucun fichier artificiel créé.

Actions optimisées inchangées : QA sur PR/main uniquement, smoke canonique adapté depuis le manifeste, aucun job permanent temporaire. Codex Security non invoqué. Le test de profil/UX propriétaire est le gate final après les preuves automatiques.
