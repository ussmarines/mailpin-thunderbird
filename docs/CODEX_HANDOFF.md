# Passage de relais Codex

## État exact

Produit : **MailPerch — Email Pins & Follow-up**. Build locale : **3.1.4**, ID de développement `pin-mails@MailPerch.local`.

La branche distante `main` est en **3.1.3** au commit `bd562373a3dab54958102e2186611ebbe0e0623d`. L’audit 3.1.4 est effectué localement depuis cette base propre et n’est pas publié automatiquement.

## Audit et correctifs 3.1.4

- répartiteur partagé pour le clic droit, le bouton « Plus », les actions rapides et le désépinglage ;
- aucune dépendance à `CSS.escape` dans la fenêtre privilégiée ;
- écouteurs capturés sur `about:3pane` et retirés symétriquement au nettoyage ;
- validation Agenda de la lecture seule, de l’état désactivé, des ACL et des capacités tâches/événements ;
- choix du calendrier cible dans le panneau, l’éditeur et le dashboard ;
- erreurs Agenda contextualisées au lieu du seul code `MODIFICATION_FAILED` ;
- recherche et navigation par sections dans les paramètres ;
- descriptions visibles sous les contrôles et boutons ;
- feedback local près de l’action, toast fixe dans le viewport et barre persistante Enregistrer/Annuler.

Le détail de la troisième passe vidéo est consigné dans `docs/VIDEO_REVIEW_2026-07-30_3.md`.

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
