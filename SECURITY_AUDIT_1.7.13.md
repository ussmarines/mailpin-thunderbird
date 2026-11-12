# Revue différentielle de sécurité — MailPin 1.7.13

**STATUT : CANDIDATE, pas une approbation de release.** Changement limité au numéro de version, à `strict_max_version` (`159.*` → `160.*`), au smoke sur binaire officiel Thunderbird 160.0, aux gardes et à la documentation. La liste des permissions, la CSP, le runtime, l’Experiment, `PinCompatibility`, SQLite et les contrats ne sont pas modifiés dans cette préparation.

- Identité attendue : `ussmarines.mailpin@addons.thunderbird.net` (sensible à la casse).
- Aucune nouvelle permission, dépendance runtime, URL distante, télémétrie, publicité ou code distant.
- `npm run check` local : PASS (garde de sécurité, audit, scan de secrets) ; CodeQL sur SHA GitHub exact : NON EXÉCUTÉ. Aucune preuve GitHub 1.7.13 disponible.
- Smoke réel Thunderbird 160.0 et vérification des fichiers GitHub publiés : **PENDING**.
- Codex Security non utilisé ; pas de scan global supplémentaire.

La release précédente 1.7.12 est historique et n'établit pas une compatibilité Thunderbird 160.0.
