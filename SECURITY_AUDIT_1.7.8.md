# Audit de sécurité — MailPin 1.7.8

## Portée

Maintenance de publication basée sur l’état Git final de 1.7.7. Le runtime Thunderbird 155, le chargeur Experiment borné, les permissions, schémas, stockage et `PinCompatibility` sont inchangés.

## Frontière privilégiée

Le correctif Thunderbird 155 reste `loadSubScriptWithOptions(..., {target: PIN_MODULES, allowUnsafeURL: true})`, limité aux noms fixes de `MODULE_PATHS` résolus sous `context.extension.rootURI`. Aucune entrée utilisateur, donnée mail ou URL distante ne construit ces chemins. Le réseau runtime reste absent.

## Gate 1.7.8

La release publique 1.7.7 a déjà démontré ce runtime sur Thunderbird 155.0. Le bump de manifeste 1.7.8 impose néanmoins une QA, un build reproductible et un smoke Thunderbird 155.0 frais sur le head candidat exact avant publication. Aucun résultat futur n’est présenté comme PASS avant exécution.

Codex Security n’est pas utilisé.
