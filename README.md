# MailPin — WebExtension-native 2.1

MailPin est une extension Thunderbird Manifest V3 locale pour épingler, organiser et suivre les e-mails importants.

## Architecture

Depuis la version 2.0, MailPin est reconstruite **sans aucune Experiment API**. La dernière architecture historique utilisant `pinInbox` est figée dans la branche `archive/mailpin-1.7.6-experiment`.

MailPin utilise uniquement les APIs MailExtension/WebExtension publiques de Thunderbird : sélection et actions sur les messages, composition, tags, stockage local, alarmes, notifications, menus, raccourcis et pages d’extension.

## Fonctionnalités 2.1 candidate

- épingler/désépingler depuis la liste ou le message affiché ;
- feedback visuel dans la liste des messages via des tags Thunderbird appartenant à MailPin ;
- bouton du message affiché avec badge, icône, libellé et tooltip dynamiques selon l’état épinglé ;
- compteur de suivis actifs sur le bouton global MailPin ;
- capture rapide Aujourd’hui, Demain, En attente, Attente de réponse ;
- Dashboard avec recherche, tris, vues et vues enregistrées ;
- statuts À traiter / Planifié / En attente / Terminé ;
- notes personnelles et checklist/sous-tâches ;
- échéances, rappels et report rapide 1 h / 1 jour ;
- priorités, projets et labels MailPin ;
- vue Planning interne et statistiques de suivi ;
- modèles réutilisables, dossiers/cases et règles locales explicites ;
- Workbench de maintenance, historique et diagnostic ;
- import manuel des messages étoilés avec permission `accountsRead` demandée uniquement lors de l’action ;
- réparation des références cassées ;
- ouverture, réponse, réponse à tous, archivage et corbeille ;
- lecture et application des tags Thunderbird existants sans les renommer ni les supprimer ;
- import/export JSON MailPin 2.x et export/import des données Workbench ;
- aucune télémétrie, publicité, CDN, code distant ou réseau runtime.

## Différences avec MailPin 1.x

Le panneau injecté au-dessus de la liste native Thunderbird, SQLite privilégié et l’intégration Agenda interne dépendaient de l’Experiment custom `pinInbox`. Ils ne sont pas repris tels quels. Leurs objectifs sont remplacés par des surfaces natives Thunderbird, un Dashboard/Workbench et un Planning local.

La migration automatique de la base SQLite 1.x n’est pas possible depuis une WebExtension pure. La branche d’archive conserve la dernière version historique complète. La 2.1 permet néanmoins d’importer explicitement les messages étoilés via API publique.

Les règles 2.1 sont volontairement explicites et appliquées par l’utilisateur à une sélection : aucune automatisation opaque n’est introduite tant qu’elle ne peut pas être garantie sans régression de données.

## Développement

```bash
npm run check
npm test
npm run build
npm run ci
```

Le XPI est créé dans `dist/`. La CI exécute aussi le `webext-linter` officiel Thunderbird épinglé à sa version 1.9.0.

## Contraintes produit

- Manifest V3 ;
- identifiant : `ussmarines.mailpin@addons.thunderbird.net` ;
- zéro Experiment API ;
- zéro réseau runtime ;
- aucun corps de message ni pièce jointe stocké ;
- un simple épinglage ne change jamais l’état lu/non-lu ;
- les tags personnels Thunderbird ne sont jamais renommés, adoptés ou supprimés par MailPin.

La publication publique reste bloquée jusqu’au smoke réel du propriétaire sur Thunderbird.
