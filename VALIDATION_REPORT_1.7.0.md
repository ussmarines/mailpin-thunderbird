# Rapport de validation — MailPin 1.7.0

## État

La source 1.7.0 est la ligne post-Organic Workspace et audit global. La dernière release publique reste **1.6.1** jusqu’à la création effective de la release 1.7.0. Le propriétaire a explicitement autorisé la publication de MailPin 1.7.0 le **15 août 2026**.

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

## Décision de publication — 15 août 2026

Le propriétaire a explicitement demandé de mettre à jour le dépôt et de publier la release **MailPin 1.7.0**. Cette instruction autorise la promotion de `releaseStatus` vers `candidate`, le merge de la préparation de release, le tag et la release GitHub.

La recette visuelle et fonctionnelle humaine supplémentaire du XPI exact n’est **pas enregistrée comme exécutée**. Elle n’est donc pas présentée comme PASS. La décision du propriétaire est une autorisation de publication malgré cette preuve additionnelle non consignée ; elle ne modifie pas les résultats automatisés réellement obtenus.

Le workflow Release doit reconstruire les artefacts depuis le commit exact de release et exécuter `npm run ci` avant publication.

La soumission Add-ons for Thunderbird (ATN) reste une étape distincte de la release GitHub.
