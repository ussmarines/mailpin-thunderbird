# Notes pour les reviewers ATN — MailPin 1.7.10

## Statut

- **Dernière release GitHub publique :** 1.7.9
- **Source candidate :** 1.7.10
- **Version :** 1.7.10
- **Soumission ATN :** à préparer séparément de la release GitHub

## Identité

- **Nom :** MailPin — Email Follow-up & Productivity
- **ID :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité candidate :** Thunderbird 153.0 à 157.*
- **Permission WebExtension :** `menus` uniquement

## Portée 1.7.10

La 1.7.10 relève uniquement `strict_max_version` de `156.*` à `157.*` et le smoke réel vers Thunderbird 157.0.1. Aucun changement métier, permission, migration, schéma, stockage, dépendance runtime, télémétrie, publicité, connexion réseau ou code distant.

## Build et validation

Voir `release/BUILD_INSTRUCTIONS.md`. La release publique 1.7.9 reste la baseline Thunderbird 156.0. Les preuves 1.7.10 doivent être renseignées uniquement après QA et smoke réel 157.0.1 sur le head exact puis post-merge.
