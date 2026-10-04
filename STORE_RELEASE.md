# Préparation MailPin 1.7.10

## État

- **Version source :** 1.7.10 — candidate
- **Dernière release publique :** 1.7.9
- **Dernière publication :** `v1.7.9`, commit `46bb9fc27256cc143743e74e4a04fb48d48f6e85`
- **Nom public/localisé :** `MailPin — Email Follow-up & Productivity` — 40 caractères
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité candidate :** Thunderbird 153.0 à 157.*
- **Compatibilité publiée :** Thunderbird 153.0 à 156.*
- **Artefact candidat :** `MailPin_v1.7.10.xpi`
- **Fiche ATN :** https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Portée 1.7.10

La 1.7.10 étend uniquement la compatibilité déclarée à Thunderbird 157.* et déplace le smoke runtime sur le binaire officiel 157.0.1. Le runtime métier et la frontière privilégiée restent inchangés. La publication est bloquée jusqu’aux gates QA/build/smoke exacts.

Aucune permission, migration, schéma, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant n’est ajouté.

## Baseline publiée

MailPin 1.7.9 reste la dernière release publique. La candidate exacte `da9d97a874f5043b43a212d09b9090ad0f77d681` a passé QA `35224045803` et smoke réel Thunderbird 156.0 `35224046106`. Le target publié `46bb9fc27256cc143743e74e4a04fb48d48f6e85` a repassé QA `35224161719` et smoke `35224161877` avant le workflow Release `35224299551`.

## Gates GitHub / ATN

- [ ] QA Linux/Windows sur la candidate 1.7.10 exacte ;
- [ ] garde sécurité/identité ;
- [ ] build reproductible et structure XPI ;
- [ ] smoke Thunderbird 157.0.1 réel sur la candidate exacte ;
- [ ] merge squash vers `main` après PASS de tous les gates applicables ;
- [ ] QA et smoke Thunderbird 157.0.1 post-merge ;
- [ ] tag/release `v1.7.10` créé par le publisher canonique ;
- [ ] éventuelle soumission ATN 1.7.10 et revue humaine, distinctes de la release GitHub.

Codex Security n’est pas utilisé.
