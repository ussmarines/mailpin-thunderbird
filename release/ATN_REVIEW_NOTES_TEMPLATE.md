# Notes pour les reviewers ATN — MailPin 1.7.10

## Statut

- **Dernière release GitHub publique :** 1.7.10
- **Source publiée :** 1.7.10
- **Version :** 1.7.10
- **Soumission ATN :** à préparer séparément de la release GitHub

## Identité

- **Nom :** MailPin — Email Follow-up & Productivity
- **ID :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 157.*
- **Permission WebExtension :** `menus` uniquement

## Portée 1.7.10

La 1.7.10 relève `strict_max_version` de `156.*` à `157.*` et le smoke réel vers Thunderbird 157.0.1. Aucun changement métier, permission, migration, schéma, stockage, dépendance runtime, télémétrie, publicité, connexion réseau ou code distant.

## Build et validation

Voir `release/BUILD_INSTRUCTIONS.md`. Candidate `565f565710da6262d7a91bfbe280a943047cdc6c` : QA `37213680870` PASS et smoke réel Thunderbird 157.0.1 `37213680824` PASS. Tag `v1.7.10` cible `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0`, validé par QA `37213779632`, smoke `37213779633` et CodeQL `37213779727` avant publication `37214354533`.

XPI public SHA-256 : `fc0cc2ada46cce977de9ba8594b79d8f9ba065dc810be329455f998e3c729b62`.
