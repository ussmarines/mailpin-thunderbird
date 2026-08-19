# Passage de relais — MailPin 1.7.4 candidate Thunderbird 154

## Référence

- dépôt : `ussmarines/mailpin-thunderbird` ;
- branche : `fix/thunderbird-154-compatibility` ;
- baseline `main` : `f7b7c99478c81b7bb4d0cc0f0c549528bc5c72c5` ;
- version source : **1.7.4** ;
- dernière release publique : **1.7.3** ;
- `releaseStatus` : **candidate** ;
- ID : `ussmarines.mailpin@addons.thunderbird.net` ;
- compatibilité candidate : Thunderbird `153.0` à `154.*`.

## Objectif

Rétablir la compatibilité avec Thunderbird 154.0 sans modifier la logique métier. La cause initiale était la limite de manifeste `strict_max_version: 153.*`; le smoke runtime est désormais exécuté sur le binaire officiel Thunderbird 154.0.

## Preuves pré-versionnement acquises

Head exact `3e1943f2be7a18ebcceef5952810675442e91a33` :

- QA Linux/Windows + garde sécurité `32299537328` — PASS ;
- smoke réel Thunderbird 154.0 `32299537485` — PASS ;
- le job runtime a construit le XPI, vérifié les téléchargements, installé MailPin, atteint `Startup: Complete`, contrôlé l’injection unique, l’ouverture unique du Dashboard, le cleanup et la réinstallation propre.

## Gates restants avant publication

- QA complète sur le head exact versionné 1.7.4 ;
- smoke réel Thunderbird 154.0 sur ce même head ;
- build/release metadata cohérents ;
- merge de la PR sur `main` uniquement si les gates sont verts ;
- workflow Release et vérification des artefacts 1.7.4.

Aucun contrôle non exécuté n’est revendiqué comme PASS. Codex Security n’est pas utilisé.
