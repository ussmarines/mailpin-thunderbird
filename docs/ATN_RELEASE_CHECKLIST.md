# Checklist Add-ons for Thunderbird — MailPin 1.7.8

Dernière release GitHub publique : **1.7.8**. La **version source 1.7.8** est publiée. La soumission Add-ons for Thunderbird reste une étape distincte.

Fiche ATN : https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Identité et build

- [x] ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- [x] nom public/localisé `MailPin — Email Follow-up & Productivity` ;
- [x] version source 1.7.8 synchronisée ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] aucune nouvelle permission WebExtension ;
- [x] release `v1.7.8` créée sur `800c07315ee7f8611f2d2fc6e12a4f2c2d74b849`.

## Compatibilité Thunderbird

- [x] Manifest V3, permission `menus` uniquement, plage Thunderbird 153.0–155.* ;
- [x] candidate `e48a12239c674e1f8a909b22a04c0c3266eca70e` : QA `33691697322` PASS ;
- [x] même candidate : smoke réel Thunderbird 155.0 `33691697345` PASS ;
- [x] main/tag target : QA `33691785442` PASS et smoke `33691785284` PASS ;
- [ ] recette visuelle humaine complète uniquement si elle doit être revendiquée comme gate formel.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant absents ;
- [x] stockage, schémas et `PinCompatibility` inchangés ;
- [x] audit source `SECURITY_AUDIT_1.7.8.md` ;
- [x] artefacts publics et digests observés ;
- [ ] nouvelle soumission ATN 1.7.8 si souhaitée ;
- [ ] revue humaine / approbation ATN.

Aucun contrôle non exécuté n’est présenté comme PASS. Codex Security n’est pas utilisé.
