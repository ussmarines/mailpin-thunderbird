# Audit de sécurité — MailPin 1.7.5

## Portée

MailPin 1.7.5 est une maintenance de métadonnées pour conformité ATN. Le changement installable est limité au nom localisé/store et au numéro de version.

## Invariants vérifiés par diff

- ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- Thunderbird 153.0–154.* inchangé ;
- permission `menus` inchangée ;
- aucune logique métier, API Experiment, `PinCompatibility`, stockage, schéma ou migration modifié ;
- aucun réseau runtime, télémétrie, publicité, CDN ou code distant ajouté.

## Gate

La candidate exacte doit passer les gardes standard et `npm run ci` avant publication. Codex Security n’est pas utilisé.
