# Plan de test manuel

Consigner version Thunderbird, OS, thème, vue, type de compte et résultat.

## Installation et migration

- installation propre ;
- mise à niveau 3.1.0 → 3.1.1 ;
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
