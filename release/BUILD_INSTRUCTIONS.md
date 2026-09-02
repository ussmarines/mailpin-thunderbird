# Instructions de build pour les reviewers — MailPin 1.7.7

Artefact XPI publié attendu : `MailPin_v1.7.7.xpi`. La release GitHub **1.7.7** est publiée et correspond à la source **1.7.7**.

## État

La release GitHub **1.7.7** est publiée. Elle restaure la compatibilité Thunderbird 155.0 après le durcissement du chargement des sous-scripts privilégiés. La plage revendiquée est Thunderbird 153.0–155.*.

## Environnement

- Ubuntu 24.04 ou équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git uniquement pour un checkout ou les contrôles d’historique.

**Git n’est pas requis** pour reproduire le build depuis l’archive source extraite. Aucune dépendance npm/Python tierce n’est installée.

## Reproduction

Dans un checkout de la source MailPin 1.7.7 ou dans l’archive reviewer extraite sans `.git` :

```bash
npm run ci
```

Livrables :

```text
dist/MailPin_v1.7.7.xpi
dist/MailPin_GitHub_Repository_v1.7.7.zip
dist/SHA256SUMS.txt
```

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript/CSS n’est minifié, transpilé, concaténé, généré ou obfusqué.

## Portée 1.7.7

Thunderbird 155.0 refuse par défaut les sous-scripts `jar:`, `file:` et `moz-extension:` chargés par `loadSubScript()`. MailPin charge ses modules Experiment depuis l’XPI ; le chargeur utilise donc `loadSubScriptWithOptions` avec `allowUnsafeURL: true`, limité aux noms de fichiers fixés dans `MODULE_PATHS` et résolus sous `context.extension.rootURI`.

La version n’ajoute aucune permission, dépendance runtime, migration, schéma, réseau, télémétrie, publicité ou code distant. `PinCompatibility`, le stockage et le correctif cold-start de 1.7.6 restent inchangés.

## Preuves

- candidate versionnée `94ce4d2656df8eb9694ce794743b82c00d83e8a9` : QA `33688297275` — PASS ;
- smoke réel Thunderbird 155.0 sur la candidate : `33688296968` — PASS ;
- `main` `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` : QA post-merge `33689155033` — PASS ;
- smoke réel Thunderbird 155.0 post-merge : `33689155048` — PASS ;
- workflow canonique Release `33689378381` : `npm run ci`, métadonnées et publication — PASS ;
- tag `v1.7.7` : cible `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` ;
- XPI public SHA-256 : `ec80836aebcb972d8148063cd4035df836e5e66a663003e7785146a7d798ce4e` ;
- archive source publique SHA-256 : `c921436872c10db42b370947f1caa701a20fac69f2f5f0a7c1fecdfd277d5d49`.
