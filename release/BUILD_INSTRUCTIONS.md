# Build reviewers — MailPin 2.2.0 native candidate

La release GitHub **1.7.10** est publiée. La 2.2.0 ne l'est pas. XPI attendu `MailPin_v2.2.0.xpi`.

Python 3.11+, Node.js 24+ ; aucune dépendance runtime, aucun bundler/minification. Depuis le checkout ou l'archive reviewer sans .git : `npm run ci`. Le build utilise seulement la bibliothèque standard Python et les sources lisibles. `extension/api/`, `extension/styles/pin.css` et AGENTS.md sont exclus du XPI, conservés dans l'archive pour provenance historique. Les modèles purs natifs portent les sources 1.7.10, avec scope globalThis pour ESM ; aucun code privilégié.

Livrables : `dist/MailPin_v2.2.0.xpi`, `dist/MailPin_GitHub_Repository_v2.2.0.zip`, `dist/SHA256SUMS.txt`. Le contrat build reconstruit deux fois puis extrait l'archive reviewer et compare les bytes XPI reconstruits sans Git.

Validation officielle séparée test-only : cloner thunderbird/webext-linter au commit `c56f6bdf3d3d0d1f3ec1091182570503f473ebaf`, `npm ci --ignore-scripts`, puis `node verify.js <chemin-XPI> --report-format json`. Le cap 157.* est intentionnel pour cette candidate testée : warning documenté, aucune erreur/hold acceptée. Les dépendances du linter ne sont jamais runtime ni incluses dans l'archive source.

Smoke : binaire officiel Thunderbird 157.0.1, geckodriver 0.37.1, profil temporaire local/synthétique ; `python tests/thunderbird/real_smoke.py --binary <binaire> --xpi dist/MailPin_v2.2.0.xpi --geckodriver <driver> --output-dir artifacts/native-smoke`. Voir le rapport pour le résultat réellement exécuté.
