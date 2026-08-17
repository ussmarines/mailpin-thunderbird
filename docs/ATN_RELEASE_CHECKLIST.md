# Checklist Add-ons for Thunderbird — MailPin 1.7.3

Dernière release GitHub publique : **1.7.2**. La **version source 1.7.3** est candidate et n’est pas encore publiée ni soumise à ATN.

## Identité et build

- [x] ID `ussmarines.mailpin@addons.thunderbird.net`, licence et local-first inchangés ;
- [x] version source 1.7.3 synchronisée dans manifeste/package/état candidate ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] aucune feuille corrective `interaction-stability.css` chargée au runtime ;
- [ ] archive source 1.7.3 et empreintes finales vérifiées après release.

## Compatibilité / UI

- [x] Manifest V3, permission `menus` uniquement, Thunderbird 153.0–153.* ;
- [x] runtime pré-versionnement PR #49 : QA `32027919000` PASS ;
- [x] runtime pré-versionnement PR #49 : smoke Thunderbird `32027918991` PASS ;
- [ ] QA Linux/Windows candidate 1.7.3 exacte ;
- [ ] smoke Thunderbird réel candidate 1.7.3 exacte ;
- [ ] recette visuelle humaine post-correction avant ATN.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant interdits ;
- [x] aucune modification de stockage, schéma, permission ou frontière privilégiée ;
- [ ] garde sécurité/identité candidate 1.7.3 ;
- [ ] workflow Release 1.7.3 ;
- [ ] `npm run ci` depuis une extraction neuve de la source reviewer sans `.git` avant soumission ATN ;
- [ ] téléversement et revue humaine ATN.

Codex Security n’est pas utilisé. Aucun contrôle non exécuté n’est présenté comme PASS.
