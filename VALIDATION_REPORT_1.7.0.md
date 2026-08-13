# Rapport de validation — MailPin 1.7.0 (source)

## État

La source 1.7.0 est la ligne post-Organic Workspace et audit global. Dernière release publique : 1.6.1. `releaseStatus` reste `development` ; aucun tag ni release 1.7.0 n’est créé par ce rapport.

## Tree produit validé

HEAD propre de la PR #40 : `88ba52cd6bdb3e3c81a41e456e72042f8c84c587`.

- Organic Workspace intégré via PR #39 ;
- shell Dashboard/Options canonique dans le HTML source ;
- garde Organic Workspace exécuté dans `npm test` ;
- permission, réseau, stockage et identifiant d’extension inchangés ;
- audit de code mort, documents actifs, workflows, tests et métadonnées effectué ;
- workflow Release durci : publication refusée tant que `releaseStatus` n’est pas `candidate`.

## Preuves GitHub

PR #40 — QA run **31719085457** : succès.
- `npm run ci` complet et structure XPI sous Linux : succès ;
- contrôles source/modèles Windows : succès ;
- garde sécurité et identité historique : succès ;
- artefact `development-build` : **9188508237**.

Thunderbird runtime smoke run **31719085416** : succès.
- Thunderbird 153.0.1 ESR + geckodriver 0.37.1 ;
- build, installation temporaire, runtime Dashboard et cycle de nettoyage : succès ;
- artefact `thunderbird-runtime-smoke` : **9188512378**.

Audit standard complémentaire run **31721145559** sur une branche éphémère issue exactement du HEAD produit : succès. Artefact de rapports : **9189352790**. Le détail des outils et du périmètre est consigné dans `SECURITY_AUDIT_1.7.0.md`.

Codex Security n’a pas été utilisé.

## Validation restante

La recette visuelle et fonctionnelle humaine sur le XPI installé reste distincte des preuves automatisées. La revue Codex indépendante est volontairement différée jusqu’après le test local utilisateur.
