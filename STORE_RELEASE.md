# Publication MailPin 1.7.4

## État

- **Version source :** 1.7.4 — publiée
- **Dernière release publique :** 1.7.4
- **Dernière publication :** `v1.7.4`, commit `b74c0c7f264cf387269be0aaf18e47e99cf07600`
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité publiée :** Thunderbird 153.0 à 154.*

## Portée 1.7.4

La 1.7.4 rétablit l’installation sur Thunderbird 154 en étendant `strict_max_version` à `154.*` et déplace le smoke runtime sur le binaire officiel Thunderbird 154.0. Aucun code métier ni adaptateur `PinCompatibility` n’a été modifié.

Aucune permission WebExtension, migration, schéma, stockage, dépendance runtime, connexion réseau, télémétrie, publicité, code distant ou identité n’est modifié.

## Preuves

- candidate versionnée `c2527b57de4775f4fd228af22b9792937e7ce6ea` : QA `32300356172` — PASS ;
- même candidate : smoke réel Thunderbird 154.0 `32300356085` — PASS ;
- déclencheur de publication : QA `32300831724` — PASS ;
- tag `v1.7.4` : identique au commit `b74c0c7f264cf387269be0aaf18e47e99cf07600` ;
- build reproductible exact de l’arbre publié : `MailPin_v1.7.4.xpi` — 254 565 octets — SHA-256 `f5a9031ed1b3bad059516f659280b447c6654edd9900e5267d576cecc8b377d8` ;
- archive source : `MailPin_GitHub_Repository_v1.7.4.zip` — 688 743 octets — SHA-256 `bf308142f4a27ec091eb0b9bef2744e33df93677b41dcb97243d5070364a91c6`.

## Artefacts

- `MailPin_v1.7.4.xpi` ;
- `MailPin_GitHub_Repository_v1.7.4.zip` ;
- `SHA256SUMS.txt`.

## Gates GitHub

- [x] QA Linux/Windows sur la candidate exacte ;
- [x] garde sécurité/identité ;
- [x] build reproductible et structure XPI ;
- [x] smoke Thunderbird 154.0 réel ;
- [x] merge sur `main` ;
- [x] tag/release `v1.7.4` créé sur le commit publié ;
- [x] workflow one-shot retiré de la branche de finalisation.

La recette visuelle humaine et la soumission ATN restent distinctes de la publication GitHub. Codex Security n’a pas été utilisé.
