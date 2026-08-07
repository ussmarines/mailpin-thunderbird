# Plan de test manuel MailPerch 1.2.0

Utiliser exclusivement un profil Thunderbird jetable avec des messages synthétiques. Ne jamais tester sur le profil réel.

## Priorité — fonctions 1.2.0

1. **Notes/checklists** : ouvrir une épingle message puis conversation, saisir une note longue raisonnable, ajouter/cocher/décocher/supprimer des sous-tâches, fermer/réouvrir Thunderbird et confirmer la persistance.
2. **Recherche globale** : retrouver une épingle par objet, auteur, note, sous-tâche, groupe, affaire et tag ; confirmer qu’aucun résultat ne dépend du corps du message.
3. **Tags Thunderbird** : activer la synchronisation, vérifier les tags `MailPerch / …`, changer statut/priorité/relance et confirmer la mise à jour. Créer auparavant un tag personnel et confirmer qu’il reste intact. Désactiver ensuite la synchronisation et vérifier que seuls les tags MailPerch possédés sont retirés.
4. **Agenda bidirectionnel** : créer une tâche puis un événement dans un calendrier explicitement choisi ; modifier échéance/état dans MailPerch puis dans Agenda et confirmer les deux sens. Refaire au minimum avec un calendrier local et chaque fournisseur réellement annoncé.
5. **Palette de commandes** : ouvrir depuis le bouton du dashboard, `Ctrl/Cmd+K` dans le dashboard et le raccourci Thunderbird configuré ; tester navigation clavier, Entrée et Échap.
6. **Vues enregistrées** : enregistrer une vue combinant recherche, vue intelligente, groupe/affaire, priorité, état de réponse ou checklist ; recharger Thunderbird, appliquer puis supprimer la vue.
7. **J’attends / Je dois répondre** : envoyer/répondre avec messages synthétiques contrôlés et confirmer que l’indicateur suit l’ordre réel des derniers messages entrants/sortants.
8. **Statistiques** : contrôler manuellement les compteurs de réponses, sous-tâches, éléments terminés sur 7 jours et âges moyens sur un jeu de données connu.
9. **Interface** : Options et dashboard en clair/sombre, largeurs étroites et zoom 100/125/200 % ; aucun texte ne doit être visuellement inférieur à 12 px, chevaucher un bouton ou perdre son alignement.
10. **Migration** : installer 1.1.2 avec des données synthétiques, exporter une sauvegarde, mettre à jour vers 1.2.0 et confirmer pins, notes, groupes, affaires, règles et Agenda avant/après redémarrage.

## Priorité — correctif responsive MP-2026-019

1. Ouvrir une liste comportant plusieurs épingles.
2. Réduire puis agrandir plusieurs fois la largeur du volet des messages autour du seuil responsive.
3. Vérifier qu’aucun grand bloc vide n’apparaît entre les outils et les cartes.
4. Sans rappel actif, vérifier l’absence totale de bande orange.
5. Créer un rappel arrivé à échéance : le centre orange doit apparaître avec son contenu et ses actions.
6. Acquitter ou reporter le rappel : le centre doit disparaître lorsqu’il redevient vide.
7. Répéter en thèmes clair/sombre et zoom 100 %, 125 % et 200 %.
8. Vérifier la navigation clavier et le focus visible du champ de recherche et du sélecteur de vue.

## Fonctions principales

- épingler/désépingler depuis la ligne, le menu contextuel et le message affiché ;
- clic, double-clic, clic droit, `Shift+F10` et bouton Plus d’actions ;
- suivi sans réponse, veille/réveil, Aujourd’hui, Revue et actions groupées ;
- création et sélection explicite d’une tâche ou d’un événement Agenda ;
- paramètres : chargement, Enregistrer, Annuler, recherche et notifications visibles ;
- dashboard : vues, Kanban, rappels et états vides ;
- sauvegarde, aperçu d’import, restauration sûre et diagnostic expurgé ;
- désinstallation puis réinstallation propre dans le profil jetable.

## Invariants

- l’épinglage ne change pas l’état lu/non lu ni les compteurs ;
- une seule étoile native et une seule punaise MailPerch sont visibles ;
- aucune action destructive n’est exécutée sans confirmation attendue ;
- aucune donnée ne quitte le poste ;
- le XPI testé correspond au SHA-256 publié.

Consigner la version Thunderbird, le système, le type de compte, le thème et le résultat dans le rapport de validation avant une soumission ATN.
