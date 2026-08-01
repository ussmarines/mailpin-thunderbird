# Registre des bugs MailPerch

> Source unique pour les bugs connus. Tout bug reproduit doit être ajouté ici
> avant ou pendant sa correction. Codex et les contributeurs doivent lire ce
> fichier après `PROJECT_MEMORY.md`.

Dernière mise à jour : **2026-08-01**
Version de travail : **3.2.12**

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

MP-2026-004 reste à valider dans une vraie liste de messages Thunderbird.
MP-2026-005, MP-2026-007 et MP-2026-008 ont été confirmés dans l’onglet Options
de Thunderbird 153.0.1 avec un profil jetable sans compte. La reproduction de
MP-2026-008 a révélé une exception antérieure à l’initialisation 3.2.9 ; la cause
et la frontière de démarrage sont corrigées en 3.2.10.

## Bugs corrigés ou en validation

| ID | Première version | Symptôme | Cause confirmée | Fichiers principaux | Test de non-régression | Statut | Correction | Validation réelle |
|---|---:|---|---|---|---|---|---:|---|
| MP-2026-001 | 3.2.0 | Le tableau de bord affiche `$(...) is null`. | La vue `list` ciblait une section DOM inexistante au lieu de `items`. | `extension/dashboard/dashboard.js` | `tests/test_dashboard_dom_contract.py` | CORRIGÉ | 3.2.1 | Validé par l’utilisateur. |
| MP-2026-002 | 3.1.2 | Clic droit et bouton `…` inopérants sur les épingles. | Menu HTML et propagation d’événements incompatibles avec la fenêtre privilégiée. | `extension/api/pinInbox/implementation.js` | `tests/test_native_card_menu.py` | CORRIGÉ | 3.1.5 | Validé par l’utilisateur. |
| MP-2026-003 | 3.1.2 | Le sélecteur du dossier de sauvegarde ne s’ouvre pas. | Le sélecteur natif recevait la fenêtre au lieu de son `BrowsingContext`. | `extension/api/pinInbox/implementation.js` | `tests/test_calendar_and_card_actions.py` | CORRIGÉ | 3.1.3 | Validé par l’utilisateur. |
| MP-2026-004 | 3.2.4 | Les icônes punaise, étoile et pièce jointe sont collées vers le bas des cartes de messages. | Dans Thunderbird 153, `.thread-card-icon-info` occupe structurellement la troisième rangée de `.thread-card-dynamic-row`; le rendre flex et lui ajouter du padding ne pouvait pas le remonter hors de cette rangée basse. | `extension/api/pinInbox/implementation.js`, `extension/styles/pin.css` | `tests/thread_card_geometry.playwright.js`, `tests/test_regressions_3_2_8.py` | À VALIDER | 3.2.8 | Tester cartes normales, sélectionnées, épinglées et avec pièce jointe dans Thunderbird 153 : centres alignés, cibles entières et au moins 8 px sous la cible lorsque la hauteur le permet. |
| MP-2026-005 | 3.2.4 | La barre « Modifications non enregistrées » n'apparaît plus ou les actions Enregistrer/Annuler ne suivent pas le brouillon réel. | La collecte, le rendu et la comparaison dépendaient de listes parallèles non vérifiées ; une valeur absente ou une exception dans `currentDraftSnapshot` interrompait `syncDirtyState` sans état d'erreur actionnable, et le baseline Agenda était reconstruit dans une continuation asynchrone. | `extension/options/options.js`, `extension/options/options.html`, `extension/options/options.css` | `tests/options_dom_flow.playwright.js`, `tests/test_options_controls.py`, `tests/test_regressions_3_2_8.py` | CORRIGÉ | 3.2.10 | Thunderbird 153.0.1, profil jetable : modifier → Enregistrer → rouvrir, modifier → Annuler, puis redémarrer ; valeur enregistrée conservée et brouillon annulé. |
| MP-2026-006 | 3.2.2 | La CI Windows signale `dist/.gitkeep\r` comme fichier suivi et ignoré. | Le flux texte vers `git check-ignore --stdin` était converti en CRLF sous Windows. | `scripts/deep_audit.py` | `tests/test_regressions_3_2_5.py`, `tests/test_cross_platform_ci.py` | CORRIGÉ | 3.2.5 | La CI Windows doit confirmer après push. |
| MP-2026-007 | 3.2.7 | Sur une installation neuve ou une configuration vide/partielle, les fonctions recommandées semblent toutes désactivées. | Options acceptait tout objet `settings`, puis rendait les booléens absents avec `Boolean(undefined)`, alors que les recommandations et la normalisation vivaient seulement dans l'Experiment ; aucune source partagée ne garantissait le rendu d'une réponse partielle. | `extension/api/pinInbox/modules/settings.js`, `extension/api/pinInbox/implementation.js`, `extension/options/options.js` | `tests/settings_defaults.mjs`, `tests/options_dom_flow.playwright.js`, `tests/test_options_controls.py` | CORRIGÉ | 3.2.10 | Thunderbird 153.0.1, profil jetable neuf : recommandations visibles et activées ; les choix explicitement désactivés restent désactivés. |
| MP-2026-008 | 3.2.8 | La page Paramètres reste sur « Chargement des recommandations » sans contrôle ni erreur. | Dans le XPI 3.2.9, `localize()` remplaçait le `textContent` du label de restauration et supprimait son enfant `input#import-file` ; l’enregistrement d’écouteur suivant levait `TypeError` avant `initializeOptions()`, donc les délais et le panneau terminal 3.2.9 ne pouvaient pas agir. | `extension/options/options-bootstrap.js`, `extension/options/options.js`, `extension/options/options.html` | `tests/options_dom_flow.playwright.js`, `tests/test_options_controls.py`, `tests/test_regressions_3_2_9.py`, `tests/test_build_reproducible.py` | CORRIGÉ | 3.2.10 | Reproduit avec le XPI 3.2.9 (`options.js:1773:4`), puis validé avec le XPI 3.2.10 dans Thunderbird 153.0.1 : formulaire, état terminal, Enregistrer/Annuler, réouverture et persistance après redémarrage. |
| MP-2026-009 | 3.2.9 | Thunderbird journalise une erreur au démarrage lors de la création du menu de message affiché. | `menus.create()` recevait le contexte obsolète `message_display`, refusé par Thunderbird 153 ; l’action dédiée `messageDisplayAction` couvre déjà ce point d’entrée. | `extension/background.js` | `tests/test_message_menu_and_row_ux.py` | CORRIGÉ | 3.2.10 | Erreur reproduite dans la console du profil jetable, puis absente après installation du XPI 3.2.10 ; l’écouteur `messageDisplayAction.onClicked` est conservé. |
| MP-2026-010 | 3.2.10 | Cartes de réglage ambiguës, champs générés sans libellé et création Agenda d’une affaire en erreur. | Les cartes ne reflétaient pas explicitement le brouillon, les lignes dynamiques étaient construites sans structure de champ, et l’affaire forçait une tâche sans date tout en laissant l’Experiment choisir une échéance. | `extension/options/options.js`, `extension/options/options.css`, `extension/api/pinInbox/implementation.js` | `tests/options_dom_flow.playwright.js`, `tests/test_options_controls.py`, `tests/test_calendar_and_card_actions.py` | À VALIDER | 3.2.11 | Vérifier dans Thunderbird 153 avec un calendrier local synthétique : validations titre/date/calendrier, tâche incompatible refusée, événement créé et rendu des lignes sans chevauchement. |

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

## Note de validation 3.2.10

- `MP-2026-004` : toujours **À VALIDER**, faute de compte et de messages dans le profil jetable.
- `MP-2026-005` : dock, Enregistrer, Annuler, réouverture et redémarrage observés dans Thunderbird 153.0.1 — **CORRIGÉ**.
- `MP-2026-007` : recommandations observées sur le profil neuf sans compte — **CORRIGÉ**.
- `MP-2026-008` : cause reproduite avec le XPI 3.2.9 et démarrage complet observé avec le XPI 3.2.10 — **CORRIGÉ**.
