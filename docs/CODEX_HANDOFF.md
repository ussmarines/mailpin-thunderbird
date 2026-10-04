# Passage de relais — MailPin 1.7.10 candidate

## État

- branche : `fix/thunderbird-157-compatibility` ;
- version source : **1.7.10** ;
- dernière release publique : **1.7.9** ;
- Thunderbird candidat : 153.0 à 157.* ;
- baseline publiée : 153.0 à 156.* ;
- ID : `ussmarines.mailpin@addons.thunderbird.net` ;
- tag/release public : `v1.7.9` → `46bb9fc27256cc143743e74e4a04fb48d48f6e85`.

## Résultat attendu

MailPin 1.7.10 relève uniquement la borne de compatibilité et le binaire du smoke vers Thunderbird 157.0.1. Aucun changement métier, permission, migration, schéma, stockage, dépendance runtime, télémétrie, publicité, connexion réseau ou code distant.

## Gates

QA Linux/Windows, garde sécurité/identité, build reproductible et smoke réel Thunderbird 157.0.1 doivent passer sur le head exact avant merge. Après squash sur `main`, QA et smoke 157.0.1 doivent repasser avant le workflow Release.

La soumission Add-ons for Thunderbird reste distincte de la release GitHub. La PR #74 et sa branche prototype upstream restent hors de cette maintenance.

Codex Security n’est pas requis.
