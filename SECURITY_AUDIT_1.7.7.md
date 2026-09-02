# Audit de sécurité — MailPin 1.7.7

## Portée

Maintenance de compatibilité Thunderbird 155 : borne manifeste, smoke runtime et migration du chargeur local de modules de l’Experiment. Aucun changement de permission, schéma, stockage, `PinCompatibility`, réseau runtime ou dépendance runtime.

## Point sensible Thunderbird 155

Thunderbird 155 bloque les sous-scripts `jar:`, `file:` et `moz-extension:` avec `loadSubScript()` par défaut. MailPin utilise `loadSubScriptWithOptions` avec `allowUnsafeURL: true` uniquement pour les noms de fichiers fixés dans `MODULE_PATHS` et résolus sous `context.extension.rootURI`. Aucune entrée API, donnée mail ou URL utilisateur ne construit ce chemin. Le réseau runtime reste absent.

L’opt-in ne transforme donc pas les données mail ni les entrées utilisateur en capacité de chargement de code. La surface reste la liste locale statique des modules privilégiés déjà livrés dans l’XPI.

## Preuves

- head pré-versionnement `2dc4fd24e303d5d9e3d5fc0275ed150b54893741` : QA `33687513879` et smoke réel Thunderbird 155.0 `33687513777` — PASS ;
- candidate exacte `94ce4d2656df8eb9694ce794743b82c00d83e8a9` : QA `33688297275`, smoke réel Thunderbird 155.0 `33688296968` et CodeQL — PASS ;
- `main` `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` : QA post-merge `33689155033` et smoke réel Thunderbird 155.0 `33689155048` — PASS ;
- workflow canonique Release `33689378381` : `npm run ci`, build et publication `v1.7.7` — PASS ;
- XPI public SHA-256 `ec80836aebcb972d8148063cd4035df836e5e66a663003e7785146a7d798ce4e`.

## Invariants conservés

- aucune permission WebExtension nouvelle ;
- aucune migration ou modification de schéma ;
- aucun réseau runtime, télémétrie, publicité, CDN ou code distant ;
- aucun changement du corps stocké ou des pièces jointes ;
- `PinCompatibility` reste la frontière Messages/Tags/Agenda ;
- l’épinglage ne change pas l’état lu/non-lu ni les compteurs natifs ;
- les ressources injectées restent nettoyées au cycle de vie.

Codex Security n’a pas été utilisé.
