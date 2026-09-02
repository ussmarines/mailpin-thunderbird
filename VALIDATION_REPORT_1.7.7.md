# Rapport de validation — MailPin 1.7.7

## Objectif

Démontrer que MailPin démarre et conserve son intégration principale sur Thunderbird 155.0 après le durcissement du chargeur de sous-scripts privilégiés.

## Preuve pré-versionnement

- head : `2dc4fd24e303d5d9e3d5fc0275ed150b54893741` ;
- QA : `33687513879` — PASS ;
- smoke réel Thunderbird 155.0 : `33687513777` — PASS ;
- binaire Thunderbird officiel et geckodriver épinglé vérifiés par SHA avant exécution.

## Gate candidate 1.7.7

**CANDIDATE — gates exacts à exécuter.** Le bump de version modifie le manifeste et impose une QA/build ainsi qu’un smoke Thunderbird 155.0 frais sur le head versionné exact. Aucun résultat futur n’est présenté comme PASS avant son exécution.
