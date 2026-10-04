> Source 2.2.0 — candidate native uniquement. Version source : **2.2.0**. Dernière release publique : **1.7.10** ; release publique 1.7.10 inchangée.
> Contrat courant et différences : docs/NATIVE_2.2.0_HANDOFF.md. Les sections 1.7.x ci-dessous restent historiques et ne prouvent pas le natif.

**Version source :** 2.2.0 — candidate ; **Dernière release publique :** 1.7.10. `MailPin_v2.2.0.xpi` réservé au test propriétaire.

# Publication MailPin 1.7.10

## État

- **Version source :** 1.7.10 — publiée
- **Dernière release publique :** 1.7.10
- **Dernière publication :** `v1.7.10`, commit `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0`
- **Nom public/localisé :** `MailPin — Email Follow-up & Productivity` — 40 caractères
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité publiée :** Thunderbird 153.0 à 157.*
- **Artefact publié :** `MailPin_v1.7.10.xpi`
- **Fiche ATN :** https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Portée 1.7.10

La 1.7.10 étend la compatibilité déclarée à Thunderbird 157.* et déplace le smoke runtime sur le binaire officiel 157.0.1. Le runtime métier et la frontière privilégiée restent inchangés.

Aucune permission, migration, schéma, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant n’est ajouté.

## Artefacts publiés

- `MailPin_v1.7.10.xpi` — SHA-256 `fc0cc2ada46cce977de9ba8594b79d8f9ba065dc810be329455f998e3c729b62`
- `MailPin_GitHub_Repository_v1.7.10.zip` — SHA-256 `ecb990f72cf44c880fb4e6f819f185cd6f477dd55525bed907332627fa266e94`
- `SHA256SUMS.txt` — asset SHA-256 `b213b5dc7f6fa8dc89812ccb838db7889ca143915df5523689e6eb011d7f8744`

## Preuves

- candidate exacte `565f565710da6262d7a91bfbe280a943047cdc6c` : QA `37213680870` — PASS ; smoke réel Thunderbird 157.0.1 `37213680824` — PASS ;
- squash sur `main` / cible du tag : `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0` ; QA post-merge `37213779632` — PASS ; smoke réel Thunderbird 157.0.1 `37213779633` — PASS ;
- CodeQL post-merge `37213779727` — PASS ;
- workflow canonique Release `37214354533` : vérification/build, métadonnées et publication — PASS ;
- release publique `v1.7.10` ciblant exactement `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0` avec les trois assets attendus et leurs digests exposés par GitHub.

## Gates GitHub / ATN

- [x] QA Linux/Windows sur la candidate 1.7.10 exacte ;
- [x] garde sécurité/identité ;
- [x] build reproductible et structure XPI ;
- [x] smoke Thunderbird 157.0.1 réel sur la candidate exacte ;
- [x] merge squash vers `main` ;
- [x] QA, CodeQL et smoke Thunderbird 157.0.1 post-merge ;
- [x] tag/release `v1.7.10` créé par le publisher canonique ;
- [ ] éventuelle soumission ATN 1.7.10 et revue humaine, distinctes de la release GitHub.

Codex Security n’a pas été utilisé.
