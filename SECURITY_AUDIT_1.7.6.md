# Audit de sécurité — MailPin 1.7.6

## Portée

MailPin 1.7.6 est une maintenance ciblée du cycle de démarrage Thunderbird. Le changement runtime est borné à l’initialisation des onglets mail existants depuis `runtime.onStartup` et à l’adaptation du banc persistant afin qu’il n’éveille plus artificiellement le background Manifest V3.

## Invariants vérifiés par le diff

- ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- Thunderbird 153.0–154.* inchangé ;
- permission `menus` inchangée ;
- aucune migration, schéma ou modification de stockage ;
- `PinCompatibility` et les adaptateurs Messages/Tags/Agenda inchangés ;
- aucun réseau runtime, télémétrie, publicité, CDN ou code distant ajouté ;
- aucun nouveau sink privilégié ou traitement de données mail non fiables ;
- le chemin `setup` reste idempotent et les règles de nettoyage existantes restent applicables.

## Preuves disponibles

Le correctif runtime de la PR #64, head `26fc0ac9b4d35009f125f543eefc5de9338bef71`, a passé QA `32639780333` et le smoke réel Thunderbird 154.0 `32639780313`, incluant le cold start sans ouverture du Dashboard. Il a été fusionné sur `main` à `fa6782f8ecfaf259d9b8e54a08e5cf361172c669`.

## Gate de candidate

La candidate versionnée 1.7.6 doit repasser les contrôles standard, le build reproductible et le smoke Thunderbird 154.0 sur son head exact avant publication. Ces résultats ne sont pas présentés comme PASS tant qu’ils n’ont pas été exécutés.

Codex Security n’est pas utilisé.
