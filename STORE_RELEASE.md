# Préparation MailPin 1.7.0

## État

- **Version source/candidate :** 1.7.0
- **Dernière release publique :** 1.6.1
- **Publication 1.7.0 :** autorisée explicitement par le propriétaire le **15 août 2026** ; tag/release GitHub à créer après validation de la PR de promotion
- **Nom :** MailPin — Email Follow-up & Productivity for Thunderbird
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité déclarée :** Thunderbird 153.0 à 153.*
- **Licence :** MailPin Source-Available License 1.1

## Portée du candidat 1.7.0

Le candidat source intègre Organic Workspace, les corrections QoL issues des recettes vidéo et l’audit global du dépôt. Il sépare explicitement le numéro de source de la release publique 1.6.1 jusqu’à la création effective de la release 1.7.0, afin qu’aucun build modifié ne réutilise le nom/version d’un artefact déjà publié.

Aucune nouvelle permission WebExtension, dépendance runtime, connexion réseau, télémétrie, publicité ou code distant n’est ajoutée. Les identifiants persistants legacy nécessaires aux migrations restent inchangés.

## Livrables de candidat

Après `npm run ci` :

- `dist/MailPin_v1.7.0.xpi` ;
- `dist/MailPin_GitHub_Repository_v1.7.0.zip` ;
- `dist/SHA256SUMS.txt`.

Le workflow Release republie ces livrables depuis le commit exact de release et refuse toute publication tant que `docs/PROJECT_STATE.json` n’est pas à `releaseStatus: candidate`.

## Preuves disponibles

- QA Linux/Windows de la source auditée 1.7.0 : succès ;
- garde sécurité et identité historique : succès ;
- build reproductible : succès ;
- smoke Thunderbird 153 réel : succès ;
- audit sécurité standard : succès ;
- aucune nouvelle permission, dépendance runtime, connexion réseau, télémétrie, publicité ou code distant ;
- autorisation explicite de publication donnée par le propriétaire le 15 août 2026.

## Décision sur la recette humaine

La recette visuelle et fonctionnelle humaine supplémentaire demandée par le plan de test n’est **pas enregistrée comme exécutée**. Le propriétaire a néanmoins explicitement demandé la mise à jour et la release 1.7.0 le 15 août 2026. Cette décision autorise la publication sans transformer un contrôle non exécuté en faux PASS.

La soumission et la revue Add-ons for Thunderbird (ATN) restent une étape distincte de la release GitHub.
