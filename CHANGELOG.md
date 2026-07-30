# Journal des modifications

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
