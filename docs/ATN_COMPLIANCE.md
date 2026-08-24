# ATN compliance — MailPin 2.0

## Gate principal

MailPin 2.0 ne déclare aucune clé `experiment_apis` et n’embarque aucune API Experiment custom.

## Permissions

- `menus` : actions depuis la liste et menu Outils.
- `messagesRead` : sélection, résolution et ouverture des messages.
- `messagesUpdate` : application explicite des tags Thunderbird existants.
- `messagesMove` : archivage.
- `messagesDelete` : déplacement vers la corbeille sur action explicite.
- `messagesTagsList` : affichage des tags natifs disponibles.
- `accountsRead` : références de dossiers/comptes nécessaires à la résolution.
- `storage` : données MailPin locales.
- `alarms`, `notifications` : rappels.
- `compose` : réponse/réponse à tous.

## Vie privée

Aucun serveur, télémétrie, publicité, CDN ou code distant. `connect-src 'none'` est imposé par CSP. Le corps des messages et les pièces jointes ne sont pas stockés.

## Validation avant soumission

- `npm run ci` ;
- `webext-linter` officiel Thunderbird ;
- installation du XPI dans Thunderbird supporté ;
- smoke manuel : pin/unpin, redémarrage, Dashboard, notes/checklist, rappel, tags, ouverture/réponse/archive/corbeille, import/export.
