# Checklist Add-ons for Thunderbird — MailPin 1.7.10

Dernière release GitHub publique : **1.7.10**. La **version source 1.7.10** est publiée et validée sur Thunderbird 157.0.1. La soumission Add-ons for Thunderbird reste une étape distincte.

Fiche ATN : https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Identité et build

- [x] ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- [x] nom public/localisé `MailPin — Email Follow-up & Productivity` ;
- [x] version source 1.7.10 synchronisée ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] aucune nouvelle permission WebExtension ;
- [x] build reproductible de la candidate exacte ;
- [x] release `v1.7.10` créée sur `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0`.

## Compatibilité Thunderbird

- [x] Manifest V3, permission `menus` uniquement, plage Thunderbird 153.0–157.* ;
- [x] candidate `565f565710da6262d7a91bfbe280a943047cdc6c` : QA `37213680870` PASS ;
- [x] même candidate : smoke réel Thunderbird 157.0.1 `37213680824` PASS ;
- [x] main/tag target : QA `37213779632`, smoke `37213779633` et CodeQL `37213779727` PASS ;
- [ ] recette visuelle humaine complète uniquement si elle doit être revendiquée comme gate formel.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant absents ;
- [x] stockage, schémas et `PinCompatibility` inchangés ;
- [x] audit source `SECURITY_AUDIT_1.7.10.md` ;
- [x] artefacts publics et digests observés ;
- [ ] nouvelle soumission ATN 1.7.10 si souhaitée ;
- [ ] revue humaine / approbation ATN.

Aucun contrôle non exécuté n’est présenté comme PASS. Codex Security n’a pas été utilisé.
