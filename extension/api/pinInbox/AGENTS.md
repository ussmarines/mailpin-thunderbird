# AGENTS.md — API Experiment privilégiée

Zone la plus risquée du dépôt. Elle a accès aux fonctions internes de Thunderbird.

## Invariants

- Ne jamais modifier les compteurs de dossiers lors d’un épinglage.
- Ne jamais forcer `threadTree.selectedIndex` ou `scrollToIndex` depuis une carte.
- Sérialiser les écritures SQLite et conserver les migrations ascendantes.
- Enregistrer chaque observateur, listener, timer et nœud injecté dans un chemin de nettoyage.
- Éviter les variables globales ; conserver l’état sur l’instance `ExtensionAPI`.
- Toute action destructive doit utiliser les notifications Thunderbird pour confirmer le résultat.
- Les objets retournés au background doivent être clonables et expurgés.

## Carte de travail

- `implementation.js` : cycle de vie, orchestration, UI `about:3pane`.
- `modules/identity.js` : identité stable et conversations.
- `modules/storage.js` : diff, checksum et outils de stockage.
- `modules/workflow.js` : états, sections, récurrence.
- `modules/rules.js` : validation, simulation, anti-boucle.
- `modules/calendar.js` : normalisation Agenda.
- `schema.json` : contrat public. Toute fonction ou événement doit correspondre exactement à l’implémentation.

## Avant toute refactorisation

Ajouter un test ou une garde, faire une modification limitée, lancer `npm run ci`, puis tester sur un profil Thunderbird dédié. Ne pas découper le fichier principal mécaniquement sans valider le cycle de vie des imports privilégiés.
