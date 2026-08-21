# Publication MailPin 1.7.5

## État

- **Version source :** 1.7.5 — publiée
- **Dernière release publique :** 1.7.5
- **Dernière publication :** `v1.7.5`, commit `2384ee52df95a711424dfeb817ef114888634ed0`
- **Nom public/localisé :** `MailPin — Email Follow-up & Productivity` — 40 caractères
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité publiée :** Thunderbird 153.0 à 154.*
- **Soumission Add-ons for Thunderbird :** envoyée le 21 août 2026 ; revue en attente
- **Fiche ATN :** https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Portée 1.7.5

La 1.7.5 corrige uniquement la conformité du nom Add-ons for Thunderbird : le nom 1.7.4 embarqué faisait 56 caractères, au-delà de la limite ATN de 50. Le nom publié fait désormais 40 caractères.

Aucune logique métier, API Experiment, frontière `PinCompatibility`, permission, migration, schéma, stockage, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant n’est modifié.

## Preuves

- candidate exacte `19cf23c21e983be924ffd9e6af8fdb1e8e612947` : QA Linux/Windows + garde sécurité/identité `32480175617` — PASS ;
- même candidate : smoke réel Thunderbird 154.0 `32480175435` — PASS ;
- tag `v1.7.5` : `2384ee52df95a711424dfeb817ef114888634ed0` ;
- publisher : `npm run ci` depuis le checkout puis depuis l’archive reviewer fraîche sans `.git`, XPI reconstruit SHA-identique — PASS ;
- vérification indépendante des artefacts publics : run `32481646372` — PASS ;
- `MailPin_v1.7.5.xpi` — 254 557 octets — SHA-256 `247e314911ce1006f40b78c6050f3697b7f6b1beb3f0489214e84410c668dc12` ;
- asset source GitHub `MailPin_GitHub_Repository_v1.7.5.zip` — 689 068 octets — SHA-256 `af555557bc0d3b80d35e34a7ec1447b77ebe356c75a95ece9f28b8238fdfb1fd` ;
- source reviewer effectivement soumise à ATN : `MailPin_ATN_Reviewer_Source_v1.7.5.zip` — SHA-256 `88ab540dcf9c3acd9f9bc8f6ded6d9c78d09be7fedf99a52e5c212e9edd499fe` ;
- `SHA256SUMS.txt` — SHA-256 `db052f49548aa70e46208808084be3e5ef2ac8d454267e1babc53aeeb647ad26`.

## Gates GitHub / ATN

- [x] nom localisé FR/EN = 40 caractères et garde anti-régression ≤ 50 ;
- [x] QA Linux/Windows sur la candidate exacte ;
- [x] garde sécurité/identité ;
- [x] build reproductible et structure XPI ;
- [x] smoke Thunderbird 154.0 réel ;
- [x] merge sur `main` ;
- [x] archive reviewer reconstruite sans `.git` ;
- [x] tag/release `v1.7.5` publié ;
- [x] artefacts publics et empreintes vérifiés ;
- [x] soumission ATN 1.7.5 téléversée ;
- [ ] revue humaine / approbation ATN.

La recette humaine 1.7.5 et les fournisseurs/calendriers réseau réels restent des validations distinctes lorsqu’ils sont revendiqués. Codex Security n’a pas été utilisé.
