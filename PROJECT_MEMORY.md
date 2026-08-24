# Mémoire opérationnelle — MailPin 2.0

> Source : **2.0.0 candidate WebExtension-native**
> Dernière release historique : **1.7.6**
> Archive historique : `archive/mailpin-1.7.6-experiment`
> Branche de reconstruction : `codex/mailpin-webextension-native-2.0`
> Extension ID : `ussmarines.mailpin@addons.thunderbird.net`

## Décision d’architecture

MailPin 2.0 est reconstruit sans aucune Experiment API. Les fonctionnalités doivent utiliser uniquement les APIs publiques MailExtension/WebExtension disponibles dans Thunderbird supporté. Une fonctionnalité non exposée par une API publique est repensée dans les pages MailPin au lieu d’accéder aux composants internes Thunderbird.

## État courant

- UI principale : Dashboard dédié ;
- capture : menus, raccourcis et message display action ;
- stockage : `storage.local` avec écritures sérialisées ;
- références persistantes : `headerMessageId` et métadonnées bornées ;
- planning/rappels : échéances MailPin + `alarms`/`notifications` ;
- réseau runtime : aucun ;
- Experiment APIs : aucune ;
- migration SQLite 1.x automatique : non disponible depuis une WebExtension pure ;
- validation propriétaire Thunderbird réelle : encore requise avant release finale 2.0.0.

## Gates avant release finale

1. `npm run ci` vert sur le head candidat ;
2. `webext-linter` Thunderbird vert ;
3. XPI installable sur Thunderbird réellement supporté ;
4. smoke propriétaire : pin/unpin, persistance après redémarrage, Dashboard, note/checklist, échéance/rappel, ouvrir/répondre/archive/corbeille, import/export ;
5. aucune `experiment_apis` ni référence privilégiée dans le XPI.
