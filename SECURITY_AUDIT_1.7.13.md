# Revue différentielle de sécurité — MailPin 1.7.13

**PASS sur la portée différentielle vérifiée.** Passage de la borne Thunderbird `159.*` à `160.*` et version `1.7.13` ; smoke runtime sur Thunderbird officiel 160.0 avec SHA-256 de téléchargement vérifié. Runtime, API Experiment, `PinCompatibility`, identité `ussmarines.mailpin@addons.thunderbird.net`, permissions `menus`, CSP, SQLite et dépendances inchangés.

- PR #94 `092a3afa4d9bf495d7110f3ab0e4550114eb3634` : QA 43236791295, smoke Thunderbird 160 43236791204 et CodeQL 43236785838 PASS.
- Cible publiée `9bc7a0ef2c28fc2547420ea4d1e6172d50e7cf0d` : QA 43237043214, smoke 43237043458 et CodeQL 43237043274 PASS ; workflow Release 43237379954 PASS.
- Le XPI publié expose SHA-256 `58b734de3bb8835f9fd8dc01b61115bbee3d83e8b2ebbc7ada3ec71ae93b90ec`, identique à celui de la candidate locale ; la vérification est fondée sur les digests déclarés par GitHub, sans retéléchargement indépendant de l'asset.
- Aucun Codex Security, scan global supplémentaire, permission ou connexion runtime ajoutés.

Limites : le smoke automatisé Linux ne prouve pas tous les fournisseurs, profils, calendriers distants, macOS ni les usages prolongés. Revue ATN indépendante.
