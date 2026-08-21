# Audit de sécurité — MailPin 1.6.0

## Périmètre

Cette release change l’identité publique, les assets, les métadonnées, les locales et les tokens visuels. Elle ne change ni les permissions WebExtension, ni les frontières `PinCompatibility`, ni le stockage métier, ni les sinks privilégiés.

## Invariants

- permissions : `menus` uniquement ;
- CSP : `connect-src 'none'` ;
- aucun réseau runtime, télémétrie, publicité, CDN ou code distant ;
- aucun `eval`, `new Function` ou HTML dynamique non sûr ;
- corps complet des messages et pièces jointes non stockés ;
- nouvel ID public : `ussmarines.mailpin@addons.thunderbird.net` ;
- préfixes de stockage/import et API Experiment `pinInbox` conservés pour la migration contrôlée.

## Validation

Le commit de rebranding n’est créé par le workflow temporaire qu’après succès de `npm run ci` et `git diff --check`. Les scans standards du dépôt font partie de cette CI. Aucun Codex Security n’est utilisé.
