# Audit de sécurité — MailPin 1.7.5

## Portée

MailPin 1.7.5 est une maintenance de métadonnées pour conformité ATN. Le changement installable est limité au nom localisé/store et au numéro de version.

## Invariants vérifiés

- ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- Thunderbird 153.0–154.* inchangé ;
- permission `menus` inchangée ;
- aucune logique métier, API Experiment, `PinCompatibility`, stockage, schéma ou migration modifié ;
- aucun réseau runtime, télémétrie, publicité, CDN ou code distant ajouté.

## Gates exécutés

- QA Linux/Windows et garde sécurité/identité `32480175617` — PASS ;
- smoke réel Thunderbird 154.0 `32480175435` — PASS ;
- build reviewer sans `.git` + XPI SHA-identique avant publication — PASS ;
- vérification indépendante des artefacts publics `32481646372` — PASS ;
- tag publié `v1.7.5` → `2384ee52df95a711424dfeb817ef114888634ed0`.

Codex Security n’a pas été utilisé.
