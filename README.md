# MailPin — WebExtension-native 2.0

MailPin est une extension Thunderbird Manifest V3 locale pour épingler, organiser et suivre les e-mails importants.

## Nouvelle architecture

Depuis la version 2.0, MailPin est reconstruite **sans aucune Experiment API**. La dernière architecture historique utilisant `pinInbox` est figée dans la branche `archive/mailpin-1.7.6-experiment`.

MailPin 2.0 utilise uniquement les APIs MailExtension/WebExtension publiques de Thunderbird : sélection de messages, actions sur les messages, composition, stockage local, alarmes, notifications, menus, raccourcis et pages d’extension.

### Fonctionnalités de la première candidate 2.0

- épingler/désépingler depuis la liste ou le message affiché ;
- capture rapide Aujourd’hui, Demain, En attente, Attente de réponse ;
- tableau de bord dédié avec recherche, tris et vues ;
- statuts À traiter / Planifié / En attente / Terminé ;
- notes personnelles et checklist/sous-tâches ;
- échéances et rappels locaux ;
- priorités, projets et labels MailPin ;
- vue Planning interne et statistiques de suivi ;
- ouverture, réponse, réponse à tous, archivage et corbeille ;
- lecture et application des tags Thunderbird existants sans les renommer ni les supprimer ;
- import/export JSON MailPin 2.x ;
- aucune télémétrie, publicité, CDN, code distant ou réseau runtime.

## Différences avec MailPin 1.x

Le panneau injecté au-dessus de la liste native Thunderbird, SQLite privilégié et l’intégration Agenda interne dépendaient de l’Experiment custom `pinInbox`. Ils ne sont pas repris tels quels. Leurs objectifs sont remplacés par un Dashboard/Planning local construit sur les APIs publiques.

La migration automatique de la base SQLite 1.x n’est pas possible depuis une WebExtension pure. La branche d’archive conserve la dernière version historique complète.

Le mode « attente de réponse » est manuel dans cette première candidate : MailPin n’invente pas une détection automatique fragile sans primitive publique fiable.

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
- un simple épinglage ne change jamais l’état lu/non-lu.

La release publique finale 2.0.0 reste bloquée jusqu’au smoke réel du propriétaire sur Thunderbird.
