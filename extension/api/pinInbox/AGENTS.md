# AGENTS.md — API Experiment privilégiée

> Contexte global : lire `PROJECT_MEMORY.md` à la racine avant ce fichier.

Zone la plus risquée du dépôt. Elle a accès aux fonctions internes de Thunderbird.
Lire aussi `docs/SECURITY_BOUNDARY.md` et `SECURITY_AUDIT_1.0.0.md` avant toute modification.

## Invariants

- Ne jamais modifier les compteurs de dossiers lors d’un épinglage.
- Ne jamais forcer `threadTree.selectedIndex` ou `scrollToIndex` depuis une carte.
- Sérialiser les écritures SQLite et conserver les migrations ascendantes.
- Enregistrer chaque observateur, listener, timer et nœud injecté dans un chemin de nettoyage.
- Éviter les variables globales ; conserver l’état sur l’instance `ExtensionAPI`.
- Toute action destructive doit utiliser les notifications Thunderbird pour confirmer le résultat.
- Les objets retournés au background doivent être clonables et expurgés.
- Les arguments des pages doivent être bornés et normalisés au niveau privilégié, même si le schéma les valide déjà.
- Les chemins locaux ne sont modifiés que par un sélecteur natif ; aucun chemin fourni par le DOM/import.
- La désinstallation doit fermer le stockage avant purge et ne doit jamais recréer un fichier de récupération.

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
