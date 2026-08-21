# Audit de sécurité — MailPin 1.6.1

## Périmètre du delta

La 1.6.1 est une correction de version et de métadonnées de publication. Par rapport au runtime 1.6.0, aucune logique métier ni frontière privilégiée n’est modifiée. Dans le XPI, seul `manifest.version` passe de 1.6.0 à 1.6.1 ; les autres changements sont des documents/build metadata hors runtime.

## Invariants contrôlés

- ID inchangé : `ussmarines.mailpin@addons.thunderbird.net` ;
- permission WebExtension : `menus` uniquement ;
- CSP : `connect-src 'none'` ;
- aucun réseau runtime, télémétrie, publicité, CDN ou code distant ;
- aucun nouveau stockage de corps de message ou pièce jointe ;
- aucune nouvelle dépendance runtime/build ;
- API Experiment `pinInbox`, adaptateurs `PinCompatibility`, schémas SQLite/settings/data et préfixes persistants inchangés.

## Validation

La PR 1.6.1 doit passer les gardes standards du dépôt, `npm run ci`, Linux/Windows, scan d’identité/secrets et smoke Thunderbird réel. Codex Security n’est pas utilisé. La matrice de charge 50–2000 et les fournisseurs réseau ne sont pas relancés car aucune surface métier correspondante ne change.
