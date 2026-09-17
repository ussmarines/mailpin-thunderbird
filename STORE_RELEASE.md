# Publication MailPin 1.7.9

## État

- **Version source :** 1.7.9 — publiée
- **Dernière release publique :** 1.7.9
- **Dernière publication :** `v1.7.9`, commit `46bb9fc27256cc143743e74e4a04fb48d48f6e85`
- **Nom public/localisé :** `MailPin — Email Follow-up & Productivity` — 40 caractères
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité publiée :** Thunderbird 153.0 à 156.*
- **Artefact publié :** `MailPin_v1.7.9.xpi`
- **Fiche ATN :** https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Portée 1.7.9

La 1.7.9 étend la compatibilité déclarée à Thunderbird 156.* et déplace le smoke runtime sur le binaire officiel 156.0. Le runtime métier et la frontière privilégiée restent inchangés. La candidate `da9d97a874f5043b43a212d09b9090ad0f77d681` et le target publié `46bb9fc27256cc143743e74e4a04fb48d48f6e85` ont tous deux passé le smoke réel Thunderbird 156.0.

Aucune permission, migration, schéma, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant n’est ajouté.

## Portée 1.7.8

La 1.7.8 publie l’état Git final synchronisé après 1.7.7. Le runtime Thunderbird 155 est inchangé. Aucun ajout de fonction, permission, migration, schéma, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant.

## Artefacts publiés

- `MailPin_v1.7.9.xpi` — SHA-256 `41248fb7f68dde8a7858e5500e008a09248f7c3a4968b045e1f8c2d6d5839fb2`
- `MailPin_GitHub_Repository_v1.7.9.zip` — SHA-256 `b3aef29587f653433dd211dfeb7d077f44832d1b83331de26151c40c334e9397`
- `SHA256SUMS.txt` — asset SHA-256 `ea5f9801b5d952368290ca2754e8dbc0df3a01133759b594b59c2d812609bcb0`

- `MailPin_v1.7.8.xpi` — SHA-256 `b007f9ad0213bb5672e5273c27b4f0d3935897fc2696922acd2e2dd673b5048e`
- `MailPin_GitHub_Repository_v1.7.8.zip` — SHA-256 `509076b18aef693c060983037c4277a97c65d98e13738ead351da7ef13537b9d`
- `SHA256SUMS.txt` — asset SHA-256 `c20e8f706bad9d688486d8143a375a5377289ccf40c3aeeb023491ed7cccc1b7`

## Preuves

- candidate exacte `da9d97a874f5043b43a212d09b9090ad0f77d681` : QA `35224045803` — PASS ; smoke réel Thunderbird 156.0 `35224046106` — PASS ;
- squash sur `main` / cible du tag : `46bb9fc27256cc143743e74e4a04fb48d48f6e85` ; QA post-merge `35224161719` — PASS ; smoke réel Thunderbird 156.0 `35224161877` — PASS ;
- workflow canonique Release `35224299551` : vérification/build, métadonnées et publication — PASS ;
- release publique `v1.7.9` ciblant exactement `46bb9fc27256cc143743e74e4a04fb48d48f6e85` avec les trois assets attendus et leurs digests exposés par GitHub.

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
