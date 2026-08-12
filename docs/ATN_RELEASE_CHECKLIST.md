# Checklist de publication Add-ons for Thunderbird — 1.6.1

Les cases cochées correspondent à des éléments présents dans l’artefact/repo ou à des validations automatisées exigées par le processus de release. Les cases non cochées nécessitent encore une action humaine, un fournisseur externe ou l’accès au portail ATN.

## Identité et fiche

- [x] nom MailPin, slogan, sous-titres FR/EN, auteur et assets synchronisés ;
- [x] identifiant permanent `ussmarines.mailpin@addons.thunderbird.net` défini avant première publication ATN ;
- [x] version 1.6.1 synchronisée dans manifeste, package, README, build et dossier reviewer ;
- [x] licence et politique de confidentialité présentes ;
- [ ] recherche juridique finale de disponibilité de la marque ;
- [ ] support et politique de confidentialité vérifiés dans le portail ATN au moment de la soumission.

## Compatibilité

- [x] Manifest V3 et clés de manifeste contrôlés ;
- [x] plage déclarée Thunderbird 153.0 à 153.* ;
- [x] thèmes clair/sombre, clipping, overflow et contraste de base couverts par les gardes automatisées existantes ;
- [x] comportements métier inchangés depuis la dernière recette utilisateur pré-rebranding 1.5.4 ; cette preuve est explicitement héritée et non renommée « recette 1.6.1 » ;
- [x] release 1.6.1 soumise à QA Linux/Windows, garde sécurité, build reproductible et smoke Thunderbird réel avant publication GitHub ;
- [ ] recette humaine ciblée du XPI 1.6.1 exact ;
- [ ] matrice fonctionnelle/charge 50/100/500/1000/2000 fraîche sur 1.6.1 — non relancée car logique métier inchangée ;
- [ ] matrice Windows/Linux/macOS Thunderbird réelle exhaustive ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels.

## Review et build

- [x] code lisible, non minifié, non transpilé et non obfusqué ;
- [x] instructions de build reproductible ;
- [x] archive source complète sans profil ni secret ;
- [x] aucune bibliothèque tierce runtime/build ajoutée ;
- [x] actions GitHub épinglées par SHA ;
- [x] release GitHub v1.6.1 destinée à être produite par le gate final avant utilisation de ce dossier pour ATN ;
- [ ] téléversement du XPI et de l’archive source sur ATN.

## Confidentialité et sécurité

- [x] permissions minimales (`menus`), CSP sans réseau et scans standards contrôlés ;
- [x] aucune nouvelle permission, dépendance runtime, télémétrie, publicité ou code distant en 1.6.1 ;
- [x] changement d’identité documenté comme ayant eu lieu en 1.6.0 — il n’est plus nié dans les documents actifs ;
- [x] Codex Security non utilisé ;
- [ ] validation avec fournisseurs mail/calendrier externes réels ;
- [ ] validation humaine complète zoom 200 %, contraste OS élevé et lecteurs d’écran.

## Traçabilité

- [x] rebranding MailPin intégré par PR #35 ;
- [x] runtime rebrand exact `4fdb978e1828325001f95951c115059a931b8b6e` : QA Linux/Windows, garde sécurité et smoke Thunderbird réel verts ;
- [x] XPI public v1.6.0 de référence : SHA-256 `6860e0177795b163cb672edd1a93897260785c4b8eeeeac71d1b3d32dca281ae` ;
- [x] métadonnées 1.6.1 débarrassées des anciens PR/SHA/hashes 1.5.4 ;
- [ ] soumission et validation finales par les reviewers ATN.
