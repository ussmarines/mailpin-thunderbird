# Rapport de validation — MailPin 1.7.6

## Objectif

Valider la correction du défaut de cold start où les épingles persistées n’étaient rendues dans la boîte mail qu’après une action MailPin telle que l’ouverture du Dashboard.

## Critères PASS/FAIL

PASS exige :
- version 1.7.6 synchronisée dans le manifeste, le package et l’état projet ;
- cold start Thunderbird 154.0 réel avec épingles persistées rendues automatiquement sans Dashboard ni interaction ;
- background réveillé par `APP_STARTUP`/`runtime.onStartup` ;
- panneau et toggle uniques, aucune duplication après les chemins de setup répétés ;
- persistance conservée sans perte ni doublon ;
- aucun changement lu/non-lu ou compteurs natifs ;
- QA Linux/Windows et build reproductible PASS ;
- archive source sans `.git` capable de reconstruire le même XPI ;
- publication `v1.7.6` uniquement après ces gates.

## Preuve pré-versionnement

Le correctif runtime exact de la PR #64 (`26fc0ac9b4d35009f125f543eefc5de9338bef71`) a reproduit le FAIL puis passé le cold start réel, la QA `32639780333` et le smoke Thunderbird 154.0 `32639780313`. Le merge `main` correspondant est `fa6782f8ecfaf259d9b8e54a08e5cf361172c669`.

## État

**CANDIDATE — gates exacts 1.7.6 à exécuter.**

Le versionnement modifie le manifeste et invalide donc la preuve runtime comme preuve finale de la candidate. Aucun QA/smoke/publication 1.7.6 futur n’est présenté comme PASS avant exécution réelle.
