# Instructions de build pour les reviewers — MailPin 1.7.5

## État

La release GitHub **1.7.4** est publiée. La source **1.7.5** est une candidate de conformité ATN ; elle conserve la compatibilité Thunderbird 153.0–154.*.

## Environnement

- Ubuntu 24.04 ou équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git uniquement pour un checkout ou les contrôles d’historique.

Git n’est pas requis pour reproduire le build depuis l’archive source extraite. Aucune dépendance npm/Python tierce n’est installée.

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

Les SHA-256 et preuves du head exact seront consignés après les gates et la publication.
