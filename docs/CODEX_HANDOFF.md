# Passage de relais — MailPin 1.7.13 publiée

- branche : `main` ; version source : **1.7.13** ; dernière release publique : **1.7.13** ;
- tag/release : `v1.7.13` → `9bc7a0ef2c28fc2547420ea4d1e6172d50e7cf0d` ; Thunderbird `153.0` à `160.*` ;
- PR #94 squash-mergée (candidate `092a3afa4d9bf495d7110f3ab0e4550114eb3634`) ; pas de modification du runtime, d'identité, de permissions ou de stockage ;
- QA candidate `43236791295`, smoke Thunderbird 160.0 `43236791204`, CodeQL `43236785838` : PASS ;
- QA cible `43237043214`, smoke réel `43237043458`, CodeQL `43237043274` : PASS ; publisher `43237379954` : PASS ;
- XPI public `MailPin_v1.7.13.xpi` SHA-256 `58b734de3bb8835f9fd8dc01b61115bbee3d83e8b2ebbc7ada3ec71ae93b90ec` ; archive source et checksums publics ;
- limites : aucun téléchargement indépendant des assets GitHub, ni recette IMAP/Gmail/CalDAV/macOS sur profils utilisateurs. ATN indépendante.

Preuves : `../VALIDATION_REPORT_1.7.13.md`, `AI_VALIDATION_STATE.json`. Toute correction future commence par l'état Git actuel et une nouvelle branche. Les mises à jour documentaires après la release n'affectent pas les assets/tag figés.
