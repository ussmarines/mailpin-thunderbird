# Passage de relais — MailPin 1.7.0 après audit global

## Référence

- dépôt : `ussmarines/mailpin-thunderbird` ;
- branche auditée : `audit/global-repo-cleanup-2026-08-13` ;
- base `main` avant audit global : `0c0400170aac631d13d795050d669cbb1a83ea7f` ;
- HEAD produit propre validé : `88ba52cd6bdb3e3c81a41e456e72042f8c84c587` ;
- PR : **#40 — chore(audit): reconcile MailPin 1.7.0 source and repository state** ;
- version source : **1.7.0** ;
- dernière release publique : **1.6.1** ;
- `releaseStatus` : **development** ;
- identifiant canonique inchangé : `ussmarines.mailpin@addons.thunderbird.net`.

## État audité

Organic Workspace est intégré dans `main` via la PR #39. L’audit global suivant a vérifié le dépôt entier puis corrigé uniquement les écarts prouvés : version source distincte de la release publique, documentation active, métadonnées, roadmap, noms non persistants hérités, deux helpers privilégiés morts et garde de publication.

Les identifiants historiques nécessaires aux migrations/continuité restent volontairement présents. Aucun changement de permission, schéma de données, migration, dépendance runtime, réseau, télémétrie ou ID d’extension n’a été introduit.

Le workflow Release exige désormais `releaseStatus == candidate`. La ligne 1.7.0 reste donc non publiable tant qu’elle est marquée `development`.

## Preuves fraîches

Sur le HEAD produit `88ba52cd6bdb3e3c81a41e456e72042f8c84c587` :

- PR #40 QA run **31719085457** : succès ;
  - `npm run ci` complet + structure XPI Linux : succès ;
  - contrôles source/modèles Windows : succès ;
  - garde sécurité + full-history identity : succès ;
  - artefact `development-build` : **9188508237** ;
- Thunderbird runtime smoke run **31719085416** : succès ;
  - Thunderbird **153.0.1 ESR** + geckodriver **0.37.1** ;
  - build, installation, runtime Dashboard et cycle de nettoyage : succès ;
  - artefact `thunderbird-runtime-smoke` : **9188512378** ;
- audit sécurité standard complémentaire run **31721145559** : succès en mode bloquant ;
  - identity/full-history, Gitleaks, Opengrep, Trivy vuln/misconfig, SBOM CycloneDX et Zizmor offline : succès ;
  - artefact de rapports : **9189352790**.

Codex Security n’a pas été utilisé.

## Limites et prochaine étape

La preuve automatisée ne remplace pas la recette visuelle et fonctionnelle humaine. L’utilisateur veut d’abord installer et tester cette version sur sa machine.

Ne pas préparer ni lancer de prompt Codex avant ce retour local. La future revue Codex devra partir des problèmes réellement observés pendant ce test, du diff encore pertinent et des preuves ci-dessus encore valides.

Aucun tag ni release 1.7.0 ne doit être créé à ce stade.
