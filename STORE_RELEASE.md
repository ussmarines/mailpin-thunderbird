# Publication MailPin 1.7.8

## État

- **Version source :** 1.7.8 — publiée
- **Dernière release publique :** 1.7.8
- **Dernière publication :** `v1.7.8`, commit `800c07315ee7f8611f2d2fc6e12a4f2c2d74b849`
- **Nom public/localisé :** `MailPin — Email Follow-up & Productivity` — 40 caractères
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité publiée :** Thunderbird 153.0 à 155.*
- **Artefact publié :** `MailPin_v1.7.8.xpi`
- **Fiche ATN :** https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Portée 1.7.8

La 1.7.8 publie l’état Git final synchronisé après 1.7.7. Le runtime Thunderbird 155 est inchangé. Aucun ajout de fonction, permission, migration, schéma, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant.

## Artefacts publiés

- `MailPin_v1.7.8.xpi` — SHA-256 `b007f9ad0213bb5672e5273c27b4f0d3935897fc2696922acd2e2dd673b5048e`
- `MailPin_GitHub_Repository_v1.7.8.zip` — SHA-256 `509076b18aef693c060983037c4277a97c65d98e13738ead351da7ef13537b9d`
- `SHA256SUMS.txt` — asset SHA-256 `c20e8f706bad9d688486d8143a375a5377289ccf40c3aeeb023491ed7cccc1b7`

## Preuves

- candidate exacte `e48a12239c674e1f8a909b22a04c0c3266eca70e` : QA `33691697322` — PASS ; smoke réel Thunderbird 155.0 `33691697345` — PASS ;
- squash sur `main` / cible du tag : `800c07315ee7f8611f2d2fc6e12a4f2c2d74b849` ; QA post-merge `33691785442` — PASS ; smoke réel Thunderbird 155.0 `33691785284` — PASS ;
- workflow canonique Release `33691919194` : vérification/build, métadonnées et publication — PASS ;
- release publique `v1.7.8` ciblant exactement `800c07315ee7f8611f2d2fc6e12a4f2c2d74b849` avec les trois assets attendus et leurs digests exposés par GitHub.

## Gates GitHub / ATN

- [x] QA Linux/Windows sur la candidate 1.7.8 exacte ;
- [x] garde sécurité/identité ;
- [x] build reproductible et structure XPI ;
- [x] smoke Thunderbird 155.0 réel sur la candidate exacte ;
- [x] merge squash vers `main` ;
- [x] QA et smoke Thunderbird 155.0 post-merge ;
- [x] tag/release `v1.7.8` créé par le publisher canonique ;
- [ ] éventuelle soumission ATN 1.7.8 et revue humaine, distinctes de la release GitHub.

Codex Security n’a pas été utilisé.
