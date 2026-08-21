# Instructions de build pour les reviewers — MailPin 1.7.5

## État

La release GitHub **1.7.5** est publiée. La source **1.7.5** correspond à la version officielle destinée à ATN et conserve la compatibilité Thunderbird 153.0–154.*.

## Environnement

- Ubuntu 24.04 ou équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git uniquement pour un checkout ou les contrôles d’historique.

**Git n’est pas requis** pour reproduire le build depuis l’archive source extraite. Aucune dépendance npm/Python tierce n’est installée.

## Reproduction

Dans un checkout de la source MailPin 1.7.5 ou dans l’archive reviewer extraite sans `.git` :

```bash
npm run ci
```

Livrables :

```text
dist/MailPin_v1.7.5.xpi
dist/MailPin_GitHub_Repository_v1.7.5.zip
dist/SHA256SUMS.txt
```

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript/CSS n’est minifié, transpilé, concaténé, généré ou obfusqué.

## Portée 1.7.5

La 1.7.5 raccourcit uniquement le nom localisé à `MailPin — Email Follow-up & Productivity` pour respecter la limite ATN de 50 caractères. Elle n’ajoute aucune permission, dépendance runtime, migration, schéma, réseau, télémétrie, publicité ou code distant.

## Preuves

- candidate exacte `19cf23c21e983be924ffd9e6af8fdb1e8e612947` : QA `32480175617` — PASS ;
- smoke réel Thunderbird 154.0 `32480175435` — PASS ;
- tag `v1.7.5` : `2384ee52df95a711424dfeb817ef114888634ed0` ;
- le publisher a exécuté `npm run ci` depuis une extraction neuve de l’archive source publiée sans `.git` et a vérifié que le XPI reconstruit avait le même SHA-256 que le XPI initial ;
- artefacts publics revérifiés dans le run `32481646372` — PASS ;
- l’arbre documentaire final a repassé `npm run ci` dans le finalizer `32482483497` et la QA finale `32482703556`.

XPI officiel SHA-256 : `247e314911ce1006f40b78c6050f3697b7f6b1beb3f0489214e84410c668dc12`.

L’asset source joint à la release GitHub au moment du tag a pour SHA-256 `af555557bc0d3b80d35e34a7ec1447b77ebe356c75a95ece9f28b8238fdfb1fd`. Pour la soumission ATN, une archive reviewer est générée depuis l’arbre documentaire final afin d’inclure l’état publié et ces instructions à jour ; son SHA-256 est communiqué séparément dans la soumission et n’est volontairement pas auto-référencé dans l’archive elle-même.
