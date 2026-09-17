# Audit de sécurité — MailPin 1.7.9

## Résultat

**PASS.** La compatibilité Thunderbird 156 modifie la borne de manifeste et le smoke runtime, sans élargir la surface de sécurité runtime.

## Frontière privilégiée

Le chargeur Experiment reste `loadSubScriptWithOptions(..., {target: PIN_MODULES, allowUnsafeURL: true})`, limité aux noms fixes de `MODULE_PATHS` sous `context.extension.rootURI`. `PinCompatibility`, permissions, schémas, stockage, CSP et absence de réseau runtime restent inchangés.

Candidate `da9d97a874f5043b43a212d09b9090ad0f77d681` : garde sécurité/QA `35224045803` PASS et smoke Thunderbird 156.0 `35224046106` PASS. Target `46bb9fc27256cc143743e74e4a04fb48d48f6e85` : QA `35224161719` et smoke `35224161877` PASS. Release `35224299551` PASS.

Codex Security n’a pas été utilisé.
