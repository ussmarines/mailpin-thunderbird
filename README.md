# MailPerch

**MailPerch — Email Pins & Follow-up**

> **Épinglez, organisez et suivez vos e-mails dans Thunderbird.**
> *Gardez vos messages importants à portée de main.*

MailPerch est une extension Thunderbird qui ajoute un panneau d’épingles au-dessus de la liste native des messages, avec suivi local, rappels, groupes, affaires, Kanban, règles et intégration Agenda.

> **État : build de développement 3.1.0.** Le code a fait l’objet de contrôles statiques, de tests de modèles et d’une passe de correction issue de captures Thunderbird. Une validation graphique complète dans Thunderbird reste obligatoire avant publication. Voir [AUDIT_REPORT_3.1.0.md](AUDIT_REPORT_3.1.0.md).

## Fonctions principales

- épingles indépendantes des étoiles Thunderbird ;
- panneau distinct sans masquer la liste native ;
- couleurs personnalisables par compte, groupes, notes et priorités ;
- suivi « À traiter / En attente / Planifié / Terminé » ;
- conversations, échéances, rappels et récurrences ;
- affaires et tableau Kanban ;
- règles locales avec simulation et protections anti-boucle ;
- tâches et événements Agenda ;
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

Les builds sont créés sous les noms :

```text
MailPerch_v<VERSION>.xpi
MailPerch_GitHub_Repository_v<VERSION>.zip
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
BRANDING.md      identité canonique et règles de nommage
```

## Confidentialité

Aucun appel réseau n’est présent. Les métadonnées nécessaires aux épingles sont stockées localement. Le corps des messages et le contenu des pièces jointes ne sont pas copiés dans la base de l’extension. Voir [PRIVACY.md](PRIVACY.md).

## Sécurité

MailPerch utilise une API Experiment pour accéder à des éléments internes de Thunderbird. Cela implique un avertissement d’accès complet à l’installation et une dépendance aux versions internes de Thunderbird. Voir [SECURITY.md](SECURITY.md), [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) et [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

## Licence

Ce dépôt n’est pas open source. Le code est fourni sous une licence source-disponible restrictive, non commerciale et sans droit de redistribution publique. Voir [LICENSE](LICENSE). Une validation juridique professionnelle est recommandée avant publication publique.

## Marque et identifiants techniques

Le nom public est **MailPerch**. Les anciens identifiants techniques `pin-mails-*` et l’ID de développement `pin-mails@MailPerch.local` sont conservés pour assurer les migrations et la continuité des données. Voir [BRANDING.md](BRANDING.md).

Thunderbird est une marque de MZLA Technologies Corporation. MailPerch est un projet indépendant, sans affiliation ni approbation de MZLA ou du projet Thunderbird.
