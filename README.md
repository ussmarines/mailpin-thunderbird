# Candidate native MailPin 2.2.0

**Version source :** `2.2.0` — candidate ; **Dernière release publique :** `1.7.10`.
Les tags natifs, actions de message, menus, raccourcis et un Space MailPin remplacent le panneau privé. Organic Workspace conserve notes, checklists, workflows, recherche, vues, affaires et modèles locaux. Agenda et sauvegardes automatiques vers un dossier sont indisponibles. Le XPI ne contient aucun Experiment privé, réseau runtime, code distant, corps de courrier ou pièce jointe.

Exporter depuis 1.7.10 avant mise à niveau ; garder le JSON et une copie du profil fermé. Import explicite dans Workbench avec preview puis merge/replace. Aucun accès/purge automatique SQLite. Automatisations importées désactivées. Limites, permissions, rollback et tests propriétaire : [handoff natif](docs/NATIVE_2.2.0_HANDOFF.md).

Build : `npm run ci` ; candidate `dist/MailPin_v2.2.0.xpi`. Thunderbird 157.0–157.*, cible réelle 157.0.1. PR draft uniquement, aucune publication/release ATN. [Validation](VALIDATION_REPORT_2.2.0.md), [revue sécurité](SECURITY_AUDIT_2.2.0.md), [matrice](docs/NATIVE_2.2.0_MATRIX.md).

## Documentation historique de la release publique 1.7.10

<div align="center">
  <img src="assets/brand/mailpin-hero.svg" width="100%" alt="MailPin — Email Follow-up & Productivity">

# MailPin

**Email Follow-up & Productivity for Thunderbird**

[![QA](https://github.com/ussmarines/mailpin-thunderbird/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ussmarines/mailpin-thunderbird/actions/workflows/ci.yml)
![Release](https://img.shields.io/badge/release-v1.7.10-4F7F75)
![Source](https://img.shields.io/badge/release-v1.7.10-3D536B)
![Thunderbird](https://img.shields.io/badge/Thunderbird-153.x--157.x-3D536B)
![Licence](https://img.shields.io/badge/license-MailPin%20Source--Available%201.1-1A1D21)
</div>

MailPin transforme les e-mails importants en suivi actionnable **sans remplacer la boîte de réception Thunderbird**. Épinglez un message, ajoutez une note ou une checklist, planifiez une relance, organisez vos vues et, lorsque l’agenda le permet, créez un événement ou une tâche — le tout localement.

## Pourquoi MailPin

- **Épingler sans altérer Thunderbird** — l’épinglage ne marque jamais un message lu/non lu et ne modifie pas les compteurs natifs.
- **Faire avancer le suivi** — états Actif, En attente, Planifié et Terminé, rappels, snooze et suivi de non-réponse.
- **Ajouter du contexte** — notes personnelles, sous-tâches, groupes, affaires, modèles et règles locales.
- **Retrouver vite** — recherche globale, vues enregistrées, Dashboard, Kanban et palette de commandes.
- **Relier l’Agenda** — événements et tâches uniquement lorsque le calendrier Thunderbird annonce la capacité correspondante.
- **Rester local-first** — aucune télémétrie, publicité, API distante, CDN ou code distant.

## Interface

La release **1.7.10** étend la compatibilité à Thunderbird 157 après validation réelle sur le binaire officiel 157.0.1. Aucun changement de permission, schéma, stockage, dépendance runtime ou réseau n’est ajouté.

## Compatibilité

- **Version source :** `1.7.10` — publiée
- **Dernière release publique :** `1.7.10`
- **Thunderbird :** `153.0` à `157.*`
- **Format :** MailExtension Manifest V3
- **Langues :** français et anglais
- **ID public :** `ussmarines.mailpin@addons.thunderbird.net`
- **Fiche Add-ons for Thunderbird :** [MailPin](https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/) — le cycle de soumission/revue ATN reste distinct de la release GitHub

MailPin utilise une API Experiment privilégiée pour l’intégration `about:3pane`, le stockage SQLite local et certaines fonctions Messages/Tags/Agenda. Les frontières Messages, Tags et Agenda restent isolées derrière `PinCompatibility`. La candidate exacte `565f565710da6262d7a91bfbe280a943047cdc6c` a passé QA `37213680870` et le smoke réel Thunderbird 157.0.1 `37213680824` ; le target publié `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0` a repassé QA `37213779632`, smoke `37213779633` et CodeQL `37213779727` avant publication par le workflow Release `37214354533`.

## Installation

### Add-ons for Thunderbird

La [fiche MailPin sur Add-ons for Thunderbird](https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/) existe. La publication GitHub 1.7.10 est distincte du cycle de revue Add-ons for Thunderbird.

### Release GitHub

1. Téléchargez `MailPin_v1.7.10.xpi` depuis la release `v1.7.10`.
2. Thunderbird → **Extensions et thèmes** → engrenage → **Installer un module depuis un fichier**.
3. Sélectionnez le XPI.

### Depuis les sources

Prérequis : Python 3.11+ et Node.js 20+.

```bash
npm run ci
```

Livrables reproductibles de la source publiée :

- `dist/MailPin_v1.7.10.xpi`
- `dist/MailPin_GitHub_Repository_v1.7.10.zip`
- `dist/SHA256SUMS.txt`

## Confidentialité & sécurité

MailPin ne contient aucun appel réseau runtime, aucune télémétrie, aucune publicité ni code distant. Le corps complet des messages et le contenu des pièces jointes ne sont pas copiés dans la base MailPin.

- [Politique de confidentialité](PRIVACY.md)
- [Politique de sécurité](SECURITY.md)
- [Audit sécurité source 1.7.10](SECURITY_AUDIT_1.7.10.md)
- [Rapport de validation source 1.7.10](VALIDATION_REPORT_1.7.10.md)
- [Limites connues](docs/KNOWN_LIMITATIONS.md)

## Documentation & support

- [Architecture](docs/ARCHITECTURE.md)
- [Compatibilité Thunderbird](docs/THUNDERBIRD_COMPATIBILITY.md)
- [Banc Thunderbird](docs/THUNDERBIRD_TEST_BENCH.md)
- [Build reviewers](release/BUILD_INSTRUCTIONS.md)
- [Préparation ATN](STORE_RELEASE.md)
- [Support](SUPPORT.md)

Maintenu par [ussmarines](https://github.com/ussmarines). Les dons [PayPal](https://paypal.me/ussmarinesdot) sont facultatifs et ne débloquent aucune fonction.

## Licence

MailPin est distribué sous la **MailPin Source-Available License 1.1**. Consultez [LICENSE](LICENSE).
