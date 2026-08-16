# Passage de relais — MailPin 1.7.1 candidat

## Référence

- dépôt : `ussmarines/mailpin-thunderbird` ;
- baseline publique : `main` à `378810a741be203b84abd1b07d5988e968ec8721` ;
- branche : `release/1.7.1-pre-public-hardening` ;
- version source : **1.7.1** ;
- dernière release publique : **1.7.0** ;
- `releaseStatus` : **candidate** ;
- identifiant canonique : `ussmarines.mailpin@addons.thunderbird.net`.

## Objectif

Corriger la dérive de métadonnées post-1.7.0 et durcir les gardes pré-publication sans toucher au métier, aux permissions, aux schémas, aux dépendances runtime, à l’identité ou au réseau.

## Preuves réutilisables

La release 1.7.0 a été validée et publiée. Ces preuves restent informatives pour le runtime inchangé, mais la modification du manifeste/version invalide le gate release/runtime au sens de la politique différentielle : le candidat 1.7.1 doit repasser QA, build et smoke Thunderbird exacts.

## Gates 1.7.1

1. contrôles ciblés versions/mémoire/bug tracker/repo/métadonnées ;
2. `npm run ci` une fois au jalon local final ;
3. QA PR Linux/Windows + garde sécurité ;
4. smoke réel Thunderbird 153 déclenché par le changement `extension/manifest.json` / `package.json` ;
5. merge squash sur `main` ;
6. workflow Release 1.7.1 ;
7. post-release : `latestPublicVersion: 1.7.1`, `releaseStatus: published` et preuves finales.

Codex Security n’est pas utilisé. La recette humaine UI non exécutée ne doit pas être présentée comme PASS.
