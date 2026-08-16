# Préparation MailPin 1.7.1

## État

- **Version source/candidate :** 1.7.1 — publiée
- **Dernière release publique :** 1.7.1
- **Publication 1.7.1 :** publiée le **16 août 2026** après autorisation explicite et gates verts
- **Tag :** `v1.7.1`
- **Commit release exact :** `c2b886677413a205d57a191234b1dac6279b86d6`
- **Nom :** MailPin — Email Follow-up & Productivity for Thunderbird
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité déclarée :** Thunderbird 153.0 à 153.*
- **Licence :** MailPin Source-Available License 1.1

## Portée du candidat 1.7.1 publié

La 1.7.1 est une maintenance de préparation publique après la release 1.7.0. Elle corrige la dérive de métadonnées active détectée après publication et renforce les gardes qui empêchent une divergence future entre version source, version publique et ressources locales.

Aucune logique métier, permission WebExtension, dépendance runtime, connexion réseau, télémétrie, publicité, code distant, schéma de données ou identité n’est modifié.

## Artefacts publiés

- `MailPin_v1.7.1.xpi` — SHA-256 `4586646a1d6ebe793c52040beeb7faf929e59d771a59a1ff0b0f63c13308e5f0` ;
- `MailPin_GitHub_Repository_v1.7.1.zip` — SHA-256 `8020b6e2e01b656691855c68f558a4b66a567489776652b4f50e20dfc7840c41` ;
- `SHA256SUMS.txt` — asset SHA-256 `2c1d7cf2e854e5dea9cdcbe571ae27098e23106bad5e945bd54c79cdd3d10d46`.

Le workflow Release `31951120772` a exécuté `npm run ci`, forcé le checkout du commit release exact puis publié `v1.7.1`. Le XPI publié porte la même empreinte que le build local validé.

## Gates GitHub publication

- [x] QA Linux complète sur le candidat — PR run `31950636397` ;
- [x] contrôles source/modèle Windows — PR run `31950636397` ;
- [x] garde sécurité/identité — PR run `31950636397` ;
- [x] build reproductible et structure XPI ;
- [x] smoke Thunderbird 153 réel sur le candidat exact — run `31950636456` ;
- [x] merge squash sur `main` — commit `c2b886677413a205d57a191234b1dac6279b86d6` ;
- [x] QA `main` — run `31950703455` ;
- [x] smoke Thunderbird `main` — run `31950703452` ;
- [x] workflow Release 1.7.1 et artefacts publiés — run `31951120772`.

La recette visuelle humaine supplémentaire d’Organic Workspace n’est pas enregistrée comme exécutée. La 1.7.1 ne modifie aucune surface UI/runtime correspondante ; cette validation reste distincte pour ATN.

Codex Security n’est pas utilisé.
