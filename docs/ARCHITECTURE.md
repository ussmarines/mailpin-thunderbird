# Architecture

## Vue d’ensemble

```text
WebExtension non privilégiée
  background.js ── menus, commandes, onglets, dashboard
       │
       │ API structurée définie par schema.json
       ▼
Experiment privilégié pinInbox
  implementation.js ── orchestration et intégration about:3pane
       ├── modules/identity.js   résolution et conversations
       ├── modules/storage.js    diff, checksum et sauvegardes
       ├── modules/workflow.js   statuts, sections et récurrences
       ├── modules/rules.js      validation et anti-boucle
       └── modules/calendar.js   métadonnées Agenda
```

## Frontières de confiance

- Les pages `options/` et `dashboard/` sont des pages d’extension non privilégiées.
- `background.js` expose les points d’entrée publics et ouvre le dashboard avec `tabs.create`.
- L’Experiment manipule l’interface interne, les en-têtes de messages, SQLite et l’Agenda.
- Les paramètres et retours traversant l’API doivent être des données clonables et normalisées.

## Panneau about:3pane

`_setupAbout3Pane()` injecte :

- l’interrupteur du panneau ;
- la section Épinglés ;
- l’en-tête « Tous les messages » ;
- les épingles dans les lignes natives ;
- le menu contextuel fixé au viewport ;
- l’éditeur de métadonnées.

Le clic sur une carte utilise le volet de lecture. Il ne sélectionne pas la ligne native et ne doit donc pas faire défiler la liste.

## Tableau de bord

Le bouton injecté ne tente pas d’ouvrir directement un `contentTab`. Il émet `pinInbox.onDashboardRequested`; le background ouvre la page d’extension avec `messenger.tabs.create`. Cette séparation garantit le bon principal de sécurité pour le CSS et le JavaScript du dashboard.

## Stockage

- base : `pin-mails-v2.sqlite` ;
- schéma actuel : 5 ;
- écritures incrémentales sérialisées ;
- WAL, transactions, révision globale et horodatage par entité ;
- fichier atomique de récupération ;
- sauvegardes JSON signées par checksum local ;
- préférence de secours limitée.

Le nom historique de la base est conservé pour la migration.

## Événements

- observateur de données inter-fenêtres via `Services.obs` ;
- notifications de dossiers pour ajout, suppression, déplacement/copie et changement de clé IMAP ;
- observateurs Agenda lorsque la synchronisation bidirectionnelle est activée ;
- nettoyage systématique à la fermeture.
