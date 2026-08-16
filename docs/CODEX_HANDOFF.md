# Passage de relais — MailPin 1.7.1 publié

## Référence

- dépôt : `ussmarines/mailpin-thunderbird` ;
- `main` release 1.7.1 : `c2b886677413a205d57a191234b1dac6279b86d6` ;
- version source : **1.7.1** ;
- dernière release publique : **1.7.1** ;
- `releaseStatus` : **published** ;
- identifiant canonique : `ussmarines.mailpin@addons.thunderbird.net`.

## Résultat

La dérive de métadonnées post-1.7.0 est corrigée et les gardes pré-publication sont renforcés sans toucher au métier, aux permissions, aux schémas, aux dépendances runtime, à l’identité ou au réseau.

## Preuves finales

- PR #43 : QA Linux/Windows et garde sécurité/identité PASS — run `31950636397` ;
- smoke Thunderbird 153 exact candidat PASS — run `31950636456` ;
- squash merge : `c2b886677413a205d57a191234b1dac6279b86d6` ;
- QA `main` PASS — run `31950703455` ;
- smoke Thunderbird `main` PASS — run `31950703452` ;
- Release PASS — run `31951120772` ;
- XPI publié SHA-256 `4586646a1d6ebe793c52040beeb7faf929e59d771a59a1ff0b0f63c13308e5f0` ;
- archive source publiée SHA-256 `8020b6e2e01b656691855c68f558a4b66a567489776652b4f50e20dfc7840c41`.

## Reste hors gate GitHub 1.7.1

- recette visuelle humaine Organic Workspace non enregistrée comme exécutée ;
- matrice réelle Gmail/Microsoft/IMAP/CalDAV et macOS à consigner si elle est revendiquée pour ATN ;
- revue juridique/marque et soumission ATN restent externes ;
- `MP-2026-018` reste `À VALIDER` pour l’identité binaire du conteneur ZIP entre plateformes.

Codex Security n’a pas été utilisé.
