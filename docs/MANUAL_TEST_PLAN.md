# Plan de test manuel MailPerch 1.1.2

Utiliser exclusivement un profil Thunderbird jetable avec des messages synthétiques. Ne jamais tester sur le profil réel.

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
