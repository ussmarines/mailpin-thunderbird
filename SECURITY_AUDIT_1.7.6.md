# Audit de sécurité — MailPin 1.7.6

## Portée

MailPin 1.7.6 est une maintenance ciblée du cycle de démarrage Thunderbird. Le changement runtime est borné à l’initialisation des onglets mail existants depuis `runtime.onStartup` et à l’adaptation du banc persistant afin qu’il n’éveille plus artificiellement le background Manifest V3.

## Invariants vérifiés

- ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- Thunderbird 153.0–154.* inchangé ;
- permission `menus` inchangée ;
- aucune migration, schéma ou modification de stockage ;
- `PinCompatibility` et les adaptateurs Messages/Tags/Agenda inchangés ;
- aucun réseau runtime, télémétrie, publicité, CDN ou code distant ajouté ;
- aucun nouveau sink privilégié ou traitement de données mail non fiables ;
- le chemin `setup` reste idempotent et les règles de nettoyage existantes restent applicables.

## Preuves

- correctif runtime PR #64 head `26fc0ac9b4d35009f125f543eefc5de9338bef71` : QA `32639780333` PASS et smoke réel Thunderbird 154.0 `32639780313` PASS ;
- candidate versionnée exacte `c502175041c85e3cb6e37666a0784f7df0a9e367` : QA Linux/Windows `32640198347` PASS et smoke réel Thunderbird 154.0 `32640198339` PASS ;
- release `v1.7.6` observée, ciblant `522042df08c2eb7a18a13cbb83631943e54abf2c` ;
- le publisher one-shot impose `npm run ci` et une reconstruction depuis l’archive source sans `.git` avec comparaison du SHA-256 du XPI avant publication.

## Limite

La revérification indépendante post-publication par téléchargement des assets publics n’est pas disponible depuis le connecteur utilisé ici et n’est pas présentée comme exécutée.

Codex Security n’a pas été utilisé.
