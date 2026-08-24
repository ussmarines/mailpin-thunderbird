# Changelog

## 2.1.1 — native tag cleanup (candidate)

### Fixed
- Désactiver le feedback visuel retire désormais les tags appartenant à MailPin des messages déjà suivis au lieu de les laisser affichés.
- Les tags personnels Thunderbird restent préservés pendant cette opération.

### Safety / ATN
- Aucun changement de frontière : zéro Experiment API, zéro réseau runtime et aucun changement lu/non-lu.

## 2.1.0 — native feature parity (candidate)

### Added
- Feedback directement visible dans la liste des messages via des tags Thunderbird créés et gérés exclusivement par MailPin, sans modifier les tags personnels existants.
- État dynamique du bouton MailPin sur le message affiché : badge, libellé, tooltip et icône épinglée/non épinglée.
- Compteur global de suivis actifs sur le bouton MailPin.
- Menu contextuel adaptatif `Épingler` / `Désépingler` selon la sélection courante.
- Vues enregistrées depuis le Dashboard (vue, recherche et tri).
- Modèles de suivi réutilisables applicables aux sélections.
- Dossiers/cases locaux regroupant plusieurs suivis sans déplacer les e-mails Thunderbird.
- Règles locales explicites applicables aux sélections selon l’objet et l’expéditeur.
- Report rapide d’une heure ou d’un jour depuis les actions groupées.
- Workbench dédié pour modèles, dossiers, règles, maintenance, diagnostic et historique.
- Import manuel des messages étoilés via permission optionnelle `accountsRead` demandée uniquement lors de l’action.
- Réparation des références cassées et diagnostic WebExtension-native.

### Safety / ATN
- Toujours zéro `experiment_apis`, zéro accès DOM à `about:3pane`, zéro réseau runtime et aucun stockage du corps ou des pièces jointes.
- Les tags visuels MailPin utilisent leurs propres clés ; aucun tag personnel n’est renommé, adopté ou supprimé.
- Aucun épinglage ne modifie l’état lu/non-lu.

### Publication
- Candidate uniquement : publication publique interdite avant smoke réel propriétaire.

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
