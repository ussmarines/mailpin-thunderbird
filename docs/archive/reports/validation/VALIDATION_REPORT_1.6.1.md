# Rapport de validation — MailPin 1.6.1

## Objectif

Produire un candidat reviewer/ATN dont les métadonnées décrivent exactement les preuves disponibles, sans modifier le comportement de MailPin.

## Delta

- `package.json` / `extension/manifest.json` : version 1.6.1 ;
- documents actifs de publication, mémoire projet, état machine et templates reviewers corrigés ;
- nouveaux rapports 1.6.1 ;
- aucune modification des modules métier, de `background.js`, du schéma Experiment, des adaptateurs Thunderbird, du stockage ou des styles runtime.

## Preuves réutilisées

- recette utilisateur : build pré-rebranding 1.5.4, uniquement pour les comportements métier inchangés ;
- rebranding/runtime MailPin : PR #35, commit `4fdb978e1828325001f95951c115059a931b8b6e`, QA Linux/Windows + garde sécurité + smoke Thunderbird 153 réel verts ;
- release 1.6.0 : XPI SHA-256 `6860e0177795b163cb672edd1a93897260785c4b8eeeeac71d1b3d32dca281ae`.

## Preuves requises pour 1.6.1

Avant publication : contrôles de version/métadonnées, `npm run ci`, `git diff --check`, QA Linux/Windows, garde sécurité et smoke Thunderbird réel sur le candidat 1.6.1. Une recette humaine exacte du XPI 1.6.1 n’est pas revendiquée tant qu’elle n’est pas réellement effectuée.
