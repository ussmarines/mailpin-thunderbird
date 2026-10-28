# Revue différentielle de sécurité — MailPin 1.7.12

**PASS dans la portée différentielle.** Compatibilité déclarée Thunderbird `158.*` → `159.*` et version `1.7.12` ; smoke officiel 159.0 vérifié SHA-256. Les modules runtime, l'Experiment, `PinCompatibility`, l’identité `ussmarines.mailpin@addons.thunderbird.net`, les permissions `menus`, les schémas, le stockage et la CSP restent inchangés. Aucun réseau/télémétrie/pub/CDN/code distant ajouté.

- Candidate PR #90 head `249116323668f322d04cb37def629f8ecb19df5a` : QA `40755535256`, smoke réel Thunderbird 159 `40755535312`, CodeQL `40755524358` PASS.
- Tag/release target `968832d1f2db39a227e16c0f079d3ba06f669359` : QA `40755717992`, smoke réel `40755718258`, CodeQL `40755717952` PASS ; publisher `40755984476` PASS.
- Le workflow Release a été étendu à une branche contrôlée `publish/v*`, gardée par la condition **exacte** `origin/main == GITHUB_SHA` et une version candidate. Test de contrat ajouté. Pas d’élargissement des permissions ni d'utilisation de secrets en clair.

Codex Security non utilisé. La publication GitHub n'est pas une approbation ATN ; les fournisseurs, profils utilisateurs et macOS restent hors périmètre. Les assets ont été constatés dans l'API GitHub avec digests, pas re-téléchargés pour vérification indépendante.
