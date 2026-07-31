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

- conserver la hauteur virtuelle native de Thunderbird ;
- placer étoile, punaise et bouton « Plus » sur un rail horizontal centré verticalement ;
- utiliser des cibles de 24×24 px en densité normale et 28×28 px en densité tactile ;
- garantir une marge supérieure et inférieure identique ;
- réserver l’espace du rail sans chevaucher auteur, date, objet, étiquettes ou pièces jointes ;
- les réglages `uiPreset` et `density` ne modifient jamais la géométrie native.

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
- modes Guidé/Avancé et espacement Compact/Équilibré/Très aéré limité à cette page ;
- aide sous chaque contrôle et bouton, sans placer aide et libellé côte à côte ;
- un seul dock Enregistrer/Annuler, visible uniquement lorsqu’une modification existe ;
- toast fixe non invasif, avec fermeture en haut à droite ;
- comptes, groupes et calendriers présentés sans duplication ni jargon technique inutile.

## Dashboard

- thèmes clair/sombre/contraste élevé et réduction de mouvement ;
- liste, vues intelligentes, Kanban, affaires, historique et centre de santé ;
- sélection multiple et options contextuelles pour les actions groupées ;
- diagnostic exportable, matrice fournisseurs et réparations sûres ;
- état de chargement, erreurs réessayables et mise en page utilisable à largeur réduite.


## Sécurité de l’interface

- aucun état `admin`, rôle caché ou permission simulée dans le DOM ;
- désactiver Enregistrer/Annuler tant que la configuration n’est pas chargée ou qu’une écriture est en cours ;
- une modification du DOM ne doit jamais définir un chemin local : le dossier de sauvegarde passe par le sélecteur natif ;
- les imports affichent un aperçu et sont restaurés en mode sûr, automatismes désactivés ;
- les confirmations UX complètent les contrôles privilégiés mais ne constituent jamais la seule barrière de sécurité ;
- après désinstallation/réinstallation, l’interface doit repartir sur les valeurs recommandées sans données résiduelles.


## Étoile native et punaise

- en mode indépendant : conserver l’étoile Thunderbird intacte et ajouter uniquement la punaise MailPerch ;
- en mode `nativeStar` : transformer un seul contrôle canonique, masquer uniquement ses doublons et restaurer exactement l’état natif en quittant ce mode ;
- ne jamais positionner un contrôle marqué `data-pin-mails-native-star` si la racine ne porte pas `pin-mails-native-star`.

## Barre Enregistrer/Annuler

- un seul groupe d’actions globales ;
- boutons associés au formulaire par l’attribut `form` ;
- Enregistrer = `submit`, Annuler = `reset` intercepté pour recharger les valeurs persistées ;
- état occupé et erreurs affichés sans bloquer le reste de la lecture.
