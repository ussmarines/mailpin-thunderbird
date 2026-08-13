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
       │
       ├── logique métier / modules purs
       │     ├── identity.js / related.js
       │     ├── workflow.js / rules.js / review.js
       │     ├── checklists.js / saved-views.js / analytics.js
       │     ├── storage.js / migrations.js
       │     └── smart.js / bulk.js / health.js / diagnostics.js / providers.js
       │
       ▼
  modules/compatibility.js ── façade de compatibilité
       ├── thunderbird-messages.js ── MailServices / MailUtils / MessageArchiver
       ├── thunderbird-tags.js     ── MailServices.tags / mots-clés dossier
       └── thunderbird-calendar.js ── cal / CalEvent / CalTodo / ACL / observateurs
                                      │
                                      ▼
                            API internes Thunderbird
```

La dépendance descend dans un seul sens : le métier appelle la façade ; les adaptateurs connaissent Thunderbird. Une nouvelle logique métier ne doit pas contourner cette frontière. Les contrats détaillés sont décrits dans [`THUNDERBIRD_COMPATIBILITY.md`](THUNDERBIRD_COMPATIBILITY.md).

`implementation.js` reste volontairement l’orchestrateur du DOM `about:3pane`. Cette zone n’est pas déplacée en bloc pendant la consolidation afin de ne pas mélanger découpage des services et réécriture de la structure native.

## Frontières de confiance

- Les pages `options/` et `dashboard/` sont des pages d’extension non privilégiées.
- `background.js` expose les points d’entrée publics, les menus de capture rapide et ouvre le dashboard avec `tabs.create`.
- L’Experiment manipule l’interface interne, les en-têtes de messages, SQLite et l’Agenda.
- Les paramètres et retours traversant l’API sont normalisés et doivent rester clonables.
- Les imports sont analysés avant écriture, les clés dangereuses sont rejetées et une restauration crée une sauvegarde de sécurité.

## Barrière de sécurité de l’API Experiment

L’API `pinInbox` est une frontière privilégiée et ne fait jamais confiance aux objets provenant des pages Options ou Dashboard. Le schéma borne les collections et les chaînes ; l’implémentation applique en plus une validation récursive, refuse les clés de pollution de prototype, limite profondeur, taille et nombre de nœuds, puis normalise chaque action avant tout accès à Thunderbird, SQLite, Agenda ou au système de fichiers.

Il n’existe aucun rôle administrateur dans le produit. Les pages d’extension peuvent demander uniquement les opérations exposées par `schema.json`. Les chemins de sauvegarde sont modifiés exclusivement par le sélecteur natif privilégié ; `setConfiguration` conserve toujours le chemin déjà validé.

Les imports sont des données non fiables : les automatismes, règles actives, liens Agenda et chemins locaux sont neutralisés avant persistance. Le diagnostic remplace les identités de comptes et calendriers par des libellés anonymes.

Les nouvelles opérations de productivité restent fermées et bornées : 500 références au maximum pour une action groupée, 50 pour une fusion. Une fusion exige une identité forte commune fournie par Thunderbird ou Gmail ; une ressemblance d’objet ne suffit jamais. L’interface demande une confirmation et l’Experiment refuse les conflits Agenda non résolus.

## Désinstallation

Les API Experiment ne peuvent pas déclarer le cycle statique `uninstall` dans leur manifeste. Pendant que l’extension est chargée, MailPin utilise donc deux signaux du cœur Gecko : AddonManager `onUninstalling` positionne immédiatement l’état de désinstallation avant `onShutdown`, et `onOperationCancelled` le réinitialise si l’utilisateur annule ; l’événement WebExtension `Management.uninstall`, dont la promesse est attendue par Gecko, attend la fermeture SQLite puis supprime la base, les fichiers WAL/SHM/journal, la récupération d’urgence, les sauvegardes internes et toutes les préférences `extensions.pinMails.*`. Lors d’une mise à jour, l’ancien écouteur se retire sans purger les données. Dans un dossier externe choisi par l’utilisateur, seules les enveloppes MailPin au checksum vérifiable peuvent être supprimées ; le dossier et les autres fichiers sont conservés.

Avant toute lecture de préférences ou ouverture de SQLite, l’Experiment vérifie aussi une sentinelle primitive dans `ExtensionStorage`, la zone locale native de l’extension. Gecko efface cette zone lors d’une désinstallation normale. Si la sentinelle manque, MailPin distingue la migration initiale depuis une version antérieure à 3.2.4 d’une installation nouvelle ; hors migration, il purge les éventuels résidus puis écrit une nouvelle sentinelle. Cette seconde barrière garantit un redémarrage propre à la réinstallation même si l’Experiment n’était pas chargé au moment d’une désinstallation antérieure.

## Panneau `about:3pane`

`_setupAbout3Pane()` injecte :

- l’interrupteur du panneau ;
- la section Épinglés et ses vues intelligentes, dont la veille ;
- l’en-tête « Tous les messages » ;
- les boutons de punaise des lignes natives ;
- les cartes, actions rapides, sélection multiple et actions groupées ;
- un centre de rappels local et interactif ;
- un `menupopup` Thunderbird natif ;
- l’éditeur de métadonnées et l’indicateur de santé discret.

Le rendu utilise une signature de liste et un cache de cartes par `stableKey`. Au-delà du seuil configuré, seule une première tranche est montée puis l’utilisateur peut charger la suite. Le clic sur une carte utilise le volet de lecture et ne doit pas faire défiler la liste native.

Le centre de rappels ne lance aucune action destructive ni aucun envoi. Il permet uniquement d’ouvrir, terminer, reporter ou acquitter une alerte via les méthodes validées de l’Experiment.

## Tableau de bord et paramètres

Le dashboard s’ouvre sur **Aujourd’hui** et regroupe aussi liste, vues intelligentes, Kanban, affaires, revue quotidienne ou hebdomadaire, historique, actions groupées, rappels interactifs, détection des conversations associées, matrice fournisseurs et centre de santé.

Les vues Aujourd’hui et Revue sont dérivées à la demande depuis les références : échéances, suivis sans réponse, réveils de veille, éléments en attente et inactivité. Elles ne créent pas de copie des messages.

La détection des éléments associés produit uniquement des propositions. La fusion est déclenchée par l’utilisateur, confirmée dans le dashboard, validée à nouveau dans l’Experiment et enregistrée dans la pile d’annulation.

Les paramètres utilisent une navigation groupée, une recherche, des aides sous chaque contrôle, un aperçu des règles avant enregistrement et une zone de statut non bloquante intégrée au flux. La présentation est organisée en **Essentiel**, **Organisation**, **Automatisation** et **Avancé**. Le mode historique `guided` est présenté comme **Recommandé** : il masque les sections techniques avancées sans les supprimer et peut préparer un brouillon de valeurs sûres. Ce brouillon conserve les valeurs propres au profil et exige toujours un clic explicite sur Enregistrer. Le mode `advanced` reste disponible pour exposer tous les contrôles.

Les dix commandes MailPin sont personnalisables avec l’API `commands` de Thunderbird et sont incluses dans les exports de configuration.

Le bouton injecté émet `pinInbox.onDashboardRequested`; le background ouvre la page d’extension avec `messenger.tabs.create`, afin de conserver le bon principal de sécurité.

### Politique de composants UI

MailPin utilise Organic Workspace avec HTML natif, jetons CSS locaux et des shells Dashboard/Options écrits directement dans les sources. Le runtime gère les états sans reconstruire la structure visuelle. Fluent 2 reste un historique de conception et non le langage UI canonique. Le build assemble directement les fichiers suivis sous `extension/` et n’exécute aucun bundler : une dépendance npm non importée ne peut donc pas devenir un composant du XPI. `@fluentui/web-components` 3.0.3 a été évalué puis retiré, notamment parce qu’il exige Node 22/24 alors que la validation du dépôt inclut Node 20. Une future adoption exige simultanément un besoin produit précis, un bundle local déterministe auditable, aucun actif distant et une matrice Node/Thunderbird documentée.

## Stockage et migrations

- base : `pin-mails-v2.sqlite` ;
- schéma logique actuel : paramètres 8 / données 7 ;
- écritures incrémentales sérialisées ;
- WAL, transactions, révision globale et horodatage par entité ;
- fichier atomique de récupération ;
- sauvegardes JSON avec checksum local ;
- analyse d’import, aperçu des conflits, fusion par horodatage et remplacement protégé ;
- sauvegarde obligatoire avant migration et restauration ;
- préférence de secours limitée.

Le nom historique de la base est conservé pour la migration. Les champs 1.1.0 sont optionnels et normalisés avec une valeur sûre, ce qui préserve les données 1.0.0 sans migration destructive.

## Diagnostic et confidentialité

Le diagnostic est désactivable, borné entre 50 et 500 entrées et filtré par niveau. L’export ne doit contenir ni corps de message, ni pièce jointe, ni adresse brute, ni chemin local sensible. Les données ne quittent pas le poste.

Les fonctions 1.1.0 n’ajoutent aucune connexion réseau, dépendance d’exécution distante, télémétrie ou secret. Les résumés de revue et groupes associés sont calculés localement à partir des métadonnées déjà disponibles.

## Événements

- observateur de données inter-fenêtres via `Services.obs` ;
- notifications de dossiers pour ajout, suppression, déplacement/copie et changement de clé IMAP ;
- détection des messages sortants et réponses entrantes pour le suivi sans réponse ;
- minuterie locale de rappels, réveils et récurrences ;
- observateurs Agenda lorsque la synchronisation bidirectionnelle est activée ;
- nettoyage systématique des observateurs, popups, timers et nœuds à la fermeture.


## Validation de l’intégration Thunderbird

La validation est répartie en niveaux : tests statiques/modèles, contrats de compatibilité avec faux services, smoke runtime sur binaire Thunderbird officiel, tests `mach` dans un checkout comm-central et validation manuelle avec comptes/fournisseurs réels. Le détail et la portée de chaque niveau sont dans [`THUNDERBIRD_TEST_BENCH.md`](THUNDERBIRD_TEST_BENCH.md).

Le workflow runtime reste séparé de la QA obligatoire même après sa première exécution réussie sur Thunderbird 153.0.1 ESR : il doit accumuler plusieurs exécutions fiables avant une éventuelle promotion en contrôle requis. Un test de contrat ne doit jamais être présenté comme une validation graphique Thunderbird.

## Isolation des préférences visuelles

- `uiPreset` est appliqué uniquement à `options/options.html` via `body[data-ui-preset]` ;
- `density` est appliqué uniquement au panneau d’épingles via `pin-mails-density` ;
- aucune préférence MailPin ne doit modifier la hauteur virtuelle `ThreadCard` de Thunderbird ;
- étoile, punaise et menu sont positionnés dans un rail d’actions centré sans changer le modèle de données natif.

La mémoire d’architecture synthétique et la carte des fichiers sont dans
[`../PROJECT_MEMORY.md`](../PROJECT_MEMORY.md).

## Productivité 1.2

- Les notes et checklists restent dans le payload JSON de la référence ; aucune table SQLite supplémentaire n’est requise.
- Les vues enregistrées sont persistées dans `state_data` avec le reste de l’état logique et sont limitées à 30 entrées.
- La recherche globale assemble uniquement les métadonnées déjà disponibles (objet, auteur, note, sous-tâches, tags, compte/dossier, groupe, affaire, workflow et état de réponse). Elle n’ouvre ni n’indexe les corps ou pièces jointes.
- `analytics.js` dérive les états **waitingForThem** et **needsReply** à partir des horodatages entrants/sortants et du workflow ; ces états ne sont pas une prédiction IA.
- La synchronisation Thunderbird tags reste derrière `enableThunderbirdTagSync`, désactivé par défaut. Les tags sont créés via l’Experiment sans nouvelle permission WebExtension et ne sont considérés comme possédés que si leur clé et leur libellé correspondent exactement aux définitions MailPin.
- La synchronisation Agenda bidirectionnelle conserve les observateurs et capacités fournisseurs existants ; les changements de statut venant d’Agenda déclenchent aussi la remise en cohérence des tags lorsqu’elle est activée.
