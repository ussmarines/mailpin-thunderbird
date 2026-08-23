# Rapport de validation — MailPin 1.7.6

## Objectif

Valider la correction du défaut de cold start où les épingles persistées n’étaient rendues dans la boîte mail qu’après une action MailPin telle que l’ouverture du Dashboard.

## Résultat

**PASS pour la correction runtime et la publication GitHub 1.7.6, avec une limite distincte sur la revérification indépendante des assets publics.**

## Preuves

- baseline réelle Thunderbird 154.0 avant correction : background MV3 `stopped`, panneau/toggle absents sans interaction ;
- correctif PR #64 head `26fc0ac9b4d35009f125f543eefc5de9338bef71` : QA `32639780333` PASS et smoke réel Thunderbird 154.0 `32639780313` PASS ;
- cold start sur profil persistant : `APP_STARTUP`, background actif, 50 références SQLite préservées, cartes attendues rendues, panneau/toggle uniques, zéro timeout et exception MailPin ;
- candidate versionnée exacte `c502175041c85e3cb6e37666a0784f7df0a9e367` : QA Linux/Windows `32640198347` PASS et smoke réel Thunderbird 154.0 `32640198339` PASS ;
- permissions, plage Thunderbird, schémas, stockage et `PinCompatibility` inchangés ;
- release `v1.7.6` observée et ciblant `522042df08c2eb7a18a13cbb83631943e54abf2c`.

## Gate publisher

Le publisher one-shot installé sur `main` exécute avant `gh release create` :
1. vérification stricte de la version/état/ID/permissions/compatibilité et du hook `runtime.onStartup` ;
2. `npm run ci` ;
3. extraction de `MailPin_GitHub_Repository_v1.7.6.zip` dans un dossier neuf sans `.git` ;
4. nouveau `npm run ci` dans l’archive ;
5. comparaison du SHA-256 du XPI reconstruit avec le XPI initial.

L’existence du tag créé par ce publisher démontre que le flux a atteint l’étape de publication.

## Limite

Le connecteur GitHub disponible dans cette session n’expose pas le téléchargement des assets de release. Une vérification indépendante post-publication des trois fichiers publics et de leurs SHA-256 n’a donc pas été exécutée ici et n’est pas présentée comme PASS.
