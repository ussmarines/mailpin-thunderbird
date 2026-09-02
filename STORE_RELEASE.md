# Préparation MailPin 1.7.8

## État

- **Version source :** 1.7.8 — publiée
- **Dernière release publique :** 1.7.7
- **Dernière publication :** `v1.7.7`, commit `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb`
- **Nom public/localisé :** `MailPin — Email Follow-up & Productivity` — 40 caractères
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité publiée :** Thunderbird 153.0 à 155.*
- **Artefact candidat :** `MailPin_v1.7.8.xpi`
- **Fiche ATN :** https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Portée 1.7.8

La 1.7.8 republie l’état Git final synchronisé après 1.7.7. Le runtime Thunderbird 155 est inchangé ; seuls le numéro de version et les métadonnées/documents de release évoluent. La candidate exacte doit repasser QA, build reproductible et smoke Thunderbird 155.0 avant publication.

Aucune permission, migration, schéma, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant n’est ajouté.

## Portée 1.7.7

La 1.7.7 restaure le démarrage de MailPin sur Thunderbird 155.0 après le durcissement de `loadSubScript()`. Le chargeur de modules de l’Experiment utilise désormais `loadSubScriptWithOptions` avec `allowUnsafeURL: true` uniquement pour les fichiers locaux fixés par `MODULE_PATHS` sous la racine de l’extension.

La candidate exacte `94ce4d2656df8eb9694ce794743b82c00d83e8a9` a passé QA `33688297275` et smoke réel Thunderbird 155.0 `33688296968`. Après intégration, `main` `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` a repassé QA `33689155033` et smoke réel Thunderbird 155.0 `33689155048`. Le workflow canonique Release `33689378381` a reconstruit, validé et publié `v1.7.7` depuis ce même commit.

Aucune permission, migration, schéma, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant n’est ajouté.

## Portée 1.7.6

La 1.7.6 corrige un défaut de cold start : des épingles déjà persistées n’étaient rendues dans la boîte mail qu’après une action MailPin telle que l’ouverture du Dashboard. Le background Manifest V3 s’enregistre désormais sur `runtime.onStartup` et initialise les onglets mail existants via le chemin `setup` idempotent déjà utilisé.

Le banc Thunderbird persistant ne réactive plus artificiellement l’onglet mail et vérifie le rendu automatique après redémarrage sans Dashboard ni interaction utilisateur.

Aucune permission WebExtension, migration, schéma, stockage, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant n’est ajouté. `PinCompatibility` reste inchangé.

## Artefacts publiés

- `MailPin_v1.7.7.xpi` — SHA-256 `ec80836aebcb972d8148063cd4035df836e5e66a663003e7785146a7d798ce4e`
- `MailPin_GitHub_Repository_v1.7.7.zip` — SHA-256 `c921436872c10db42b370947f1caa701a20fac69f2f5f0a7c1fecdfd277d5d49`
- `SHA256SUMS.txt` — asset SHA-256 `3e90d12adff3b84b665a21c63bd8f1f66a706086ec7fe056c795f1148165c9dd`

## Preuves

- head pré-versionnement Thunderbird 155 `2dc4fd24e303d5d9e3d5fc0275ed150b54893741` : QA `33687513879` — PASS ; smoke réel Thunderbird 155.0 `33687513777` — PASS ;
- candidate versionnée exacte `94ce4d2656df8eb9694ce794743b82c00d83e8a9` : QA `33688297275` — PASS ; smoke réel Thunderbird 155.0 `33688296968` — PASS ; CodeQL — PASS ;
- squash sur `main` : `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` ; QA post-merge `33689155033` — PASS ; smoke réel Thunderbird 155.0 `33689155048` — PASS ;
- workflow canonique Release `33689378381` : vérification/build, métadonnées et publication — PASS ;
- release publique `v1.7.7` observée, ciblant `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` avec les trois assets attendus et leurs digests exposés par GitHub.

## Gates GitHub / ATN

- [x] cause racine Thunderbird 155 et correctif runtime démontrés ;
- [x] QA Linux/Windows sur la candidate 1.7.7 exacte ;
- [x] garde sécurité/identité ;
- [x] CodeQL sans nouvelle alerte sur le diff ;
- [x] build reproductible et structure XPI sur la candidate ;
- [x] smoke Thunderbird 155.0 réel sur la candidate 1.7.7 exacte ;
- [x] merge squash vers `main` ;
- [x] QA et smoke Thunderbird 155.0 post-merge sur `main` ;
- [x] tag/release `v1.7.7` créé par le publisher canonique ;
- [ ] éventuelle soumission ATN 1.7.7 et revue humaine, distinctes de la release GitHub ;
- [ ] recette visuelle humaine supplémentaire uniquement si elle doit être consignée comme gate formel.

Codex Security n’a pas été utilisé.
