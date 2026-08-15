# Release MailPin 1.7.0

## État

- **Version source/candidate :** 1.7.0
- **Dernière release publique :** 1.7.0
- **Publication 1.7.0 :** publiée sur GitHub le **15 août 2026** depuis le commit `419d1c7de208a304dd71ad4d87f9d2eacdb91048`
- **Tag :** `v1.7.0`
- **Nom :** MailPin — Email Follow-up & Productivity for Thunderbird
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité déclarée :** Thunderbird 153.0 à 153.*
- **Licence :** MailPin Source-Available License 1.1

## Portée 1.7.0

La release intègre Organic Workspace, les corrections QoL issues des recettes vidéo et l’audit global du dépôt. Elle remplace la dernière release publique 1.6.1 sans réutiliser un numéro d’artefact précédent.

Aucune nouvelle permission WebExtension, dépendance runtime, connexion réseau, télémétrie, publicité ou code distant n’est ajoutée. Les identifiants persistants legacy nécessaires aux migrations restent inchangés.

## Livrables publiés

Le workflow Release **31901834209** a reconstruit et publié depuis le commit exact de release :

- `MailPin_v1.7.0.xpi` — SHA-256 `749d8ee9c55efd9bcda1230c157da1ad5f121ae735f41b1762449c10bd050734` ;
- `MailPin_GitHub_Repository_v1.7.0.zip` — SHA-256 `fc5d3e30e27178ae265bee5bc29b58cc483de063dcdd3238289b10777a19e5a0` ;
- `SHA256SUMS.txt`.

Le workflow a exécuté `npm run ci`, préparé les métadonnées puis créé la release GitHub `MailPin 1.7.0` et le tag `v1.7.0` sur `419d1c7de208a304dd71ad4d87f9d2eacdb91048`.

## Preuves disponibles

- QA Linux/Windows de la source auditée 1.7.0 : succès ;
- QA post-merge sur `main` : succès ;
- garde sécurité et identité historique : succès ;
- build reproductible : succès ;
- smoke Thunderbird 153 réel : succès ;
- audit sécurité standard : succès ;
- workflow Release **31901834209** : succès ;
- release GitHub `v1.7.0` : publiée, non draft, non prerelease ;
- aucune nouvelle permission, dépendance runtime, connexion réseau, télémétrie, publicité ou code distant ;
- autorisation explicite de publication donnée par le propriétaire le 15 août 2026.

## Décision sur la recette humaine

La recette visuelle et fonctionnelle humaine supplémentaire demandée par le plan de test n’est **pas enregistrée comme exécutée**. Le propriétaire a néanmoins explicitement demandé et autorisé la release 1.7.0 le 15 août 2026. Cette décision de publication ne transforme pas un contrôle non exécuté en faux PASS.

La soumission et la revue Add-ons for Thunderbird (ATN) restent une étape distincte de la release GitHub.
