# MailPerch

MailPerch est une extension Thunderbird locale pour épingler, organiser et suivre les e-mails importants sans remplacer la liste native des messages.

> **État : build de développement 3.2.13.** Compatible avec Thunderbird 128 à 153. La validation manuelle complète de l’interface et de l’Agenda reste nécessaire avant toute publication.

## Fonctions principales

- panneau d’épingles distinct au-dessus de la liste native ;
- suivis, échéances, rappels, groupes, affaires et modèles locaux ;
- règles locales avec simulation et protections contre les boucles ;
- tâches et événements Agenda selon les calendriers compatibles ;
- tableau de bord, vues intelligentes et diagnostic local expurgé.

## Installation

1. Construisez l’extension avec `npm run build`.
2. Dans Thunderbird, ouvrez **Extensions et thèmes**, puis **Installer un module depuis un fichier**.
3. Sélectionnez `dist/MailPerch_v3.2.13.xpi`.
4. Redémarrez Thunderbird et utilisez d’abord un profil de test.

MailPerch n’est pas encore annoncé comme disponible sur Thunderbird Add-ons.

## Prise en main

1. Ouvrez les paramètres MailPerch.
2. Conservez les réglages recommandés ou adaptez l’affichage et les suivis.
3. Épinglez un message depuis la liste, le menu contextuel ou le raccourci configuré.
4. Utilisez le panneau ou le tableau de bord pour organiser les suivis.

## Confidentialité et fonctionnement local

MailPerch n’effectue aucun appel réseau, télémétrie ou chargement de contenu distant. Les données de suivi restent dans le profil Thunderbird ; le corps des messages et le contenu des pièces jointes ne sont pas copiés dans sa base locale. Consultez [PRIVACY.md](PRIVACY.md).

## Permissions et API Experiment

L’extension contient une API Experiment privilégiée pour intégrer le panneau à Thunderbird et accéder aux fonctions locales nécessaires. Cette API implique l’avertissement d’accès complet de Thunderbird et dépend de ses interfaces internes. Consultez [SECURITY.md](SECURITY.md), le [modèle de menace](docs/THREAT_MODEL.md) et les [limites connues](docs/KNOWN_LIMITATIONS.md).

## Développement et tests

Prérequis : Python 3.11+ et Node.js 20+. Aucune dépendance npm n’est requise.

```bash
npm run check
npm test
npm run build
npm run ci
```

Les procédures de validation manuelle sont décrites dans [docs/MANUAL_TEST_PLAN.md](docs/MANUAL_TEST_PLAN.md). Les contributeurs doivent également lire [AGENTS.md](AGENTS.md) et [docs/CODEX_HANDOFF.md](docs/CODEX_HANDOFF.md).

## Documentation et problèmes

- [Architecture](docs/ARCHITECTURE.md)
- [Registre des bugs](docs/BUG_TRACKER.md)
- [Guide de débogage](docs/DEBUGGING.md)
- [Signaler un problème](https://github.com/ussmarines/mailperch-thunderbird/issues)

## Auteur et liens officiels

- [ussmarines](https://github.com/ussmarines)
- [Dépôt MailPerch](https://github.com/ussmarines/mailperch-thunderbird)

## Soutenir MailPerch

Vous appréciez MailPerch ? Vous pouvez contribuer à la poursuite de son développement en faisant un don.

[**Soutenir le projet via PayPal**](https://paypal.me/ussmarinesdot)

Les dons sont facultatifs et ne débloquent aucune fonctionnalité.

## Licence

Ce dépôt est fourni sous une licence source-disponible restrictive, non commerciale et sans droit de redistribution publique. Consultez [LICENSE](LICENSE).
