# Revue différentielle de sécurité — MailPin 1.7.11

Revue limitée au diff de compatibilité 158, sans audit global ni Codex Security. Le runtime, les permissions, la CSP, l’identité, le stockage et les adaptateurs restent inchangés. Le workflow conserve SHA-256 officiel, geckodriver 0.37.1, actions épinglées et permissions minimales.

`npm run check` (garde identité/secrets, contrôles source) et `npm test` passent. Les smokes et contrats réels/ciblés passent ; les contrôles build et limites sont détaillés dans `VALIDATION_REPORT_1.7.11.md`. QA et garde sécurité `38754897029`, CodeQL `38754896607` et smoke réel Linux 158 `38754897259` PASS sur le target publié `fce07e98e2a056f38bfc7143766a71d1f7923e44`. Publisher `38755293619` PASS ; assets publics téléchargés et vérifiés. Aucune validation ATN revendiquée.
