# Rapport de validation — MailPin 1.7.11

## Verdicts

Compatibilité : PASS pour les scénarios synthétiques Windows 158.0 et le smoke réel Linux 158.0 exécutés. Release : PASS — `v1.7.11` publiée le 15 octobre 2026 sur `fce07e98e2a056f38bfc7143766a71d1f7923e44` après QA/smoke/CodeQL exacts. Assets publics téléchargés et vérifiés.

Préparation initiale : branche `codex/thunderbird-158-compatibility`, HEAD/base `048867671e7bf9e8ccd71529676b1b4814da3916` plus diff local. ID `ussmarines.mailpin@addons.thunderbird.net`. Dernière release publique lors de cette préparation : 1.7.10. PR #84 draft/head `cfb14b8e24b557dec351432120f4ae9bea0b26ba` inchangée. Checkout initial, branche upstream et modifications Graphify préservés.

## Critères posés avant modification

A. Base, identité, version, branche isolée et travail concurrent préservés ; PR #84 inchangée.
B. Manifest/version/frontière/build et sécurité différentielle PASS ; aucune nouvelle surface runtime.
C. Vrai Thunderbird 158 : installation, injection unique, pin/unpin/raccourcis, compteurs/lu, Dashboard/Options, ouverture sans défilement natif, dossiers/onglets, persistance et nettoyage ; coexistence Quick Filter.
D. Contrats Tags/Agenda, dégradation facultative et chemins réels synthétiques concernés.
E. XPI/source construits, SHA-256, reproductibilité/reviewer.
F. Autorisations distinctes, contrôles sur cible exacte, tag/release et téléchargement vérifié des assets. Sinon NO-GO RELEASE.

## Environnement et provenance

Windows ; Python 3.14.6, Node 26.8.1, npm 11.19.0, zlib-ng 1.3.1. Thunderbird Release 158.0, build `20261008005236`, source stamp `5c6da15cb60b84eabcddc3aa7a7f98977f1d8369`. ESR 153.5.0esr et Beta 159.0b2 sont distincts.

- Installer `win64/en-US/Thunderbird Setup 158.0.exe` téléchargé depuis Mozilla et vérifié avec SHA256SUMS avant extraction : SHA-256 `7337e7bf74b0a0ec708ba457c446be134a0b976ecc17622b962108a322b9270d`.
- geckodriver 0.37.1 : archive officielle win64 SHA-256 `dfed9315abe8d2fbc1b6161a2ee8002452e79cf05ee92fdc653a4e26bc35edd8`, contrôlée avec le digest GitHub Mozilla. L’exécutable testé est identique à l’exécutable extrait, SHA-256 `e95b4eac7960ffcd5acbfd92bb7d49d48f99c1d01a20ddd297fef8c80821020d`.
- XPI candidat testé : SHA-256 `5373ecd6d981ced8411312ac18eb4323e6ca01f5f20b47426758ae66613c802f`. Les modifications suivantes du banc et des documents ne changent pas son contenu runtime. Les empreintes finales XPI/source sont dans `dist/SHA256SUMS.txt` ; l’archive ne contient pas sa propre empreinte.

## Tests réellement exécutés

- A : état Git/GitHub, refs/tags/releases et PR #84 vérifiés ; 1.7.11 libre ; worktree dédié propre créé depuis main distant.
- B ciblé PASS : `scripts/check_versions.py`, `scripts/check_project_memory.py`, `scripts/check_bug_tracker.py`, `tests/test_thunderbird_compatibility_boundary.py`, `tests/thunderbird_compatibility_contract.mjs`, `tests/test_thunderbird_test_bench.py`.
- Smoke initial PASS : `tests/thunderbird/real_smoke.py`, `artifacts/thunderbird-158-candidate/result.json`.
- C smoke étendu PASS : même script final, `artifacts/thunderbird-158-extended-final/result.json`. Installation ; une injection ; pin/unpin par bouton et raccourci Alt+P réel WebDriver ; comparaison de tous les flags et compteurs total/non-lu/nouveau ; ouverture du message vérifiée ; position native non nulle conservée ; Quick Filter non-lu puis retour aux 40 lignes avec carte indépendante ; changement de dossier et nouvel onglet mail ; Dashboard unique ; retrait et réinstallation propres.
- C persistance PASS : appel ciblé de `functional_bench._run_scope_case`, 50 références synthétiques, comptes A+C, deux processus distincts sur le même profil jetable. `artifacts/thunderbird-158-persistence/result.json`. Installation persistante, SQLite/réglages conservés, 34 cartes A+C restaurées automatiquement au cold start sans réveil artificiel.
- C/D banc fonctionnel PASS : `tests/thunderbird/functional_bench.py --volumes 50`, `artifacts/thunderbird-158-functional-final/results.json`. Panneau, notes/checklists, workflows, Dashboard/Options et sauvegarde/annulation, thèmes clair/sombre, création réelle d’événement et tâche sur calendrier mémoire ; tags natifs créés/synchronisés pour 50 messages puis retirés, tag personnel synthétique conservé ; zéro erreur JavaScript MailPin et zéro timeout. La dégradation facultative reste couverte par les contrats, pas par une simulation prétendue de tous les fournisseurs réels.
- B jalon local PASS : `npm run check` et `npm test`. La commande initiale `npm run ci` s’est arrêtée dans les gardes de dépôt (LF, badge candidat, puis fichiers binaires locaux). Après correction des fichiers candidats et déplacement des binaires hors checkout, les étapes interrompues ont été reprises séparément ; aucune passe complète n’a été rejouée inutilement. Logs : `artifacts/validation/ci-158.log`, `check-158.log`, `test-158.log`, `test-158-final.log`. Build final PASS dans `artifacts/validation/build-158.log`.
- E PASS : `npm run build` construit XPI/source et SHA256SUMS ; `tests/test_build_reproducible.py` PASS dans `npm test`. Reconstruction reviewer sans `.git` par `python scripts/build.py --source` : XPI identique octet pour octet ; archive sans binaires/profils/logs locaux. La reconstruction finale et ses empreintes sont consignées dans `artifacts/validation/reviewer-build.json`.

## Échecs conservés et corrections du banc

La baseline 1.7.10 refuse réellement l’installation sur 158.0 : plafond 157.*. `artifacts/thunderbird-158-baseline/result.json`.

Le banc fonctionnel initial échoue à la mesure géométrie/contraste sous 158 ET sous le binaire officiel 157.0.1 (installer SHA-256 `dec7acc0e246c9bce3ab23e02fcc55543ea96526bb0a13f5ca8d33a09e904f35`). `artifacts/thunderbird-158-functional/results.json` et `artifacts/thunderbird-157-functional-control/results.json` conservent cet échec identique. Le banc supposait une colonne large malgré le split natif étroit et ne lisait pas `color(srgb ...)`. Correction test uniquement : mesure dans une colonne large via le splitter natif et résolution/composition des couleurs par canvas Gecko, avec autotest. Les seuils 4.5:1, clipping et densité ne sont pas abaissés. Les captures étroites initiales ne valent pas acceptation visuelle complète du mode compact.

Le premier ajout de comparaison des compteurs après raccourci comparait l’ordre des clés d’objets après sérialisation WebDriver. Il a été corrigé pour comparer chaque champ ; le smoke final a été relancé et passe. Aucun échec produit n’a nécessité de changement runtime.

Les binaires et archives téléchargés sont conservés hors checkout dans le dossier frère `../validation-runtime/` ; les chemins absolus des résultats JSON décrivent leur emplacement lors du test. Les empreintes restent la provenance stable.

## Preuves réutilisées et limites

Aucune ancienne entrée verte du cache 1.7.6 ni aucun smoke 157 n’est réattribué à 158. Le minimum 153.0 est conservé ; sa matrice n’est pas réexécutée. L’identité de l’exécutable geckodriver officiel a été vérifiée après les tests par comparaison SHA-256, sans changer le binaire testé.

Le smoke Linux 158 a ensuite passé sur la PR et la cible publiée. Pas de test macOS 158, fournisseur réseau, calendrier distant, profil personnel, accessibilité assistée ou identité binaire inter-OS revendiquée. La matrice de volume complète n’est pas rejouée : seule la régression fonctionnelle à 50 est pertinente ici. Les captures et assertions réelles ne sont pas une certification visuelle humaine exhaustive.

## Publication exécutée et vérification indépendante

- PR [#86](https://github.com/ussmarines/mailpin-thunderbird/pull/86), head `c19bd4054c9632ce44bbda4a1512c6b1ab6ae910` : QA `38754605711`, smoke réel Linux 158 `38754605738` et CodeQL `38754601088` PASS avant squash.
- Cible intégrée et tag : `fce07e98e2a056f38bfc7143766a71d1f7923e44` ; arbre identique à la PR validée. QA [38754897029](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/38754897029), smoke [38754897259](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/38754897259) et CodeQL [38754896607](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/38754896607) PASS avant création du nouveau tag.
- Publisher canonique [38755293619](https://github.com/ussmarines/mailpin-thunderbird/actions/runs/38755293619) PASS sur ce même target ; [release publique v1.7.11](https://github.com/ussmarines/mailpin-thunderbird/releases/tag/v1.7.11) publiée à 14:52:47 UTC.
- Trois assets publics téléchargés : digests GitHub et fichier SHA256SUMS concordants ; XPI et source identiques octet pour octet aux archives QA de ce target. Le log du smoke confirme le SHA-256 exact du XPI publié. Reconstruction depuis la source publique sans Git : contenu extrait du XPI identique ; aucune identité ZIP inter-OS inférée.
- XPI public SHA-256 : `9332bb52f0954799d73f8b655423620ba00f00501c7351981d1d2f5c13ec9a63`.
- Archive source publique SHA-256 : `06ead2e37381ddb3facebe793fb2bf3374406ce9ac2c323e75f3786153e4054a`.
- Asset SHA256SUMS SHA-256 : `c141fef24a8a9b7c8df9164180ff201fb037e873cce211374a061a4ea95b5744`.

Preuve locale : `artifacts/published-1.7.11/verification.json`. Les assets restent ceux du tag immuable ; cette mise à jour documentaire postérieure ne les remplace pas. Autorisations explicites du propriétaire reçues avant les opérations. PR #84 et #74 inchangées. Aucune soumission ATN.

Sources officielles : [versions](https://product-details.mozilla.org/1.0/thunderbird_versions.json), [notes 158](https://www.thunderbird.net/en-US/thunderbird/158.0/releasenotes/), [archive et SHA256SUMS](https://archive.mozilla.org/pub/thunderbird/releases/158.0/). Les changements Quick Filter/Agenda annoncés ont motivé les tests réels, sans servir de preuve de compatibilité. Comparaison directe des sources embarquées dans les deux binaires officiels : `quickFilterBar.js`, `message-pane.mjs` et `pane-layout.mjs` identiques ; diff `about3Pane.js` limité à la gestion des dossiers unifiés/parents masqués. Diff conservé dans `artifacts/validation/thunderbird-internal-diff.txt`.
