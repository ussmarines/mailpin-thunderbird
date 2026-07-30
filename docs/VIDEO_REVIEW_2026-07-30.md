# Revue de la vidéo d’utilisation — 30 juillet 2026

## Source et méthode

La vidéo de 3 min 18 s a été examinée sur toute sa durée et par images clés. Les corrections ci-dessous correspondent à des comportements visibles ou à leur cause directement vérifiée dans le code. Les éléments non reproductibles sans une session Thunderbird graphique restent explicitement dans le plan de validation manuel.

## Défauts observés et causes vérifiées

### 1. Dashboard bloqué par le contrat API

Erreur visible :

```text
Type error for parameter options (Unexpected properties: filter, search, view)
for pinInbox.getDashboardData.
```

Cause : les paramètres objets du schéma Experiment étaient déclarés comme objets vides. Thunderbird rejetait donc les propriétés réellement envoyées par le dashboard.

Correction : types nommés et propriétés explicites dans `schema.json`, avec une garde automatique interdisant tout nouvel objet nu.

### 2. Sauvegarde des paramètres bloquée

Erreur visible :

```text
Type error for parameter configuration
(Unexpected properties: cases, groups, rules, settings, templates)
for pinInbox.setConfiguration.
```

Cause identique au dashboard. La correction couvre également l’import, les règles, l’historique, les affaires, les modèles, les workflows et les actions de référence.

### 3. Clic droit inopérant sur une carte

Cause vérifiée : l’écouteur était attaché à la liste, trop tard dans la propagation face au menu contextuel natif de Thunderbird.

Correction : capture du `contextmenu` au niveau du document `about:3pane`, filtrage par `composedPath()`, arrêt immédiat de la propagation et conservation des accès clavier.

### 4. Bordure persistante et actions rapides toujours visibles

Cause vérifiée : un clic normal ajoutait la carte à l’ensemble de sélection multiple. Le même état servait à indiquer le message affiché et une sélection groupée.

Correction : séparation entre :

- `data-active`, message actuellement affiché ;
- `data-selected`, sélection multiple explicite avec `Ctrl`/`Cmd`, `Maj` ou Espace.

Les actions rapides dépendent uniquement du survol ou du focus interne.

### 5. Couleurs des punaises disparues

Cause vérifiée : plusieurs règles calculaient la couleur à travers `light-dark()` et des mélanges avec du blanc. Sur le thème sombre de la vidéo, la punaise devenait blanche au lieu d’utiliser la couleur du compte.

Correction : la forme active utilise directement `--pin-account-color` ou `--pin-row-account-color`. Les mélanges de couleurs restent limités au fond, au contour et à la lueur.

### 6. Survol peu lisible

Correction : zones cliquables stabilisées à 32 px, punaise inactive révélée au survol de la ligne, retour plus fort au survol direct, lueur et agrandissement limités à la forme centrale.

### 7. Punaise visuellement décentrée

Cause vérifiée : les coordonnées du dessin SVG plaçaient son centre optique légèrement sous le centre géométrique du bouton.

Correction : translation verticale interne de `-0,375 px` dans les SVG Regular et Filled. Le positionnement CSS reste centré à 50 % afin d’éviter des corrections différentes selon les vues.

### 8. Dialogue natif pour les groupes

Le `prompt()` natif ne suit ni le thème, ni l’accessibilité, ni les contrôles de l’extension.

Correction : dialogues intégrés pour créer un groupe et classer une sélection, avec validation, couleur, annulation et focus initial.

### 9. Faux message d’indisponibilité du dashboard

Cause vérifiée : un clic pouvait arriver avant l’enregistrement de l’écouteur du background.

Correction : mise en attente d’une demande unique, livraison lors de l’enregistrement de l’écouteur, délai d’erreur de 2,5 s et nettoyage à l’arrêt.

## Validation automatisée ajoutée

- contrat des objets de l’API Experiment ;
- capture du clic droit au niveau document ;
- séparation actif/sélection multiple ;
- couleurs de compte ;
- retours de survol ;
- absence de `prompt()` ;
- centrage partagé par masques CSS et SVG ;
- tests statiques, modèles, SQLite, sécurité et build reproductible existants.

## Validation graphique restant obligatoire

Le code n’a pas été exécuté dans une session Thunderbird Windows dans l’environnement de génération. Après installation de la 3.1.1, suivre en priorité la section « Régressions vidéo » de `MANUAL_TEST_PLAN.md`.
