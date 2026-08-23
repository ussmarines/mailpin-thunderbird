# Mémoire opérationnelle — MailPin

> Version source : **1.7.6**
> Dernière release publique : **1.7.5**
> Branche courante : `release/startup-fix-1.7.6` ; candidate du correctif de démarrage
> Extension ID : `ussmarines.mailpin@addons.thunderbird.net`

## Résumé

MailPin est une extension Thunderbird Manifest V3 locale. La candidate 1.7.6 corrige le chargement des épingles persistées après un démarrage complet de Thunderbird : le background MV3 s’enregistre désormais sur `runtime.onStartup` et initialise les onglets mail existants sans dépendre de l’ouverture du Dashboard. Le banc persistant ne réactive plus artificiellement l’onglet mail. La logique reste idempotente et ne change ni `PinCompatibility`, ni les schémas, le stockage, les permissions, la plage Thunderbird 153.0–154.* ou la politique réseau local-first.

Le correctif runtime exact de la PR #64 (`26fc0ac9b4d35009f125f543eefc5de9338bef71`) a passé la QA `32639780333` et le smoke réel Thunderbird 154.0 `32639780313`, puis a été fusionné dans `main` à `fa6782f8ecfaf259d9b8e54a08e5cf361172c669`. La candidate versionnée 1.7.6 doit repasser les gates applicables sur son head exact avant publication.

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

- source : 1.7.6 candidate ; dernière release publique : 1.7.5 ;
- Thunderbird : 153.0 à 154.* ;
- permission WebExtension : `menus` uniquement ;
- schémas : SQLite 5, settings 8, data 7 ;
- aucune migration, permission, dépendance runtime ou connexion réseau introduite par 1.7.6 ;
- PR #64, head runtime `26fc0ac9b4d35009f125f543eefc5de9338bef71` : QA `32639780333` — PASS ; smoke Thunderbird 154.0 `32639780313` — PASS ;
- merge du correctif sur `main` : `fa6782f8ecfaf259d9b8e54a08e5cf361172c669` ;
- candidate 1.7.6 : QA/build et smoke Thunderbird 154.0 frais requis avant publication.

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
- publication uniquement après les gates applicables démontrés.
