# Rapport de validation — MailPin 1.7.0

## État final

MailPin **1.7.0** est publié sur GitHub depuis le **15 août 2026**. La release `v1.7.0` cible exactement le commit `419d1c7de208a304dd71ad4d87f9d2eacdb91048`, est non draft et non prerelease, et contient les trois artefacts attendus.

## Tree produit validé

HEAD propre de la PR #40 : `88ba52cd6bdb3e3c81a41e456e72042f8c84c587`.

- Organic Workspace intégré via PR #39 ;
- shell Dashboard/Options canonique dans le HTML source ;
- garde Organic Workspace exécuté dans `npm test` ;
- permission, réseau, stockage et identifiant d’extension inchangés ;
- audit de code mort, documents actifs, workflows, tests et métadonnées effectué ;
- workflow Release durci : publication refusée tant que `releaseStatus` n’est pas `candidate`.

## Preuves GitHub avant publication

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

## Promotion et publication

La PR de promotion **#41** a synchronisé l’état release sans modifier le runtime, les permissions, les schémas, les dépendances ou l’identité. Le commit `main` publié est :

`419d1c7de208a304dd71ad4d87f9d2eacdb91048`

QA post-merge **31900989681** : succès.

Workflow Release **31901834209** : succès.
- `npm run ci` : succès ;
- préparation métadonnées : succès ;
- création de la release GitHub : succès.

Release finale :
- tag : `v1.7.0` ;
- nom : `MailPin 1.7.0` ;
- cible : `419d1c7de208a304dd71ad4d87f9d2eacdb91048` ;
- draft : non ;
- prerelease : non ;
- `MailPin_v1.7.0.xpi` — SHA-256 `749d8ee9c55efd9bcda1230c157da1ad5f121ae735f41b1762449c10bd050734` ;
- `MailPin_GitHub_Repository_v1.7.0.zip` — SHA-256 `fc5d3e30e27178ae265bee5bc29b58cc483de063dcdd3238289b10777a19e5a0` ;
- `SHA256SUMS.txt` publié.

## Décision de publication — 15 août 2026

Le propriétaire a explicitement demandé de mettre à jour le dépôt et de publier la release **MailPin 1.7.0**. Cette instruction a autorisé la promotion de `releaseStatus` vers `candidate`, le merge de la préparation de release, le tag et la release GitHub.

La recette visuelle et fonctionnelle humaine supplémentaire du XPI exact n’est **pas enregistrée comme exécutée**. Elle n’est donc pas présentée comme PASS. La décision du propriétaire est une autorisation de publication malgré cette preuve additionnelle non consignée ; elle ne modifie pas les résultats automatisés réellement obtenus.

La soumission Add-ons for Thunderbird (ATN) reste une étape distincte de la release GitHub.
