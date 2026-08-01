# Journal des modifications

## 3.2.10 — amorçage Options prouvé dans Thunderbird

- correction de la cause réelle du chargeur permanent : la localisation du libellé de restauration supprimait l’`input#import-file`, puis `options.js` échouait avant `initializeOptions()` ;
- ajout d’un bootstrap autonome chargé avant les dépendances, avec capture des erreurs globales et promesses rejetées, watchdog terminal, étapes expurgées et Réessayer sans écouteurs dupliqués ;
- chargement contrôlé de `settings.js`, import dynamique du module principal et attente bornée de l’espace de noms Experiment avant `getConfiguration()` ;
- matrice Playwright étendue aux scripts absents, import rejeté, exception top-level, API absente/retardée/rejetée/bloquée, normalisation, Agenda et succès complet avec localisation non vide ;
- inspection directe du XPI pour vérifier la page Options, toutes ses dépendances relatives et l’unicité du manifeste ;
- retrait du contexte de menu obsolète `message_display`, refusé par Thunderbird 153, tandis que l’action native de message affiché reste disponible ;
- validation dans Thunderbird 153.0.1 avec profil temporaire sans compte : recommandations, dock, Enregistrer, Annuler, réouverture et persistance après redémarrage.

## 3.2.9 — initialisation des paramètres bornée et récupérable

- contrôleur d’initialisation explicite : les paramètres atteignent toujours le formulaire prêt ou un panneau d’erreur avec Réessayer ;
- délais maximums et diagnostic expurgé pour l’API de configuration, les raccourcis, la santé, les sauvegardes et l’Agenda ;
- chargement Agenda déplacé après l’affichage des paramètres principaux : une absence de compte ou de calendrier conserve une liste vide valide ;
- test Playwright des vrais actifs couvrant une promesse de configuration bloquée, le panneau terminal, Réessayer et un calendrier bloqué.

## 3.2.8 — recommandations partagées, sauvegarde exhaustive et rail structurel

- source unique gelée pour les recommandations, les types et la migration des réglages, consommée par l'Experiment et la page Options ;
- conservation des choix `false` explicites et complétion des configurations absentes, partielles, anciennes ou invalides avant tout rendu ;
- formulaire masqué derrière un état de chargement jusqu'à la normalisation, évitant un affichage transitoire entièrement désactivé ;
- registre exhaustif des contrôles avec lecteurs, écrivains, normalisation, dépendances et participation au brouillon/sauvegarde ;
- instantané canonique indépendant, erreurs de comparaison visibles, sauvegarde comparée à la réponse puis à une relecture API ;
- test Playwright des vrais HTML/JS/CSS : 98 contrôles, pointeur, Enregistrer, Annuler, erreur, configurations anciennes et reconstruction ;
- rail d'actions aligné par grille sur toutes les rangées du DOM ThreadCard Thunderbird 153, sans offset absolu ni déplacement du texte/de la date ;
- test géométrique normal/compact/tactile/zoom 125 %/étoile native avec hit-tests et marge basse minimale ;
- audit fonctionnel et procédure Browser Toolbox consignés dans `docs/FUNCTIONAL_AUDIT_3.2.8.md` et `docs/MANUAL_TEST_PLAN.md`.

## 3.2.7 — rail natif et sauvegarde vérifiée de bout en bout

- alignement de l’étoile native, de la punaise MailPerch et du menu sur un rail vertical commun sans déplacer l’étoile dans le DOM ;
- déplacement de la punaise indépendante dans le conteneur natif `thread-card-icon-info` ;
- liaison des commandes Enregistrer/Annuler en capture avant toute initialisation visuelle ;
- sauvegarde explicite autorisée même sans état `dirty`, valeurs numériques bornées et relecture de confirmation après écriture ;
- `setConfiguration` attend désormais la fin des écritures SQLite avant de confirmer le succès ;
- suppression d’une duplication de groupe dans la normalisation des paramètres.

## 3.2.7 — interaction réelle des paramètres et icônes natives

- retrait des classes génériques Thunderbird du bouton de punaise indépendant afin d’empêcher le dessin d’une icône parasite ;
- l’étoile native reste dans son conteneur Thunderbird en mode indépendant, sans repositionnement CSS par MailPerch ;
- barre Enregistrer/Annuler déplacée à l’intérieur du formulaire et reliée directement par des gestionnaires de clic ;
- conservation des événements `submit`/`reset` comme accès clavier et accessibilité ;
- retours visibles lorsque les paramètres ne sont pas prêts, inchangés ou déjà en cours de traitement ;
- réouverture documentée de MP-2026-004 et MP-2026-005 jusqu’à validation Thunderbird réelle ;
- ajout des gardes de régression `tests/test_regressions_3_2_6.py`.

## 3.2.5 — étoiles natives, validation des paramètres et suivi des bugs

- correction définitive de la duplication des étoiles dans la liste native : les annotations, déplacements et masquages sont désormais limités au mode `nativeStar` ;
- restauration exacte des attributs et du conteneur d’origine du bouton étoile lors d’un changement de mode ou d’un nettoyage de fenêtre ;
- actions Enregistrer et Annuler reliées au formulaire natif par `submit` et `reset`, avec raccourci `Ctrl/Cmd+S` et confirmation explicite du retour API ;
- correction de la CI Windows par des flux Git NUL-délimités en mode binaire, empêchant tout faux chemin `dist/.gitkeep\r` ;
- ajout de `docs/BUG_TRACKER.md`, registre permanent des bugs connus, et de `scripts/check_bug_tracker.py` dans la validation standard ;
- ajout de gardes de régression 3.2.5 pour les étoiles, les paramètres, le bug tracker et l’audit Git multiplateforme.

## 3.2.4 — durcissement sécurité, désinstallation propre et fiabilité
- chaîne CI autonome : suppression des helpers Python téléchargés, actions GitHub épinglées par SHA, checkout sans identifiants persistés et suivi Dependabot ;

- validation bornée de toutes les sauvegardes et des principaux objets traversant l’API Experiment ;
- neutralisation des automatismes, liens Agenda et paramètres dépendants de l’environnement lors d’un import ;
- fermeture du stockage avant la purge et suppression complète des données MailPerch à la désinstallation ;
- sentinelle native effacée par Gecko : une réinstallation purge les résidus avant toute ouverture SQLite, sans effacer les données lors de la migration initiale 3.2.3 → 3.2.4 ;
- profil recommandé rendu conservateur par défaut : workflows automatiques, récurrences, complétion Agenda et nettoyage automatique désactivés ;
- CSP sans réseau, code distant, formulaire externe, framing ou ressource `data:` ;
- conservation du chemin de sauvegarde uniquement via le sélecteur natif Thunderbird ;
- correction des boutons Enregistrer/Annuler et protection contre les doubles enregistrements ;
- garde supplémentaire contre la duplication de l’étoile native ;
- secret scanner renforcé et test de sécurité 3.2.4 dédié ;
- suppression des rapports techniques et journaux CI historiques devenus obsolètes ; consolidation dans la mémoire Codex et les documents durables.


## 3.2.3 — mémoire projet et harmonisation UX

- ajout de `PROJECT_MEMORY.md`, point d’entrée unique pour Codex, et de `docs/PROJECT_STATE.json` ;
- contrôle automatique empêchant la mémoire projet de devenir obsolète ;
- rail étoile, punaise et menu centré verticalement dans les cartes de messages natives ;
- séparation stricte entre l’espacement de la page Paramètres et la densité du panneau principal ;
- densités Compacte, Normale et Confortable rendues lisibles avec des hauteurs minimales sûres ;
- correction du bouton Fermer des notifications, désormais placé en haut à droite ;
- ajout des primitives CSS manquantes qui causaient chevauchements, textes concaténés et blocs désorganisés ;
- réorganisation des toggles, aides de boutons, groupes, comptes, calendriers, sauvegardes et centre de santé ;
- suppression de la duplication visible nom/adresse des comptes ;
- libellés Agenda fondés sur les capacités réelles tâches/événements ;
- suppression du second bouton Enregistrer visible au profit du dock contextuel ;
- audit Git Windows durci contre les retours chariot dans les chemins suivis ;
- nouvelle garde de régression pour l’UX 3.2.3 et la mémoire projet.

## 3.2.2 — alignement des lignes, chargement des paramètres et CI Windows

- rééquilibrage complet de la géométrie des cartes de messages Thunderbird sans dépasser leur hauteur virtuelle native ;
- suppression de la hauteur forcée de 42 px sur la première sous-ligne, qui repoussait l’objet contre la bordure basse ;
- centrage vertical de l’indicateur lu/non lu, de l’expéditeur, de la date, de l’objet, des icônes et de la punaise MailPerch ;
- taille de la punaise adaptée à la vue Cartes afin de préserver une cible claire sans déformer la ligne ;
- chargement des paramètres rendu tolérant aux réponses transitoirement nulles, avec tentatives courtes et état de formulaire explicite ;
- enregistrement et sélection du dossier protégés lorsque la configuration n’est pas encore disponible ;
- scripts npm rendus multiplateformes avec la commande `python`, disponible via `actions/setup-python` sous Linux et Windows ;
- actions GitHub migrées vers les runtimes Node 24 (`checkout@v6`, `setup-node@v6`, `setup-python@v6`, `upload-artifact@v7`) pour supprimer les avertissements de dépréciation ;
- nouvelles gardes de régression pour la géométrie des lignes, la configuration différée et l’outillage CI multiplateforme.

## 3.2.1 — tableau de bord, menus et lisibilité de la liste

- correction du crash du tableau de bord causé par la correspondance erronée entre la vue `list` et la section DOM `items` ;
- contrat automatisé entre les identifiants utilisés par le JavaScript du tableau de bord et ceux réellement présents dans son HTML ;
- simplification du menu contextuel des messages : une action claire pour la sélection et une action distincte pour toute la conversation ;
- suppression du second menu privilégié historique afin d’éviter deux systèmes de commandes concurrents ;
- ajout d’une action directe et contextualisée pour retirer une épingle de son groupe ;
- lignes de messages générales légèrement plus hautes, avec davantage d’espace sous l’aperçu ;
- nouveaux messages signalés par une bordure plus forte, un fond discret, une typographie renforcée et une icône de statut agrandie ;
- nouvelles gardes de régression pour le tableau de bord, les menus, les groupes et les états `unread` / `new`.

## 3.2.0 — workflows intelligents, fiabilité et refonte UX

- refonte guidée et aérée des paramètres avec navigation groupée, recherche, section active, aides contextuelles et retours non invasifs ;
- tableau de bord enrichi avec vues intelligentes, sélection multiple, actions groupées et centre de santé ;
- suivi automatique local des conversations sans réponse, avec annulation lors d’une réponse entrante ;
- diagnostic expurgé exportable, journal borné et indicateur de santé discret dans le panneau ;
- matrice locale de compatibilité pour comptes IMAP, POP, Gmail, Microsoft, dossiers locaux et calendriers ;
- restauration prévisualisée, fusion contrôlée, protection contre les clés dangereuses et sauvegarde obligatoire avant migration/restauration ;
- rendu différentiel des cartes, cache par signature et chargement progressif au-delà du seuil configuré ;
- logique stable séparée dans les modules `bulk`, `diagnostics`, `health`, `localization`, `migrations`, `performance`, `providers` et `smart` ;
- navigation clavier étendue, focus restauré après les menus natifs, liens d’évitement, contraste élevé et réduction des animations ;
- couverture FR/EN de toutes les chaînes déclaratives des paramètres et du dashboard, plus localisation du panneau injecté principal ;
- zone d’épinglage de la liste générale agrandie et recentrée pour éloigner la punaise du bord supérieur ;
- CI renforcée sur Linux et Windows, contrôle centralisé des versions et workflow manuel de release candidate ;
- nouvelles gardes de régression et nouveaux tests de modèle pour les fonctions 3.2.0.

## 3.1.5 — menu d’actions natif des messages épinglés

- remplacement du menu HTML positionné manuellement par un `menupopup` natif Thunderbird ;
- ouverture ancrée au bouton « Plus d’actions » et ouverture aux coordonnées écran pour le clic droit ;
- capture du clic droit au niveau de `about:3pane`, avec solution de secours directement sur la liste des cartes ;
- gestion native des commandes et de la fermeture du menu, avec restauration correcte de `aria-expanded` ;
- neutralisation temporaire du glisser-déposer de la carte lorsqu’un bouton est pressé ;
- suppression du CSS et des gestionnaires devenus obsolètes pour l’ancien menu HTML ;
- ajout d’une garde de régression dédiée à la construction, à l’ouverture et à l’activation du menu natif.

## 3.1.4 — audit complet, intégrité et fiabilité

- correction du sens de comparaison des priorités Thunderbird ;
- résolution des messages renforcée pour ne plus contourner l’empreinte d’identité en cas de Message-ID dupliqué ;
- normalisation des imports durcie contre les clés héritées et les identifiants réservés ;
- déduplication et limitation cohérentes des groupes, règles, affaires, modèles, historiques et journaux ;
- correction de l’installation tardive de l’écouteur de défilement du panneau ;
- sérialisation des écritures de récupération rendue cohérente ;
- calcul des récurrences anciennes optimisé et protégé contre les résultats passés ;
- suppression des collisions d’identifiants lors de créations rapides ;
- correction des courses de chargement dans le tableau de bord et la liste Agenda des paramètres ;
- réinitialisation des couleurs de compte correctement marquée comme modification ;
- menus WebExtension réinitialisés proprement au redémarrage du contexte ;
- ajout d’un audit profond de tous les fichiers source et de nouvelles gardes de régression ;
- suppression de constantes et imports inutilisés.

## 3.1.3 — cartes, Agenda et paramètres réparés

### Corrigé

- gestionnaires des actions de cartes déplacés dans une portée partagée afin que le clic droit, le bouton « Plus », les actions rapides et le désépinglage utilisent le même répartiteur ;
- suppression de la dépendance à `CSS.escape` dans le contexte privilégié Thunderbird ;
- capture des clics au niveau de `about:3pane`, avec nettoyage symétrique des écouteurs à l’arrêt ;
- inventaire Agenda enrichi avec lecture seule, désactivation, ACL et capacités tâches/événements ;
- sélection explicite du calendrier cible dans le panneau, l’éditeur de carte et le dashboard ;
- erreurs `MODIFICATION_FAILED` transformées en diagnostics lisibles indiquant le calendrier et sa compatibilité ;
- mise à jour des éléments Agenda liés protégée par les mêmes contrôles d’écriture ;
- paramètres dotés d’une navigation par section, d’une recherche, d’explications sous chaque contrôle et bouton, et d’un état enregistré/non enregistré explicite ;
- retours d’action affichés à la fois près du contrôle utilisé et dans un toast fixe toujours visible ;
- notifications du panneau placées dans le viewport au lieu de dépendre du défilement.

### Validation

- garde de régression dédiée aux actions de cartes, aux capacités Agenda et aux surfaces de sélection ;
- `npm run ci` requis avant distribution ;
- validation graphique réelle dans Thunderbird encore requise avant publication.

## 3.1.2 — interactions et retours d’action

### Corrigé

- notification des paramètres déplacée dans un toast fixe visible quelle que soit la position de défilement ;
- bandeau fixe pour enregistrer ou annuler les modifications non sauvegardées ;
- opérations de maintenance protégées contre l’écrasement silencieux des modifications en cours ;
- états occupé, succès et erreur ajoutés aux boutons des paramètres et du dashboard ;
- aide intégrée indiquant où retrouver les fonctions activées ;
- clic droit capturé au niveau de la fenêtre `about:3pane`, avec solution de secours sur le bouton droit ;
- menu complet accessible par clic droit, bouton « Plus », `Shift+F10` et touche Menu ;
- boutons invisibles empêchés d’intercepter les clics sur les cartes ;
- actions rapides et actions du menu reliées à un gestionnaire unique avec retours visibles ;
- couleurs par compte restaurées sur les punaises du panneau ;
- centrage et zone cliquable des punaises stabilisés ;
- survol des cartes, punaises et boutons rendu cohérent ;
- actions unitaires, groupées et Kanban du dashboard dotées d’un résultat visible ;
- gardes de régression étendues aux interactions et au feedback des paramètres.

### Validation

- constats de la passe vidéo consolidés dans les tests de régression et la documentation durable ;
- build et tests portés en version 3.1.2.

## 3.1.0 — passe de débogage, dashboard et dépôt

### Corrigé

- ouverture du dashboard par le background pour charger correctement CSS et JavaScript ;
- page dashboard entièrement mise en forme, avec chargement, erreurs et vues vides ;
- clic droit sur les cartes avec menu complet, navigation clavier et placement dans le viewport ;
- fermeture du menu au scroll, resize, blur et changement de dossier ;
- support `Shift+F10` et touche Menu ;
- sélection visuelle cohérente avant ouverture du menu par clavier ou bouton « Plus » ;
- suppression du contour drag-and-drop résiduel ;
- nettoyage des cibles de drop à chaque déplacement ;
- contrôles d’en-tête remplacés par des icônes explicites ;
- réduction des actions rapides visibles ;
- suppression de sauvegarde limitée aux fichiers de l’extension ;
- version dynamique dans les diagnostics et sauvegardes ;
- invalidation systématique du cache de démarrage lors d’une mise à jour/désactivation.

### Sécurité et maintenance

- CSP explicite ;
- background réécrit de façon lisible ;
- scripts de build reproductible, audit du dépôt et scan de secrets ;
- structure `extension/`, `docs/`, `scripts/`, `tests/` ;
- documentation Codex hiérarchique, rapport d’audit et checklist ATN ;
- CI corrigée pour fonctionner sans `package-lock.json` ni dépendance npm ;
- licence source-disponible restrictive.

## 3.0.0

- stockage incrémental, workflows avancés, affaires, Kanban, règles, Agenda, historique et sauvegardes.

## 2.0.0

- stockage SQLite structuré, sections intelligentes, conversations et dashboard.

## 1.x

- panneau Outlook, couleurs par compte, tri, épingles indépendantes et premières fonctions avancées.
