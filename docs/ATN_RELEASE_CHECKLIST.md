# Checklist Add-ons for Thunderbird — candidat 1.7.0

Dernière release publique : **1.6.1**. Cette checklist décrit le candidat source 1.7.0 et ne signifie pas qu’il a été publié ou soumis à ATN.

## Identité et build

- [x] nom, ID, licence, confidentialité et dépôt MailPin cohérents ;
- [x] version source 1.7.0 synchronisée dans manifeste/package/build ;
- [x] aucune dépendance runtime/build tierce ;
- [x] actions GitHub épinglées par SHA ;
- [ ] disponibilité juridique finale de la marque ;
- [ ] artefacts définitifs produits depuis le commit de release autorisé.

## Compatibilité / UI

- [x] Manifest V3, permission `menus` uniquement, Thunderbird 153.0–153.* ;
- [x] Organic Workspace et responsive couverts par les gardes source ;
- [ ] recette humaine du XPI 1.7.0 exact : Dashboard, Options, panneau, splitter, thèmes, zoom 200 %, contraste élevé ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels si annoncés ;
- [ ] matrice Windows/Linux/macOS exhaustive si requise pour la soumission.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité et code distant interdits ;
- [x] entrées privilégiées bornées, stockage local, imports neutralisés et cycle de vie couverts par les gardes ;
- [ ] audit sécurité standard final du commit de candidat ;
- [ ] revue Codex indépendante ;
- [ ] téléversement ATN et revue humaine ATN.

Codex Security n’est pas utilisé par défaut.
