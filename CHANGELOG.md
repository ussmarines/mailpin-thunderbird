# Changelog

## 2.0.1 — owner-smoke hardening (candidate)

### Changed
- Renforcement de l’ergonomie du Dashboard observée pendant le premier smoke réel Thunderbird 154.
- Barre d’outils rendue persistante pendant le défilement et sélection visuelle renforcée.
- Action groupée désactivée tant qu’aucun suivi n’est sélectionné, avec état de sélection globale synchronisé.
- Bouton Enregistrer rendu plus visible et accessible via `Ctrl+S`/`Cmd+S` dans la fiche d’un suivi.

### Safety
- Confirmation explicite avant les actions destructives exposées dans la fiche (Corbeille et Désépingler).
- Aucun changement de frontière : toujours zéro Experiment API, zéro réseau runtime et stockage `storage.local`.

### Validation
- Cette candidate doit repasser les trois checks obligatoires, le build XPI et `webext-linter` avant un second smoke propriétaire.

## 2.0.0 — WebExtension-native rebuild (candidate)

### Changed
- Reconstruction complète de MailPin autour des APIs WebExtension/MailExtension publiques de Thunderbird.
- Remplacement du panneau injecté `about:3pane` par un tableau de bord dédié et des actions natives (menus, raccourcis, message action).
- Remplacement du stockage SQLite privilégié par `storage.local` avec écritures sérialisées.
- Remplacement de l’intégration Agenda privilégiée par un Planning MailPin interne fondé sur échéances et alarmes.

### Added
- Recherche et vues de suivi dans le Dashboard.
- Notes, checklist, priorités, projets, labels, rappels, attente de réponse et statistiques.
- Actions Ouvrir, Répondre, Répondre à tous, Archiver et Corbeille.
- Lecture/application des tags Thunderbird existants via API native.
- Import/export JSON MailPin 2.x.

### Removed
- `experiment_apis.pinInbox` et toute API Experiment custom.
- Injection DOM dans la liste native Thunderbird.
- SQLite privilégié et accès aux composants internes Thunderbird.

### Archive
- La dernière version historique 1.7.6 reste disponible sur `archive/mailpin-1.7.6-experiment`.

La publication finale reste conditionnée au smoke réel du propriétaire.
