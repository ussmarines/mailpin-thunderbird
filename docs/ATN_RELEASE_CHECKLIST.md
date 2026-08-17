# Checklist Add-ons for Thunderbird — MailPin 1.7.3

Dernière release GitHub publique : **1.7.3**. La **version source 1.7.3** est publiée sur GitHub ; la soumission Add-ons for Thunderbird (ATN) reste une étape distincte.

## Identité et build

- [x] ID `ussmarines.mailpin@addons.thunderbird.net`, licence et local-first inchangés ;
- [x] version source 1.7.3 synchronisée dans manifeste/package/état publié ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] aucune feuille corrective `interaction-stability.css` chargée au runtime ;
- [x] release `v1.7.3` publiée depuis `814e07adc82f0a1b19051c83fbb0fec6a22836b0` ;
- [x] XPI publié — SHA-256 `66a10432457a509b9c9959e3df7bcdd2415d14668284b6104803dfa1d9362bc4` ;
- [x] archive source publiée — SHA-256 `ff5999a8b73392b0ad7e6778c69602ddddeeb687a3263d2162b2f93afddaf767` ;
- [x] `SHA256SUMS.txt` publié — SHA-256 `af405970d942b42cbb1d224538795811ddc00ba3cadba3ab9de6e53eea1194e9`.

## Compatibilité / UI

- [x] Manifest V3, permission `menus` uniquement, Thunderbird 153.0–153.* ;
- [x] QA Linux/Windows candidate exacte `a247dc53e3b707335b04ae00b227acad52ddb8b5` — run `32028928653` PASS ;
- [x] smoke Thunderbird réel candidate exacte — run `32028928636` PASS ;
- [x] workflow Release `32031451673` — PASS ;
- [ ] recette visuelle humaine post-correction avant ATN ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels si revendiqués dans la soumission ;
- [ ] matrice Windows/Linux/macOS exhaustive si requise par ATN.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant interdits ;
- [x] aucune modification de stockage, schéma, permission ou frontière privilégiée ;
- [x] garde sécurité/identité sur la candidate 1.7.3 ;
- [x] build reproductible et structure XPI validés par la QA/release ;
- [ ] `npm run ci` depuis une extraction neuve de la source reviewer 1.7.3 sans `.git` avant soumission ATN ;
- [ ] téléversement et revue humaine ATN.

Codex Security n’est pas utilisé. Aucun contrôle non exécuté n’est présenté comme PASS.
