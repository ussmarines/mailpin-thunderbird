# Journal des modifications

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

- nouvelle passe vidéo du 30 juillet 2026 documentée dans `docs/VIDEO_REVIEW_2026-07-30_2.md` ;
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
