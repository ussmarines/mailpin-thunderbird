# Journal des modifications

## 1.5.3 — durcissement des imports et correction de lisibilité des automatisations

- neutralisation, lors d’un import de sauvegarde, des réglages automatiques ou destructifs `autoRemoveCompleted`, rétention des terminés, désépinglage après suppression et sauvegardes automatiques ;
- `safeMode` bloque désormais la rétention des éléments terminés avant toute mutation locale des données importées ;
- conservation explicite des épingles lors d’un déplacement importé et maintien des confirmations destructives existantes ;
- correction du chevauchement entre le titre « Activer les règles » et son texte d’aide dans Options → Automatisation → Règles et actions automatiques ;
- les cartes de réglage mises en avant empilent désormais titre et aide avec une hiérarchie typographique lisible sur les largeurs testées de 360 à 1 200 px ;
- aucune nouvelle permission WebExtension, dépendance runtime, connexion réseau, télémétrie, publicité, migration de schéma ou extension d’API Thunderbird.

## 1.5.2 — couverture runtime automatisée et finition du panneau

- exécution des scénarios DOM Dashboard et Options directement dans les vrais onglets Thunderbird via le `BrowsingContext`/acteur Marionette du processus de contenu ;
- remplacement de la commande XUL synthétique de l’éditeur par `menuitem.doCommand()`, avec modification réelle des notes, checklists, priorité, groupe, échéances, statut et relance dans Thunderbird ;
- validation multi-processus avec extension non temporaire, profil exact réutilisé, stockage SQLite et sélection de comptes conservés, puis réveil MV3 par une activation d’onglet utilisateur locale ;
- contrôle automatique clair/sombre du clipping, débordement horizontal, alignement des contrôles et contraste texte de base, les choix esthétiques pixel par pixel restant une inspection humaine ;
- correction des substitutions localisées paramétrées du Dashboard dans le contexte WebExtension Thunderbird ;
- ajustement de la hauteur maximale du panneau et de la densité des cartes afin de conserver deux cartes ordinaires complètes dans la zone testée, y compris sur panneau étroit ;
- aucune nouvelle permission WebExtension, dépendance runtime, connexion réseau, télémétrie, publicité, migration ou modification de schéma.

## 1.5.1 — audit complet et durcissement correctif

- correction du crash `ReferenceError: assignment to undeclared variable checklistItems` lors de l’ouverture de l’éditeur de carte ;
- centralisation des énumérations, accès DB et mutations Messages restantes dans `PinCompatibility.messages`, avec balayages privilégiés bornés et gardes anti-régression renforcées ;
- correction de la matrice de diagnostic comptes afin de refléter `isSecure` et le support hors-ligne réellement exposés par Thunderbird ;
- migration Settings réalignée sur le schéma courant 8, tandis que le schéma données reste 7 et SQLite physique 5 ;
- smoke Thunderbird rattaché à `main` plutôt qu’à une ancienne branche de consolidation supprimée ;
- plage de compatibilité déclarée resserrée à Thunderbird `153.0`–`153.*` après essais réels : 128/140 injectent le panneau mais ne garantissent pas l’ouverture fiable du Dashboard via le pont MV3 Experiment → background ;
- banc Thunderbird corrigé pour distinguer le total de portée des résultats filtrés, puis matrice réelle 50/100/500/1000/2000 revalidée sans timeout ni exception JavaScript sur Thunderbird 153.0.1 ESR ;
- documentation, rapports sécurité/validation, notes reviewers et métadonnées de publication resynchronisés ;
- aucune nouvelle permission WebExtension, dépendance runtime, connexion réseau, télémétrie, publicité ou code distant.

## 1.5.0 — refonte visuelle du produit

- nouvelle direction visuelle locale, sobre et cohérente, sans modification des fonctionnalités métier ni du logo actuel ;
- design system et tokens Fluent locaux harmonisés entre le Dashboard, les Options et le panneau des épingles ;
- Dashboard restructuré visuellement avec une hiérarchie, une navigation et des statistiques plus lisibles ;
- Options simplifiées et moins « cardifiées », avec une séparation plus nette des familles et contrôles existants ;
- panneau des épingles harmonisé avec le reste du produit, sans altérer la liste native Thunderbird ;
- focus clavier, contraste, responsive, thèmes clair/sombre et réduction du mouvement préservés ;
- aucune nouvelle permission WebExtension, dépendance runtime ou connexion réseau.

## 1.4.0 — comptes sélectionnés, fiabilité UI et banc Thunderbird

- Options : sections rendues dans l’ordre Essentiel, Automatisation, Organisation puis Avancé ; nouvelle portée « Comptes sélectionnés » utilisant `account.key` comme identité canonique, avec sélection explicite, conservation du brouillon et migration sûre de l’ancien `currentAccount` vers la boîte courante ;
- Options et Dashboard : soutien limité à PayPal, volume conseillé jusqu’à 2 000 mails épinglés et indication informative du volume dans le Centre de santé, sans limite dure au-delà de 2 000 ;
- Dashboard : normalisation des compteurs visibles pour exclure `null`, `undefined` et `NaN`, et retrait du dump « État technique » redondant ;
- panneau Thunderbird : recherche et vue « Toutes » restent sur une ligne tant que la largeur le permet, hauteur par défaut augmentée pour garder au moins deux cartes complètes visibles, ouverture du Dashboard fiabilisée et icônes de punaise adaptées aux thèmes clair/sombre ;
- validation multi-comptes réelle : portée vide = 0, A = 18, B = 16, A+C = 34 sans B et A+B+C = 50, avec sauvegarde Options → panneau confirmée manuellement ;
- banc Thunderbird : ajout d’un workflow manuel et d’un scénario fonctionnel/charge réel couvrant 50, 100, 500, 1 000 et 2 000 épingles, tous validés sans exception JavaScript, timeout ni incohérence de comptage ;
- smoke Thunderbird : le bouton Dashboard doit ouvrir exactement un onglet, l’injection/cleanup/réinstallation restent contrôlés ;
- aucune nouvelle permission WebExtension, dépendance runtime, connexion réseau du produit ou modification de l’identifiant canonique.

## 1.3.0 — consolidation Thunderbird et interface

- isolation des accès internes Messages, Tags et Agenda derrière `PinCompatibility` et trois adaptateurs injectables ;
- contrats de compatibilité et garde empêchant la réintroduction des appels natifs extraits dans l’orchestrateur ;
- Options réorganisées en Essentiel, Organisation, Automatisation et Avancé ; le mode `guided` est présenté comme **Recommandé** sans migration de stockage ;
- application des valeurs recommandées sous forme de brouillon explicite, sans sauvegarde automatique et en préservant les valeurs propres au profil ;
- ajout d’un smoke runtime GitHub Actions basé sur un binaire Thunderbird officiel et geckodriver vérifiés par SHA-256 ; exécution réelle réussie sur Thunderbird 153.0.1 ESR avec profil local synthétique, injection/cleanup/réinstallation contrôlés ;
- correction d’un crash de bootstrap découvert par ce banc (`ExtensionError is not defined`) grâce à un import privilégié explicite et une garde de non-régression ;
- restauration du contrôle Options `moveToWaitingOnReply`, dont l’absence bloquait l’initialisation, et ajout d’une garde bidirectionnelle entre le registre des réglages et le HTML ;
- correction de la recherche initiale du dashboard qui affichait `undefined`, et réalignement du scénario navigateur sur les neuf statistiques actuelles ;
- conservation de Fluent 2 au moyen des contrôles natifs et jetons CSS locaux ; retrait de `@fluentui/web-components` et du lockfile inutilisés, sans ajout de bundler ni de code au XPI ;
- modernisation visuelle cohérente du dashboard, des Options et du panneau injecté : en-têtes plus compacts, hiérarchie et états vides clarifiés, jetons de contrôles, espacements, focus et élévations unifiés ;
- typographie sans-serif garantie locale via `system-ui` et ses fallbacks natifs, sans police embarquée, CDN ni requête réseau runtime ;
- documentation de la frontière Thunderbird, du banc de test, de la reprise Codex et des limites mise à jour ;
- aucune nouvelle permission WebExtension, dépendance runtime, connexion réseau du produit, migration de stockage ou nouvelle fonction métier.

## 1.2.1 — correction sécurité de la détection des fournisseurs

- remplacement des tests de sous-chaîne sur les noms d’hôte par une comparaison exacte ou par suffixe de domaine à frontière contrôlée ;
- correction des deux alertes CodeQL `js/incomplete-url-substring-sanitization` signalées sur `live.com` et `me.com` ;
- ajout de tests de régression couvrant les domaines trompeurs tels que `evil-live.com`, `live.com.attacker.example`, `evil-me.com` et `me.com.attacker.example` ;
- aucune nouvelle permission, dépendance, connexion réseau, migration de stockage ou modification de schéma.

## 1.2.0 — productivité locale avancée et finition Fluent 2

- notes étendues et checklists/sous-tâches directement liées aux épingles ;
- recherche globale sur les métadonnées MailPerch, groupes, affaires, tags, notes et sous-tâches, sans indexer le corps des messages ;
- vues personnalisées enregistrables et palette de commandes/accès rapides ;
- indicateurs distincts **J’attends** / **Je dois répondre** et statistiques de suivi enrichies ;
- synchronisation facultative avec des tags Thunderbird strictement réservés à MailPerch, sans nouvelle permission WebExtension ;
- consolidation de la synchronisation bidirectionnelle Agenda ↔ MailPerch et propagation des changements de statut ;
- interface Options/dashboard affinée : pile de polices système locale, alignements et espacements revus, statistiques responsives et texte explicite d’au moins 12 px ;
- schéma logique paramètres/données 7, migrations et sauvegardes compatibles avec les versions antérieures ;
- nouvelles gardes automatisées couvrant les fonctions 1.2, la confidentialité, l’accessibilité, les limites d’entrée et l’absence d’élargissement des permissions.

## 1.1.2 — correction responsive du panneau épinglé

- suppression du grand espace vide créé lorsque les outils du panneau passent en disposition verticale ;
- masquage complet du centre de rappels vide, sans retirer les rappels interactifs actifs ;
- adaptation du sélecteur de vue intelligente aux panneaux étroits ;
- ajout d’une garde de non-régression et synchronisation des métadonnées, README et documents de publication ;
- aucun changement de permission, de stockage, de schéma ou de traitement des messages.

## 1.1.1 — confidentialité, robustesse et qualité de publication

- suppression des références personnelles et adoption de l’identité publique `ussmarines` ;
- durcissement des diagnostics, de la résolution des conversations, du packaging et des workflows ;
- localisation FR/EN complétée et validation dans Thunderbird 153.0.1 avec un profil jetable ;
- contrôles classiques de sécurité, de secrets, de reproductibilité et de compatibilité renforcés.

## 1.1.0 — suivi quotidien et productivité

- suivi automatique des réponses, mise en veille, vues Aujourd’hui et Revue ;
- rappels interactifs, actions groupées, capture rapide et aperçu des règles ;
- dix raccourcis personnalisables et fusion prudente par identité forte.

## 1.0.0 — première version publique

- panneau d’épingles, suivis, rappels, groupes, règles, Agenda, dashboard et Kanban ;
- fonctionnement local sans réseau, télémétrie, publicité ni code distant ;
- build reproductible, archive source reviewer et publication GitHub automatisée.

Les changements des anciennes builds internes `3.2.x` restent consultables dans l’historique Git et les audits archivés.
