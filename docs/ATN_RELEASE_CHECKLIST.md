# Checklist Add-ons for Thunderbird — MailPin 1.7.6

Dernière release GitHub publique : **1.7.5**. La **version source 1.7.6** est une candidate de maintenance pour le correctif de chargement des épingles au démarrage. La soumission ATN 1.7.5 reste en revue humaine.

Fiche ATN : https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Identité et build

- [x] ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- [x] nom public/localisé `MailPin — Email Follow-up & Productivity` (40 caractères, limite ATN 50) ;
- [x] version source 1.7.6 synchronisée dans les métadonnées de candidate ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] aucune nouvelle permission WebExtension ;
- [ ] QA/build exacts sur la candidate 1.7.6 ;
- [ ] release `v1.7.6` publiée.

## Compatibilité Thunderbird

- [x] Manifest V3, permission `menus` uniquement, plage Thunderbird 153.0–154.* inchangée ;
- [x] correctif runtime PR #64 head `26fc0ac9b4d35009f125f543eefc5de9338bef71` : QA `32639780333` PASS ;
- [x] même head : smoke réel Thunderbird 154.0 `32639780313` PASS ;
- [x] cold start réel sans Dashboard ni interaction validé sur le correctif ;
- [ ] smoke réel Thunderbird 154.0 sur la candidate versionnée 1.7.6 exacte ;
- [ ] recette visuelle humaine complète uniquement si elle doit être consignée comme gate formel ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels uniquement s’ils sont revendiqués dans la soumission.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant interdits ;
- [x] stockage, schémas et `PinCompatibility` inchangés ;
- [x] aucune nouvelle permission ou dépendance runtime ;
- [ ] audit source 1.7.6 finalisé après gates exacts ;
- [ ] build reproductible et structure XPI validés ;
- [ ] `npm run ci` depuis une extraction neuve de l’archive source 1.7.6 sans `.git` ;
- [ ] XPI reconstruit identique au XPI publié ;
- [ ] nouvelle soumission ATN 1.7.6 si la publication GitHub doit être envoyée au store.

Aucun contrôle non exécuté n’est présenté comme PASS. Codex Security n’est pas utilisé.
