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

## Résultat

**PASS.**

- candidate exacte : `19cf23c21e983be924ffd9e6af8fdb1e8e612947` ;
- QA Linux/Windows + garde sécurité/identité : `32480175617` — PASS ;
- smoke réel Thunderbird 154.0 : `32480175435` — PASS ;
- release/tag `v1.7.5` : `2384ee52df95a711424dfeb817ef114888634ed0` ;
- nom FR/EN : 40 caractères — PASS ;
- archive reviewer fraîche sans `.git` : `npm run ci` — PASS ;
- XPI reconstruit identique au XPI publié — PASS ;
- vérification indépendante des artefacts publics : `32481646372` — PASS ;
- XPI SHA-256 : `247e314911ce1006f40b78c6050f3697b7f6b1beb3f0489214e84410c668dc12` ;
- source reviewer SHA-256 : `af555557bc0d3b80d35e34a7ec1447b77ebe356c75a95ece9f28b8238fdfb1fd`.
