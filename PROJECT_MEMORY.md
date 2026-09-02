# Mémoire opérationnelle — MailPin

> Version source : **1.7.8**
> Dernière release publique : **1.7.8**
> Branche courante : `main` ; MailPin 1.7.8 publiée
> Extension ID : `ussmarines.mailpin@addons.thunderbird.net`

## Résumé

MailPin est une extension Thunderbird Manifest V3 locale. La release 1.7.7 restaure la compatibilité Thunderbird 155.0 après le durcissement du chargement des sous-scripts privilégiés. Le chargeur de modules de l’Experiment utilise désormais `loadSubScriptWithOptions` avec `allowUnsafeURL: true` uniquement pour les fichiers locaux fixés dans `MODULE_PATHS` et résolus sous `context.extension.rootURI`. Aucune URL utilisateur ou distante ne construit ce chemin.

La correction conserve `PinCompatibility`, les schémas, le stockage local-first, les permissions, l’état lu/non-lu et l’absence de réseau runtime. Le correctif cold-start de 1.7.6 via `runtime.onStartup` reste inchangé et couvert par les validations courantes.

La candidate exacte `94ce4d2656df8eb9694ce794743b82c00d83e8a9` a passé la QA `33688297275` et le smoke réel Thunderbird 155.0 `33688296968`. Après squash, `main` `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` a repassé la QA `33689155033` et le smoke réel Thunderbird 155.0 `33689155048`. Le workflow canonique Release `33689378381` a publié `v1.7.7` depuis ce même commit.

Les métadonnées de release exposent les empreintes suivantes : XPI `ec80836aebcb972d8148063cd4035df836e5e66a663003e7785146a7d798ce4e`, archive source `c921436872c10db42b370947f1caa701a20fac69f2f5f0a7c1fecdfd277d5d49`, asset `SHA256SUMS.txt` `3e90d12adff3b84b665a21c63bd8f1f66a706086ec7fe056c795f1148165c9dd`.

La maintenance 1.7.8 a été validée sur la candidate exacte `e48a12239c674e1f8a909b22a04c0c3266eca70e` : QA `33691697322` PASS et smoke réel Thunderbird 155.0 `33691697345` PASS. Après squash, `main`/tag target `800c07315ee7f8611f2d2fc6e12a4f2c2d74b849` a repassé QA `33691785442` PASS et smoke `33691785284` PASS. Le workflow Release `33691919194` a publié `v1.7.8`. Empreintes publiques : XPI `b007f9ad0213bb5672e5273c27b4f0d3935897fc2696922acd2e2dd673b5048e`, archive source `509076b18aef693c060983037c4277a97c65d98e13738ead351da7ef13537b9d`, `SHA256SUMS.txt` `c20e8f706bad9d688486d8143a375a5377289ccf40c3aeeb023491ed7cccc1b7`.

## Invariants non négociables

1. Aucun réseau runtime, télémétrie, publicité, CDN ou code distant.
2. Épingler ne change jamais l’état lu/non lu ni les compteurs natifs.
3. Aucun corps complet de message ni contenu de pièce jointe n’est stocké.
4. Les entrées privilégiées restent bornées et normalisées.
5. SQLite reste incrémental, transactionnel et sérialisé.
6. Les listeners, observers, timers, menus, styles et nœuds injectés sont nettoyés.
7. Les tags personnels Thunderbird restent intacts ; seuls les tags MailPin possédés peuvent être gérés.
8. Aucune permission ou dépendance runtime nouvelle sans justification et test.
9. `PinCompatibility` reste la frontière des accès Messages/Tags/Agenda.
10. Organic Workspace utilise un seul stylesheet canonique pour la composition principale ; aucune feuille corrective runtime empilée n’est chargée.

## Carte complète des fichiers

- `extension/manifest.json`
- `extension/background.js`
- `extension/api/pinInbox/schema.json`
- `extension/api/pinInbox/implementation.js`
- `extension/api/pinInbox/modules/compatibility.js`
- `extension/api/pinInbox/modules/thunderbird-messages.js`
- `extension/api/pinInbox/modules/thunderbird-tags.js`
- `extension/api/pinInbox/modules/thunderbird-calendar.js`
- `extension/options/options.html`
- `extension/dashboard/dashboard.html`
- `PROJECT_MEMORY.md`
- `docs/SECURITY_BOUNDARY.md`
- `docs/BUG_TRACKER.md`
- `docs/THUNDERBIRD_COMPATIBILITY.md`
- `docs/THUNDERBIRD_TEST_BENCH.md`
- `docs/CODEX_HANDOFF.md`

## Où modifier quoi

- composition Dashboard/Options : `extension/styles/workspace.css` ;
- tokens et thèmes : `extension/styles/tokens.css`, `extension/styles/theme.js` ;
- paramètres : `extension/options/` ; dashboard : `extension/dashboard/` ;
- logique métier : `extension/api/pinInbox/modules/` ;
- frontière Thunderbird : `extension/api/pinInbox/modules/compatibility.js` et adaptateurs `thunderbird-*.js` ;
- smoke réel : `tests/thunderbird/real_smoke.py`, `.github/workflows/thunderbird-smoke.yml` ;
- publication : `release/`, `STORE_RELEASE.md`, `docs/ATN_RELEASE_CHECKLIST.md`.

## État technique courant

- source : 1.7.8 publiée ; dernière release publique : 1.7.8 ;
- Thunderbird : 153.0 à 155.* ;
- permission WebExtension : `menus` uniquement ;
- schémas : SQLite 5, settings 8, data 7 ;
- aucune migration, permission, dépendance runtime ou connexion réseau introduite par 1.7.7 ;
- candidate 1.7.7 `94ce4d2656df8eb9694ce794743b82c00d83e8a9` : QA `33688297275` — PASS ; smoke Thunderbird 155.0 `33688296968` — PASS ;
- `main` publié `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` : QA `33689155033` — PASS ; smoke Thunderbird 155.0 `33689155048` — PASS ;
- release `v1.7.7` : tag ciblant `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` ; workflow Release `33689378381` — PASS.

## Commandes obligatoires

```bash
npm run check
npm test
npm run build
npm run ci
```

## Définition de terminé

- version source et dernière release publique déclarées sans ambiguïté ;
- tests et build verts sur le diff applicable ;
- smoke Thunderbird 155 réel frais sur le head versionné et après intégration ;
- cold start avec épingles persistées sans Dashboard validé ;
- aucune permission, schéma, réseau ou dépendance runtime injustifiée ;
- documentation active alignée avec les preuves exactes ;
- aucun workflow one-shot de publication laissé actif après finalisation.
