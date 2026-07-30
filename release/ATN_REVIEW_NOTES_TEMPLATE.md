# Notes pour les reviewers ATN — modèle

## Fonction principale

Ajouter un panneau local de messages épinglés au-dessus de la liste native, avec workflows, rappels et outils facultatifs.

## Permission privilégiée

L’extension contient l’Experiment `pinInbox`, nécessaire pour :

- injecter le panneau dans `about:3pane` ;
- résoudre les messages déplacés à partir des bases locales ;
- utiliser SQLite structuré ;
- écouter les notifications de dossiers ;
- intégrer l’Agenda Thunderbird.

Le reste des points d’entrée utilise les API WebExtension publiques.

## Réseau et données

Aucun appel réseau. Aucun corps de message ou pièce jointe n’est copié. Voir `PRIVACY.md`.

## Build

Voir `release/BUILD_INSTRUCTIONS.md`. Aucune dépendance de build ou d’exécution tierce.

## Scénario de test rapide

1. installer dans un profil de test ;
2. épingler un message depuis la liste ;
3. vérifier qu’il apparaît dans le panneau et reste dans la liste ;
4. cliquer la carte : le message s’affiche sans défilement ;
5. utiliser clic droit sur la carte ;
6. ouvrir le dashboard ;
7. désépingler et confirmer que le compteur non lu n’a pas changé.

## Versions testées

À compléter avant soumission avec versions Thunderbird, systèmes et types de comptes effectivement testés.
