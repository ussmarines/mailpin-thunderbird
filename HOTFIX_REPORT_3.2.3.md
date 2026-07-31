# Correctif MailPerch 3.2.3

Base GitHub : `main` au commit `8b3495baca5d89358d703c42add9d773c09517af` (3.2.2).

## Objectifs

- fournir à Codex un contexte unique et maintenable ;
- corriger les problèmes d’alignement relevés sur les captures ;
- empêcher les préférences visuelles MailPerch de dégrader les messages natifs ;
- harmoniser les paramètres sans ajouter de feedback invasif ;
- rendre la CI Windows réellement robuste.

## Correctifs

- `PROJECT_MEMORY.md` et `docs/PROJECT_STATE.json` ;
- rail d’actions centré pour étoile, punaise et menu ;
- densités de cartes bornées et lisibles ;
- `uiPreset` limité aux paramètres ;
- toast à trois colonnes avec fermeture en haut à droite ;
- toggles en grille, aide sous le libellé ;
- aides de boutons isolées par action ;
- éditeur de groupes structuré avec nom, couleur et actions ;
- comptes dédupliqués visuellement ;
- capacités Agenda reformulées ;
- footer de sauvegarde simplifié ;
- nettoyage CRLF des chemins Git dans l’audit profond.

## Validation

Exécuter `npm run ci`, puis la section 3.2.3 de `docs/MANUAL_TEST_PLAN.md`.
