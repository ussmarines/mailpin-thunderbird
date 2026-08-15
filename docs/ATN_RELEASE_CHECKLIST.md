# Checklist Add-ons for Thunderbird — candidat 1.7.0

Dernière release publique : **1.6.1** jusqu’à la création effective de la release 1.7.0. Le propriétaire a explicitement autorisé la publication GitHub de MailPin 1.7.0 le **15 août 2026**.

## Identité et build

- [x] nom, ID, licence, confidentialité et dépôt MailPin cohérents ;
- [x] version source 1.7.0 synchronisée dans manifeste/package/build ;
- [x] aucune dépendance runtime/build tierce ;
- [x] actions GitHub épinglées par SHA ;
- [x] publication 1.7.0 explicitement autorisée par le propriétaire le 15 août 2026 ;
- [ ] avis juridique indépendant sur la marque — non requis par le propriétaire pour cette release ;
- [ ] artefacts définitifs à produire depuis le commit/tag exact de release.

## Compatibilité / UI

- [x] Manifest V3, permission `menus` uniquement, Thunderbird 153.0–153.* ;
- [x] Organic Workspace et responsive couverts par les gardes source ;
- [x] smoke réel Thunderbird 153 exécuté avec succès sur la source auditée 1.7.0 ;
- [ ] recette humaine supplémentaire du XPI 1.7.0 exact — non enregistrée comme exécutée ; publication néanmoins autorisée explicitement par le propriétaire ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels si annoncés ;
- [ ] matrice Windows/Linux/macOS exhaustive si requise pour une future soumission ATN.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité et code distant interdits ;
- [x] entrées privilégiées bornées, stockage local, imports neutralisés et cycle de vie couverts par les gardes ;
- [x] audit sécurité standard final de la source 1.7.0 : succès ;
- [ ] revue Codex indépendante additionnelle — non exigée par le propriétaire pour déclencher cette release ;
- [ ] téléversement ATN et revue humaine ATN — étape distincte après la release GitHub.

Codex Security n’est pas utilisé par défaut. Aucun contrôle non exécuté n’est présenté comme PASS.
