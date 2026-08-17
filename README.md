<div align="center">
  <img src="assets/brand/mailpin-hero.svg" width="100%" alt="MailPin — Email Follow-up & Productivity for Thunderbird">

# MailPin

**Email Follow-up & Productivity for Thunderbird**

[![QA](https://github.com/ussmarines/mailpin-thunderbird/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ussmarines/mailpin-thunderbird/actions/workflows/ci.yml)
![Release](https://img.shields.io/badge/release-v1.7.3-4F7F75)
![Source](https://img.shields.io/badge/release-v1.7.3-3D536B)
![Thunderbird](https://img.shields.io/badge/Thunderbird-153.x-3D536B)
![Licence](https://img.shields.io/badge/licence-MailPin%20Source--Available%201.1-1A1D21)
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

**Organic Workspace** est consolidé directement dans son stylesheet canonique. La release 1.7.3 supprime la feuille corrective `interaction-stability.css`, intègre en dur les corrections dans `workspace.css`, augmente l’espace entre groupes de paramètres et garantit un contraste lisible pour **Annuler** dans la barre de sauvegarde, notamment en thème sombre. Aucun dégradé, asset ou police distante n’est ajouté.

## Compatibilité

- **Version source :** `1.7.3` — publiée
- **Dernière release publique :** `1.7.3`
- **Thunderbird :** `153.0` à `153.*`
- **Format :** MailExtension Manifest V3
- **Langues :** français et anglais
- **ID public :** `ussmarines.mailpin@addons.thunderbird.net`

MailPin utilise une API Experiment privilégiée pour l’intégration `about:3pane`, le stockage SQLite local et certaines fonctions Messages/Tags/Agenda. Les frontières Messages, Tags et Agenda restent isolées derrière `PinCompatibility`.

## Installation

### Release GitHub

1. Téléchargez `MailPin_v1.7.3.xpi` depuis la release `v1.7.3`.
2. Thunderbird → **Extensions et thèmes** → engrenage → **Installer un module depuis un fichier**.
3. Sélectionnez le XPI.

### Depuis les sources

Prérequis : Python 3.11+ et Node.js 20+.

```bash
npm run ci
```

Livrables reproductibles de la source publiée :

- `dist/MailPin_v1.7.3.xpi`
- `dist/MailPin_GitHub_Repository_v1.7.3.zip`
- `dist/SHA256SUMS.txt`

## Confidentialité & sécurité

MailPin ne contient aucun appel réseau runtime, aucune télémétrie, aucune publicité ni code distant. Le corps complet des messages et le contenu des pièces jointes ne sont pas copiés dans la base MailPin.

- [Politique de confidentialité](PRIVACY.md)
- [Politique de sécurité](SECURITY.md)
- [Audit sécurité source 1.7.3](SECURITY_AUDIT_1.7.3.md)
- [Rapport de validation source 1.7.3](VALIDATION_REPORT_1.7.3.md)
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
