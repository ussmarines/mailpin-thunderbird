# Passage de relais Codex

## État exact

Produit : **MailPerch — Email Pins & Follow-up**. Build : **3.1.2**, ID de développement `pin-mails@MailPerch.local`.

Corrections implémentées à partir des captures :

Corrections dérivées de la seconde vidéo du 30 juillet 2026 :

- feedback des paramètres fixé au bas de la fenêtre avec états succès/erreur/chargement ;
- barre persistante pour les modifications non enregistrées ;
- actions de maintenance sans écrasement des champs en cours de saisie ;
- menu contextuel renforcé au niveau de `about:3pane` et par `pointerdown` droit ;
- actions invisibles neutralisées avec `pointer-events: none` ;
- menu « Plus » toujours visible et gestionnaire d’actions unifié ;
- couleurs, centrage et survol des punaises restaurés ;
- feedback des actions du dashboard et du Kanban ;
- documentation détaillée dans `docs/VIDEO_REVIEW_2026-07-30_2.md`.

Corrections supplémentaires dérivées de la vidéo du 30 juillet 2026 :

- schémas explicites pour tous les objets transmis à l’API Experiment ;
- chargement du dashboard et sauvegarde des paramètres débloqués ;
- clic droit capturé avant le menu natif de Thunderbird ;
- état actif séparé de la sélection multiple ;
- couleurs de compte rétablies pour toutes les punaises ;
- retours de survol restaurés et hitboxes stabilisées ;
- centrage optique des SVG corrigé ;
- dialogues internes pour la création et l’affectation de groupes.

- dashboard ouvert par le background afin que CSS/JS soient chargés comme ressources d’extension ;
- dashboard entièrement stylé avec états d’erreur et de chargement ;
- menu contextuel propre aux cartes, ouvert au clic droit, à `Shift+F10` et à la touche Menu ;
- menu contextuel en position fixe pour éviter le clipping du panneau ;
- fermeture du menu au défilement, redimensionnement, changement de dossier et perte de focus ;
- réduction des actions rapides visibles ;
- icônes explicites dans l’en-tête ;
- nettoyage des marqueurs drag-and-drop pour supprimer le contour pointillé résiduel ;
- conservation des compteurs natifs Thunderbird ;
- rétention des sauvegardes limitée aux fichiers `pin-mails-*.json` ;
- invalidation du cache de démarrage à la désactivation/mise à jour.

## Ce qui doit encore être validé dans Thunderbird

1. Clic droit sur une carte : menu visible, focus clavier, toutes les commandes.
2. Dashboard : CSS sombre, données chargées, boutons et Kanban.
3. Aucun contour pointillé après un drag annulé, sortie de fenêtre ou changement de dossier.
4. Deux fenêtres ouvertes : mise à jour des épingles sans écrasement.
5. Compteurs natifs inchangés après épinglage/désépinglage.
6. Agenda : création, modification, calendrier en lecture seule et suppression.
7. Archivage/suppression : traitement seulement après notification Thunderbird.
8. Mise à niveau depuis 3.0.0 avec conservation de la base.

## Commandes obligatoires

```bash
npm run ci
```

Pour le test graphique, suivre `docs/MANUAL_TEST_PLAN.md` et consigner : version Thunderbird, système, type de compte, vue Tableau/Cartes, thème et résultat.

## Priorités si un problème apparaît

1. perte de données ou modification de compteurs ;
2. action destructive incorrecte ;
3. boucle de règle/Agenda ;
4. erreur ou fuite d’écouteur ;
5. menu/dashboard/drag ;
6. cosmétique.

## Identité de marque

Lire `BRANDING.md`. MailPerch est le nom public canonique. Les identifiants internes `pin-mails-*` sont historiques et restent conservés jusqu’à une migration explicitement testée.

## Interdictions

Ne pas introduire de réseau, dépendance CDN, télémétrie, stockage du corps des messages, `innerHTML`, sélection native forcée ou modification des compteurs de dossiers.
