# Instructions de build pour les reviewers — MailPin 1.7.3

## État

La release GitHub **1.7.3** est publiée. La source **1.7.3** correspond à cette release et cible le commit `814e07adc82f0a1b19051c83fbb0fec6a22836b0`.

## Environnement

- Ubuntu 24.04 ou équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git uniquement pour un checkout ou les contrôles d’historique.

**Git n’est pas requis pour reproduire le build depuis l’archive source extraite.** Aucune dépendance npm/Python tierce n’est installée.

## Reproduction

Dans un checkout de la source 1.7.3 ou dans l’archive reviewer extraite sans `.git` :

```bash
npm run ci
```

Livrables :

```text
dist/MailPin_v1.7.3.xpi
dist/MailPin_GitHub_Repository_v1.7.3.zip
dist/SHA256SUMS.txt
```

Sans `.git`, le garde de sécurité et le build utilisent exclusivement `.mailpin-source-files.json`. Les chemins absolus, traversées `..`, doublons, symlinks et fichiers absents sont refusés. `security_guard.py --history` reste réservé à un checkout Git.

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript/CSS n’est minifié, transpilé, concaténé, généré ou obfusqué.

## Portée 1.7.3

La release supprime `interaction-stability.css` et consolide les corrections UI dans `workspace.css`, renforce l’espacement des groupes de réglages et le contraste Annuler. Elle n’ajoute aucune permission, dépendance runtime, migration, schéma, réseau, télémétrie, publicité ou code distant.

## Preuves de publication

1. QA Linux/Windows + garde sécurité sur la candidate exacte `a247dc53e3b707335b04ae00b227acad52ddb8b5` : run `32028928653` — PASS ;
2. smoke Thunderbird réel : run `32028928636` — PASS ;
3. build reproductible et structure XPI : PASS dans la QA et le workflow Release ;
4. merge PR release vers `main` : `814e07adc82f0a1b19051c83fbb0fec6a22836b0` ;
5. workflow Release : `32031451673` — PASS ;
6. XPI publié SHA-256 `66a10432457a509b9c9959e3df7bcdd2415d14668284b6104803dfa1d9362bc4` ;
7. archive source publiée SHA-256 `ff5999a8b73392b0ad7e6778c69602ddddeeb687a3263d2162b2f93afddaf767` ;
8. `SHA256SUMS.txt` publié SHA-256 `af405970d942b42cbb1d224538795811ddc00ba3cadba3ab9de6e53eea1194e9`.

Avant soumission ATN, exécuter encore exactement `npm run ci` depuis une extraction neuve de l’archive source publiée sans `.git` et consigner le résultat. Ce gate n’est pas déclaré PASS ici tant qu’il n’a pas été exécuté sur l’archive publiée.
