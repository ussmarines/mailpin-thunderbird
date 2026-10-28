# Instructions de build pour les reviewers — MailPin 1.7.12

La source 1.7.12 est publiée ; la release GitHub **1.7.12** est publiée sur le commit `968832d1f2db39a227e16c0f079d3ba06f669359`.

Python 3.11+, Node.js 20+, npm 10+. Aucune dépendance tierce à installer. Depuis le checkout MailPin 1.7.12 ou l’archive reviewer extraite sans `.git` :

```bash
npm run ci
```

Livrables publics : `dist/MailPin_v1.7.12.xpi`, `dist/MailPin_GitHub_Repository_v1.7.12.zip`, `dist/SHA256SUMS.txt`.

Le XPI contient directement les sources lisibles de `extension/`. Le build depuis l’archive sans Git utilise le manifeste borné `.mailpin-source-files.json`. La reproductibilité locale ne prouve pas l’identité binaire inter-OS. La CI `40755717992`, le smoke Thunderbird 159.0 `40755718258` et le publisher `40755984476` sont PASS ; voir `../VALIDATION_REPORT_1.7.12.md`. Les checksums GitHub des assets sont disponibles ; re-téléchargement et comparaison indépendante des octets non exécutés.
