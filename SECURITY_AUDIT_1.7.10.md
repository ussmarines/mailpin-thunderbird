# Audit de sécurité — MailPin 1.7.10

## Portée

Compatibilité Thunderbird 157. La modification runtime prévue est limitée au manifeste : `strict_max_version` passe de `156.*` à `157.*`. Le smoke automatisé cible désormais le binaire officiel Thunderbird 157.0.1.

## Frontière privilégiée

Le chargeur Experiment reste `loadSubScriptWithOptions(..., {target: PIN_MODULES, allowUnsafeURL: true})`, limité aux noms fixes de `MODULE_PATHS` sous `context.extension.rootURI`. `PinCompatibility`, permissions, schémas, stockage, CSP et absence de réseau runtime restent inchangés.

## Gate 1.7.10

Aucune compatibilité Thunderbird 157 n’est déclarée comme démontrée avant QA et smoke réel du head candidat exact. En cas d’échec, la cause doit être corrigée sans assouplir les assertions ni les protections.

Codex Security n’est pas utilisé.
