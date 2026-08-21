# Checklist Add-ons for Thunderbird — MailPin 1.7.5

Dernière release GitHub publique : **1.7.4**. La **version source 1.7.5** est une candidate de conformité du nom ATN ; elle n’est pas encore publiée ni soumise à Add-ons for Thunderbird.

## Identité et build

- [x] ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- [x] nom public/localisé `MailPin — Email Follow-up & Productivity` (40 caractères) ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] aucune nouvelle permission WebExtension ;
- [ ] QA/build sur le head exact 1.7.5 ;
- [ ] merge et release `v1.7.5`.

## Compatibilité Thunderbird

- [x] Manifest V3, permission `menus` uniquement, plage Thunderbird 153.0–154.* inchangée ;
- [x] release 1.7.4 : QA et smoke réel Thunderbird 154.0 PASS ;
- [ ] smoke Thunderbird 154.0 sur la candidate 1.7.5 exacte.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant interdits ;
- [x] aucune modification de stockage, schéma, logique métier ou `PinCompatibility` ;
- [x] audit source `SECURITY_AUDIT_1.7.5.md` créé sans Codex Security ;
- [ ] build reproductible validé ;
- [ ] `npm run ci` depuis une extraction neuve de la source reviewer 1.7.5 sans `.git` avant soumission ATN ;
- [ ] téléversement et revue humaine ATN.

Aucun contrôle non exécuté n’est présenté comme PASS.
