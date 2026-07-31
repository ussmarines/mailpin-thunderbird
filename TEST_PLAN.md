# Plan de test

Le plan manuel complet se trouve dans `docs/MANUAL_TEST_PLAN.md`.

Les contrôles disponibles sans environnement Thunderbird sont lancés par :

```bash
npm run ci
```

Ils couvrent structure, versions, mémoire projet, scan de secrets, permissions/CSP, validation des entrées privilégiées, import durci, cycle cœur de désinstallation, purge et sentinelle de réinstallation, accessibilité, localisation FR/EN, données, migrations, vues intelligentes, actions groupées, fournisseurs, santé, diagnostic, performances, modèles SQLite et build reproductible.

Les fichiers `tests/browser/` et `tests/xpcshell/` restent des points d’entrée pour un checkout Thunderbird. Aucune compatibilité graphique complète ne doit être affirmée avant leur exécution et la matrice manuelle Windows/Linux.

Le contexte de test, les invariants et les chemins à haut risque sont résumés dans [`PROJECT_MEMORY.md`](PROJECT_MEMORY.md). Les bugs reproduits et leur validation sont suivis dans [`docs/BUG_TRACKER.md`](docs/BUG_TRACKER.md).


## Porte de sécurité 3.2.4

Le contrôle ciblé est lancé par :

```bash
python tests/test_security_hardening_3_2_4.py
```

Il ne remplace pas une validation dans Thunderbird. La désinstallation doit être vérifiée manuellement avec un profil de test : fermeture des fenêtres, suppression du module, absence de base/préférences/sauvegardes internes, puis réinstallation avec les valeurs recommandées.


## Régressions ciblées 3.2.5

```bash
python tests/test_regressions_3_2_5.py
python scripts/check_bug_tracker.py
```

Dans Thunderbird, vérifier séparément :

1. une seule étoile native et une seule punaise MailPerch en mode indépendant ;
2. le passage vers `nativeStar`, puis le retour au mode indépendant sans étoile déplacée ni masquée ;
3. Enregistrer, Annuler, Entrée/Espace et `Ctrl/Cmd+S` dans les paramètres ;
4. le job Windows GitHub Actions, qui ne doit plus signaler `dist/.gitkeep\r`.

## Régressions ciblées 3.2.6

1. Défilement rapide de 200 messages : une étoile native, une punaise MailPerch et un bouton Plus par carte.
2. Modifier un sélecteur, cliquer Enregistrer, fermer puis rouvrir les paramètres et vérifier la valeur.
3. Modifier une case, cliquer Annuler et vérifier le retour immédiat à la valeur enregistrée.
4. Refaire les scénarios au clavier avec Ctrl/Cmd+S.
