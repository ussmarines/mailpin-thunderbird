# Rapport de validation — candidate MailPin 1.7.13 / Thunderbird 160.0

**STATUT : PAS DE RELEASE PUBLIÉE ET PAS DE PREUVE RUNTIME THUNDERBIRD 160.0.**

## Base et changements

- Base GitHub inspectée : `main` `9af16307b3bf43aef274c6a9b252092934d4ab9e`.
- Source reconstituée à partir de l’artefact `development-build` du run QA GitHub `41449240527`, source reviewer SHA-256 `7aca4d6cab646eb11052359bfdff5c26bea489136339d2ae7cc1575c5029d4f9` ; il ne s'agit pas d'un checkout Git natif.
- Candidate : `1.7.13` ; dernière release publique `1.7.12` ; manifeste déclaré `153.0`–`160.*` ; version smoke `160.0`.
- Portée : version, limite du manifeste, cible smoke, gardes statiques et documentation ; runtime et privilèges inchangés.

## Gates

| Contrôle | État |
| --- | --- |
| `npm run check` local (scripts de sécurité, cohérence, versions, audit et secrets) | **PASS** sur la source candidate ; aucun test Thunderbird réalisé |
| Tests statiques, modèles et contrats `npm test` | **PASS** ; vérifications ciblées et complète après ajout des nouveaux rapports suivis par Git |
| `npm run build` reproductible | **PASS** ; archives XPI/source et SHA256SUMS produites localement |
| QA Linux/Windows sur SHA GitHub candidate | NON EXÉCUTÉ |
| CodeQL sur SHA GitHub candidate | NON EXÉCUTÉ |
| Smoke réel Thunderbird 160.0 (binaire Mozilla, checksum) | NON EXÉCUTÉ |
| Inspection réelle du panneau MailPin 160.0 | NON EXÉCUTÉ |
| PR, merge squash, CI cible `main`, tag et release | NON EFFECTUÉS |
| Assets publics XPI/source/SHA256SUMS et empreintes vérifiés | NON EFFECTUÉS |

Les résultats locaux ont été exécutés dans un espace de travail reconstitué à partir de l’archive GitHub Actions ; ils ne prouvent ni le comportement Thunderbird 160.0 ni l’exécution des workflows GitHub sur la nouvelle candidate.

Une release GitHub ne doit pas être annoncée comme publiée tant que ces étapes n'ont pas produit des preuves contrôlées. La revue ATN est distincte.
