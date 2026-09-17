# Audit de sécurité — MailPin 1.7.9

## Portée

Compatibilité Thunderbird 156. La modification runtime prévue est limitée au manifeste : `strict_max_version` passe de `155.*` à `156.*`. Le smoke automatisé cible désormais le binaire officiel Thunderbird 156.0.

## Frontière privilégiée

Le chargeur Experiment reste `loadSubScriptWithOptions(..., {target: PIN_MODULES, allowUnsafeURL: true})`, limité aux noms fixes de `MODULE_PATHS` résolus sous `context.extension.rootURI`. `PinCompatibility`, les permissions, schémas, stockage, CSP et l’absence de réseau runtime restent inchangés.

## Gate 1.7.9

Aucune compatibilité Thunderbird 156 n’est déclarée comme démontrée avant le smoke réel du head candidat exact. En cas d’échec, la cause doit être corrigée sans assouplir les assertions ni les protections.

Codex Security n’est pas utilisé.
