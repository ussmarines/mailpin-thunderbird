# AGENTS.md — API Experiment privilégiée

> Contexte global : lire `PROJECT_MEMORY.md` à la racine avant ce fichier.

Zone la plus risquée du dépôt. Elle a accès aux fonctions internes de Thunderbird.
Lire aussi `docs/SECURITY_BOUNDARY.md`, `docs/THUNDERBIRD_COMPATIBILITY.md` et le dernier audit de sécurité applicable avant toute modification.

## Invariants

- Ne jamais modifier les compteurs de dossiers lors d’un épinglage.
- Ne jamais forcer `threadTree.selectedIndex` ou `scrollToIndex` depuis une carte.
- Sérialiser les écritures SQLite et conserver les migrations ascendantes.
- Enregistrer chaque observateur, listener, timer et nœud injecté dans un chemin de nettoyage.
- Éviter les nouveaux états globaux mutables ; conserver l’état runtime sur l’instance `ExtensionAPI` autant que possible.
- Toute action destructive doit utiliser les notifications Thunderbird pour confirmer le résultat.
- Les objets retournés au background doivent être clonables et expurgés.
- Les arguments des pages doivent être bornés et normalisés au niveau privilégié, même si le schéma les valide déjà.
- Les chemins locaux ne sont modifiés que par un sélecteur natif ; aucun chemin fourni par le DOM/import.
- La désinstallation doit fermer le stockage avant purge et ne doit jamais recréer un fichier de récupération.
- Toute dépendance privilégiée injectée dans `PinCompatibility` doit être importée explicitement au bootstrap de l’Experiment avant la création des adaptateurs ; ne pas dépendre d’un identifiant global implicite ou d’un chemin d’erreur qui n’aurait pas encore été évalué.

## Carte de travail

- `implementation.js` : cycle de vie, orchestration, UI `about:3pane`.
- `modules/compatibility.js` : façade de compatibilité.
- `modules/thunderbird-messages.js` : comptes, dossiers, résolution, affichage/réponse/archive.
- `modules/thunderbird-tags.js` : définitions et mots-clés avec propriété stricte.
- `modules/thunderbird-calendar.js` : capacités, ACL, items et observateurs Agenda.
- `modules/identity.js` : identité stable et conversations.
- `modules/storage.js` : diff, checksum et outils de stockage.
- `modules/workflow.js` : états, sections, récurrence.
- `modules/rules.js` : validation, simulation, anti-boucle.
- `modules/calendar.js` : métadonnées/logique Agenda indépendante des services natifs.
- `schema.json` : contrat public. Toute fonction ou événement doit correspondre exactement à l’implémentation.

## Avant toute refactorisation

Ajouter un test ou une garde, faire une modification limitée, lancer les tests ciblés puis `npm run ci`, puis tester sur un profil Thunderbird dédié lorsque le comportement dépend du runtime. Ne pas découper le fichier principal mécaniquement sans valider le cycle de vie des imports privilégiés. Toute opération Messages/Tags/Agenda déjà extraite doit passer par `PinCompatibility` au lieu de réintroduire un appel direct.
