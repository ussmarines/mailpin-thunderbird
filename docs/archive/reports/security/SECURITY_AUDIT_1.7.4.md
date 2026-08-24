# Audit de sécurité — MailPin 1.7.4

## Périmètre

MailPin 1.7.4 est une maintenance de compatibilité Thunderbird. Le changement runtime se limite à étendre `strict_max_version` de `153.*` à `154.*`; la logique métier, l’Experiment API, les adaptateurs `PinCompatibility`, le stockage et les permissions restent inchangés. Le banc runtime est déplacé sur le binaire officiel Thunderbird 154.0 afin que cette compatibilité soit démontrée et non supposée.

## Invariants

- Manifest V3 local ;
- ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- permission WebExtension `menus` uniquement ;
- `connect-src 'none'` ;
- aucune télémétrie, publicité, CDN ou code distant ;
- aucun corps complet ni pièce jointe stocké ;
- aucune nouvelle dépendance runtime/build tierce ;
- aucune migration ni modification de schéma ;
- `PinCompatibility` et les adaptateurs Thunderbird sont inchangés.

## Preuves de compatibilité

Head pré-versionnement `3e1943f2be7a18ebcceef5952810675442e91a33` de la PR #52 :

- QA Linux/Windows, garde sécurité/identité et CI complète : `32299537328` — PASS ;
- smoke sur le binaire officiel Thunderbird 154.0 : `32299537485` — PASS.

Candidate versionnée exacte `c2527b57de4775f4fd228af22b9792937e7ce6ea` :

- QA Linux/Windows, garde sécurité/identité, build et structure XPI : `32300356172` — PASS ;
- smoke réel Thunderbird 154.0 : `32300356085` — PASS ;
- téléchargements Thunderbird et geckodriver vérifiés par SHA-256 dans le workflow ;
- aucune correction de logique MailPin n’a été nécessaire pour obtenir le PASS 154.

## Publication

- déclencheur de publication validé par QA `32300831724` — PASS ;
- tag `v1.7.4` identique au commit `b74c0c7f264cf387269be0aaf18e47e99cf07600` ;
- XPI reproductible SHA-256 `f5a9031ed1b3bad059516f659280b447c6654edd9900e5267d576cecc8b377d8` ;
- archive source reproductible SHA-256 `bf308142f4a27ec091eb0b9bef2744e33df93677b41dcb97243d5070364a91c6`.

Aucun finding de sécurité supplémentaire n’a été introduit par la finalisation. Codex Security n’a pas été utilisé.
