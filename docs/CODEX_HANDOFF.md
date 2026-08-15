# Passage de relais — release MailPin 1.7.0

## Référence

- dépôt : `ussmarines/mailpin-thunderbird` ;
- source auditée : PR #40, HEAD produit `88ba52cd6bdb3e3c81a41e456e72042f8c84c587` ;
- `main` avant promotion release : `0c27715e5573d7041291883268e5c456f2eae408` ;
- branche de promotion : `codex/release-mailpin-1.7.0` ;
- version : **1.7.0** ;
- dernière release publique avant publication : **1.6.1** ;
- `releaseStatus` : **candidate** ;
- identifiant canonique inchangé : `ussmarines.mailpin@addons.thunderbird.net`.

## État

Organic Workspace est intégré et l’audit global 1.7.0 a terminé avec succès. Aucun changement de permission, schéma de données, migration, dépendance runtime, réseau, télémétrie ou ID d’extension n’a été introduit pendant la promotion release.

Le propriétaire a explicitement autorisé la mise à jour et la publication de **MailPin 1.7.0 le 15 août 2026**. La promotion vers `candidate` est donc autorisée et le workflow Release peut publier après merge de la PR de préparation.

## Preuves réutilisées

Sur le HEAD produit `88ba52cd6bdb3e3c81a41e456e72042f8c84c587` :

- PR #40 QA run **31719085457** : succès ;
- Thunderbird runtime smoke run **31719085416** : succès avec Thunderbird **153.0.1 ESR** et geckodriver **0.37.1** ;
- audit sécurité standard run **31721145559** : succès ;
- aucun Codex Security utilisé.

La modification de `docs/PROJECT_STATE.json` vers `candidate` invalide formellement le cache QA précédent pour la ligne de release ; la PR de promotion et surtout le workflow Release doivent donc fournir la preuve fraîche du commit candidat. Le workflow Release exécute `npm run ci` avant création de la release.

## Recette humaine

La recette visuelle et fonctionnelle humaine supplémentaire n’est pas enregistrée comme exécutée. Aucun PASS manuel n’est inventé. Le propriétaire a néanmoins explicitement autorisé la publication sans exiger cette preuve supplémentaire avant la release.

## Étapes de sortie

1. valider les checks de la PR de promotion 1.7.0 ;
2. merger la PR sur `main` ;
3. créer/pousser le tag `v1.7.0` sur le commit de release ou déclencher le workflow Release sur `main` ;
4. vérifier que la release GitHub `MailPin 1.7.0` contient `MailPin_v1.7.0.xpi`, `MailPin_GitHub_Repository_v1.7.0.zip` et `SHA256SUMS.txt` ;
5. après publication, resynchroniser les métadonnées publiques (`latestPublicVersion`, README et état projet) sans modifier le runtime ;
6. traiter séparément toute future soumission Add-ons for Thunderbird (ATN).
