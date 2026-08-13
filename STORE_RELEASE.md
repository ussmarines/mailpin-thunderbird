# Préparation MailPin 1.7.0

## État

- **Version source/candidate :** 1.7.0
- **Dernière release publique :** 1.6.1
- **Publication 1.7.0 :** non effectuée — décision explicite requise
- **Nom :** MailPin — Email Follow-up & Productivity for Thunderbird
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité déclarée :** Thunderbird 153.0 à 153.*
- **Licence :** MailPin Source-Available License 1.1

## Portée du candidat 1.7.0

Le candidat source intègre Organic Workspace, les corrections QoL issues des recettes vidéo et l’audit global du dépôt. Il sépare désormais explicitement le numéro de source de la release publique 1.6.1, afin qu’aucun build modifié ne réutilise le nom/version d’un artefact déjà publié.

Aucune nouvelle permission WebExtension, dépendance runtime, connexion réseau, télémétrie, publicité ou code distant n’est ajoutée. Les identifiants persistants legacy nécessaires aux migrations restent inchangés.

## Livrables de candidat

Après `npm run ci` :

- `dist/MailPin_v1.7.0.xpi` ;
- `dist/MailPin_GitHub_Repository_v1.7.0.zip` ;
- `dist/SHA256SUMS.txt`.

Ces fichiers ne deviennent des artefacts publics qu’après validation humaine, revue indépendante, autorisation explicite de publication, tag et workflow Release.

## Preuves requises avant publication

- QA Linux/Windows ;
- garde sécurité et identité historique ;
- build reproductible ;
- smoke Thunderbird 153 réel ;
- audit sécurité standard ;
- recette humaine ciblée Organic Workspace ;
- vérification des limitations/fournisseurs annoncés ;
- revue Codex indépendante demandée par le propriétaire.

L’historique et les hashes de la release publique 1.6.1 restent dans `VALIDATION_REPORT_1.6.1.md`, `SECURITY_AUDIT_1.6.1.md` et la release GitHub correspondante.
