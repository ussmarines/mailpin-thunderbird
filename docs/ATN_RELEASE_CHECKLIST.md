# Checklist Add-ons for Thunderbird — MailPin 1.7.8

Dernière release GitHub publique : **1.7.7**. La **version source 1.7.8** est candidate ; la release GitHub publique reste **1.7.7** jusqu’aux gates et à la publication. Le cycle de soumission et de revue Add-ons for Thunderbird reste distinct de la release GitHub ; ce document ne prétend pas qu’une soumission ATN 1.7.7 a été effectuée.

Fiche ATN : https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Identité et build

- [x] ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- [x] nom public/localisé `MailPin — Email Follow-up & Productivity` (40 caractères, limite ATN 50) ;
- [x] version source 1.7.7 synchronisée ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] aucune nouvelle permission WebExtension ;
- [x] QA/build exacts sur la candidate 1.7.7 ;
- [x] release `v1.7.7` créée par le workflow canonique.

## Compatibilité Thunderbird

- [x] Manifest V3, permission `menus` uniquement, plage Thunderbird 153.0–155.* ;
- [x] candidate versionnée `94ce4d2656df8eb9694ce794743b82c00d83e8a9` : QA `33688297275` PASS ;
- [x] même candidate : smoke réel Thunderbird 155.0 `33688296968` PASS ;
- [x] `main` `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` : QA `33689155033` PASS ;
- [x] même `main` : smoke réel Thunderbird 155.0 `33689155048` PASS ;
- [x] cold start réel sans Dashboard ni interaction validé ;
- [ ] recette visuelle humaine complète uniquement si elle doit être consignée comme gate formel ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels uniquement s’ils sont revendiqués dans une soumission.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant interdits ;
- [x] stockage, schémas et `PinCompatibility` inchangés ;
- [x] aucune nouvelle permission ou dépendance runtime ;
- [x] l’opt-in `allowUnsafeURL` est borné aux fichiers locaux fixes de `MODULE_PATHS` sous `context.extension.rootURI` ;
- [x] audit source `SECURITY_AUDIT_1.7.7.md` ;
- [x] build reproductible et structure XPI validés ;
- [x] CodeQL n’a signalé aucune nouvelle alerte sur le diff de la PR #75 ;
- [x] tag/release `v1.7.7` observé, ciblant `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` ;
- [x] digests des trois assets publics observés dans les métadonnées GitHub de la release ;
- [ ] nouvelle soumission ATN 1.7.7 si souhaitée ;
- [ ] revue humaine / approbation ATN.

Aucun contrôle non exécuté n’est présenté comme PASS. Codex Security n’est pas utilisé.
