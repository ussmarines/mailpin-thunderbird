# Instructions de build pour les reviewers — MailPin 1.7.4

## État

La release GitHub **1.7.4** est publiée. La source **1.7.4** correspond à la version publiée compatible Thunderbird 154.

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

La version publiée étend la compatibilité déclarée de Thunderbird `153.0` à `154.*` et teste le runtime sur le binaire officiel Thunderbird 154.0. Elle n’ajoute aucune permission, dépendance runtime, migration, schéma, réseau, télémétrie, publicité ou code distant.

## Preuves

1. candidate exacte `c2527b57de4775f4fd228af22b9792937e7ce6ea` : QA Linux/Windows + garde sécurité `32300356172` — PASS ;
2. même candidate : smoke réel Thunderbird 154.0 `32300356085` — PASS ;
3. déclencheur de publication : QA `32300831724` — PASS ;
4. tag `v1.7.4` : identique au commit `b74c0c7f264cf387269be0aaf18e47e99cf07600`.

XPI SHA-256 : `f5a9031ed1b3bad059516f659280b447c6654edd9900e5267d576cecc8b377d8`. Archive source SHA-256 : `bf308142f4a27ec091eb0b9bef2744e33df93677b41dcb97243d5070364a91c6`.

Avant soumission ATN, exécuter encore exactement `npm run ci` depuis une extraction neuve de l’archive source publiée sans `.git` et consigner le résultat. Ce gate n’est pas déclaré PASS ici tant qu’il n’a pas été exécuté sur l’archive publiée.
