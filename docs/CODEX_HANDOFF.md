# Passage de relais Codex

## État exact

Produit : **MailPerch — Email Pins & Follow-up**. Build locale : **3.1.5**, ID de développement `pin-mails@MailPerch.local`.

La branche distante `main` utilisée comme base est en **3.1.4** au commit `99bf0da7570ae123c5bf2355af933f40133f1584`. La correction 3.1.5 remplace l’ancien menu HTML des cartes par un menu XUL natif et n’est pas publiée automatiquement.

## Correctif 3.1.5

- menu d’actions construit avec `menupopup`, `menuitem` et `menuseparator` dans le `popupset` Thunderbird ;
- bouton « Plus d’actions » ouvert avec `openPopup` sur son ancre ;
- clic droit ouvert avec `openPopupAtScreen` aux coordonnées du pointeur ;
- capture précoce sur `about:3pane` et solution de secours sur la liste des cartes ;
- commandes traitées par l’événement XUL `command` et état nettoyé par `popuphidden` ;
- glisser-déposer temporairement neutralisé pendant l’utilisation d’un bouton ;
- ancien overlay HTML, positionnement manuel et CSS associés supprimés ;
- test de régression dédié dans `tests/test_native_card_menu.py`.

## Audit et correctifs 3.1.4 conservés

- validation Agenda de la lecture seule, de l’état désactivé, des ACL et des capacités tâches/événements ;
- choix du calendrier cible dans le panneau, l’éditeur et le dashboard ;
- recherche et navigation par sections dans les paramètres ;
- feedback local près de l’action, toast fixe dans le viewport et barre persistante Enregistrer/Annuler ;
- protections d’intégrité des imports, références, priorités, écritures et chargements concurrents.

## Ce qui doit encore être validé dans Thunderbird

1. Clic droit sur auteur, objet, espace vide et punaise de chaque carte.
2. Bouton « Plus », actions rapides et désépinglage, à la souris et au clavier.
3. Création d’une tâche et d’un événement dans chacun des calendriers compatibles.
4. Refus explicite d’un calendrier désactivé, en lecture seule, sans ACL ou sans capacité adaptée.
5. Choix du calendrier dans le panneau, l’éditeur et le dashboard.
6. Paramètres en haut et en bas de page : aide, recherche, navigation, état modifié, Enregistrer et Annuler.
7. Deux fenêtres ouvertes, compteurs natifs inchangés, stockage et migration conservés.
8. Archivage/suppression uniquement après notification Thunderbird.

## Commande obligatoire

```bash
npm run ci
```

Pour le test graphique, suivre `docs/MANUAL_TEST_PLAN.md` et consigner la version Thunderbird, le système, le type de compte, la vue, le thème et le résultat.

## Invariants

- aucun réseau, CDN, télémétrie ou publicité ;
- aucun stockage du corps des messages ou des pièces jointes ;
- aucune modification des compteurs natifs lu/non lu/nouveau ;
- conservation de l’ID `pin-mails@MailPerch.local`, du stockage SQLite, des migrations et de la sécurité multi-fenêtre ;
- pas de `innerHTML`, `eval` ou `new Function` ;
- nettoyage des écouteurs et nœuds à l’arrêt.
