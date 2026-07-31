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

## Barrière de sécurité de l’API Experiment

L’API `pinInbox` est une frontière privilégiée et ne fait jamais confiance aux objets provenant des pages Options ou Dashboard. Le schéma borne les collections et les chaînes ; l’implémentation applique en plus une validation récursive, refuse les clés de pollution de prototype, limite profondeur/taille/nombre de nœuds et normalise chaque action avant tout accès à Thunderbird, SQLite, Agenda ou au système de fichiers.

Il n’existe aucun rôle administrateur dans le produit. Les pages d’extension peuvent demander uniquement les opérations exposées par `schema.json`. Les chemins de sauvegarde sont modifiés exclusivement par le sélecteur natif privilégié ; `setConfiguration` conserve toujours le chemin déjà validé.

Les imports sont des données non fiables : les automatismes, règles actives, liens Agenda et chemins locaux sont neutralisés avant persistance. Le diagnostic remplace les identités de comptes et calendriers par des libellés anonymes.

## Désinstallation

Les API Experiment ne peuvent pas déclarer le cycle statique `uninstall` dans leur manifeste. Pendant que l’extension est chargée, MailPerch utilise donc deux signaux du cœur Gecko : AddonManager `onUninstalling` positionne immédiatement l’état de désinstallation avant `onShutdown`, et `onOperationCancelled` le réinitialise si l’utilisateur annule ; l’événement WebExtension `Management.uninstall`, dont la promesse est attendue par Gecko, attend la fermeture SQLite puis supprime la base, les fichiers WAL/SHM/journal, la récupération d’urgence, les sauvegardes internes et toutes les préférences `extensions.pinMails.*`. Lors d’une mise à jour, l’ancien écouteur se retire sans purger les données. Dans un dossier externe choisi par l’utilisateur, seules les enveloppes MailPerch au checksum vérifiable peuvent être supprimées ; le dossier et les autres fichiers sont conservés.

Avant toute lecture de préférences ou ouverture de SQLite, l’Experiment vérifie aussi une sentinelle primitive dans `ExtensionStorage`, la zone locale native de l’extension. Gecko efface cette zone lors d’une désinstallation normale. Si la sentinelle manque, MailPerch distingue la migration initiale depuis une version antérieure à 3.2.4 d’une installation nouvelle ; hors migration, il purge les éventuels résidus puis écrit une nouvelle sentinelle. Cette seconde barrière garantit un redémarrage propre à la réinstallation même si l’Experiment n’était pas chargé au moment d’une désinstallation antérieure.

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

## Isolation des préférences visuelles

- `uiPreset` est appliqué uniquement à `options/options.html` via `body[data-ui-preset]`.
- `density` est appliqué uniquement au panneau d’épingles via `pin-mails-density`.
- aucune préférence MailPerch ne doit modifier la hauteur virtuelle `ThreadCard` de Thunderbird ;
- étoile, punaise et menu sont positionnés dans un rail d’actions centré sans changer le modèle de données natif.

La mémoire d’architecture synthétique et la carte des fichiers sont dans
[`../PROJECT_MEMORY.md`](../PROJECT_MEMORY.md).
