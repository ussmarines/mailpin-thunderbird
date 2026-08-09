# Passage de relais Codex — MailPerch 1.5.0

Ce fichier décrit la branche active de refonte visuelle. Lire d’abord `docs/IDENTITY_MIGRATION_REQUIRED.md`, `PROJECT_MEMORY.md`, puis uniquement les sources et tests utiles au diff contre `main`.

## Référence Git

- version préparée pour publication : **1.5.0** ;
- base intégrée : `origin/main` = `4f73efddc4a515a2a1a3d864050f4aa676e2072d` (MailPerch 1.4.0) ;
- branche : `codex/ui-ux-product-redesign` ;
- publication complète autorisée par l’utilisateur après validation : push, PR, squash merge, tag `v1.5.0`, release et nettoyage de cette branche ;
- ne contourner aucun ruleset ni check GitHub.

## Objectif de la branche

Publier la nouvelle direction visuelle locale de MailPerch :

- harmoniser les tokens Fluent locaux ;
- restructurer visuellement le Dashboard ;
- simplifier les Options et réduire la cardification ;
- harmoniser le panneau des épingles ;
- préserver le logo, la hiérarchie, le focus, le contraste, le responsive, les thèmes et la réduction du mouvement.

Cette release ne crée aucune fonctionnalité métier et ne modifie ni permission, ni dépendance runtime, ni connexion réseau, ni schéma de données.

## Surfaces du redesign

- `extension/styles/tokens.css` ;
- `extension/dashboard/dashboard.css` ;
- `extension/options/options.css` ;
- `extension/styles/pin.css`.

Les évolutions fonctionnelles/runtime de `main` 1.4.0 restent prioritaires hors de ces choix visuels.

## Preuves disponibles

Avant l’intégration de `main` :

- `npm run ci` vert ;
- scénario Dashboard avec 7 vues, 9 statistiques, action groupée et absence de débordement à 720 px ;
- inspection visuelle Dashboard et Options ;
- XPI du redesign validé manuellement par l’utilisateur dans Thunderbird.

L’intégration de `main` et la préparation 1.5.0 imposent une nouvelle passe finale `npm run ci` et les contrôles UI ciblés nécessaires. La validation utilisateur du XPI ne doit pas être étendue aux changements ultérieurs non observés dans Thunderbird.

## Sortie attendue

La release est terminée uniquement quand :

- la PR unique vers `main` est fusionnée par la méthode autorisée ;
- le tag annoté `v1.5.0` pointe sur le commit exact de `main` issu de la fusion ;
- le workflow Release est vert ;
- la release GitHub `MailPerch 1.5.0` contient l’XPI, le ZIP dépôt et `SHA256SUMS.txt` ;
- le dépôt local termine sur `main`, synchronisé avec `origin/main`, worktree propre ;
- seule la branche de redesign devenue inutile est supprimée.
