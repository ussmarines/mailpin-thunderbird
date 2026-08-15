# Checklist Add-ons for Thunderbird — candidat 1.7.0

Release GitHub publique : **1.7.0**, publiée le **15 août 2026** depuis le commit `419d1c7de208a304dd71ad4d87f9d2eacdb91048`. La soumission Add-ons for Thunderbird (ATN) reste une étape distincte.

## Identité et build

- [x] nom, ID, licence, confidentialité et dépôt MailPin cohérents ;
- [x] version source 1.7.0 synchronisée dans manifeste/package/build ;
- [x] aucune dépendance runtime/build tierce ;
- [x] actions GitHub épinglées par SHA ;
- [x] publication 1.7.0 explicitement autorisée par le propriétaire le 15 août 2026 ;
- [x] artefacts définitifs reconstruits et publiés depuis le commit exact de release via le workflow **31901834209** ;
- [ ] avis juridique indépendant sur la marque — non requis par le propriétaire pour cette release GitHub.

## Compatibilité / UI

- [x] Manifest V3, permission `menus` uniquement, Thunderbird 153.0–153.* ;
- [x] Organic Workspace et responsive couverts par les gardes source ;
- [x] smoke réel Thunderbird 153 exécuté avec succès sur la source auditée 1.7.0 ;
- [ ] recette humaine supplémentaire du XPI 1.7.0 exact — non enregistrée comme exécutée ; publication GitHub néanmoins autorisée explicitement par le propriétaire ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels si annoncés ;
- [ ] matrice Windows/Linux/macOS exhaustive si requise pour une future soumission ATN.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité et code distant interdits ;
- [x] entrées privilégiées bornées, stockage local, imports neutralisés et cycle de vie couverts par les gardes ;
- [x] audit sécurité standard final de la source 1.7.0 : succès ;
- [x] QA post-merge et workflow Release 1.7.0 : succès ;
- [ ] revue Codex indépendante additionnelle — non exigée par le propriétaire pour la release GitHub ;
- [ ] téléversement ATN et revue humaine ATN — étape distincte après la release GitHub.

## Artefacts GitHub publiés

- `MailPin_v1.7.0.xpi` — SHA-256 `749d8ee9c55efd9bcda1230c157da1ad5f121ae735f41b1762449c10bd050734` ;
- `MailPin_GitHub_Repository_v1.7.0.zip` — SHA-256 `fc5d3e30e27178ae265bee5bc29b58cc483de063dcdd3238289b10777a19e5a0` ;
- `SHA256SUMS.txt`.

Codex Security n’est pas utilisé par défaut. Aucun contrôle non exécuté n’est présenté comme PASS.
