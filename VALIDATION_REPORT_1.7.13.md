# Rapport de validation — MailPin 1.7.13 / Thunderbird 160.0

**PASS — release GitHub [v1.7.13](https://github.com/ussmarines/mailpin-thunderbird/releases/tag/v1.7.13) publiée le 12 novembre 2026**, cible exacte `9bc7a0ef2c28fc2547420ea4d1e6172d50e7cf0d`. Plage déclarée Thunderbird `153.0`–`160.*`, minimum inchangé. Aucun changement au runtime, à l'Experiment, aux permissions, schémas, SQLite, à `PinCompatibility` ou à la politique locale.

## Gates observés

| Contrôle | Candidate PR #94 `092a3afa4d9bf495d7110f3ab0e4550114eb3634` | Cible `main` `9bc7a0ef2c28fc2547420ea4d1e6172d50e7cf0d` |
| --- | --- | --- |
| QA Linux/Windows + sécurité | [43236791295](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/43236791295) PASS | [43237043214](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/43237043214) PASS |
| Smoke réel Thunderbird 160.0 Linux | [43236791204](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/43236791204) PASS | [43237043458](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/43237043458) PASS |
| CodeQL JavaScript, Python et Actions | [43236785838](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/43236785838) PASS | [43237043274](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/43237043274) PASS |
| Publication | — | [43237379954](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/43237379954) PASS |

Le smoke installe l'extension sur le binaire officiel Thunderbird 160.0 (build `20261106235107`) et geckodriver 0.37.1 vérifiés par empreintes SHA-256. Le fichier `result.json` de l'artefact CI `thunderbird-runtime-smoke` indique `status=passed`, une seule injection du panneau et du bouton Quick Filter, le bon démarrage MV3, le pin/unpin sans mutation des compteurs/états natifs, les raccourcis, le changement de dossier/onglet, le Dashboard unique, le nettoyage après désinstallation et la réinstallation propre. Il s'agit d'un profil local synthétique jetable.

## Artefacts GitHub

- `MailPin_v1.7.13.xpi` — 254 694 octets ; SHA-256 `58b734de3bb8835f9fd8dc01b61115bbee3d83e8b2ebbc7ada3ec71ae93b90ec`.
- `MailPin_GitHub_Repository_v1.7.13.zip` — 726 827 octets ; SHA-256 `d252def3542f2e799bce041f81ca44336b490b3bae6003b017c500ebbb493f13`.
- `SHA256SUMS.txt` — 190 octets ; SHA-256 `1ad6eeeecbf2daf5718068a7c574a4cd7bac08182f6261289bc2d2b2ddf9ef0c`.

Ces trois digests GitHub coïncident avec ceux de l'archive candidate locale déjà vérifiée. Aucun retéléchargement indépendant des trois assets GitHub n'a été réalisé. Source reviewer et XPI publiés depuis le commit exact de release ; les mises à jour documentaires ultérieures ne les remplacent pas.

## Limites restantes

Le smoke sur Linux n'est pas une recette humaine Windows/macOS ni une matrice IMAP/Gmail/CalDAV en production. La persistance des épingles après fermeture complète et redémarrage, l'accessibilité assistée, les fournisseurs distants et la parité binaire inter-OS n'ont pas été revalidés pour 160. La publication sur Add-ons for Thunderbird (ATN) est un processus séparé.
