# Plan de test manuel

Consigner version Thunderbird, OS, thème, vue, type de compte et résultat.

## Installation et migration

- installation propre ;
- mise à niveau 3.1.2 → 3.1.3 ;
- redémarrage normal et redémarrage forcé ;
- sauvegarde puis restauration.

## Panneau

- 0, 1, 10, 100 et 1 000 épingles ;
- boîte actuelle, compte et tous les comptes ;
- thèmes clair, sombre, contraste élevé ;
- vues cartes et tableau ;
- repli, recherche, tri et groupes.

## Interactions

- clic simple sans défilement natif ;
- double-clic ;
- clic droit et toutes ses commandes ;
- `Shift+F10`, touche Menu, flèches et Échap ;
- sélection multiple ;
- drag réussi et drag annulé ;
- aucune bordure pointillée résiduelle.

## Dashboard

- ouverture depuis l’en-tête, l’action et le menu ;
- CSS/JS chargés ;
- liste, Kanban, affaires, historique ;
- actions unitaires et groupées ;
- erreur simulée et bouton Réessayer.

## Données et compteurs

- compteur non lu/nouveau inchangé après épinglage ;
- message lu et non lu ;
- déplacement, copie, archive, corbeille et restauration ;
- dossier renommé ;
- deux fenêtres simultanées ;
- hors ligne puis reconnexion.

## Agenda, règles et rappels

- calendrier local et CalDAV modifiable ;
- calendrier en lecture seule ;
- création, modification, fin et suppression ;
- règle simulée puis appliquée ;
- limite et anti-boucle ;
- veille, réveil et rappel manqué.

## Validation ciblée 3.1.3

### Cartes épinglées

- clic droit sur auteur, objet, espace vide, bouton d’action et punaise : le menu MailPerch s’ouvre ;
- bouton « Plus » : même menu, positionné dans le viewport ;
- exécuter ouvrir, répondre, lu/non lu, archiver, supprimer, groupe, attente, planifier, terminer, rappel et Agenda ;
- désépingler par la punaise puis par le menu ;
- vérifier le résultat visible et l’absence de double exécution ;
- tester `Shift+F10`, touche Menu, Échap et navigation clavier.

### Agenda

- vérifier la liste des calendriers dans les paramètres, le panneau, l’éditeur et le dashboard ;
- choisir un calendrier local inscriptible, créer une tâche puis un événement ;
- refaire le test avec un calendrier CalDAV inscriptible ;
- vérifier qu’un calendrier en lecture seule, désactivé, sans ACL ou incompatible reste expliqué mais non sélectionnable ;
- modifier l’échéance et le titre d’un élément déjà lié ;
- provoquer une erreur fournisseur et vérifier que le message indique le calendrier et la cause détectée.

### Paramètres

- utiliser la recherche pour retrouver une option et un bouton ;
- parcourir chaque section avec la navigation collante ;
- vérifier une explication sous chaque contrôle et chaque bouton ;
- modifier une option en bas de page : le feedback local et le toast restent visibles ;
- vérifier les états « modifications non enregistrées », Enregistrer et Annuler ;
- lancer une opération de maintenance sans perdre les modifications en cours.

## Régressions vidéo du 30 juillet 2026

- le dashboard charge sans erreur `Unexpected properties` ;
- enregistrer les paramètres ne produit aucune erreur de schéma ;
- clic droit sur chaque zone d’une carte : auteur, objet, espace vide et punaise ;
- clic simple : le message s’affiche sans conserver la bordure de sélection multiple ;
- les actions rapides disparaissent quand la souris quitte la carte ;
- `Ctrl`/`Cmd` et `Maj` conservent leur sélection multiple distincte ;
- couleur de compte visible sur les punaises du panneau et de la liste native ;
- punaise inactive visible au survol de ligne, puis retour renforcé au survol direct ;
- punaise centrée dans son bouton en vue Cartes et Tableau ;
- création et affectation d’un groupe sans dialogue natif du navigateur ;
- ouverture du dashboard juste après le démarrage de Thunderbird, sans faux message d’indisponibilité.

## Régressions de la seconde vidéo du 30 juillet 2026

- faire défiler les paramètres jusqu’en bas, lancer chaque action et vérifier le toast dans le viewport ;
- modifier une option puis lancer Vérifier SQLite : la modification non enregistrée doit rester présente ;
- vérifier le bandeau fixe Enregistrer/Annuler après toute saisie ;
- cliquer sur auteur, objet, espace vide, bouton Plus et punaise : aucune zone morte ;
- clic droit sur chaque zone de la carte : menu MailPerch visible, jamais le menu natif seul ;
- quitter la carte : les actions rapides invisibles ne doivent plus capter les clics ;
- vérifier les couleurs de compte et le centrage des punaises dans les deux thèmes ;
- exécuter chaque action du dashboard : état occupé puis succès ou erreur visible ;
- déplacer une carte Kanban et vérifier le feedback et l’absence de contour résiduel.
