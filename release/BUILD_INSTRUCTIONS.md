# Instructions de build pour les reviewers — MailPin 1.7.13

La source 1.7.13 est une candidate ; la release GitHub **1.7.12** est publiée. Aucun artefact 1.7.13 n'est publié sur GitHub à ce stade.

Python 3.11+, Node.js 20+, npm 10+. Aucune dépendance tierce à installer. Depuis le checkout MailPin 1.7.13 ou l’archive reviewer extraits sans `.git` :

```bash
npm run ci
```

Livrables candidats : `dist/MailPin_v1.7.13.xpi`, `dist/MailPin_GitHub_Repository_v1.7.13.zip`, `dist/SHA256SUMS.txt`.

Le XPI contient les sources lisibles de `extension/`. Le build depuis l’archive sans Git utilise `.mailpin-source-files.json`. Les gates CI GitHub, smoke Thunderbird 160.0 et release officielle ne sont pas prouvés. Voir `../VALIDATION_REPORT_1.7.13.md`.
