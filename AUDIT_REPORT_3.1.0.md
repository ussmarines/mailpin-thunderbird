# Rapport d’audit et de stabilisation — 3.1.0

Date : 30 juillet 2026
Base examinée : build 3.0.0 fournie dans la conversation
Portée : code installable, API Experiment, interface, dashboard, stockage, sécurité, build, documentation et préparation du dépôt GitHub.

## Conclusion

La 3.1.0 est une **candidate de stabilisation destinée aux tests**, et non une version déclarée prête pour le store. Les problèmes visibles sur les trois captures ont été traités dans le code et couverts par des gardes statiques. Aucun contrôle statique ne peut remplacer une exécution dans une session Thunderbird graphique réelle.

## Constats issus des captures

### Panneau principal

- Les trois commandes d’en-tête affichées sous la forme `C`, `↗` et `+` n’étaient pas explicites.
- La carte sélectionnée affichait trop d’actions symboliques simultanément.
- Le clic droit sur une carte épinglée ne produisait aucun menu utilisable.

### Tableau de bord

- Le dashboard était affiché sans sa présentation et sans contenu exploitable.
- L’ancienne route l’ouvrait directement depuis le contexte privilégié de l’Experiment.

### Glisser-déposer

- Un contour bleu pointillé pouvait rester affiché après une interaction de drag interrompue.

## Corrections réalisées

### Clic droit et accessibilité

- menu contextuel propre aux cartes épinglées ;
- écoute de `contextmenu` en capture et arrêt de la propagation vers les gestionnaires natifs ;
- positionnement `fixed`, contrainte au viewport et défilement interne ;
- accès par clic droit, bouton « Plus », `Shift+F10` et touche Menu ;
- navigation par flèches, Début, Fin et Échap ;
- sélection visuelle cohérente de la carte avant ouverture du menu ;
- fermeture au clic extérieur, scroll, redimensionnement, blur et changement de dossier ;
- retrait du nœud et des listeners au nettoyage.

### Dashboard

- suppression de l’ouverture directe par `contentTab` depuis l’Experiment ;
- événement `pinInbox.onDashboardRequested` ;
- ouverture par le background avec une URL `moz-extension://` ;
- CSS clair/sombre, états chargement/erreur/vide, vues Liste/Kanban/Affaires/Historique ;
- gestion visible des erreurs d’API et bouton Réessayer ;
- aucune construction par `innerHTML`.

### Interface du panneau

- remplacement des commandes d’en-tête cryptiques par des icônes originales avec `title` et `aria-label` ;
- réduction des actions rapides visibles à cinq, les autres étant déplacées dans le menu contextuel ;
- conservation du panneau distinct au-dessus de « Tous les messages » ;
- aucune sélection ou position de scroll imposée à la liste native.

### Drag-and-drop

- nettoyage centralisé de `data-dragging`, `data-drop-target`, `data-drop-before` et `data-drop-after` ;
- nettoyage sur dragover, dragend, dragleave, drop, blur, resize et changement de dossier ;
- styles de cible limités au panneau de l’extension.

### Données et compteurs

- aucun badge d’épingles injecté dans l’arbre des dossiers ;
- ancien réglage de badge forcé à `false`, y compris à l’import ;
- garde qui vérifie les compteurs avant/après un épinglage ;
- aucun marquage lu/non lu lors d’un simple épinglage ;
- écritures SQLite incrémentales, transactions, WAL, révision globale et récupération atomique conservées.

### Sécurité et packaging

- Manifest V3 ;
- CSP locale ;
- aucune requête réseau détectée ;
- aucune télémétrie, publicité, code distant ou dépendance d’exécution ;
- motifs `eval`, `new Function`, `innerHTML`, `outerHTML` et `insertAdjacentHTML` interdits par les contrôles ;
- scan conservateur des secrets ;
- XPI et archive source déterministes ;
- `.git`, caches, profils, bases locales et builds exclus de l’archive source ;
- aucun screenshot ni donnée personnelle inclus dans le dépôt livré.

## Structure GitHub/Codex

Le dépôt comprend :

- `AGENTS.md` racine et instructions spécialisées dans `extension/`, `extension/api/pinInbox/` et `tests/` ;
- architecture, modèle de données, menace, décisions, limites, UI et débogage dans `docs/` ;
- plan de test manuel détaillé ;
- instructions de build pour reviewers ;
- modèles d’issues, pull request et notes de revue ATN ;
- CI GitHub sans dépendance npm ;
- README FR/EN, sécurité, confidentialité, support, contribution et changelog ;
- licence source-disponible restrictive.

## Contrôles exécutés

Commande finale :

```bash
npm run ci
```

Résultats attendus et obtenus lors de la génération :

- structure et ressources : OK ;
- syntaxe JavaScript avec `node --check` : OK ;
- JSON, HTML, CSS et SVG : OK ;
- scan de secrets : OK ;
- gardes du dashboard, menu contextuel et drag : OK ;
- garde des compteurs Thunderbird : OK ;
- tests de modèles JavaScript : OK ;
- tests de modèle SQLite : OK ;
- reproduction binaire XPI et archive source : OK ;
- intégrité ZIP : OK.

## Validation encore obligatoire dans Thunderbird

Les points suivants ne sont **pas déclarés validés** tant qu’ils ne sont pas observés dans Thunderbird :

1. affichage et actions du menu contextuel au clic droit ;
2. dashboard stylé et chargé avec des données réelles ;
3. disparition du contour pointillé après tous les scénarios de drag ;
4. deux fenêtres simultanées ;
5. IMAP, POP, Gmail et Exchange ;
6. archivage, suppression, restauration et hors-ligne ;
7. Agenda local, CalDAV et calendrier en lecture seule ;
8. migration d’un profil contenant la base 3.0.0 ;
9. thèmes clair, sombre, contraste élevé et vues Tableau/Cartes ;
10. comportement avec 100 à 1 000 épingles.

## Limites et décisions avant publication

- Le nom public retenu est **MailPerch**. Une vérification juridique finale de disponibilité de la marque reste recommandée avant publication.
- L’identifiant de développement `pin-mails@MailPerch.local` doit rester inchangé pendant les tests afin de préserver les migrations. Choisir l’identifiant public une seule fois avant la première publication.
- La licence fournie est restrictive et non open source. Elle correspond à la demande fonctionnelle, mais n’est pas un avis juridique ; une revue par un professionnel est recommandée.
- L’API Experiment donne un accès privilégié et dépend des interfaces internes de Thunderbird. La plage de compatibilité doit être validée réellement avant publication.
- Le fichier principal privilégié reste volumineux. Les domaines stables sont isolés dans `modules/`, mais un découpage supplémentaire doit être réalisé par petites étapes avec des tests Thunderbird, pas par transformation mécanique.

## Ordre de test recommandé

1. Installer la 3.1.0 dans un profil de test après export de la configuration précédente.
2. Vérifier les compteurs de dossiers avant toute autre action.
3. Tester clic simple, clic droit, clavier et bouton « Plus ».
4. Ouvrir le dashboard depuis les trois points d’entrée.
5. Tester drag réussi puis annulé.
6. Tester ensuite seulement les actions destructives, règles et Agenda.
7. Joindre à chaque bug : version Thunderbird, OS, type de compte, thème, vue et étapes exactes, sans contenu privé.
