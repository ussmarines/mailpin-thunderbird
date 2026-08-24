# Audit sécurité différentiel — MailPerch 1.5.3

Date : 2026-08-11
Portée : delta publié depuis 1.5.2

## Portée

MailPerch 1.5.3 regroupe deux correctifs déjà intégrés séparément : le durcissement des paramètres restaurés depuis une sauvegarde importée et une correction CSS localisée dans les Options.

Le delta sécurité concerne `extension/api/pinInbox/implementation.js` et `tests/test_security_hardening_3_2_4.py`. Le delta UI concerne uniquement `extension/options/options.css`. La préparation de release ne modifie que les marqueurs de version et la documentation.

Aucune nouvelle permission WebExtension, dépendance runtime, connexion réseau, télémétrie, publicité, CDN, code distant, migration de schéma SQLite/Settings/Data ou extension d’API Thunderbird n’est introduite.

## Correctif sécurité import / safeMode

Les sauvegardes importées ne peuvent plus conserver comme actifs les réglages automatiques ou destructifs suivants :

- suppression automatique des éléments terminés ;
- durée de rétention importée des éléments terminés ;
- désépinglage automatique après suppression ;
- sauvegardes automatiques ;
- comportement de déplacement incompatible avec la conservation sûre de l’épingle.

`safeMode` est désormais vérifié avant l’application de la rétention des éléments terminés, afin qu’un import explicitement choisi par l’utilisateur reste inerte avant validation des réglages restaurés.

## Contrôles réellement exécutés

Sur le correctif import/safeMode de la PR #29 :

- `python tests/test_security_hardening_3_2_4.py` — réussi ;
- `python tests/test_data_integrity_guards.py` — réussi ;
- `python tests/static_checks.py` — réussi ;
- `git diff --check` — réussi ;
- QA GitHub Actions `31479529285` — réussie ;
- smoke Thunderbird réel `31479529235` — réussi.

Sur la correction UI de la PR #30 :

- tests Options ciblés — réussis ;
- contrôle responsive 360, 520, 760, 1000 et 1200 px — aucun chevauchement ;
- QA GitHub Actions `31499664186` — réussie ;
- smoke Thunderbird réel `31499663975` — réussi.

Sur la préparation 1.5.3 :

- `scripts/check_versions.py` — réussi ;
- `scripts/check_project_memory.py` — réussi ;
- `scripts/check_bug_tracker.py` — réussi ;
- `tests/test_project_metadata.py` — réussi ;
- `git diff --check` — réussi ;
- garde sécurité de la PR #31 — réussie, y compris le contrôle d’identité sur l’historique.

## Contrôles réutilisés car inchangés

L’audit exhaustif 1.5.1 et l’audit différentiel 1.5.2 restent applicables aux permissions, dépendances, politique réseau, stockage SQLite, migrations, frontière `PinCompatibility`, CSP et chaîne de build lorsqu’aucun chemin correspondant n’a changé.

Gitleaks, Opengrep, Trivy et zizmor n’ont pas été relancés manuellement pour ce delta : les changements 1.5.3 n’ajoutent ni dépendance, ni permission, ni workflow permanent, ni surface réseau ou code distant. La garde de secrets et les contrôles standards intégrés à la CI restent exécutés par `npm run ci`.

Codex Security n’a pas été utilisé ; les contrôles standards ciblés ont suffi à conclure sur le problème corrigé.

## Limites

Cet audit est différentiel et ne prétend pas remplacer l’audit exhaustif 1.5.1. La publication 1.5.3 reste conditionnée à la réussite de la QA finale, du smoke Thunderbird réel et du workflow de release qui réexécute `npm run ci` sur l’arbre publié.

## Conclusion

Le delta 1.5.3 réduit la surface de mutation possible après import et corrige un défaut de présentation sans élargir les privilèges ni la surface réseau de MailPerch.
