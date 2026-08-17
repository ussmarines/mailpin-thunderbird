# Mémoire opérationnelle — MailPin

> Version source : **1.7.3**
> Dernière release publique : **1.7.3**
> Branche courante : `main` ; release : `v1.7.3` sur `814e07adc82f0a1b19051c83fbb0fec6a22836b0`
> Extension ID : `ussmarines.mailpin@addons.thunderbird.net`

## Résumé

MailPin est une extension Thunderbird Manifest V3 locale. La release 1.7.3 consolide en dur dans `extension/styles/workspace.css` les corrections UI auparavant portées par `interaction-stability.css`, désormais supprimé. Elle augmente le rythme vertical des groupes de paramètres et rend le bouton Annuler lisible dans la barre de sauvegarde, notamment en thème sombre. La candidate exacte `a247dc53e3b707335b04ae00b227acad52ddb8b5` a passé QA `32028928653` et smoke Thunderbird réel `32028928636`, puis a été fusionnée dans `main` à `814e07adc82f0a1b19051c83fbb0fec6a22836b0`. Le workflow Release `32031451673` a ensuite exécuté `npm run ci`, reconstruit les artefacts et publié `v1.7.3` avec succès.

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
- navigation Options : `extension/options/options-navigation-stability.js` ;
- paramètres : `extension/options/` ;
- dashboard : `extension/dashboard/` ;
- logique métier : `extension/api/pinInbox/modules/` ;
- frontière Thunderbird : `extension/api/pinInbox/modules/compatibility.js` et adaptateurs `thunderbird-*.js` ;
- smoke réel : `tests/thunderbird/real_smoke.py`, `.github/workflows/thunderbird-smoke.yml` ;
- publication : `release/`, `STORE_RELEASE.md`, `docs/ATN_RELEASE_CHECKLIST.md`.

## État technique courant

- source : 1.7.3 ; dernière release publique : 1.7.3 ;
- Thunderbird : 153.0 à 153.* ;
- permission WebExtension : `menus` uniquement ;
- schémas : SQLite 5, settings 8, data 7 ;
- aucune migration, permission, dépendance runtime ou connexion réseau introduite par 1.7.3 ;
- QA candidate : `32028928653` — PASS ;
- smoke Thunderbird réel candidate : `32028928636` — PASS ;
- workflow Release : `32031451673` — PASS ;
- XPI : `66a10432457a509b9c9959e3df7bcdd2415d14668284b6104803dfa1d9362bc4` ;
- archive source : `ff5999a8b73392b0ad7e6778c69602ddddeeb687a3263d2162b2f93afddaf767`.

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
- smoke Thunderbird réel frais lorsque `extension/**` change ;
- aucune permission, schéma, réseau ou dépendance runtime injustifiée ;
- documentation active alignée avec les preuves exactes ;
- publication uniquement après autorisation explicite et gates applicables démontrés.
