# AGENTS.md — Tests

> Contexte global : lire `PROJECT_MEMORY.md` à la racine avant ce fichier.

Les tests génériques ne remplacent pas Thunderbird.

- `static_checks.py` : contrat du paquet et motifs interdits.
- `test_folder_counter_guard.py` : invariant critique sur les compteurs.
- `test_ui_regressions.py` : garde du dashboard, menu contextuel et drag.
- `model_tests.mjs` et `sqlite_model_tests.py` : logique pure et stockage.
- `browser/` et `xpcshell/` : scénarios pour le harnais Thunderbird, non exécutés par la CI générique.

Toute correction d’un bug utilisateur doit ajouter une assertion reproductible lorsque possible. Les tests qui ne font que rechercher une chaîne doivent être complétés par un test runtime dès qu’un harnais Thunderbird est disponible.
