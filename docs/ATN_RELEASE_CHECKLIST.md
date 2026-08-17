# Checklist Add-ons for Thunderbird — MailPin 1.7.1

Dernière release GitHub publique : **1.7.1**. La release **MailPin 1.7.1** est publiée ; la soumission Add-ons for Thunderbird (ATN) reste une étape distincte. La source reviewer ATN corrigée a été régénérée et validée sans modifier `extension/**`.

## Identité et build

- [x] nom, ID, licence, confidentialité, support et dépôt MailPin cohérents sur `main` courant ;
- [x] version source 1.7.1 synchronisée dans manifeste/package/build ;
- [x] aucune dépendance runtime/build tierce ;
- [x] actions GitHub épinglées par SHA ;
- [x] publication 1.7.1 explicitement autorisée par le propriétaire le 16 août 2026 ;
- [x] artefacts définitifs 1.7.1 reconstruits depuis `c2b886677413a205d57a191234b1dac6279b86d6` ;
- [x] gate juridique/marque considéré validé par décision explicite du propriétaire le 16 août 2026 ; aucune revue juridique indépendante n’est revendiquée ;
- [x] source reviewer ATN régénérée après le correctif de reproductibilité hors Git ;
- [x] `npm run ci` PASS depuis une extraction neuve de cette source, sans dossier `.git` ;
- [x] XPI reconstruit sous Python 3.12 identique au XPI publié 1.7.1 (`4586646a1d6ebe793c52040beeb7faf929e59d771a59a1ff0b0f63c13308e5f0`) ;
- [x] pack ATN régénéré avec `PACK_INVENTORY.txt` présent dans son propre inventaire et empreintes recalculées.

## Compatibilité / UI

- [x] Manifest V3, permission `menus` uniquement, Thunderbird 153.0–153.* ;
- [x] la 1.7.1 ne modifie pas le runtime Dashboard/Options/panneau ;
- [x] smoke réel Thunderbird 153 de l’arbre 1.7.1 exact — run `31950636456` ;
- [ ] recette humaine Organic Workspace supplémentaire — non enregistrée comme exécutée ; pertinente pour ATN ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels si annoncés ;
- [ ] matrice Windows/Linux/macOS exhaustive si requise par la soumission ATN.

## Sécurité / review

- [x] réseau runtime, télémétrie, publicité et code distant interdits ;
- [x] sous-ressources HTML/CSS distantes refusées par le garde source ;
- [x] entrées privilégiées, stockage local, imports et cycle de vie restent couverts par les gardes existants ;
- [x] QA/garde sécurité de la release 1.7.1 — run `31950636397` ;
- [x] workflow Release 1.7.1 — run `31951120772` ;
- [ ] téléversement ATN et revue humaine ATN.

Codex Security n’est pas utilisé. Aucun contrôle non exécuté n’est présenté comme PASS.
