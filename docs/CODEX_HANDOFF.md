# Passage de relais — MailPin Organic Workspace

## Référence

- dépôt : `ussmarines/mailpin-thunderbird` ;
- branche auditée : `design/organic-workspace-ui` ;
- base `main` avant intégration : `497d71e9660c068a166201a4da13fdddc3e65628` ;
- HEAD produit propre validé : `41ae231d4c3f2fca1ccbb33325b294ba88453d40` ;
- PR : **#39 — design: rebuild MailPin as Organic Workspace V2 + QoL** ;
- version distribuée inchangée : **1.6.1** ;
- identifiant canonique inchangé : `ussmarines.mailpin@addons.thunderbird.net`.

## État audité

Organic Workspace est désormais écrit directement dans les sources HTML/CSS canoniques : le runtime gère les états et interactions mais ne reconstruit plus le shell Dashboard/Options. Le Dashboard ne contient qu’un landmark `main`, Options conserve ses 101 contrôles persistés, et les anciens wrappers CSS devenus morts ont été supprimés.

La passe vidéo/QoL reste intégrée : responsive par surface disponible, inspector contextuel, menus et statistiques dans le flux, Kanban lisible, Rule Builder structuré, Affaires recomposées, commandes Enregistrer/Annuler dans l’en-tête sticky, palette automatique MailPin et focus immédiat après création.

L’audit a aussi corrigé un défaut de validation : `tests/test_organic_workspace_ui.py` définissait des fonctions de test mais était lancé comme simple script. Il possède maintenant un point d’entrée explicite ; ses cinq contrats sont réellement exécutés par `npm test` et affichent `Organic Workspace UI contracts: OK`.

Aucun changement de permission, API Experiment, schéma de données, stockage, réseau, télémétrie, dépendance runtime ou ID d’extension.

## Preuves fraîches du HEAD propre

Sur `41ae231d4c3f2fca1ccbb33325b294ba88453d40` :

- GitHub Actions QA run **31713371255** : succès ;
  - `npm run ci` complet + structure XPI sous Linux : succès ;
  - contrôles source/modèles Windows : succès ;
  - garde sécurité + full-history identity : succès ;
  - artefact `development-build` : **9186201391** ;
- Thunderbird runtime smoke run **31713371263** : succès ;
  - Thunderbird **153.0.1 ESR** + geckodriver **0.37.1** ;
  - installation, injection, ouverture Dashboard, désinstallation/nettoyage et réinstallation : succès ;
  - artefact `thunderbird-runtime-smoke` : **9186204968** ;
- XPI du HEAD propre : SHA-256 `5ae857ea9b10303b77fdb87fa5b8fbe7894c1f30e829431942542515316d1e19`.

## Limites

Le smoke réel valide le cycle de vie et les contrats runtime, pas le jugement visuel humain. Les derniers problèmes d’espacement/ergonomie signalés par l’utilisateur devront servir d’entrées à la prochaine passe de revue, après l’audit global du dépôt.

## Git

L’utilisateur a explicitement autorisé l’intégration de cette refonte dans `main` après cette validation, puis un audit global du dépôt. Utiliser le mode de merge autorisé par le ruleset (squash si requis), vérifier le SHA final de `main`, puis repartir d’une branche dédiée pour le nettoyage global.

Codex Security n’a pas été utilisé et n’est pas requis par cette étape.
