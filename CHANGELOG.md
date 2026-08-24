# Changelog

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

La publication finale 2.0.0 reste conditionnée au smoke réel du propriétaire.
