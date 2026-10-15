# Passage de relais — MailPin 1.7.11 publiée

- branche : `main` ; version source : **1.7.11** ; dernière release publique : **1.7.11** ;
- tag/release : `v1.7.11` → `fce07e98e2a056f38bfc7143766a71d1f7923e44` ; Thunderbird 153.0 à 158.* ;
- ID : `ussmarines.mailpin@addons.thunderbird.net` ; runtime métier inchangé ;
- PR #86 fusionnée après QA/smoke 158/CodeQL verts sur `c19bd4054c9632ce44bbda4a1512c6b1ab6ae910` ;
- target intégré : QA `38754897029`, smoke réel Linux 158 `38754897259`, CodeQL `38754896607` PASS ; publisher `38755293619` PASS ;
- trois artefacts publics téléchargés, SHA-256 vérifiés et archives identiques à la QA du target.

Preuves détaillées, empreintes et limites : `../VALIDATION_REPORT_1.7.11.md`, `AI_VALIDATION_STATE.json`. Les contrôles Windows synthétiques et les contrats restent valides ; fournisseurs réseau, macOS, accessibilité assistée et matrice inférieure non rejoués.

Le checkout initial et ses modifications Graphify sont préservés ; PR #84 et #74 inchangées. Aucune soumission ATN. La documentation publiée après le tag ne modifie pas les assets immuables de cette release.
