# Audit complet MailPerch 3.1.4

Date : 31 juillet 2026
Base auditée : branche `main`, commit `bd562373a3dab54958102e2186611ebbe0e0623d`
Portée : dépôt complet, extension Thunderbird, API Experiment, modules, pages d’interface, scripts, tests, documentation et métadonnées de publication.

## Résumé

L’audit a relu et contrôlé l’ensemble des fichiers source fournis, puis a ajouté un contrôle automatisé réexécutable sur chaque fichier et chaque ligne. Les correctifs restent locaux : aucun commit, push, tag ou artefact GitHub n’a été créé par l’audit.

Les invariants critiques ont été conservés : aucun réseau ni télémétrie, stockage local uniquement, aucun corps de message ou contenu de pièce jointe stocké, aucune modification des compteurs natifs Thunderbird, aucune lecture forcée lors d’un épinglage et nettoyage des intégrations injectées.

## Corrections importantes

### Données et sécurité locale

- rejet des clés réservées pouvant altérer le prototype d’un objet importé ;
- utilisation systématique de tests de propriétés propres pour les références et les diffs de stockage ;
- normalisation, limitation et déduplication des références, groupes, règles, affaires, modèles, historiques et journaux ;
- validation des identifiants utilisés comme clés SQLite ou JavaScript ;
- protection des champs d’historique contre leur remplacement par les données additionnelles ;
- chaînes et identifiants importés bornés avant stockage.

### Résolution des messages et priorités

- correction du sens de comparaison des priorités élevées ;
- suppression d’un chemin qui acceptait un Message-ID dupliqué malgré une empreinte d’identité différente ;
- le repli par Message-ID n’est désormais utilisé que lorsqu’aucune empreinte n’est disponible.

### Stockage, récurrence et concurrence

- chaîne d’écriture de récupération rendue cohérente et toujours attendable ;
- calcul direct des récurrences quotidiennes et hebdomadaires très anciennes ;
- garde étendue pour les récurrences calendaires afin de ne jamais retourner une date passée ;
- création d’identifiants uniques renforcée et rejet explicite des doublons d’affaires ou de modèles ;
- initialisation des menus WebExtension rendue idempotente.

### Interface

- écouteur de défilement du panneau installé après la création réelle du panneau ;
- chargements concurrents du tableau de bord empêchés de laisser les contrôles désactivés ;
- résultats obsolètes du tableau de bord et des calendriers ignorés ;
- accès au `dataTransfer` protégé dans le glisser-déposer ;
- réinitialisation d’une couleur de compte marquée comme modification non enregistrée ;
- retour local ignoré lorsque son contrôle a été retiré du document ;
- identifiants créés depuis les paramètres rendus uniques même lors de clics très rapides.

### Nettoyage et maintenabilité

- suppression de constantes et imports inutilisés ;
- ajout de `scripts/deep_audit.py` ;
- ajout de gardes de régression sur l’intégrité des données, le cycle de vie et les courses asynchrones ;
- mise à jour de la version, du changelog, des instructions et du plan de validation ;
- correction de l’archive source afin qu’elle conserve `dist/.gitkeep` et puisse repasser les contrôles du dépôt après extraction, sans embarquer les artefacts générés.

## Contrôles automatisés

`npm run ci` exécute désormais :

1. validation du manifeste, des ressources, de la CSP et de la structure ;
2. audit profond de tous les fichiers source ;
3. scan de secrets ;
4. contrat de l’API Experiment ;
5. garde des compteurs Thunderbird ;
6. gardes UI, paramètres, Agenda et actions de cartes ;
7. gardes d’intégrité, concurrence et cycle de vie ;
8. reproductibilité du XPI et de l’archive source ;
9. tests de modèles JavaScript ;
10. tests du modèle SQLite ;
11. construction finale du XPI et des sources.

L’audit profond vérifie notamment : UTF-8, fins de ligne, caractères de contrôle et bidirectionnels, espaces finaux, JSON avec détection de clés dupliquées, syntaxe Python et imports inutilisés, syntaxe JavaScript, XML/SVG, identifiants HTML dupliqués, cohérence des catalogues de traduction, collisions de chemins insensibles à la casse et fichiers versionnés ignorés.

## Limite de validation

Les contrôles automatisés ne remplacent pas une exécution dans Thunderbird. Aucun test graphique réel n’a été exécuté dans cet environnement. Avant publication, la build doit encore être installée dans un profil Thunderbird dédié et parcourir `docs/MANUAL_TEST_PLAN.md`, particulièrement : cartes épinglées, menu « Plus d’actions », clic droit, désépinglage, sélection Agenda, sauvegardes locales, migration, multi-fenêtres et compteurs de dossiers.
