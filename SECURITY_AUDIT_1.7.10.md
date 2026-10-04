# Audit de sécurité — MailPin 1.7.10

## Résultat

**PASS.** La compatibilité Thunderbird 157 modifie la borne de manifeste et le smoke runtime, sans élargir la surface de sécurité runtime.

## Frontière privilégiée

Le chargeur Experiment reste `loadSubScriptWithOptions(..., {target: PIN_MODULES, allowUnsafeURL: true})`, limité aux noms fixes de `MODULE_PATHS` sous `context.extension.rootURI`. `PinCompatibility`, permissions, schémas, stockage, CSP et absence de réseau runtime restent inchangés.

Candidate `565f565710da6262d7a91bfbe280a943047cdc6c` : garde sécurité/QA `37213680870` PASS et smoke Thunderbird 157.0.1 `37213680824` PASS. Target `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0` : QA `37213779632`, smoke `37213779633` et CodeQL `37213779727` PASS. Release `37214354533` PASS.

Codex Security n’a pas été utilisé.
