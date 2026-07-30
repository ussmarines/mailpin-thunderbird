# Épingles de messages pour Thunderbird

Extension Thunderbird expérimentale qui ajoute un panneau d’épingles au-dessus de la liste des messages, avec suivi local, rappels, groupes, affaires, Kanban, règles et intégration Agenda.

> **État : build de développement 3.1.1.** Cette version corrige les régressions observées dans la vidéo d’utilisation du 30 juillet 2026, notamment le contrat API, le clic droit, les couleurs, le survol et le centrage des punaises. Une nouvelle validation graphique complète dans Thunderbird reste obligatoire avant publication. Voir [docs/VIDEO_REVIEW_2026-07-30.md](docs/VIDEO_REVIEW_2026-07-30.md).

## Fonctions principales

- épingles indépendantes des étoiles Thunderbird ;
- panneau distinct sans masquer la liste native ;
- couleurs par compte, groupes, notes et priorités ;
- suivi « À traiter / En attente / Planifié / Terminé » ;
- conversations, échéances, rappels et récurrences ;
- affaires et tableau Kanban ;
- règles locales avec simulation et protections anti-boucle ;
- tâches/événements Agenda ;
- sauvegardes, réparation, diagnostic et stockage SQLite local ;
- menu contextuel accessible sur les cartes épinglées ;
- tableau de bord global adapté aux thèmes clair et sombre.

## Installation de test

1. Construire avec `npm run build`, ou utiliser le XPI fourni séparément.
2. Dans Thunderbird : **Extensions et thèmes → roue dentée → Installer un module depuis un fichier**.
3. Redémarrer Thunderbird.
4. Utiliser un profil de test et des messages sans importance pour les opérations de suppression, archivage et règles.

## Développement

Prérequis : Python 3.11+ et Node.js 20+. Le projet n’a aucune dépendance npm.

```bash
npm run check   # structure, sécurité, syntaxe et ressources
npm test        # tests de modèle et gardes anti-régression
npm run build   # XPI reproductible + archive source
npm run ci      # ensemble des contrôles
```

Le contenu de `extension/` est placé à la racine du XPI. Le dossier `dist/` n’est pas versionné.

## Structure

```text
extension/       code installable Thunderbird
docs/            architecture, sécurité, tests et décisions
scripts/         contrôle, secrets et build reproductible
tests/           tests statiques et modèles
release/         modèle de manifeste pour la future publication
.github/         CI et modèles de contribution
AGENTS.md        consignes compactes pour Codex et les contributeurs
```

## Confidentialité

Aucun appel réseau n’est présent. Les métadonnées nécessaires aux épingles sont stockées localement. Le corps des messages et le contenu des pièces jointes ne sont pas copiés dans la base de l’extension. Voir [PRIVACY.md](PRIVACY.md).

## Sécurité

L’extension utilise une API Experiment pour accéder à des éléments internes de Thunderbird. Cela implique un avertissement d’accès complet à l’installation et une dépendance aux versions internes de Thunderbird. Voir [SECURITY.md](SECURITY.md), [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) et [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

## Licence

Ce dépôt n’est pas open source. Le code est fourni sous une licence source-disponible restrictive, non commerciale et sans droit de redistribution publique. Voir [LICENSE](LICENSE). Une validation juridique professionnelle est recommandée avant publication publique.

## Nom du projet

« Outlook » est une marque de Microsoft. Le nom actuel est un nom de développement descriptif. Un examen du nom et des marques est requis avant la publication sur Add-ons for Thunderbird.
