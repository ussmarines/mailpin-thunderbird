# Préparation MailPin 1.7.3

## État

- **Version source :** 1.7.3 — publiée
- **Dernière release publique :** 1.7.3
- **Dernière publication :** `v1.7.3`, commit `814e07adc82f0a1b19051c83fbb0fec6a22836b0`
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 153.*

## Portée 1.7.3

La 1.7.3 consolide les corrections UI directement dans `extension/styles/workspace.css`, supprime la feuille corrective `interaction-stability.css`, augmente l’espace entre groupes de paramètres et corrige le contraste du bouton Annuler dans la barre de sauvegarde.

Aucune permission WebExtension, logique métier, migration, schéma, stockage, dépendance runtime, connexion réseau, télémétrie, publicité, code distant ou identité n’est modifié.

## Preuves

Candidate exacte `a247dc53e3b707335b04ae00b227acad52ddb8b5` :

- QA Linux/Windows + garde sécurité `32028928653` — PASS ;
- smoke Thunderbird réel `32028928636` — PASS ;
- squash dans `main` : `814e07adc82f0a1b19051c83fbb0fec6a22836b0` ;
- workflow Release `32031451673` — PASS ;
- release GitHub `v1.7.3` publique, non draft et non prerelease.

## Artefacts publiés

- `MailPin_v1.7.3.xpi` — 254 564 octets — SHA-256 `66a10432457a509b9c9959e3df7bcdd2415d14668284b6104803dfa1d9362bc4` ;
- `MailPin_GitHub_Repository_v1.7.3.zip` — 683 629 octets — SHA-256 `ff5999a8b73392b0ad7e6778c69602ddddeeb687a3263d2162b2f93afddaf767` ;
- `SHA256SUMS.txt` — 188 octets — SHA-256 `af405970d942b42cbb1d224538795811ddc00ba3cadba3ab9de6e53eea1194e9`.

Les digests publiés par GitHub correspondent exactement aux empreintes produites pendant le workflow Release.

## Gates de publication

- [x] QA Linux/Windows sur la candidate 1.7.3 exacte ;
- [x] garde sécurité/identité ;
- [x] build reproductible et structure XPI ;
- [x] smoke Thunderbird 153 réel sur la candidate exacte ;
- [x] merge PR release sur `main` ;
- [x] workflow Release depuis `main` ;
- [x] `v1.7.3` publique et empreintes des artefacts vérifiées.

La recette visuelle humaine supplémentaire reste distincte des preuves automatisées et n’est pas déclarée comme exécutée si elle ne l’a pas été.

Codex Security n’est pas utilisé.
