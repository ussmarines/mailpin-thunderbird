# BRAIN.md — mémoire durable MailPin

Brain complète les sources canoniques MailPin : il conserve seulement les décisions, contraintes et justifications durables difficiles à reconstruire depuis le code.

## Priorité et consultation

En cas de contradiction, appliquer : instruction utilisateur courante, état Git/GitHub observé, `MAILPERCH_AI_RULES.md`, `AGENTS.md` MailPin, sources canoniques MailPin, puis Brain pertinent. Brain n'est jamais une source pour la branche, le HEAD, `origin/main`, les PR, CI, releases, bugs courants, TODO ou preuves de tests.

Au début d'une tâche : vérifier Git et le diff, lire les règles MailPin, puis consulter Brain uniquement lorsqu'une décision durable connue peut affecter le périmètre. Ne jamais charger l'index ou toutes les pages par défaut.

## Contenu autorisé

Écrire seulement une connaissance qui restera utile dans environ six mois et qui n'est pas triviale à reconstruire : décision, contrainte, justification ou concept durable. Ne pas dupliquer `PROJECT_MEMORY.md` ni les documents canoniques ; y placer plutôt une synthèse et des pointeurs.

## Contrat CLI

Le Brain résolu par `brain brain-dir` est unique. Toutes les lectures et écritures sous `brain/` passent par le CLI Node livré avec le skill `brain-page` : `brain-dir`, `list-pages`, `read-page`, `read-root`, `create-page`, `update-truth`, `append-timeline`, `update-root`, `reindex` et `lint-links`. Ne jamais éditer manuellement un fichier sous `brain/`.

Ne pas exécuter `brain-bootstrap` par défaut sur MailPin. Aucun hook pre-commit Brain n'est installé dans cette intégration initiale.
