# Instructions de build pour les reviewers — MailPin 1.7.8

Artefact XPI attendu : `MailPin_v1.7.8.xpi`. La release GitHub **1.7.8** est publiée.

## Environnement

- Ubuntu 24.04 ou équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git uniquement pour un checkout ou les contrôles d’historique.

**Git n’est pas requis** pour reproduire le build depuis l’archive source extraite. Aucune dépendance npm/Python tierce n’est installée.

## Reproduction

Dans un checkout de la source MailPin 1.7.8 ou dans l’archive reviewer extraite sans `.git` :

```bash
npm run ci
```

Livrables :

```text
dist/MailPin_v1.7.8.xpi
dist/MailPin_GitHub_Repository_v1.7.8.zip
dist/SHA256SUMS.txt
```

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript/CSS n’est minifié, transpilé, concaténé, généré ou obfusqué.

## Portée et preuves

La 1.7.8 ne modifie pas le runtime Thunderbird 155 validé. Candidate `e48a12239c674e1f8a909b22a04c0c3266eca70e` : QA `33691697322` PASS, smoke `33691697345` PASS. Tag `v1.7.8` : cible `800c07315ee7f8611f2d2fc6e12a4f2c2d74b849`, après QA `33691785442` et smoke `33691785284` PASS. Workflow Release `33691919194` PASS.

SHA-256 public du XPI : `b007f9ad0213bb5672e5273c27b4f0d3935897fc2696922acd2e2dd673b5048e`.
