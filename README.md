# MailPerch

**MailPerch — Email Pins & Follow-up**

> **Épinglez, organisez et suivez vos e-mails dans Thunderbird.**
> *Gardez vos messages importants à portée de main.*

MailPerch est une extension Thunderbird qui ajoute un panneau d’épingles au-dessus de la liste native des messages, avec suivi local, rappels, groupes, affaires, Kanban, règles et intégration Agenda.

> **État : build de développement 3.2.1.** Les contrôles statiques, les tests de modèle et les gardes de régression sont exécutés automatiquement. Une validation graphique complète dans Thunderbird reste obligatoire avant publication.

## Fonctions principales

- épingles indépendantes des étoiles Thunderbird ;
- panneau distinct sans masquer la liste native ;
- couleurs personnalisables par compte, groupes, notes et priorités ;
- suivi « À traiter / En attente / Planifié / Terminé » ;
- conversations, échéances, rappels et récurrences ;
- affaires, tableau Kanban, vues intelligentes et actions groupées ;
- suivi automatique des conversations sans réponse ;
- règles locales avec simulation et protections anti-boucle ;
- tâches et événements Agenda avec matrice de compatibilité ;
- sauvegardes prévisualisées, migrations protégées et stockage SQLite local ;
- centre de santé et diagnostic local expurgé exportable ;
- menu contextuel natif sur toute la surface des cartes épinglées ;
- tableau de bord global adapté aux thèmes clair, sombre et contraste élevé ;
- paramètres guidés, recherche, aides contextuelles et retours d’action non invasifs ;
- rendu différentiel et chargement progressif pour les grands volumes.

## Installation de test

1. Construire avec `npm run build`, ou utiliser le XPI fourni séparément.
2. Dans Thunderbird : **Extensions et thèmes → roue dentée → Installer un module depuis un fichier**.
3. Sélectionner `dist/MailPerch_v3.2.1.xpi`.
4. Redémarrer complètement Thunderbird.
5. Utiliser un profil de test et des messages sans importance pour les opérations de suppression, archivage et règles.

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
tests/           tests statiques, modèles, accessibilité, données et UX 3.2
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
