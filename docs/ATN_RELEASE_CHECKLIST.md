# Checklist Add-ons for Thunderbird — MailPin 1.7.7

Dernière release GitHub publique : **1.7.6**. La **version source 1.7.7** est publiée. La soumission Add-ons for Thunderbird 1.7.5 reste en revue humaine ; une éventuelle soumission 1.7.6 est une étape distincte.

Fiche ATN : https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Identité et build

- [x] ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- [x] nom public/localisé `MailPin — Email Follow-up & Productivity` (40 caractères, limite ATN 50) ;
- [x] version source 1.7.6 synchronisée ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] aucune nouvelle permission WebExtension ;
- [x] QA/build exacts sur la candidate 1.7.6 ;
- [x] release `v1.7.6` créée.

## Compatibilité Thunderbird

- [x] Manifest V3, permission `menus` uniquement, plage Thunderbird 153.0–154.* inchangée ;
- [x] candidate versionnée `c502175041c85e3cb6e37666a0784f7df0a9e367` : QA `32640198347` PASS ;
- [x] même candidate : smoke réel Thunderbird 154.0 `32640198339` PASS ;
- [x] cold start réel sans Dashboard ni interaction validé ;
- [ ] recette visuelle humaine complète uniquement si elle doit être consignée comme gate formel ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels uniquement s’ils sont revendiqués dans la soumission.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant interdits ;
- [x] stockage, schémas et `PinCompatibility` inchangés ;
- [x] aucune nouvelle permission ou dépendance runtime ;
- [x] audit source `SECURITY_AUDIT_1.7.6.md` ;
- [x] build et structure XPI validés sur la candidate ;
- [x] tag/release `v1.7.6` observé, ciblant `522042df08c2eb7a18a13cbb83631943e54abf2c` ;
- [ ] téléchargement indépendant des trois assets publics et vérification de leurs empreintes, non exposés par le connecteur actuel ;
- [ ] nouvelle soumission ATN 1.7.6 si souhaitée ;
- [ ] revue humaine / approbation ATN.

Aucun contrôle non exécuté n’est présenté comme PASS. Codex Security n’est pas utilisé.
