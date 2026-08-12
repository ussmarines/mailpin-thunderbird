# Passage de relais Codex — MailPin 1.6.0

## Référence

- référence runtime intégrée : `main` au commit `ca7206329045b58aff3384e7bd4c3b99eeecd2b3` ;
- PR d’intégration : #33, fusionnée par squash ;
- version publique : **1.6.0** ;
- identifiant canonique : `ussmarines.mailpin@addons.thunderbird.net` ;
- branche de préparation runtime : `fix/pre-store-manual-findings-1.6.0` ;
- branche de finalisation documentaire : `release/finalize-1.6.0-metadata`.

## État produit

La 1.6.0 corrige les constats de recette 1.5.3 : règles Options comprimées, modale Agenda et planification, toggle et badges d’attente, délai de relance individuel, doublons message/conversation et responsive du panneau selon le splitter Thunderbird. La passe transversale pré-store aligne aussi les transitions workflow de l’éditeur, des templates, des règles et d’Agenda, supprime les états `noReply*`/relance orphelins et empêche le Dashboard d’annoncer un succès si son état post-mutation n’a pas pu être rechargé. Le dernier constat Agenda est consolidé : toute nouvelle création commence sur **Événement** et une tâche sans calendrier compatible est expliquée sans tentative de création.

La recette utilisateur finale est verte. La PR #33 puis le commit intégré ont repassé les workflows GitHub Actions **QA** et **Thunderbird runtime smoke** avec succès. Les preuves détaillées sont consignées dans `VALIDATION_REPORT_1.6.0.md`.

## Artefacts

Le build Linux final de `main` avant la finalisation documentaire a produit :

- `MailPin_v1.6.0.xpi` — SHA-256 `13de009d165ea6eb33ef4319be22a0731dfe317cab0d409272c6cd92919e54ff` ;
- l’artefact Linux de la PR est identique octet pour octet ;
- le XPI Windows utilisé pour la recette manuelle avait le SHA-256 `9ebaa2a49db29ec28339be9d99f4de85f53dec298c84a56912d5765f6d84eb3f`, différence de conteneur ZIP multiplateforme déjà suivie sous MP-2026-018.

Les sommes de la release publiées dans `SHA256SUMS.txt` restent l’autorité finale.

## Readiness

- **GitHub release 1.6.0 : GO** ;
- **ATN : encore séparé**, avec fournisseurs réseau, matrice multi-OS complète et contrôles humains/accessibilité restant hors preuve.

Aucune nouvelle permission, dépendance runtime, connexion réseau, télémétrie, publicité, migration de stockage ou modification d’identité n’est introduite par la 1.6.0. Codex Security n’a pas été utilisé.
