# MailPin 2.1.0 — native feature parity candidate

Cette candidate vise à récupérer le maximum de valeur fonctionnelle de MailPin 1.7.6 sans aucune Experiment API.

## Nouveaux parcours à tester

- épingler/désépingler un message depuis Thunderbird et vérifier l’apparition/disparition des tags visuels MailPin dans la liste ;
- vérifier que les tags personnels Thunderbird restent inchangés ;
- ouvrir un message et vérifier le badge/libellé/icône dynamique du bouton MailPin ;
- vérifier le compteur de suivis actifs sur le bouton global MailPin ;
- clic droit sur une sélection : vérifier que le libellé bascule entre Épingler et Désépingler ;
- créer puis rappeler une vue enregistrée depuis le Dashboard ;
- créer un modèle dans Outils puis l’appliquer à plusieurs suivis ;
- créer un dossier/case puis y ajouter plusieurs suivis ;
- créer une règle locale et l’appliquer à une sélection ;
- reporter une sélection d’une heure puis d’un jour ;
- lancer le diagnostic ;
- importer des messages étoilés (permission accountsRead demandée uniquement à ce moment) ;
- supprimer des références cassées si le diagnostic en trouve ;
- redémarrer Thunderbird et vérifier la persistance de toutes les données.

## Invariants obligatoires

- aucun `experiment_apis` ;
- aucun DOM `about:3pane` ;
- aucun réseau runtime ;
- aucun changement lu/non-lu lors d’un épinglage ;
- aucun corps de message ni pièce jointe stocké ;
- aucun tag personnel renommé, adopté ou supprimé ;
- la publication ATN reste NO-GO avant validation propriétaire.
