# Audit de sécurité — MailPin 1.7.7

## Portée

Maintenance de compatibilité Thunderbird 155 : borne manifeste, smoke runtime et migration du chargeur local de modules de l’Experiment. Aucun changement de permission, schéma, stockage, `PinCompatibility`, réseau runtime ou dépendance runtime.

## Point sensible Thunderbird 155

Thunderbird 155 bloque les sous-scripts `jar:` avec `loadSubScript()` par défaut. MailPin utilise `loadSubScriptWithOptions` avec `allowUnsafeURL: true` uniquement pour les noms de fichiers fixés dans `MODULE_PATHS` et résolus sous `context.extension.rootURI`. Aucune entrée API, donnée mail ou URL utilisateur ne construit ce chemin. Le réseau runtime reste absent.

## Preuve disponible

Le head pré-versionnement `2dc4fd24e303d5d9e3d5fc0275ed150b54893741` a passé QA `33687513879` et le smoke réel Thunderbird 155.0 `33687513777`. Les gates du head versionné exact 1.7.7 restent à exécuter avant publication.

Codex Security n’est pas utilisé.
