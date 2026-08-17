# Checklist Add-ons for Thunderbird — MailPin 1.7.2

Dernière release GitHub publique : **1.7.1**. La **version source 1.7.2** est une candidate corrective UI/navigation ; elle n’est pas encore publiée ni soumise à Add-ons for Thunderbird (ATN).

## Identité et build

- [x] nom, ID public `ussmarines.mailpin@addons.thunderbird.net`, licence et politique local-first inchangés ;
- [x] version source 1.7.2 synchronisée dans manifeste/package/état candidate ;
- [x] aucune nouvelle dépendance runtime/build tierce ;
- [x] actions GitHub épinglées par SHA ;
- [x] autorisation explicite du propriétaire reçue le 17 août 2026 pour PR, merge et nouvelle release sous réserve des gates ;
- [ ] archive source reviewer 1.7.2 reconstruite et validée hors Git ;
- [ ] empreintes finales des artefacts 1.7.2 vérifiées après build/release.

## Compatibilité / UI

- [x] Manifest V3, permission `menus` uniquement, Thunderbird 153.0–153.* ;
- [x] corrections UI initiales validées avant versionnement par PR #47, QA `32024824818` et smoke Thunderbird réel `32024824756` ;
- [ ] QA Linux/Windows sur la candidate 1.7.2 exacte ;
- [ ] smoke Thunderbird réel sur la candidate 1.7.2 exacte ;
- [ ] recette humaine post-correction — non enregistrée comme exécutée ; recommandée avant soumission ATN ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels si annoncés ;
- [ ] matrice Windows/Linux/macOS exhaustive si requise par la soumission ATN.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité, CDN et code distant interdits ;
- [x] aucune modification de stockage, schéma, permission ou frontière privilégiée dans le correctif UI ;
- [ ] garde sécurité/identité 1.7.2 sur le candidat exact ;
- [ ] workflow Release 1.7.2 ;
- [ ] téléversement ATN et revue humaine ATN.

La source reviewer 1.7.1 corrigée demeure une preuve historique de reproductibilité hors Git ; elle ne remplace pas la validation du futur paquet 1.7.2.

Codex Security n’est pas utilisé. Aucun contrôle non exécuté n’est présenté comme PASS.
