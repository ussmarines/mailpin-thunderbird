# Rapport de validation — MailPin 1.7.7

## Objectif

Démontrer que MailPin démarre et conserve son intégration principale sur Thunderbird 155.0 après le durcissement du chargeur de sous-scripts privilégiés, puis confirmer que la release publique correspond au commit réellement validé.

## Preuve pré-versionnement

- head : `2dc4fd24e303d5d9e3d5fc0275ed150b54893741` ;
- QA : `33687513879` — PASS ;
- smoke réel Thunderbird 155.0 : `33687513777` — PASS ;
- binaire Thunderbird officiel et geckodriver épinglé vérifiés par SHA avant exécution.

## Candidate exacte 1.7.7

- head : `94ce4d2656df8eb9694ce794743b82c00d83e8a9` ;
- QA `33688297275` : Full verification Linux — PASS ; Source and model checks Windows — PASS ; Security guard regression — PASS ;
- CodeQL : PASS, aucune nouvelle alerte dans le code modifié ;
- smoke réel Thunderbird 155.0 `33688296968` — PASS ;
- build/reproductibilité XPI et archive source — PASS.

## Intégration sur main

- squash PR #75 : `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` ;
- QA post-merge `33689155033` : Linux — PASS ; Windows — PASS ; Security guard regression — PASS ;
- smoke réel Thunderbird 155.0 post-merge `33689155048` — PASS.

## Publication

Le workflow canonique `Release` `33689378381` a exécuté `npm run ci`, préparé les métadonnées puis publié `v1.7.7` depuis le commit exact `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb`.

Artefacts observés dans la release GitHub :

- `MailPin_v1.7.7.xpi` — SHA-256 `ec80836aebcb972d8148063cd4035df836e5e66a663003e7785146a7d798ce4e` ;
- `MailPin_GitHub_Repository_v1.7.7.zip` — SHA-256 `c921436872c10db42b370947f1caa701a20fac69f2f5f0a7c1fecdfd277d5d49` ;
- `SHA256SUMS.txt` — asset SHA-256 `3e90d12adff3b84b665a21c63bd8f1f66a706086ec7fe056c795f1148165c9dd`.

L’empreinte XPI publique est identique à l’empreinte du build candidat observée avant publication.

## Verdict

**PASS GitHub / Thunderbird 155.0.** Les gates applicables à la maintenance 1.7.7 sont démontrés. Une soumission Add-ons for Thunderbird ou une recette humaine supplémentaire restent des étapes séparées et ne sont pas présentées comme exécutées.
