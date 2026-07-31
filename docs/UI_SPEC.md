# Spécification d’interface

## Principes UX

- présenter d’abord les actions et informations utiles ;
- regrouper les réglages par besoin utilisateur plutôt que par détail technique ;
- réserver les options avancées aux groupes repliables ;
- laisser de l’espace entre les blocs, avec une hiérarchie typographique nette ;
- afficher le résultat près de l’action et dans un toast non bloquant ;
- conserver le clavier, le zoom 200 %, les thèmes sombre/clair et le contraste élevé.

## Panneau

- placé au-dessus de la liste native et repliable ;
- hauteur limitée avec défilement interne ;
- portée, tri, recherche et vue intelligente explicites ;
- cache de cartes et chargement progressif au-delà du seuil configuré ;
- sélection multiple et barre d’actions groupées seulement lorsqu’elle est utile ;
- indicateur de santé discret uniquement en cas d’attention ;
- aucune modification du badge de dossier natif.

## Liste générale

- la ligne Cartes qui contient la punaise dispose d’une hauteur minimale confortable ;
- la cible de la punaise mesure 36×36 px, est centrée verticalement et éloignée du bord supérieur ;
- l’espace réservé ne doit jamais chevaucher l’objet, l’auteur ou les autres boutons Thunderbird.

## Cartes

- liseré de couleur du compte ;
- expéditeur, date, objet et métadonnées lisibles ;
- punaise pleine colorée ;
- actions rapides limitées et menu complet via clic droit ou bouton « Plus d’actions » ;
- clic simple : affichage à droite sans défilement natif ;
- double-clic : ouverture native ;
- focus visible, roving `tabindex`, flèches, Home/End, PageUp/PageDown, Entrée, Espace, Shift+F10 et Échap.

## Menu contextuel

- `menupopup` Thunderbird natif dans le `popupset` de la fenêtre ;
- ancré sous le bouton ou ouvert aux coordonnées écran du clic droit ;
- focus restauré au déclencheur après fermeture ;
- confirmation avant action destructive selon les paramètres.

## Paramètres

- en-tête et résumé immédiat ;
- barre latérale groupée : Essentiel, Suivi, Organisation, Intégrations, Maintenance et Accès rapide ;
- recherche filtrant sections et navigation ;
- section active signalée par `aria-current` ;
- modes Guidé/Avancé et Compact/Équilibré/Très aéré ;
- aide sous chaque contrôle et bouton ;
- dock Enregistrer/Annuler et toast fixe mais non invasif.

## Dashboard

- thèmes clair/sombre/contraste élevé et réduction de mouvement ;
- liste, vues intelligentes, Kanban, affaires, historique et centre de santé ;
- sélection multiple et options contextuelles pour les actions groupées ;
- diagnostic exportable, matrice fournisseurs et réparations sûres ;
- état de chargement, erreurs réessayables et mise en page utilisable à largeur réduite.
