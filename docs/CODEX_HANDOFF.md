# Passage de relais Codex — MailPin 1.6.1

## Référence

- runtime MailPin intégré par la PR #35 : `4fdb978e1828325001f95951c115059a931b8b6e` ;
- baseline `main` avant préparation 1.6.1 : `6d582da0cf729b1a93df348e4845430fbfb7fad2` ;
- version cible publique : **1.6.1** ;
- identifiant canonique : `ussmarines.mailpin@addons.thunderbird.net` ;
- branche de préparation : `release/mailpin-1.6.1-store-metadata`.

## État produit

MailPin 1.6.0 a introduit le nouveau nom, l’ID ATN définitif, l’icône SVG et la palette professionnelle sans modifier la logique métier validée avant rebranding. Le runtime rebrand intégré par #35 a ensuite repassé QA Linux/Windows, garde sécurité et smoke Thunderbird 153 réel sur le commit exact `4fdb978e1828325001f95951c115059a931b8b6e`.

La 1.6.1 ne corrige pas un bug runtime. Elle retire des métadonnées de publication 1.5.4 restées actives dans l’archive source 1.6.0 et évite d’attribuer à tort une recette manuelle fraîche à un XPI qui ne l’avait pas reçue. Le seul delta XPI prévu est `manifest.version = 1.6.1`.

## Preuves

- recette manuelle : dernière preuve fraîche sur le candidat 1.5.4 avant rebranding, réutilisée uniquement pour le métier inchangé ;
- QA/sécurité/smoke réel MailPin 1.6.0 : verts sur `4fdb978e1828325001f95951c115059a931b8b6e` ;
- XPI v1.6.0 public : `6860e0177795b163cb672edd1a93897260785c4b8eeeeac71d1b3d32dca281ae` ;
- 1.6.1 : exiger QA Linux/Windows + sécurité + `npm run ci` + smoke Thunderbird réel sur la PR et le `main` final avant release.

## Readiness

- **GitHub 1.6.1 : GO uniquement après les gates ci-dessus** ;
- **ATN : candidat officiel après release GitHub**, avec recette humaine ciblée, fournisseurs réseau/matrice multi-OS et contrôles accessibilité humains restant explicitement hors preuve.

Aucune nouvelle permission, dépendance runtime, connexion réseau, télémétrie, publicité ou migration de stockage n’est introduite en 1.6.1. Le changement d’identité a eu lieu volontairement en 1.6.0 et reste immuable pour la publication ATN. Codex Security n’a pas été utilisé.
