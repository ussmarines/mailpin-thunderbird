# Passage de relais — candidate MailPin 1.7.12 / Thunderbird 159

- branche : `fix/thunderbird-159-compatibility` ; version source : **1.7.12** ; dernière release publique : **1.7.11** ;
- base GitHub : `main` `133975ba1dd7c2d61bb8626351658abb78018b41` ; PR #84 native 2.2.0 draft non touchée ;
- cible : Thunderbird 159.0 officiel (sorti le 27 octobre 2026) ; manifest `153.0` à `159.*` ;
- périmètre : borne déclarée, banc smoke réel, documents de release/validation et garde associée ; aucun changement runtime métier, permissions, ID, schémas ou dépendance ;
- gates : QA, smoke 159.0 réel, CodeQL, intégration et release/assets sur SHA exacts avant PASS ;
- statut : aucun résultat 159 ni publication 1.7.12 présumés ; historique 1.7.11 dans `../VALIDATION_REPORT_1.7.11.md`.

Détails dans `../VALIDATION_REPORT_1.7.12.md` et `AI_VALIDATION_STATE.json`. Conserver les invariants et la validation différentielle.
