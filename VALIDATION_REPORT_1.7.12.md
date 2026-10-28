# Rapport de validation — MailPin 1.7.12 / Thunderbird 159.0

## Verdict

**PASS GitHub release v1.7.12** sur la cible exacte `968832d1f2db39a227e16c0f079d3ba06f669359`, publiée le 28 octobre 2026. La release publique précédente était v1.7.11 (borne 158.*) ; la nouvelle release déclare Thunderbird 153.0–159.*. Aucun changement de runtime métier, permissions, stockage, schéma ou code privilégié dans cette maintenance.

## Critères PASS/FAIL (fixés avant implémentation)

A. Git/identité : **PASS**. Branche de maintenance depuis `main` `133975ba1dd7c2d61bb8626351658abb78018b41`, PR [#90](https://github.com/ussmarines/mailpin-thunderbird/pull/90) fusionnée par squash, tag v1.7.12 sur SHA validé. ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ; PR #84 native 2.2.0 draft non touchée.

B. Contrats/source : **PASS**. `npm run ci` dans QA Linux et contrôles source/modèles Windows, gardes secrets/identité, CodeQL. Manifest, package, documents de version et garde statique ajustés ; minimum Thunderbird 153.0 inchangé. Changements de dépendances, permissions et sécurité runtime : aucun.

C. Thunderbird réel 159.0 : **PASS dans le périmètre du smoke automatisé Linux**. Binaire officiel Thunderbird 159.0 téléchargé et vérifié via SHA256SUMS Mozilla ; geckodriver 0.37.1 vérifié par SHA-256. Exécution du smoke existant sur XPI construit de la cible exacte. Le succès du smoke ne prouve pas les fournisseurs IMAP/Gmail/Microsoft, les calendriers distants, macOS ou la recette humaine.

D. Packaging et sécurité : **PASS CI**. Build XPI/source reviewer et SHA256SUMS en QA et dans le publisher. CodeQL Actions, Python et JavaScript/TypeScript PASS. GitHub expose les trois assets publics et leurs digests SHA-256. Une comparaison indépendante des octets après re-téléchargement n’a pas été exécutée : ce contrôle spécifique reste **non vérifié**.

E. Publication : **PASS**. Publisher GitHub Actions et tag sur cible exacte, assets XPI/source/checksums disponibles.

## Preuves GitHub constatées

| Cible | QA | Smoke Thunderbird 159.0 | CodeQL |
| --- | --- | --- | --- |
| PR #90, head `249116323668f322d04cb37def629f8ecb19df5a` | [40755535256](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/40755535256) PASS | [40755535312](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/40755535312) PASS | [40755524358](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/40755524358) PASS |
| main/tag `968832d1f2db39a227e16c0f079d3ba06f669359` | [40755717992](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/40755717992) PASS | [40755718258](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/40755718258) PASS | [40755717952](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/40755717952) PASS |

Publisher officiel : [40755984476](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/40755984476) PASS. Release publique : [v1.7.12](https://github.com/ussmarines/mailpin-thunderbird/releases/tag/v1.7.12). Le workflow Release a exécuté `npm run ci` avant de publier.

## Artefacts publics (digests GitHub, pas re-téléchargement local)

- `MailPin_v1.7.12.xpi` : 254 693 octets ; SHA-256 `58cf44b3696a29a52d11df047760e5fba0f5cc3ac9cc908e68bc8ae4a58e3df8`.
- `MailPin_GitHub_Repository_v1.7.12.zip` : 722 501 octets ; SHA-256 `0698fc5ecef1375bcb64eb03e514bd6228939f71a69a30599a2bddfa38f40556`.
- `SHA256SUMS.txt` : 190 octets ; SHA-256 `00e28678c9a06915b705d669e9ab02435e40e842f2dce68f9cd38dc8aa7519bf`.

Le tag et les assets publics restent associés au target immuable `968832d1f2db39a227e16c0f079d3ba06f669359`. Les synchronisations documentaires postérieures de `main` ne les remplacent pas.

## Limites

Tests Windows **source et modèles**, mais pas de smoke réel interactif Thunderbird 159 sous Windows dans cette session. Non validés : fournisseurs réseau, calendriers distants, macOS, accessibilité assistée et mise à niveau sur profil utilisateur réel. La validation Add-ons for Thunderbird (ATN) est distincte, et l’architecture Experiment historique ne devient pas éligible à ATN par ce seul changement de version.
