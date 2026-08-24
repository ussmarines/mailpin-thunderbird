# Rapport de validation — MailPin 1.7.4

## Objet

MailPin 1.7.4 rétablit la compatibilité d’installation avec Thunderbird 154 et déplace la preuve runtime automatisée sur le binaire officiel Thunderbird 154.0.

## Critères PASS

- manifeste : Thunderbird `153.0` à `154.*` ;
- installation et démarrage sur Thunderbird 154.0 ;
- background MV3 à `Startup: Complete` ;
- panneau et bouton MailPin injectés une seule fois dans `about:3pane` ;
- bouton Dashboard ouvrant exactement un onglet Dashboard ;
- nettoyage après désinstallation puis réinstallation propre ;
- aucune nouvelle permission, dépendance runtime, migration, schéma, logique métier ou connexion réseau ;
- QA Linux/Windows, garde sécurité et build reproductible PASS sur la candidate exacte ;
- smoke Thunderbird 154 réel PASS sur la candidate exacte.

## Preuves

Head pré-versionnement `3e1943f2be7a18ebcceef5952810675442e91a33` de la PR #52 :

- QA `32299537328` — PASS ;
- smoke réel Thunderbird 154.0 `32299537485` — PASS.

Candidate versionnée exacte `c2527b57de4775f4fd228af22b9792937e7ce6ea` :

- QA `32300356172` — PASS ;
- smoke réel Thunderbird 154.0 `32300356085` — PASS ;
- job runtime `Real Thunderbird 154 runtime smoke` : build XPI, téléchargement officiel vérifié, installation, startup, injection unique, Dashboard, désinstallation et réinstallation tous terminés avec succès.

Publication :

- déclencheur one-shot validé par QA `32300831724` — PASS ;
- tag `v1.7.4` identique au commit publié `b74c0c7f264cf387269be0aaf18e47e99cf07600` ;
- build reproductible : XPI SHA-256 `f5a9031ed1b3bad059516f659280b447c6654edd9900e5267d576cecc8b377d8` ;
- archive source SHA-256 `bf308142f4a27ec091eb0b9bef2744e33df93677b41dcb97243d5070364a91c6`.

## État final

**PASS.** La compatibilité Thunderbird 154 est démontrée sur la candidate versionnée exacte et la release `v1.7.4` est publiée sur le commit validé. Les validations humaines ATN/fournisseurs restent distinctes et ne sont pas revendiquées ici.
