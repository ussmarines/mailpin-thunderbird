# Checklist Add-ons for Thunderbird — MailPin 1.7.5

Dernière release GitHub publique : **1.7.5**. La **version source 1.7.5** est publiée et prête pour une nouvelle soumission Add-ons for Thunderbird.

## Identité et build

- [x] ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- [x] nom public/localisé `MailPin — Email Follow-up & Productivity` (40 caractères, limite ATN 50) ;
- [x] version source 1.7.5 synchronisée ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] aucune nouvelle permission WebExtension ;
- [x] QA/build exacts et release `v1.7.5` publiés.

## Compatibilité Thunderbird

- [x] Manifest V3, permission `menus` uniquement, plage Thunderbird 153.0–154.* inchangée ;
- [x] candidate exacte `19cf23c21e983be924ffd9e6af8fdb1e8e612947` : QA `32480175617` PASS ;
- [x] même candidate : smoke réel Thunderbird 154.0 `32480175435` PASS ;
- [ ] recette visuelle humaine sur le XPI 1.7.5 si souhaitée avant ATN ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels uniquement s’ils sont revendiqués dans la soumission.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant interdits ;
- [x] aucune modification de stockage, schéma, logique métier ou `PinCompatibility` ;
- [x] audit source `SECURITY_AUDIT_1.7.5.md` sans Codex Security ;
- [x] build reproductible et structure XPI validés ;
- [x] `npm run ci` depuis une extraction neuve de l’archive reviewer publiée sans `.git` ;
- [x] XPI reconstruit identique au XPI publié ;
- [ ] téléversement et revue humaine ATN.

Artefacts officiels :
- XPI SHA-256 `247e314911ce1006f40b78c6050f3697b7f6b1beb3f0489214e84410c668dc12` ;
- source reviewer SHA-256 `af555557bc0d3b80d35e34a7ec1447b77ebe356c75a95ece9f28b8238fdfb1fd`.

Aucun contrôle non exécuté n’est présenté comme PASS.
