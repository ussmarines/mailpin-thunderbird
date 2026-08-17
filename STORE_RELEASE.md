# Préparation MailPin 1.7.2

## État

- **Version source :** 1.7.2 — candidate
- **Dernière release publique :** 1.7.1
- **Dernière publication :** `v1.7.1`, commit `c2b886677413a205d57a191234b1dac6279b86d6`
- **Baseline de la candidate 1.7.2 :** `main` à `5284e39a43513d38ededec5e7f939a685f7fdd2c`
- **Nom :** MailPin — Email Follow-up & Productivity for Thunderbird
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité déclarée :** Thunderbird 153.0 à 153.*
- **Licence :** MailPin Source-Available License 1.1

## Portée candidate 1.7.2

La 1.7.2 corrige des problèmes de navigation et de composition observés en usage réel dans le Dashboard et les Paramètres : contrôle « Plus de statistiques », section active du rail, barre Enregistrer/Annuler, notifications, espacements, cartes Agenda et action d’enregistrement des raccourcis.

Aucune permission WebExtension, logique métier, migration, schéma, stockage SQLite, dépendance runtime, connexion réseau, télémétrie, publicité, code distant ou identité n’est modifié.

## Preuve déjà acquise sur le runtime corrigé

La PR #47 a validé le head exact `551841858e974482f046a1980e52cfc84be71a6c` avec :

- QA Linux/Windows et garde sécurité : run `32024824818` — PASS ;
- smoke Thunderbird réel : run `32024824756` — PASS ;
- merge squash vers `main` : `5284e39a43513d38ededec5e7f939a685f7fdd2c`.

Ces preuves ont déclenché la préparation 1.7.2, mais la candidate versionnée doit repasser ses gates exacts avant publication.

## Artefacts attendus

- `MailPin_v1.7.2.xpi` ;
- `MailPin_GitHub_Repository_v1.7.2.zip` ;
- `SHA256SUMS.txt`.

Les empreintes ne seront inscrites comme définitives qu’après le build/release exact.

## Gates 1.7.2 avant publication

- [ ] `npm run ci` sur la PR de release ;
- [ ] contrôles source/modèle Windows ;
- [ ] garde sécurité/identité ;
- [ ] build reproductible et structure XPI ;
- [ ] smoke Thunderbird 153 réel sur la candidate exacte ;
- [ ] merge de la PR de release sur `main` ;
- [ ] workflow Release exécuté depuis `main` avec `releaseStatus = candidate` ;
- [ ] release `v1.7.2` et artefacts vérifiés après publication.

La recette visuelle humaine supplémentaire post-correction n’est pas déclarée comme exécutée. Elle reste recommandée pour confirmer les détails esthétiques que le smoke automatisé ne peut pas prouver.

Codex Security n’est pas utilisé.
