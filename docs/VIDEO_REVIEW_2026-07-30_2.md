# Analyse de la seconde vidéo — 30 juillet 2026

## Périmètre

Analyse de l’enregistrement utilisateur montrant les paramètres, le panneau des épingles, les actions de cartes et le tableau de bord sous Thunderbird Windows en thème sombre.

## Constats vérifiés

### Paramètres

1. Le retour d’une action était rendu dans l’en-tête de la page. Après un défilement important, il se trouvait hors du viewport.
2. Les opérations longues ne désactivaient pas toutes le bouton déclencheur et n’affichaient pas systématiquement un état de chargement.
3. Une opération de maintenance rechargeait toute la configuration et pouvait écraser des valeurs saisies mais non enregistrées.
4. L’activation d’une fonction ne précisait pas où elle devenait accessible dans le panneau.

### Cartes épinglées

1. Les actions rapides étaient masquées uniquement par opacité. Leur surface restait interactive et pouvait intercepter un clic destiné à la carte.
2. Le clic droit dépendait d’un seul événement `contextmenu`, soumis aux gestionnaires natifs de Thunderbird.
3. Certaines actions utilisaient des chemins distincts, avec peu ou pas de retour visible.
4. Le bouton de punaise héritait de règles générales déclarées plus tard, ce qui écrasait sa couleur, son fond et une partie de son centrage.
5. L’accès aux fonctions secondaires dépendait du survol, donc elles pouvaient sembler absentes.

### Dashboard

1. Les actions rechargeaient les données sans confirmation explicite de leur résultat.
2. Les boutons ne signalaient pas clairement l’état occupé.
3. Les erreurs et succès étaient affichés dans une zone statique facile à manquer.

## Corrections structurelles

- toast fixe au bas de la fenêtre pour les paramètres et le dashboard ;
- bandeau fixe des modifications non enregistrées ;
- conservation des saisies pendant les opérations de maintenance ;
- guide visible « Où retrouver les fonctions » ;
- délégation d’événements fondée sur `composedPath()` ;
- capture du clic droit sur la fenêtre `about:3pane` et solution de secours au `pointerdown` droit ;
- gestionnaire unique `runCardAction` pour les boutons et le menu ;
- bouton « Plus » toujours visible ;
- actions rapides réellement non interactives lorsqu’elles sont masquées ;
- règles CSS de punaise à spécificité suffisante, couleur de compte et hitbox fixe ;
- retours succès/erreur/chargement pour les actions du dashboard et du Kanban ;
- gardes de régression automatisées.

## Limite de validation

Les causes ont été confirmées dans le code et les contrôles automatisés couvrent les invariants. Une validation graphique dans une session Thunderbird Windows reste nécessaire pour confirmer l’intégration avec les événements internes de la version installée.
