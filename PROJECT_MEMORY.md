# Mémoire opérationnelle — MailPin

> Version source : **1.7.5**
> Dernière release publique : **1.7.5**
> Branche courante : `release/finalize-1.7.5` ; finalisation documentaire post-publication
> Extension ID : `ussmarines.mailpin@addons.thunderbird.net`

## Résumé

MailPin est une extension Thunderbird Manifest V3 locale. La release 1.7.5 raccourcit uniquement le nom public/localisé à **MailPin — Email Follow-up & Productivity** (40 caractères) afin de respecter la limite ATN de 50 caractères. La logique métier, l’API Experiment, `PinCompatibility`, les schémas, le stockage, les permissions et la plage Thunderbird 153.0–154.* restent inchangés. La candidate exacte `19cf23c21e983be924ffd9e6af8fdb1e8e612947` a passé la QA `32480175617` et le smoke réel Thunderbird 154.0 `32480175435`. Le tag `v1.7.5` cible exactement `2384ee52df95a711424dfeb817ef114888634ed0` et les artefacts publics ont été vérifiés dans le run `32481646372`.

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

- source : 1.7.5 publiée ; dernière release publique : 1.7.5 ;
- Thunderbird : 153.0 à 154.* ;
- permission WebExtension : `menus` uniquement ;
- schémas : SQLite 5, settings 8, data 7 ;
- aucune migration, permission, dépendance runtime ou connexion réseau introduite par 1.7.5 ;
- candidate exacte 1.7.5 `19cf23c21e983be924ffd9e6af8fdb1e8e612947` : QA `32480175617` — PASS ; smoke Thunderbird 154.0 `32480175435` — PASS ;
- release `v1.7.5` : tag `2384ee52df95a711424dfeb817ef114888634ed0`, build reviewer hors `.git` PASS, artefacts publics vérifiés `32481646372` — PASS.

## Commandes obligatoires

```bash
npm run check
npm test
npm run build
npm run ci
```

## Définition de terminé

- nom localisé ≤ 50 caractères et garde anti-régression ;
- version source et dernière release publique déclarées sans ambiguïté ;
- tests et build verts sur le diff applicable ;
- smoke Thunderbird 154 réel frais sur le head versionné ;
- aucune permission, schéma, réseau ou dépendance runtime injustifiée ;
- documentation active alignée avec les preuves exactes ;
- publication uniquement après les gates applicables démontrés.
