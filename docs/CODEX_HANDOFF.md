# Passage de relais — MailPin 1.7.7 publiée

## État

- branche courante : `main` ;
- version source : **1.7.7** ;
- dernière release publique : **1.7.7** ;
- Thunderbird : 153.0 à 155.* ;
- ID : `ussmarines.mailpin@addons.thunderbird.net` ;
- nom ATN : `MailPin — Email Follow-up & Productivity` — 40 caractères.

## Résultat

La maintenance 1.7.7 est publiée sur GitHub. Thunderbird 155.0 a durci `loadSubScript()` et refusait les sous-scripts de l’XPI avec `Trying to load untrusted URI`. MailPin utilise désormais `loadSubScriptWithOptions` avec `allowUnsafeURL: true` uniquement pour la liste fixe `MODULE_PATHS` résolue sous `context.extension.rootURI`.

Aucune permission, migration, dépendance runtime, schéma ou connexion réseau n’a été ajoutée. `PinCompatibility`, le stockage local-first, l’état lu/non-lu et les règles de nettoyage restent inchangés.

Candidate exacte `94ce4d2656df8eb9694ce794743b82c00d83e8a9` : QA `33688297275` PASS, smoke réel Thunderbird 155.0 `33688296968` PASS. Main publié `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` : QA `33689155033` PASS, smoke réel Thunderbird 155.0 `33689155048` PASS. Workflow Release `33689378381` PASS. Tag `v1.7.7` : cible `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb`.

Artefacts publics :

- `MailPin_v1.7.7.xpi` — SHA-256 `ec80836aebcb972d8148063cd4035df836e5e66a663003e7785146a7d798ce4e` ;
- `MailPin_GitHub_Repository_v1.7.7.zip` — SHA-256 `c921436872c10db42b370947f1caa701a20fac69f2f5f0a7c1fecdfd277d5d49` ;
- `SHA256SUMS.txt` — asset SHA-256 `3e90d12adff3b84b665a21c63bd8f1f66a706086ec7fe056c795f1148165c9dd`.

## Suite

La soumission Add-ons for Thunderbird 1.7.7, si souhaitée, est distincte de la release GitHub. Une recette humaine supplémentaire ou des essais sur fournisseurs réseau/calendriers distants ne doivent être déclarés PASS que s’ils sont réellement exécutés.

Codex Security n’est pas requis et n’a pas été utilisé pour cette maintenance.
