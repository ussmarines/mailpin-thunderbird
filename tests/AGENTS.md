# AGENTS.md — Tests

> Contexte global : lire `PROJECT_MEMORY.md` à la racine avant ce fichier.

Les tests génériques ne remplacent pas Thunderbird. Toujours distinguer la preuve de contrat de la preuve runtime.

- `static_checks.py` : contrat du paquet et motifs interdits.
- `test_folder_counter_guard.py` : invariant critique sur les compteurs.
- `test_ui_regressions.py` : gardes du panneau/dashboard et du responsive.
- `test_recommended_options_ux.py` : taxonomie Options et brouillon Recommandé sans auto-save.
- `test_thunderbird_compatibility_boundary.py` : empêche de contourner les adaptateurs extraits.
- `thunderbird_compatibility_contract.mjs` : contrats Messages/Tags/Agenda avec faux services.
- `test_thunderbird_test_bench.py` : structure et chaîne de confiance du smoke runtime.
- `thunderbird/real_smoke.py` : vrai lancement Thunderbird via WebDriver Mozilla ; résultat réel requis avant toute affirmation runtime.
- `model_tests.mjs` et `sqlite_model_tests.py` : logique pure et stockage.
- `browser/` et `xpcshell/` : scénarios pour un checkout/harnas Thunderbird, non exécutés par la CI générique.

Toute correction d’un bug utilisateur doit ajouter une assertion reproductible lorsque possible. Un test qui recherche une chaîne est une garde, pas une preuve fonctionnelle. Les comportements dépendant du DOM, du fournisseur, d’ACL ou du cycle de vie doivent recevoir un test runtime ou rester explicitement « à valider ».
