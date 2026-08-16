# Rapport de validation — MailPin 1.7.1 candidat

## État

- version source : **1.7.1** ;
- dernière release publique au début du cycle : **1.7.0** ;
- branche : `release/1.7.1-pre-public-hardening` ;
- baseline : `378810a741be203b84abd1b07d5988e968ec8721` ;
- publication 1.7.1 : autorisée par le propriétaire le 16 août 2026, sous réserve des gates techniques.

## Portée

Cette maintenance corrige la cohérence des métadonnées/release, renforce les gardes de version et interdit explicitement les ressources HTML/CSS distantes. Aucune logique métier, permission, migration, schéma, dépendance runtime, identité ou surface UI n’est modifiée.

## Baseline réutilisée

Le `main` 1.7.0 fourni dans le ZIP correspond au commit GitHub courant et `npm run ci` était vert avant modification. La preuve runtime publiée 1.7.0 reste informative pour les surfaces inchangées, mais le changement du manifeste/version exige un nouveau smoke 1.7.1 avant publication.

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
- XPI local : `MailPin_v1.7.1.xpi` — SHA-256 `4586646a1d6ebe793c52040beeb7faf929e59d771a59a1ff0b0f63c13308e5f0` ;
- archive source locale : `MailPin_GitHub_Repository_v1.7.1.zip` — construction reproductible **PASS** ; son hash n’est volontairement pas figé dans un fichier inclus dans cette archive.

L’empreinte XPI locale est une preuve de build du candidat de travail ; les artefacts de release seront reconstruits par GitHub depuis le commit exact publié et recevront leurs propres empreintes.

## Gates distants avant publication

- [ ] QA PR Linux/Windows ;
- [ ] garde sécurité/identité PR ;
- [ ] smoke réel Thunderbird 153 du candidat exact ;
- [ ] merge squash ;
- [ ] workflow Release et artefacts 1.7.1.

Aucune recette humaine UI supplémentaire n’est déclarée comme exécutée. Codex Security n’est pas utilisé.
