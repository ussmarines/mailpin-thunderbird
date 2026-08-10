<div align="center">
  <img src="extension/icons/mailperch-icon.svg" width="128" height="128" alt="Logo MailPerch">

# MailPerch

**Épinglez, organisez et suivez vos e-mails importants dans Thunderbird.**

[![QA](https://github.com/ussmarines/mailperch-thunderbird/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ussmarines/mailperch-thunderbird/actions/workflows/ci.yml)
![Release](https://img.shields.io/badge/release-v1.5.2-0078D4)
![Licence](https://img.shields.io/badge/licence-MailPerch%20Source--Available%201.1-6A5ACD)
</div>

MailPerch ajoute à Thunderbird un panneau d’épingles distinct au-dessus de la liste native. Il permet de garder les messages importants visibles, de planifier leur suivi et de les organiser sans remplacer le fonctionnement habituel de Thunderbird.

## Fonctionnalités

- épinglage d’un message ou d’une conversation, indépendamment de l’étoile native ;
- portée du panneau par boîte courante, comptes Thunderbird sélectionnés ou tous les comptes ;
- suivi automatique des réponses, échéances, rappels interactifs et mise en veille ;
- vues **Aujourd’hui** et **Revue**, actions groupées et capture rapide depuis un message ;
- groupes, affaires, modèles, règles locales avec aperçu et vues intelligentes ;
- création de tâches et d’événements dans les calendriers Thunderbird compatibles ;
- notes personnelles et checklists/sous-tâches liées aux messages et conversations ;
- recherche globale MailPerch, vues personnalisées enregistrables et palette de commandes ;
- indicateurs **J’attends** / **Je dois répondre** et statistiques de suivi enrichies ;
- synchronisation facultative avec des tags Thunderbird gérés exclusivement par MailPerch ;
- synchronisation bidirectionnelle des tâches/événements Agenda compatibles ;
- tableau de bord, Kanban, historique et centre de santé local ;
- sauvegarde, restauration et diagnostics expurgés.

## Compatibilité

- **MailPerch :** `1.5.2` ;
- **Thunderbird :** `153.0` à `153.*` ;
- **Format :** MailExtension Manifest V3 ;
- **Langues :** français et anglais ;
- **Systèmes ciblés :** Windows, Linux et macOS.

La plage de versions est déclarée dans le manifeste, mais la matrice complète Windows/Linux/macOS et les versions extrêmes doivent encore être validées manuellement avant la soumission au store.

MailPerch utilise une API Experiment privilégiée pour intégrer son panneau à Thunderbird, gérer son stockage SQLite local et accéder aux fonctions Agenda nécessaires. Thunderbird affiche donc un avertissement d’accès complet lors de l’installation.

Les accès internes Messages, Tags et Agenda sont isolés derrière une couche de compatibilité dédiée afin de réduire le couplage aux internals Thunderbird. Le DOM `about:3pane` reste volontairement adapté progressivement.

## Installation

### Depuis une release GitHub

1. Téléchargez `MailPerch_v1.5.2.xpi` depuis la release `v1.5.2`.
2. Dans Thunderbird, ouvrez **Extensions et thèmes**.
3. Dans le menu de l’engrenage, choisissez **Installer un module depuis un fichier**.
4. Sélectionnez le fichier XPI, puis redémarrez Thunderbird si nécessaire.

> Les anciennes builds internes `3.2.x` utilisaient un numéro supérieur aux versions publiques actuelles. Pour tester `1.5.2` après une build de développement, utilisez un profil de test propre ou désinstallez d’abord l’ancienne build après avoir exporté vos données MailPerch.

### Depuis les sources

Prérequis : Python 3.11+ et Node.js 20+. Aucune dépendance npm ou Python tierce n’est téléchargée.

```bash
npm run ci
```

Les livrables reproductibles sont générés dans `dist/` : XPI, archive source et sommes SHA-256.

## Confidentialité et sécurité

MailPerch fonctionne localement : aucun appel réseau, aucune télémétrie, aucune publicité et aucun chargement de code distant. Les métadonnées nécessaires aux épingles restent dans le profil Thunderbird ; le corps complet des messages et le contenu des pièces jointes ne sont pas copiés dans la base MailPerch.

- [Politique de confidentialité](PRIVACY.md)
- [Politique de sécurité](SECURITY.md)
- [Audit de sécurité 1.5.2](SECURITY_AUDIT_1.5.2.md)
- [Rapport de validation 1.5.2](VALIDATION_REPORT_1.5.2.md)
- [Limites connues](docs/KNOWN_LIMITATIONS.md)

## Documentation et support

- [Guide d’architecture](docs/ARCHITECTURE.md)
- [Couche de compatibilité Thunderbird](docs/THUNDERBIRD_COMPATIBILITY.md)
- [Banc de test Thunderbird](docs/THUNDERBIRD_TEST_BENCH.md)
- [Plan de test manuel](docs/MANUAL_TEST_PLAN.md)
- [Instructions de build pour reviewers](release/BUILD_INSTRUCTIONS.md)
- [Préparation de la soumission Thunderbird Add-ons](STORE_RELEASE.md)
- [Signaler un problème](https://github.com/ussmarines/mailperch-thunderbird/issues)

Le développement est maintenu par [ussmarines](https://github.com/ussmarines). Les dons via [PayPal](https://paypal.me/ussmarinesdot) sont facultatifs et ne débloquent aucune fonction.

## Licence

MailPerch est distribué sous la **MailPerch Source-Available License 1.1**. Le dépôt public peut être consulté et les droits éventuellement accordés directement par GitHub restent applicables ; la licence MailPerch n’accorde cependant aucun droit supplémentaire de vente, redistribution, publication d’un fork, reprise indépendante du projet ou exploitation commerciale sans autorisation écrite. Consultez [LICENSE](LICENSE).
