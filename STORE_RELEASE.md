# Préparation MailPin 1.7.1

## État

- **Version source/candidate :** 1.7.1
- **Dernière release publique :** 1.7.0
- **Publication 1.7.1 :** autorisée explicitement par le propriétaire le **16 août 2026** ; publication uniquement après gates verts du candidat exact
- **Nom :** MailPin — Email Follow-up & Productivity for Thunderbird
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité déclarée :** Thunderbird 153.0 à 153.*
- **Licence :** MailPin Source-Available License 1.1

## Portée du candidat 1.7.1

La 1.7.1 est une maintenance de préparation publique après la release 1.7.0. Elle corrige la dérive de métadonnées active détectée après publication et renforce les gardes qui empêchent une divergence future entre version source, version publique et ressources locales.

Aucune logique métier, permission WebExtension, dépendance runtime, connexion réseau, télémétrie, publicité, code distant, schéma de données ou identité n’est modifié.

## Livrables attendus

Après `npm run ci` sur le candidat exact :

- `dist/MailPin_v1.7.1.xpi` ;
- `dist/MailPin_GitHub_Repository_v1.7.1.zip` ;
- `dist/SHA256SUMS.txt`.

Le workflow Release doit reconstruire les livrables depuis `main`, vérifier `releaseStatus: candidate`, exécuter `npm run ci`, puis créer `v1.7.1`. Il ne doit pas réutiliser ni modifier les artefacts `v1.7.0`.

## Gates avant publication

- [ ] QA Linux complète sur le candidat ;
- [ ] contrôles source/modèle Windows ;
- [ ] garde sécurité/identité ;
- [ ] build reproductible et structure XPI ;
- [ ] smoke Thunderbird 153 réel sur le candidat exact ;
- [ ] merge squash sur `main` ;
- [ ] workflow Release 1.7.1 vert et artefacts publiés.

La recette visuelle humaine supplémentaire d’Organic Workspace n’est pas enregistrée comme exécutée. La 1.7.1 ne modifie aucune surface UI/runtime correspondante ; cette validation reste distincte pour ATN.

Codex Security n’est pas utilisé.
