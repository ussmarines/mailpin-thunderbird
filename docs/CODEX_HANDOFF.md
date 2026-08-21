# Passage de relais — MailPin 1.7.5 candidate ATN

## État

- branche : `release/atn-name-1.7.5` ;
- version source : **1.7.5** ;
- dernière release publique : **1.7.4** ;
- Thunderbird : 153.0 à 154.* ;
- ID : `ussmarines.mailpin@addons.thunderbird.net`.

## Objectif

Publier une maintenance 1.7.5 qui raccourcit uniquement le nom localisé/store à `MailPin — Email Follow-up & Productivity` afin de respecter la limite ATN de 50 caractères.

## Périmètre

Locales FR/EN, métadonnées de nom, version/release/docs/tests associés. Aucun changement de logique métier, API Experiment, `PinCompatibility`, stockage, schéma, permission ou réseau.

## Gates

Contrôle ciblé du nom ; QA Linux/Windows + build reproductible ; smoke Thunderbird 154.0 sur la candidate exacte ; merge puis publication `v1.7.5` ; reproduction `npm run ci` depuis l’archive reviewer publiée sans `.git`.

Codex Security n’est pas requis.
