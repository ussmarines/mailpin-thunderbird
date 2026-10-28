# Rapport de validation — MailPin 1.7.12 / Thunderbird 159.0

## Statut

**Candidate en préparation, non publiée.** Dernière release publique : 1.7.11 (Thunderbird 153.0–158.*). La borne manifeste 159.* n'est pas en soi une preuve de fonctionnement sur Thunderbird 159.

## Critères PASS/FAIL préétablis

A. **Git** : branche dédiée depuis `main` actuel, identité publique et PR native 2.2.0 draft préservées ; aucun travail concurrent écrasé.
B. **Contrats/source** : versions manifest/package/état/docs synchronisées, `npm run ci` et contrôles sécurité ciblés PASS, aucune nouvelle permission, réseau runtime, schéma, migration ou modification lu/non-lu.
C. **Thunderbird réel 159.0** : téléchargement officiel vérifié SHA-256 ; installation du XPI, injection unique `about:3pane`, pin/unpin, compteurs/lu, Dashboard/Options, cycle démarrage/nettoyage et Quick Filter selon couverture du banc ; zéro erreur bloquante.
D. **Archivage** : XPI et source reviewer reconstruits, fichiers et SHA-256 vérifiés sur la même révision ; CodeQL et checks nécessaires PASS.
E. **Publication** : PR fusionnée selon règles Git, vérification QA/smoke/CodeQL sur la cible exacte, release GitHub v1.7.12 avec XPI, source et SHA256SUMS, vérification des assets téléchargés.

Une seule défaillance bloquante entraîne **NO-GO release** ; relancer d’abord le contrôle échoué après correction. Les anciennes preuves Thunderbird 158, les fournisseurs distants et macOS ne valent pas validation Thunderbird 159.

## État initial

- `main` : `133975ba1dd7c2d61bb8626351658abb78018b41` ; dernière release `v1.7.11` ; limite 158.*.
- PR #84, candidate native 2.2.0 zéro Experiment : séparée, non fusionnée et non publiée.
- Cible officielle : [Thunderbird 159.0, 27 octobre 2026](https://www.thunderbird.net/en-US/thunderbird/159.0/releasenotes/).
- Contrôles candidat et smoke réels 159 : **non encore exécutés au moment de la préparation**.

## Preuves et limites

Inscrire uniquement des résultats issus de workflows/actions sur le SHA exact. Aucune validation manuelle de profils personnels ou fournisseurs distants n’est revendiquée.
