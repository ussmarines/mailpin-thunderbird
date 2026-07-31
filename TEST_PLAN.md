# Plan de test

Le plan manuel complet se trouve dans `docs/MANUAL_TEST_PLAN.md`.

Les contrôles disponibles sans environnement Thunderbird sont lancés par :

```bash
npm run ci
```

Ils couvrent structure, versions, mémoire projet, scan de secrets, permissions/CSP, validation des entrées privilégiées, import durci, cycle cœur de désinstallation, purge et sentinelle de réinstallation, accessibilité, localisation FR/EN, données, migrations, vues intelligentes, actions groupées, fournisseurs, santé, diagnostic, performances, modèles SQLite et build reproductible.

Les fichiers `tests/browser/` et `tests/xpcshell/` restent des points d’entrée pour un checkout Thunderbird. Aucune compatibilité graphique complète ne doit être affirmée avant leur exécution et la matrice manuelle Windows/Linux.

Le contexte de test, les invariants et les chemins à haut risque sont résumés dans [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md).


## Porte de sécurité 3.2.4

Le contrôle ciblé est lancé par :

```bash
python tests/test_security_hardening_3_2_4.py
```

Il ne remplace pas une validation dans Thunderbird. La désinstallation doit être vérifiée manuellement avec un profil de test : fermeture des fenêtres, suppression du module, absence de base/préférences/sauvegardes internes, puis réinstallation avec les valeurs recommandées.
