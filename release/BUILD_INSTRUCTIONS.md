# Instructions de build pour les reviewers — MailPin 1.7.4

## État

La release GitHub **1.7.3** est publiée. La source **1.7.4** est une candidate de compatibilité Thunderbird 154 et n’est pas encore publiée.

## Environnement

- Ubuntu 24.04 ou équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git uniquement pour un checkout ou les contrôles d’historique.

**Git n’est pas requis pour reproduire le build depuis l’archive source extraite.** Aucune dépendance npm/Python tierce n’est installée.

## Reproduction

Dans un checkout de la source MailPin 1.7.4 ou dans l’archive reviewer extraite sans `.git` :

```bash
npm run ci
```

Livrables :

```text
dist/MailPin_v1.7.4.xpi
dist/MailPin_GitHub_Repository_v1.7.4.zip
dist/SHA256SUMS.txt
```

Sans `.git`, le garde de sécurité et le build utilisent exclusivement `.mailpin-source-files.json`. Les chemins absolus, traversées `..`, doublons, symlinks et fichiers absents sont refusés. `security_guard.py --history` reste réservé à un checkout Git.

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript/CSS n’est minifié, transpilé, concaténé, généré ou obfusqué.

## Portée 1.7.4

La candidate étend la compatibilité déclarée de Thunderbird `153.0` à `154.*` et teste le runtime sur le binaire officiel Thunderbird 154.0. Elle n’ajoute aucune permission, dépendance runtime, migration, schéma, réseau, télémétrie, publicité ou code distant.

## Preuves pré-versionnement

1. QA Linux/Windows + garde sécurité sur `3e1943f2be7a18ebcceef5952810675442e91a33` : `32299537328` — PASS ;
2. smoke réel Thunderbird 154.0 sur le même head : `32299537485` — PASS.

La candidate versionnée 1.7.4 doit repasser QA, build et smoke 154 sur son head exact avant merge/publication. Les SHA-256 des artefacts seront consignés uniquement après le workflow Release.

Avant soumission ATN, exécuter encore exactement `npm run ci` depuis une extraction neuve de l’archive source publiée sans `.git` et consigner le résultat. Ce gate n’est pas déclaré PASS ici tant qu’il n’a pas été exécuté sur l’archive publiée.
