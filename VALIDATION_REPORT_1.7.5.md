# Rapport de validation — MailPin 1.7.5

## Objectif

Valider la correction de conformité ATN : le nom localisé de la 1.7.4 faisait 56 caractères alors que le formulaire ATN impose un maximum de 50.

## Critères PASS/FAIL

PASS exige :
- `extensionName` FR et EN exactement `MailPin — Email Follow-up & Productivity` ;
- longueur du nom = 40 caractères et ≤ 50 ;
- version 1.7.5 synchronisée ;
- ID et plage Thunderbird inchangés ;
- QA Linux/Windows et build reproductible PASS ;
- smoke Thunderbird 154.0 PASS sur le head exact ;
- artefacts publiés et archive reviewer reproductible hors `.git`.

## État

Le contrôle statique du nom est préparé. Les gates CI/runtime/publication restent à exécuter et ne sont pas présentés comme PASS avant preuve.
