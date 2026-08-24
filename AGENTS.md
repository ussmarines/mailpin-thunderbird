# AGENTS.md — MailPin 2.0

MailPin est désormais une MailExtension Thunderbird Manifest V3 **WebExtension-native**.

## Invariants

1. Aucune Experiment API, API privilégiée ou injection dans le DOM interne Thunderbird.
2. Identifiant canonique : `ussmarines.mailpin@addons.thunderbird.net`.
3. Aucun réseau runtime, télémétrie, publicité, CDN ou code distant.
4. Un simple épinglage ne modifie jamais l’état lu/non-lu.
5. Ne jamais stocker le corps complet des messages ni les pièces jointes.
6. Toute entrée UI/import est bornée, validée et normalisée.
7. Les écritures de l’état MailPin restent sérialisées ; éviter les remplacements concurrents.
8. Les références de message persistantes utilisent `headerMessageId`; le `messageId` Thunderbird est volatil.
9. Les tags personnels Thunderbird ne sont jamais renommés, adoptés ou supprimés par MailPin.
10. Les permissions doivent rester minimales et justifiées dans `docs/ATN_COMPLIANCE.md`.

## Architecture

- `extension/background.js` : orchestration et frontière APIs Thunderbird publiques.
- `extension/dashboard/` : UI principale.
- `extension/options/` : paramètres, import/export.
- `docs/ARCHITECTURE.md` : architecture canonique.
- `docs/ATN_COMPLIANCE.md` : permissions et gate ATN.
- `tests/native_contract.mjs` + `scripts/check_native.py` : gardes anti-régression.

## Validation

Ordre : contrôle ciblé -> syntaxe -> contrat -> build -> smoke Thunderbird si runtime touché. Ne déclarer un comportement Thunderbird réel qu’après observation.

```bash
npm run check
npm test
npm run build
npm run ci
```

La branche `archive/mailpin-1.7.6-experiment` est historique et ne doit pas servir de base à de nouvelles fonctions.
