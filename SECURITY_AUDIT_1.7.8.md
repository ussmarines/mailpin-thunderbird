# Audit de sécurité — MailPin 1.7.8

## Portée

Maintenance de publication basée sur l’état Git final après 1.7.7. Le runtime Thunderbird 155, le chargeur Experiment borné, les permissions, schémas, stockage et `PinCompatibility` sont inchangés.

## Frontière privilégiée

Le correctif Thunderbird 155 reste `loadSubScriptWithOptions(..., {target: PIN_MODULES, allowUnsafeURL: true})`, limité aux noms fixes de `MODULE_PATHS` résolus sous `context.extension.rootURI`. Aucune entrée utilisateur, donnée mail ou URL distante ne construit ces chemins. Le réseau runtime reste absent.

## Preuves

- candidate `e48a12239c674e1f8a909b22a04c0c3266eca70e` : QA `33691697322` PASS, smoke Thunderbird 155.0 `33691697345` PASS ;
- main/tag target `800c07315ee7f8611f2d2fc6e12a4f2c2d74b849` : QA `33691785442` PASS, smoke `33691785284` PASS ;
- Release `33691919194` : build et publication PASS.

Aucune nouvelle permission, migration, dépendance runtime ou surface réseau n’est introduite par 1.7.8. Codex Security n’est pas utilisé.
