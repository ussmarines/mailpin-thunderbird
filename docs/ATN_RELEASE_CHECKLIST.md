# Checklist Add-ons for Thunderbird — candidat 1.7.1

Dernière release GitHub publique : **1.7.0**. Le candidat **1.7.1** est une maintenance de durcissement release ; la soumission Add-ons for Thunderbird (ATN) reste une étape distincte.

## Identité et build

- [x] nom, ID, licence, confidentialité, support et dépôt MailPin cohérents ;
- [x] version source 1.7.1 synchronisée dans manifeste/package/build ;
- [x] aucune dépendance runtime/build tierce ;
- [x] actions GitHub épinglées par SHA ;
- [x] publication 1.7.1 explicitement autorisée par le propriétaire le 16 août 2026 ;
- [ ] artefacts définitifs 1.7.1 reconstruits depuis le commit exact de release ;
- [ ] avis juridique indépendant sur la marque — validation externe, non automatisable ici.

## Compatibilité / UI

- [x] Manifest V3, permission `menus` uniquement, Thunderbird 153.0–153.* ;
- [x] la 1.7.1 ne modifie pas le runtime Dashboard/Options/panneau ;
- [ ] smoke réel Thunderbird 153 du candidat 1.7.1 exact ;
- [ ] recette humaine Organic Workspace supplémentaire — non enregistrée comme exécutée ; pertinente pour ATN ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels si annoncés ;
- [ ] matrice Windows/Linux/macOS exhaustive si requise par la soumission ATN.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité et code distant interdits ;
- [x] sous-ressources HTML/CSS distantes désormais refusées par le garde source ;
- [x] entrées privilégiées, stockage local, imports et cycle de vie restent couverts par les gardes existants ;
- [ ] QA/garde sécurité du candidat 1.7.1 ;
- [ ] workflow Release 1.7.1 ;
- [ ] téléversement ATN et revue humaine ATN.

Codex Security n’est pas utilisé. Aucun contrôle non exécuté n’est présenté comme PASS.
