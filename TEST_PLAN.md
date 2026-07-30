# Plan de test

Le plan de référence se trouve dans `docs/MANUAL_TEST_PLAN.md`.

Les contrôles automatiques disponibles sans environnement Thunderbird sont lancés par :

```bash
npm run ci
```

Les fichiers `tests/browser/` et `tests/xpcshell/` sont des points de départ pour le harnais Thunderbird. Ils doivent être intégrés et exécutés dans un checkout Thunderbird avant toute affirmation de compatibilité complète.
