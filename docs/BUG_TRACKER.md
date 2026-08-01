# Registre des bugs MailPerch

> Source unique pour les bugs connus. Tout bug reproduit doit être ajouté ici
> avant ou pendant sa correction. Codex et les contributeurs doivent lire ce
> fichier après `PROJECT_MEMORY.md`.

Dernière mise à jour : **2026-08-01**
Version de travail : **3.2.8**

## Règles de suivi

Statuts autorisés : `OUVERT`, `EN COURS`, `BLOQUÉ`, `À VALIDER`, `CORRIGÉ`.

Chaque entrée doit contenir :

- un identifiant stable `MP-YYYY-NNN` ;
- la première version concernée ;
- le symptôme utilisateur ;
- la cause confirmée ou, à défaut, `À déterminer` ;
- les fichiers concernés ;
- le test de non-régression ;
- le statut et la version de correction.

Un bug ne passe à `CORRIGÉ` qu’après validation automatisée. Quand le défaut dépend
réellement de l’interface Thunderbird, la validation manuelle reste explicitement
indiquée dans la colonne **Validation réelle**.

## Bugs ouverts

Les défauts MP-2026-004 et MP-2026-005 ont été rouverts après validation réelle
de la build 3.2.5. MP-2026-007 décrit le rendu désactivé d'une configuration
neuve ou incomplète. La build 3.2.8 corrige leurs frontières communes ; ils
restent en statut `À VALIDER` tant que Thunderbird 153 ne les confirme pas.

## Bugs corrigés ou en validation

| ID | Première version | Symptôme | Cause confirmée | Fichiers principaux | Test de non-régression | Statut | Correction | Validation réelle |
|---|---:|---|---|---|---|---|---:|---|
| MP-2026-001 | 3.2.0 | Le tableau de bord affiche `$(...) is null`. | La vue `list` ciblait une section DOM inexistante au lieu de `items`. | `extension/dashboard/dashboard.js` | `tests/test_dashboard_dom_contract.py` | CORRIGÉ | 3.2.1 | Validé par l’utilisateur. |
| MP-2026-002 | 3.1.2 | Clic droit et bouton `…` inopérants sur les épingles. | Menu HTML et propagation d’événements incompatibles avec la fenêtre privilégiée. | `extension/api/pinInbox/implementation.js` | `tests/test_native_card_menu.py` | CORRIGÉ | 3.1.5 | Validé par l’utilisateur. |
| MP-2026-003 | 3.1.2 | Le sélecteur du dossier de sauvegarde ne s’ouvre pas. | Le sélecteur natif recevait la fenêtre au lieu de son `BrowsingContext`. | `extension/api/pinInbox/implementation.js` | `tests/test_calendar_and_card_actions.py` | CORRIGÉ | 3.1.3 | Validé par l’utilisateur. |
| MP-2026-004 | 3.2.4 | Les icônes punaise, étoile et pièce jointe sont collées vers le bas des cartes de messages. | Dans Thunderbird 153, `.thread-card-icon-info` occupe structurellement la troisième rangée de `.thread-card-dynamic-row`; le rendre flex et lui ajouter du padding ne pouvait pas le remonter hors de cette rangée basse. | `extension/api/pinInbox/implementation.js`, `extension/styles/pin.css` | `tests/thread_card_geometry.playwright.js`, `tests/test_regressions_3_2_8.py` | À VALIDER | 3.2.8 | Tester cartes normales, sélectionnées, épinglées et avec pièce jointe dans Thunderbird 153 : centres alignés, cibles entières et au moins 8 px sous la cible lorsque la hauteur le permet. |
| MP-2026-005 | 3.2.4 | La barre « Modifications non enregistrées » n'apparaît plus ou les actions Enregistrer/Annuler ne suivent pas le brouillon réel. | La collecte, le rendu et la comparaison dépendaient de listes parallèles non vérifiées ; une valeur absente ou une exception dans `currentDraftSnapshot` interrompait `syncDirtyState` sans état d'erreur actionnable, et le baseline Agenda était reconstruit dans une continuation asynchrone. | `extension/options/options.js`, `extension/options/options.html`, `extension/options/options.css` | `tests/options_dom_flow.playwright.js`, `tests/test_options_controls.py`, `tests/test_regressions_3_2_8.py` | À VALIDER | 3.2.8 | Tester modifier → Enregistrer → rouvrir, modifier → Annuler et retour manuel, puis redémarrer Thunderbird ; la barre doit suivre chaque famille de contrôle. |
| MP-2026-006 | 3.2.2 | La CI Windows signale `dist/.gitkeep\r` comme fichier suivi et ignoré. | Le flux texte vers `git check-ignore --stdin` était converti en CRLF sous Windows. | `scripts/deep_audit.py` | `tests/test_regressions_3_2_5.py`, `tests/test_cross_platform_ci.py` | CORRIGÉ | 3.2.5 | La CI Windows doit confirmer après push. |
| MP-2026-007 | 3.2.7 | Sur une installation neuve ou une configuration vide/partielle, les fonctions recommandées semblent toutes désactivées. | Options acceptait tout objet `settings`, puis rendait les booléens absents avec `Boolean(undefined)`, alors que les recommandations et la normalisation vivaient seulement dans l'Experiment ; aucune source partagée ne garantissait le rendu d'une réponse partielle. | `extension/api/pinInbox/modules/settings.js`, `extension/api/pinInbox/implementation.js`, `extension/options/options.js` | `tests/settings_defaults.mjs`, `tests/options_dom_flow.playwright.js`, `tests/test_options_controls.py` | À VALIDER | 3.2.8 | Dans un profil Thunderbird jetable neuf, ouvrir Options avant toute écriture : recommandations actives sans flash désactivé ; vérifier aussi une mise à jour conservant un `false` explicite. |

## Modèle pour une nouvelle entrée

```text
| MP-YYYY-NNN | version | symptôme | cause ou À déterminer | fichiers | test | OUVERT | — | scénario à exécuter |
```

## Procédure

1. Reproduire et noter la version Thunderbird, l’OS, le thème et la vue.
2. Ajouter l’entrée avec le statut `OUVERT` ou `EN COURS`.
3. Ajouter un test qui échoue avant le correctif lorsque cela est possible.
4. Corriger la plus petite frontière responsable.
5. Exécuter `npm run ci`.
6. Passer à `À VALIDER` si une interaction Thunderbird réelle reste nécessaire.
7. Passer à `CORRIGÉ` après confirmation et conserver l’entrée dans l’historique.

## Note de validation 3.2.8

- `MP-2026-004` : rail placé dans une grille couvrant les rangées du DOM ThreadCard 153, mesuré automatiquement — **À VALIDER** dans une vraie liste Thunderbird.
- `MP-2026-005` : registre exhaustif, instantané canonique, erreurs visibles et relecture après écriture ; 98 contrôles exercés dans un navigateur réel — **À VALIDER** dans l'onglet Options Thunderbird.
- `MP-2026-007` : recommandations et migration partagées entre stockage et Options, formulaire caché jusqu'à normalisation — **À VALIDER** sur installation Thunderbird neuve.
