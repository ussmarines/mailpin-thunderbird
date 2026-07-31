# Plan de test

Le plan manuel complet se trouve dans `docs/MANUAL_TEST_PLAN.md`.

Les contrôles disponibles sans environnement Thunderbird sont lancés par :

```bash
npm run ci
```

Ils couvrent structure, sécurité, versions, accessibilité, localisation FR/EN, données, migrations, vues intelligentes, actions groupées, fournisseurs, santé, diagnostic, performances, modèles SQLite et build reproductible.

Les fichiers `tests/browser/` et `tests/xpcshell/` restent des points d’entrée pour un checkout Thunderbird. Aucune compatibilité graphique complète ne doit être affirmée avant leur exécution et la matrice manuelle Windows/Linux.

Le contexte de test, les invariants et les chemins à haut risque sont résumés dans [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md).
