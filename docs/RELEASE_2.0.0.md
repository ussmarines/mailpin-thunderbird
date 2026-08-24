# MailPin 2.0.0 — candidate de reconstruction

MailPin 2.0.0 est la première candidate de l’architecture WebExtension-native.

## Objectif

Conserver la valeur fonctionnelle de MailPin sans aucune Experiment API afin de rester compatible avec la politique ATN et de réduire la dépendance aux composants internes de Thunderbird.

## À tester par le propriétaire

- installation du XPI ;
- épinglage/désépinglage depuis la liste et un message affiché ;
- captures Aujourd’hui, Demain, En attente et Attente de réponse ;
- persistance après fermeture/redémarrage de Thunderbird ;
- navigation Dashboard, recherche, tris et vues ;
- notes, checklist, statut, priorité, projet, labels, tags et échéance ;
- notification de rappel ;
- ouverture, réponse, réponse à tous, archivage et corbeille ;
- import/export JSON 2.x ;
- vérification qu’un épinglage simple ne change jamais lu/non-lu.

## Ruptures connues par rapport à 1.7.6

- aucun panneau injecté dans `about:3pane` ;
- aucune base SQLite privilégiée ;
- aucun accès Agenda Thunderbird privilégié : Planning MailPin interne à la place ;
- aucune migration automatique des données SQLite 1.x ;
- suivi « attente de réponse » manuel dans cette première candidate (pas de détection automatique fragile).

La release publique finale 2.0.0 ne doit être publiée qu’après le smoke réel du propriétaire.
