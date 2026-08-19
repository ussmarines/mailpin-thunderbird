# Passage de relais — MailPin 1.7.4 publiée pour Thunderbird 154

## Référence

- dépôt : `ussmarines/mailpin-thunderbird` ;
- branche de finalisation : `release/finalize-1.7.4` ;
- version source : **1.7.4** ;
- dernière release publique : **1.7.4** ;
- `releaseStatus` : **published** ;
- ID : `ussmarines.mailpin@addons.thunderbird.net` ;
- compatibilité publiée : Thunderbird `153.0` à `154.*`.

## Résultat

MailPin 1.7.4 corrige l’incompatibilité d’installation avec Thunderbird 154. La cause était `strict_max_version: 153.*`. Le correctif étend la plage à `154.*` et déplace le smoke sur le binaire officiel Thunderbird 154.0, sans changement métier, permission, stockage, schéma, dépendance runtime ou réseau.

## Preuves

- candidate exacte `c2527b57de4775f4fd228af22b9792937e7ce6ea` : QA `32300356172` PASS ;
- même candidate : smoke réel Thunderbird 154.0 `32300356085` PASS ;
- déclencheur de publication : QA `32300831724` PASS ;
- tag `v1.7.4` identique au commit `b74c0c7f264cf387269be0aaf18e47e99cf07600` ;
- XPI reproductible : SHA-256 `f5a9031ed1b3bad059516f659280b447c6654edd9900e5267d576cecc8b377d8` ;
- source reviewer reproductible : SHA-256 `bf308142f4a27ec091eb0b9bef2744e33df93677b41dcb97243d5070364a91c6`.

## Reste hors gate GitHub

- recette humaine visuelle/fournisseurs si souhaitée ;
- soumission et revue ATN ;
- futurs Thunderbird >154 : nouveau smoke réel requis.

Codex Security n’a pas été utilisé.
