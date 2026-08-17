# Passage de relais — MailPin 1.7.3 publiée

## Référence

- dépôt : `ussmarines/mailpin-thunderbird` ;
- release commit : `main` à `814e07adc82f0a1b19051c83fbb0fec6a22836b0` ;
- tag/release : `v1.7.3` ;
- version source : **1.7.3** ;
- dernière release publique : **1.7.3** ;
- `releaseStatus` : **published** ;
- ID : `ussmarines.mailpin@addons.thunderbird.net`.

## Résultat livré

La 1.7.3 publie les corrections UI intégrées en dur : suppression de `interaction-stability.css`, consolidation dans `workspace.css`, espacement renforcé entre groupes de paramètres et contraste lisible du bouton Annuler en thème sombre et clair.

## Preuves acquises

- candidate exacte `a247dc53e3b707335b04ae00b227acad52ddb8b5` ;
- QA Linux/Windows + garde sécurité `32028928653` — PASS ;
- smoke Thunderbird 153 réel `32028928636` — PASS ;
- squash release : `814e07adc82f0a1b19051c83fbb0fec6a22836b0` ;
- workflow Release `32031451673` — PASS ;
- `v1.7.3` publique, non draft, non prerelease, ciblant exactement le commit release ;
- XPI SHA-256 `66a10432457a509b9c9959e3df7bcdd2415d14668284b6104803dfa1d9362bc4` ;
- archive source SHA-256 `ff5999a8b73392b0ad7e6778c69602ddddeeb687a3263d2162b2f93afddaf767` ;
- `SHA256SUMS.txt` SHA-256 `af405970d942b42cbb1d224538795811ddc00ba3cadba3ab9de6e53eea1194e9`.

## Restant hors publication GitHub

- recette visuelle humaine post-correction avant ATN ;
- `npm run ci` depuis une extraction neuve de la source reviewer 1.7.3 sans `.git` avant soumission ATN ;
- téléversement et revue ATN ;
- matrices fournisseurs/systèmes réels uniquement si elles sont nécessaires à la soumission.

Aucun contrôle manuel non exécuté n’est revendiqué comme PASS. Codex Security n’est pas utilisé.
