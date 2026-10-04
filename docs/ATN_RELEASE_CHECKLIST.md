# Checklist Add-ons for Thunderbird — MailPin 1.7.10

Dernière release GitHub publique : **1.7.9**. La **version source 1.7.10** est candidate ; la publication 1.7.10 reste bloquée jusqu’aux gates Thunderbird 157. La soumission Add-ons for Thunderbird reste une étape distincte.

Fiche ATN : https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Identité et build

- [x] ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- [x] nom public/localisé `MailPin — Email Follow-up & Productivity` ;
- [x] version source 1.7.10 synchronisée ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] aucune nouvelle permission WebExtension ;
- [ ] build reproductible de la candidate exacte.

## Compatibilité Thunderbird

- [x] Manifest V3, permission `menus` uniquement, plage candidate Thunderbird 153.0–157.* ;
- [ ] QA Linux/Windows sur la candidate exacte ;
- [ ] smoke réel Thunderbird 157.0.1 sur la candidate exacte ;
- [ ] QA et smoke 157.0.1 post-merge sur `main` ;
- [ ] recette visuelle humaine complète uniquement si elle doit être revendiquée comme gate formel.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant absents du diff prévu ;
- [x] stockage, schémas et `PinCompatibility` inchangés ;
- [x] audit source `SECURITY_AUDIT_1.7.10.md` préparé ;
- [ ] artefacts publics et digests observés après publication ;
- [ ] nouvelle soumission ATN 1.7.10 si souhaitée ;
- [ ] revue humaine / approbation ATN.

Aucun contrôle non exécuté n’est présenté comme PASS. Codex Security n’est pas utilisé.
