# Passage de relais — candidate MailPin 1.7.13 / Thunderbird 160

- Base GitHub vérifiée : `main` `9af16307b3bf43aef274c6a9b252092934d4ab9e` ; travailler hors `main`.
- version source : **1.7.13** ; dernière release publique : **1.7.12** (`v1.7.12` → `968832d1f2db39a227e16c0f079d3ba06f669359`).
- Déclaration candidate : Thunderbird 153.0–160.* ; runtime 160.0 non prouvé jusqu'au smoke du SHA GitHub exact.
- Portée : manifeste, workflow de smoke 160.0, gardes de version, métadonnées et documentation ; aucune modification des modules runtime privilégiés.
- Gates : `npm run ci`, CI Linux/Windows, CodeQL, smoke réel Thunderbird 160.0 et preuve du panneau, vérification des artefacts et release finale ; aucune de ces preuves GitHub 1.7.13 n'existe encore.
- Ne pas réutiliser la preuve Thunderbird 159 comme preuve 160 ; ne pas modifier 2.2.0 draft, l’ID, les permissions ni le stockage.
- Aucun push, PR, merge, tag ni opération de publication sans autorisation explicite correspondant à l’opération.

Voir `../VALIDATION_REPORT_1.7.13.md` et `AI_VALIDATION_STATE.json`.
