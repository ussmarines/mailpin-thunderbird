# Instructions de build pour les reviewers — MailPin 1.7.13

La source 1.7.13 est publiée ; la release GitHub **1.7.13** est publiée sur le commit `9bc7a0ef2c28fc2547420ea4d1e6172d50e7cf0d`.

Python 3.11+, Node.js 20+, npm 10+. Aucune dépendance tierce à installer. Depuis le checkout MailPin 1.7.13 ou l'archive reviewer extraite sans `.git` :

```bash
npm run ci
```

Livrables publics : `dist/MailPin_v1.7.13.xpi`, `dist/MailPin_GitHub_Repository_v1.7.13.zip`, `dist/SHA256SUMS.txt`.

Le XPI contient les sources lisibles de `extension/`. Le build depuis l'archive sans Git utilise `.mailpin-source-files.json`. QA GitHub `43237043214`, smoke Thunderbird 160.0 `43237043458`, CodeQL `43237043274` et publisher `43237379954` : PASS. Vérifier les empreintes publiques dans `../VALIDATION_REPORT_1.7.13.md` ; reproductibilité binaire inter-OS non démontrée.
