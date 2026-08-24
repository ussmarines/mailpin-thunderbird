# Mémoire opérationnelle — MailPin

> Version source : **1.7.6**
> Dernière release publique : **1.7.6**
> Branche courante : `release/finalize-1.7.6` ; finalisation documentaire post-publication
> Extension ID : `ussmarines.mailpin@addons.thunderbird.net`

## Résumé

MailPin est une extension Thunderbird Manifest V3 locale. La release 1.7.6 corrige le chargement des épingles persistées après un démarrage complet de Thunderbird : le background MV3 s’enregistre sur `runtime.onStartup` et initialise les onglets mail existants sans dépendre de l’ouverture du Dashboard. Le banc persistant ne réactive plus artificiellement l’onglet mail. La logique reste idempotente et ne change ni `PinCompatibility`, ni les schémas, le stockage, les permissions, la plage Thunderbird 153.0–154.* ou la politique réseau local-first.

La candidate versionnée `c502175041c85e3cb6e37666a0784f7df0a9e367` a passé la QA `32640198347` et le smoke réel Thunderbird 154.0 `32640198339`. La release `v1.7.6` cible `522042df08c2eb7a18a13cbb83631943e54abf2c`. Le téléchargement indépendant des assets publics n’est pas exposé par le connecteur utilisé ici ; aucune empreinte d’asset non observée n’est donc inventée dans cet état final.

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

- source : 1.7.6 publiée ; dernière release publique : 1.7.6 ;
- Thunderbird : 153.0 à 154.* ;
- permission WebExtension : `menus` uniquement ;
- schémas : SQLite 5, settings 8, data 7 ;
- aucune migration, permission, dépendance runtime ou connexion réseau introduite par 1.7.6 ;
- candidate exacte 1.7.6 `c502175041c85e3cb6e37666a0784f7df0a9e367` : QA `32640198347` — PASS ; smoke Thunderbird 154.0 `32640198339` — PASS ;
- release `v1.7.6` : tag ciblant `522042df08c2eb7a18a13cbb83631943e54abf2c`.

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
- smoke Thunderbird 154 réel frais sur le head versionné ;
- cold start avec épingles persistées sans Dashboard validé ;
- aucune permission, schéma, réseau ou dépendance runtime injustifiée ;
- documentation active alignée avec les preuves exactes ;
- aucun workflow one-shot de publication laissé actif après finalisation.
