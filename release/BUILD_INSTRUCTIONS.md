# Instructions de build pour les reviewers — MailPin 1.7.12

La source 1.7.12 est candidate ; la release GitHub **1.7.11** est publiée. Le XPI 1.7.12 n'est pas encore public.

Python 3.11+, Node.js 20+, npm 10+. Aucune dépendance tierce à installer. Depuis le checkout MailPin 1.7.12 ou l’archive reviewer extraite sans `.git` :

```bash
npm run ci
```

Livrables candidats : `dist/MailPin_v1.7.12.xpi`, `dist/MailPin_GitHub_Repository_v1.7.12.zip`, `dist/SHA256SUMS.txt`.

Le XPI contient directement les sources lisibles de `extension/`. Le build depuis l’archive sans Git utilise le manifeste borné `.mailpin-source-files.json`. La reproductibilité locale ne prouve pas l’identité binaire inter-OS. Voir `../VALIDATION_REPORT_1.7.12.md` pour les contrôles réellement exécutés.
