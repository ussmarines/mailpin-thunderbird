# Checklist Add-ons for Thunderbird — MailPin 1.7.4

Dernière release GitHub publique : **1.7.4**. La **version source 1.7.4** est publiée et compatible Thunderbird 154 ; elle n’est pas encore soumise à Add-ons for Thunderbird (ATN).

## Identité et build

- [x] ID `ussmarines.mailpin@addons.thunderbird.net`, licence et local-first inchangés ;
- [x] version source 1.7.4 synchronisée dans manifeste/package/état publié ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] aucune nouvelle permission WebExtension ;
- [x] merge de la PR 1.7.4 vers `main` après gates exacts ;
- [x] release `v1.7.4` et artefacts publiés.

## Compatibilité Thunderbird

- [x] Manifest V3, permission `menus` uniquement, plage publiée Thunderbird 153.0–154.* ;
- [x] head pré-versionnement `3e1943f2be7a18ebcceef5952810675442e91a33` : QA `32299537328` PASS ;
- [x] head pré-versionnement : smoke réel Thunderbird 154.0 `32299537485` PASS ;
- [x] QA Linux/Windows sur la candidate versionnée 1.7.4 exacte (`32300356172`) ;
- [x] smoke Thunderbird 154.0 sur cette même candidate (`32300356085`) ;
- [ ] recette visuelle humaine si requise avant ATN ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels si revendiqués dans la soumission.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant interdits ;
- [x] aucune modification de stockage, schéma, logique métier ou frontière `PinCompatibility` ;
- [x] audit source `SECURITY_AUDIT_1.7.4.md` créé sans Codex Security ;
- [x] build reproductible et structure XPI validés sur le head versionné ;
- [ ] `npm run ci` depuis une extraction neuve de la source reviewer 1.7.4 sans `.git` avant soumission ATN ;
- [ ] téléversement et revue humaine ATN.

Codex Security n’est pas utilisé. Aucun contrôle non exécuté n’est présenté comme PASS.
