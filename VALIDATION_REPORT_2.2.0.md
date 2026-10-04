# Validation — MailPin 2.2.0 candidate native

Base `4d38862c55ea4c7fc3e4c440fbfed80e3aa197e3`. Les preuves 1.7.10 sont historiques et invalidées pour manifeste/backend/smoke. Les modèles purs copiés restent de même logique ; la suite applicable sera exécutée au jalon final.

## Gates locaux exécutés — 2026-10-04

| Gate | Résultat / preuve |
|---|---|
| `npm run ci` sur le code candidat final | PASS : garde identité/sécurité, paquet natif, syntaxe, parité FR/EN, provenance des 19 modèles, versions/mémoire ; contrats core/client, thèmes/defaults et modèles métier ; build |
| `tests/native_core_contract.mjs` | PASS : concurrence, notes/checklist/recherche, workflows/snooze, affaires/modèles/vues/historique, règles/anti-boucle, corruption/quota, migration legacy/Gmail, liens Agenda, plafonds fusion, tags personnels/union conversations, racine quickCapture, cohérence après commit, rappel dédupliqué/snooze |
| `tests/native_client_contract.mjs` | PASS : startup avec options facultatives, refus permission sans exécution, permissions archive/delete/compose uniquement au clic, propagation erreur, aucune injection d'événement via client |
| `tests/native_build_contract.py` | PASS : deux builds identiques, zéro api/Experiment, dépendances pages présentes, archive reviewer reconstruite sans Git → XPI identique |
| Linter officiel Thunderbird | PASS : thunderbird/webext-linter 2.2.0 `c56f6bdf3d3d0d1f3ec1091182570503f473ebaf`, schéma release MV3 157.0 ; 0 error, 0 hold, 1 warning : cap intentionnel `157.*` pour cette candidate testée |
| Smoke réel Windows | PASS : binaire officiel installé Thunderbird 157.0.1, buildID 20261001134409, geckodriver 0.37.1, profil temporaire synthétique distinct du profil propriétaire |

XPI validé : `dist/MailPin_v2.2.0.xpi`, SHA-256 `25b6869e5c2bcdf112e531611477f6d23ea911436ae57a64730c771dc6f553c3`.

Le smoke a exécuté installation/activation MV3, pin/unpin par vrai raccourci Alt+P, tags natifs, invariants lu/non-lu et compteurs total/non-lus, Dashboard initialisé sans fatal, Options prête, un Space unique et ouverture par le bouton Options via background, Workbench rendu, fichier JSON/preview/fusion avec note conservée, redémarrage réel du processus/profil avec épingle et note persistantes, désinstallation runtime et réinstallation propre, aucune erreur de script de l'extension dans la console. Le chrome privilégié appartient uniquement au banc pour créer/observer le client synthétique et accéder à l'acteur Marionette des onglets distants ; les opérations produit passent par les raccourcis/UI/RPC livrés, sans API de test privée.

Résultats bruts locaux ignorés : `artifacts/native-smoke/result.json`, `native-installed.png`, `geckodriver.log`, `artifacts/native-linter.json`. GitHub fournit les mêmes rapports via les workflows existants après ouverture de la PR draft ; aucune preuve CI n'est inventée dans ce rapport local.

## Différentiel et limites

Les preuves 1.7.10 ne sont pas utilisées comme preuves runtime natives. Les 19 modèles purs sont identiques hormis le scope ESM et contrôlés directement ; les suites de modèles ont été exécutées au jalon. Les anciennes suites DOM privé/SQLite/PinCompatibility restent historiques et hors `npm test` natif ; elles sont remplacées pour la frontière par les contrats natifs, la garde sur le XPI et le smoke manifest-aware. Les tests métier ne sont pas remplacés par une simple recherche de tokens.

La revue séparée a reproduit six défauts, corrigés avec tests comportementaux. L'alignement des identités internes/publiques avant une commande est aussi testé sans ouverture préalable du Dashboard. Les erreurs du banc corrigées ont été relancées seulement sur le smoke ; le jalon complet a été renouvelé après le dernier correctif de migration qui invalidait le backend.

Impeccable : direction Organic Workspace conservée, nouvelle page Workbench inspectée dans Thunderbird et corrigée en une passe ; contrôle mécanique local DEGRADED (parseurs HTML/CSS absents, fallback regex), donc aucune déclaration de certification accessibilité/contraste sur ce scanner. L'accessibilité détaillée et les thèmes/profils réels restent propriétaires.

`MANUAL_OWNER_TEST_REQUIRED` : seulement les scénarios du handoff natif (migration sur copie réelle 1.7.10, fournisseurs/IMAP/copies/conversations, table/cards/theme/FR-EN/clavier/a11y, notifications système après veille, permissions/actions facultatives, retour arrière). Agenda/inline/automatismes reportés sont des limitations explicites, pas des gates prétendus PASS.

Aucun merge/main, tag, release, ATN, force-push ou modification du profil propriétaire. La candidate 2.2.0 demeure non publiée ; dernière release publique 1.7.10.
