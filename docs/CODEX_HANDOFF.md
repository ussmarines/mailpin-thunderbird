# Passage de relais — MailPin 1.7.0 publié

## Référence

- dépôt : `ussmarines/mailpin-thunderbird` ;
- source auditée : PR #40, HEAD produit `88ba52cd6bdb3e3c81a41e456e72042f8c84c587` ;
- PR de promotion release : #41 ;
- commit `main` publié : `419d1c7de208a304dd71ad4d87f9d2eacdb91048` ;
- version : **1.7.0** ;
- dernière release publique : **1.7.0** ;
- tag : **v1.7.0** ;
- `releaseStatus` post-publication : **published** ;
- identifiant canonique inchangé : `ussmarines.mailpin@addons.thunderbird.net`.

## État

Organic Workspace est intégré et l’audit global 1.7.0 a terminé avec succès. Aucun changement de permission, schéma de données, migration, dépendance runtime, réseau, télémétrie ou ID d’extension n’a été introduit pendant la promotion release.

Le propriétaire a explicitement autorisé la mise à jour et la publication de **MailPin 1.7.0 le 15 août 2026**. La release GitHub a été créée par le workflow Release depuis le commit exact `419d1c7de208a304dd71ad4d87f9d2eacdb91048`.

## Preuves

Sur le HEAD produit `88ba52cd6bdb3e3c81a41e456e72042f8c84c587` :

- PR #40 QA run **31719085457** : succès ;
- Thunderbird runtime smoke run **31719085416** : succès avec Thunderbird **153.0.1 ESR** et geckodriver **0.37.1** ;
- audit sécurité standard run **31721145559** : succès ;
- aucun Codex Security utilisé.

Promotion/publication :

- PR #41 : fusionnée ;
- QA post-merge **31900989681** : succès ;
- workflow Release **31901834209** : succès ;
- release `v1.7.0` : publiée, non draft, non prerelease ;
- XPI : `MailPin_v1.7.0.xpi`, SHA-256 `749d8ee9c55efd9bcda1230c157da1ad5f121ae735f41b1762449c10bd050734` ;
- archive dépôt : `MailPin_GitHub_Repository_v1.7.0.zip`, SHA-256 `fc5d3e30e27178ae265bee5bc29b58cc483de063dcdd3238289b10777a19e5a0` ;
- `SHA256SUMS.txt` publié.

## Recette humaine

La recette visuelle et fonctionnelle humaine supplémentaire n’est pas enregistrée comme exécutée. Aucun PASS manuel n’est inventé. Le propriétaire a explicitement autorisé la publication sans exiger cette preuve supplémentaire avant la release.

## Suite

1. conserver `main` comme ligne de développement après publication ;
2. maintenir `latestPublicVersion: 1.7.0` et `releaseStatus: published` jusqu’à l’ouverture d’un nouveau cycle de version ;
3. traiter séparément toute future soumission Add-ons for Thunderbird (ATN) ;
4. ne republier aucun artefact différent sous le tag/version `v1.7.0`.
