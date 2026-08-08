# Plan de test

Le plan manuel complet se trouve dans `docs/MANUAL_TEST_PLAN.md`. La stratégie du banc réel est décrite dans `docs/THUNDERBIRD_TEST_BENCH.md`.

## Niveau 1 — contrôle complet sans Thunderbird

```bash
npm run ci
```

Cette commande couvre structure, versions, mémoire projet, scan de secrets, permissions/CSP, validation des entrées privilégiées, import durci, cycle de désinstallation, accessibilité, localisation FR/EN, données, migrations, logique métier, stockage SQLite et build reproductible.

## Niveau 2 — contrats de la consolidation

```bash
python tests/test_thunderbird_compatibility_boundary.py
node tests/thunderbird_compatibility_contract.mjs
python tests/test_recommended_options_ux.py
python tests/test_thunderbird_test_bench.py
```

Ces tests vérifient :

- l’absence de réintroduction des appels Thunderbird extraits dans l’orchestrateur ;
- les contrats Messages / Tags / Agenda avec faux services ;
- l’atomicité/propriété des tags et les capacités Agenda ;
- le mode Recommandé, son brouillon sans auto-save et la taxonomie Options ;
- la structure, les versions épinglées et la chaîne de vérification du smoke runtime.

Ils ne prouvent pas le comportement graphique dans Thunderbird.

## Niveau 3 — vrai binaire Thunderbird en CI

Workflow : `.github/workflows/thunderbird-smoke.yml`.

Il construit l’XPI, télécharge et vérifie un Thunderbird officiel ainsi qu’un geckodriver épinglé, puis teste : installation temporaire, extension active, présence unique du panneau/toggle, désinstallation et cleanup, réinstallation sans duplication.

Tant que ce job n’a pas réellement réussi sur un commit, il faut décrire son état comme **implémenté mais runtime non validé**. Les artefacts de diagnostic sont conservés même en cas d’échec.

## Niveau 4 — checkout Thunderbird / comm-central

Les fichiers `tests/browser/` et `tests/xpcshell/` restent des points d’entrée pour un checkout Thunderbird. Les suites officielles peuvent être lancées via `mach`, par exemple :

```bash
./mach xpcshell-test comm/mail/components/extensions/test/xpcshell
./mach mochitest mail/components/extensions/test/browser
```

Un checkout/build Thunderbird complet est requis. Cette couche permet d’aller plus loin que le smoke externe pour les internals et interactions natives.

## Niveau 5 — validation manuelle

Aucune compatibilité complète ne doit être affirmée avant les scénarios pertinents de `docs/MANUAL_TEST_PLAN.md`, notamment :

- comptes et dossiers réels ;
- Agenda/fournisseurs ;
- tags et dossiers virtuels ;
- thèmes/zoom/accessibilité ;
- redémarrage et cycle de vie ;
- performances et grands volumes.

## Régressions historiques à conserver

Les gardes 3.2.x restent utiles même si ces numéros ne sont plus la roadmap active : elles couvrent des bugs réels déjà rencontrés, notamment étoile/punaise, Options Enregistrer/Annuler, initialisation, CRLF Windows, responsive et sécurité de cycle de vie.

Ne supprimer ou assouplir une garde historique que si son contrat n’existe réellement plus et que cette décision est documentée.
