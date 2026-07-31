# Architecture

## Vue d’ensemble

```text
WebExtension non privilégiée
  background.js ── menus, commandes, onglets, dashboard
       │
       │ API structurée définie par schema.json
       ▼
Experiment privilégié pinInbox
  implementation.js ── orchestration, cycle de vie et intégration about:3pane
       ├── modules/identity.js       résolution et conversations
       ├── modules/storage.js        diff, checksum et sauvegardes
       ├── modules/workflow.js       statuts, sections et récurrences
       ├── modules/rules.js          validation et anti-boucle
       ├── modules/calendar.js       métadonnées Agenda
       ├── modules/bulk.js           validation des actions groupées
       ├── modules/diagnostics.js    journal borné et expurgation
       ├── modules/health.js         score et anomalies locales
       ├── modules/localization.js   chaînes de l’interface injectée
       ├── modules/migrations.js     analyse, conflits et fusion sûre
       ├── modules/performance.js    signatures de rendu
       ├── modules/providers.js      matrice comptes/calendriers
       └── modules/smart.js          vues intelligentes
```

## Frontières de confiance

- Les pages `options/` et `dashboard/` sont des pages d’extension non privilégiées.
- `background.js` expose les points d’entrée publics et ouvre le dashboard avec `tabs.create`.
- L’Experiment manipule l’interface interne, les en-têtes de messages, SQLite et l’Agenda.
- Les paramètres et retours traversant l’API sont normalisés et doivent rester clonables.
- Les imports sont analysés avant écriture, les clés dangereuses sont rejetées et une restauration crée une sauvegarde de sécurité.

## Panneau `about:3pane`

`_setupAbout3Pane()` injecte :

- l’interrupteur du panneau ;
- la section Épinglés et ses vues intelligentes ;
- l’en-tête « Tous les messages » ;
- les boutons de punaise des lignes natives ;
- les cartes, actions rapides, sélection multiple et actions groupées ;
- un `menupopup` Thunderbird natif ;
- l’éditeur de métadonnées et l’indicateur de santé discret.

Le rendu utilise une signature de liste et un cache de cartes par `stableKey`. Au-delà du seuil configuré, seule une première tranche est montée puis l’utilisateur peut charger la suite. Le clic sur une carte utilise le volet de lecture et ne doit pas faire défiler la liste native.

## Tableau de bord et paramètres

Le dashboard regroupe liste, vues intelligentes, Kanban, affaires, historique, actions groupées, matrice fournisseurs et centre de santé. Les paramètres utilisent une navigation groupée, une recherche, des aides sous chaque contrôle et des notifications fixes mais non bloquantes.

Le bouton injecté émet `pinInbox.onDashboardRequested`; le background ouvre la page d’extension avec `messenger.tabs.create`, afin de conserver le bon principal de sécurité.

## Stockage et migrations

- base : `pin-mails-v2.sqlite` ;
- schéma logique actuel : 6 ;
- écritures incrémentales sérialisées ;
- WAL, transactions, révision globale et horodatage par entité ;
- fichier atomique de récupération ;
- sauvegardes JSON avec checksum local ;
- analyse d’import, aperçu des conflits, fusion par horodatage et remplacement protégé ;
- sauvegarde obligatoire avant migration et restauration ;
- préférence de secours limitée.

Le nom historique de la base est conservé pour la migration.

## Diagnostic et confidentialité

Le diagnostic est désactivable, borné entre 50 et 500 entrées et filtré par niveau. L’export ne doit contenir ni corps de message, ni pièce jointe, ni adresse brute, ni chemin local sensible. Les données ne quittent pas le poste.

## Événements

- observateur de données inter-fenêtres via `Services.obs` ;
- notifications de dossiers pour ajout, suppression, déplacement/copie et changement de clé IMAP ;
- détection des messages sortants et réponses entrantes pour le suivi sans réponse ;
- observateurs Agenda lorsque la synchronisation bidirectionnelle est activée ;
- nettoyage systématique des observateurs, popups, timers et nœuds à la fermeture.
