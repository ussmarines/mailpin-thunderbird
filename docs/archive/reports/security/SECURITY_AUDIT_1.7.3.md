# Audit de sécurité — MailPin 1.7.3

## Périmètre

MailPin 1.7.3 est une maintenance UI. Le diff runtime issu de la PR #49 supprime `extension/styles/interaction-stability.css`, retire son chargement dynamique de `theme.js` et consolide les règles dans `workspace.css`. Aucun accès privilégié, stockage, schéma, permission ou contrat réseau n’est modifié.

## Invariants

- Manifest V3 local ;
- ID `ussmarines.mailpin@addons.thunderbird.net` ;
- permission WebExtension `menus` uniquement ;
- `connect-src 'none'` ;
- aucune télémétrie, publicité, CDN ou code distant ;
- aucun corps complet ni pièce jointe stocké ;
- aucune nouvelle dépendance runtime/build tierce ;
- `PinCompatibility` et les adaptateurs Thunderbird sont inchangés.

## Preuves finales

Candidate exacte `a247dc53e3b707335b04ae00b227acad52ddb8b5` :

- QA Linux/Windows, garde sécurité/identité et CI complète : `32028928653` — PASS ;
- smoke Thunderbird 153 réel : `32028928636` — PASS ;
- squash vers `main` : `814e07adc82f0a1b19051c83fbb0fec6a22836b0` ;
- workflow Release `32031451673` : `npm run ci`, build reproductible et publication — PASS ;
- release `v1.7.3` publique, non draft et non prerelease, ciblant exactement le commit release ;
- XPI SHA-256 `66a10432457a509b9c9959e3df7bcdd2415d14668284b6104803dfa1d9362bc4` ;
- archive source SHA-256 `ff5999a8b73392b0ad7e6778c69602ddddeeb687a3263d2162b2f93afddaf767` ;
- `SHA256SUMS.txt` SHA-256 `af405970d942b42cbb1d224538795811ddc00ba3cadba3ab9de6e53eea1194e9`.

Les digests des assets GitHub correspondent aux empreintes produites par le workflow Release. Aucun changement supplémentaire de sécurité ou de runtime n’est intervenu après les gates candidate.

## Limites restantes

La soumission ATN reste distincte. Avant ATN, l’archive source publiée doit encore être extraite dans un répertoire neuf sans `.git` et `npm run ci` doit y être exécuté exactement, puis le résultat consigné. La recette visuelle humaine reste également séparée des preuves automatisées.

Codex Security n’est pas utilisé.
