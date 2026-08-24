# Rapport de validation — MailPin 1.7.1

## État

- version source : **1.7.1** ;
- dernière release publique : **1.7.1** ;
- branche de préparation : `release/1.7.1-pre-public-hardening` ;
- baseline de départ : `378810a741be203b84abd1b07d5988e968ec8721` ;
- commit release exact : `c2b886677413a205d57a191234b1dac6279b86d6` ;
- publication : **PASS**, `v1.7.1`, 16 août 2026.

## Portée

Cette maintenance corrige la cohérence des métadonnées/release, renforce les gardes de version et interdit explicitement les ressources HTML/CSS distantes. Aucune logique métier, permission, migration, schéma, dépendance runtime, identité ou surface UI n’est modifiée.

## Baseline réutilisée

Le `main` 1.7.0 fourni dans le ZIP correspondait au commit GitHub courant et `npm run ci` était vert avant modification. La preuve runtime 1.7.0 a été réutilisée uniquement pour les surfaces inchangées ; le changement du manifeste/version a provoqué un nouveau smoke 1.7.1 avant publication.

## Preuves locales 1.7.1

- `python scripts/check_versions.py` : **PASS** ;
- `python scripts/check_project_memory.py` : **PASS** ;
- `python scripts/check_bug_tracker.py` : **PASS** ;
- `python scripts/check_repo.py` : **PASS** ;
- `python tests/test_project_metadata.py` : **PASS** ;
- `python tests/test_cross_platform_ci.py` : **PASS** ;
- mutation HTML avec `img src=https://…` : le garde échoue comme attendu, puis le fichier est restauré ;
- mutation CSS avec `url(https://…)` : le garde échoue comme attendu, puis le fichier est restauré ;
- `npm run ci` : **PASS** complet après staging du jeu de fichiers candidat ;
- XPI local : `MailPin_v1.7.1.xpi` — SHA-256 `4586646a1d6ebe793c52040beeb7faf929e59d771a59a1ff0b0f63c13308e5f0`.

## Preuves GitHub finales

- [x] PR #43 QA Linux/Windows — run `31950636397` ;
- [x] garde sécurité/identité PR — run `31950636397` ;
- [x] smoke réel Thunderbird 153 du candidat exact — run `31950636456` ;
- [x] squash merge — `c2b886677413a205d57a191234b1dac6279b86d6` ;
- [x] QA `main` — run `31950703455` ;
- [x] smoke Thunderbird `main` — run `31950703452` ;
- [x] workflow Release — run `31951120772` ;
- [x] release `v1.7.1`, cible exacte `c2b886677413a205d57a191234b1dac6279b86d6` ;
- [x] XPI publié SHA-256 `4586646a1d6ebe793c52040beeb7faf929e59d771a59a1ff0b0f63c13308e5f0` ;
- [x] archive source publiée SHA-256 `8020b6e2e01b656691855c68f558a4b66a567489776652b4f50e20dfc7840c41` ;
- [x] `SHA256SUMS.txt` asset SHA-256 `2c1d7cf2e854e5dea9cdcbe571ae27098e23106bad5e945bd54c79cdd3d10d46`.

Le XPI GitHub est bit-à-bit identique au XPI local validé. La recette humaine UI supplémentaire n’est pas déclarée comme exécutée. Codex Security n’est pas utilisé.
