# Rapport de validation différentiel — MailPerch 1.5.3

Date : 2026-08-11
Candidat de release : branche `release/1.5.3`
Thunderbird cible : 153.0–153.*

## Delta validé

1.5.3 publie le durcissement des imports/safe mode déjà intégré par la PR #29 et la correction du chevauchement de texte des règles automatiques déjà intégrée par la PR #30. La branche de release ajoute uniquement les métadonnées et documents nécessaires à la version 1.5.3.

## Résultats réellement obtenus avant la validation finale de release

Correctif import/safeMode :

- `python tests/test_security_hardening_3_2_4.py` — réussi ;
- `python tests/test_data_integrity_guards.py` — réussi ;
- `python tests/static_checks.py` — réussi ;
- QA GitHub Actions `31479529285` — réussie ;
- smoke Thunderbird réel `31479529235` — réussi.

Correctif Options :

- `python tests/test_recommended_options_ux.py` — réussi ;
- `python tests/test_options_controls.py` — réussi ;
- `python tests/test_dynamic_options_localization.py` — réussi ;
- `node tests/options_browser_test_contract.mjs` — réussi ;
- rendu contrôlé à 360, 520, 760, 1000 et 1200 px — aucun chevauchement ;
- QA GitHub Actions `31499664186` — réussie ;
- smoke Thunderbird réel `31499663975` — réussi.

Préparation des métadonnées 1.5.3 :

- `python scripts/check_versions.py` — `Version declarations 1.5.3: OK` ;
- `python scripts/check_project_memory.py` — `Project memory 1.5.3: OK` ;
- `python scripts/check_bug_tracker.py` — registre valide ;
- `python tests/test_project_metadata.py` — réussi ;
- `git diff --check` — réussi.

La première exécution finale de la PR #31 s’est arrêtée avant les tests produit car `scripts/check_repo.py` exige les rapports versionnés `SECURITY_AUDIT_1.5.3.md` et `VALIDATION_REPORT_1.5.3.md`. Ce blocage documentaire est précisément corrigé par le présent rapport et l’audit associé ; la garde sécurité/identité de cette exécution était déjà verte.

## Preuves réutilisées car inchangées

Les validations 1.5.2 restent applicables aux scénarios Dashboard, Options généraux, éditeur natif, persistance multi-processus, thèmes, banc 50/100/500/1000/2000, compatibilité Thunderbird et packaging lorsque ces surfaces n’ont pas changé dans le delta 1.5.3.

Le rapport 1.5.2 conserve les détails et empreintes des artefacts de cette version ; aucune empreinte 1.5.3 n’est inventée avant la construction réelle de la nouvelle release.

## Validation finale requise avant publication

La release 1.5.3 ne doit être publiée qu’après :

1. QA finale de la PR de release réussie ;
2. smoke Thunderbird 153 réel réussi sur le candidat de release ;
3. fusion de la PR de release dans `main` ;
4. workflow `Release` réussi sur `v1.5.3`, incluant `npm run ci`, la construction du XPI, de l’archive source et de `SHA256SUMS.txt`.

## Limites restantes

- fournisseurs externes réels nécessitant des credentials non simulés ;
- inspection esthétique pixel par pixel, zoom 200 %, contraste OS élevé et parcours complet lecteur d’écran ;
- reproductibilité binaire ZIP Windows ↔ Linux toujours suivie par `MP-2026-018`.
