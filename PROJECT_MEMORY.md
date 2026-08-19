# Mémoire opérationnelle — MailPin

> Version source : **1.7.4**
> Dernière release publique : **1.7.3**
> Branche courante : `fix/thunderbird-154-compatibility` ; candidate de compatibilité Thunderbird 154
> Extension ID : `ussmarines.mailpin@addons.thunderbird.net`

## Résumé

MailPin est une extension Thunderbird Manifest V3 locale. La source 1.7.4 étend la compatibilité déclarée de `153.0` à `154.*` et déplace le smoke automatisé sur le binaire officiel Thunderbird 154.0. Aucun changement de logique métier, permission, stockage, schéma, dépendance runtime ou réseau n’est introduit. Le head pré-versionnement `3e1943f2be7a18ebcceef5952810675442e91a33` a passé la QA `32299537328` et le smoke réel Thunderbird 154.0 `32299537485`; la candidate versionnée doit repasser ces gates avant publication.

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

- source : 1.7.4 candidate ; dernière release publique : 1.7.3 ;
- Thunderbird : 153.0 à 154.* ;
- permission WebExtension : `menus` uniquement ;
- schémas : SQLite 5, settings 8, data 7 ;
- aucune migration, permission, dépendance runtime ou connexion réseau introduite par 1.7.4 ;
- preuve pré-versionnement QA : `32299537328` — PASS ;
- preuve pré-versionnement smoke Thunderbird 154.0 : `32299537485` — PASS ;
- candidate versionnée : QA et smoke frais requis avant merge/publication.

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
- aucune permission, schéma, réseau ou dépendance runtime injustifiée ;
- documentation active alignée avec les preuves exactes ;
- publication uniquement après les gates applicables démontrés.
