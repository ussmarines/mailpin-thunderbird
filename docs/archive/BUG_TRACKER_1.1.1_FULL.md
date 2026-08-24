# Registre des bugs MailPerch

> Source unique pour les bugs connus. Tout bug reproduit doit être ajouté ici
> avant ou pendant sa correction. Codex et les contributeurs doivent lire ce
> fichier après `PROJECT_MEMORY.md`.

Dernière mise à jour : **2026-08-05**
Version publique : **1.1.1**

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

MP-2026-010 reste à valider avec un calendrier local synthétique. MP-2026-011
reste à valider sur toute la matrice Thunderbird 128–153, notamment à 200 % de
zoom. MP-2026-018 suit la reproductibilité binaire ZIP entre Windows et Linux.
MP-2026-004 et MP-2026-017 ont été confirmés dans Thunderbird 153.0.1 avec un
compte local et quatre messages synthétiques, dans un profil jetable distinct du
profil utilisateur.

## Bugs corrigés ou en validation

| ID | Première version | Symptôme | Cause confirmée | Fichiers principaux | Test de non-régression | Statut | Correction | Validation réelle |
|---|---:|---|---|---|---|---|---:|---|
| MP-2026-001 | 3.2.0 | Le tableau de bord affiche `$(...) is null`. | La vue `list` ciblait une section DOM inexistante au lieu de `items`. | `extension/dashboard/dashboard.js` | `tests/test_dashboard_dom_contract.py` | CORRIGÉ | 3.2.1 | Validé par l’utilisateur. |
| MP-2026-002 | 3.1.2 | Clic droit et bouton `…` inopérants sur les épingles. | Menu HTML et propagation d’événements incompatibles avec la fenêtre privilégiée. | `extension/api/pinInbox/implementation.js` | `tests/test_native_card_menu.py` | CORRIGÉ | 3.1.5 | Validé par l’utilisateur. |
| MP-2026-003 | 3.1.2 | Le sélecteur du dossier de sauvegarde ne s’ouvre pas. | Le sélecteur natif recevait la fenêtre au lieu de son `BrowsingContext`. | `extension/api/pinInbox/implementation.js` | `tests/test_calendar_and_card_actions.py` | CORRIGÉ | 3.1.3 | Validé par l’utilisateur. |
| MP-2026-004 | 3.2.4 | Les icônes punaise, étoile et pièce jointe sont collées vers le bas des cartes de messages. | Dans Thunderbird 153, `.thread-card-icon-info` occupe structurellement la troisième rangée de `.thread-card-dynamic-row`; le rendre flex et lui ajouter du padding ne pouvait pas le remonter hors de cette rangée basse. | `extension/api/pinInbox/implementation.js`, `extension/styles/pin.css` | `tests/thread_card_geometry.playwright.js`, `tests/test_regressions_3_2_8.py` | CORRIGÉ | 3.2.8 | Thunderbird 153.0.1, profil jetable avec quatre messages synthétiques : cartes normales, sélectionnées, épinglées et avec pièce jointe observées à 100 %, centres alignés et cibles entières. |
| MP-2026-005 | 3.2.4 | La barre « Modifications non enregistrées » n'apparaît plus ou les actions Enregistrer/Annuler ne suivent pas le brouillon réel. | La collecte, le rendu et la comparaison dépendaient de listes parallèles non vérifiées ; une valeur absente ou une exception dans `currentDraftSnapshot` interrompait `syncDirtyState` sans état d'erreur actionnable, et le baseline Agenda était reconstruit dans une continuation asynchrone. | `extension/options/options.js`, `extension/options/options.html`, `extension/options/options.css` | `tests/options_dom_flow.playwright.js`, `tests/test_options_controls.py`, `tests/test_regressions_3_2_8.py` | CORRIGÉ | 3.2.10 | Thunderbird 153.0.1, profil jetable : modifier → Enregistrer → rouvrir, modifier → Annuler, puis redémarrer ; valeur enregistrée conservée et brouillon annulé. |
| MP-2026-006 | 3.2.2 | La CI Windows signale `dist/.gitkeep\r` comme fichier suivi et ignoré. | Le flux texte vers `git check-ignore --stdin` était converti en CRLF sous Windows. | `scripts/deep_audit.py` | `tests/test_regressions_3_2_5.py`, `tests/test_cross_platform_ci.py` | CORRIGÉ | 3.2.5 | La CI Windows doit confirmer après push. |
| MP-2026-007 | 3.2.7 | Sur une installation neuve ou une configuration vide/partielle, les fonctions recommandées semblent toutes désactivées. | Options acceptait tout objet `settings`, puis rendait les booléens absents avec `Boolean(undefined)`, alors que les recommandations et la normalisation vivaient seulement dans l'Experiment ; aucune source partagée ne garantissait le rendu d'une réponse partielle. | `extension/api/pinInbox/modules/settings.js`, `extension/api/pinInbox/implementation.js`, `extension/options/options.js` | `tests/settings_defaults.mjs`, `tests/options_dom_flow.playwright.js`, `tests/test_options_controls.py` | CORRIGÉ | 3.2.10 | Thunderbird 153.0.1, profil jetable neuf : recommandations visibles et activées ; les choix explicitement désactivés restent désactivés. |
| MP-2026-008 | 3.2.8 | La page Paramètres reste sur « Chargement des recommandations » sans contrôle ni erreur. | Dans le XPI 3.2.9, `localize()` remplaçait le `textContent` du label de restauration et supprimait son enfant `input#import-file` ; l’enregistrement d’écouteur suivant levait `TypeError` avant `initializeOptions()`, donc les délais et le panneau terminal 3.2.9 ne pouvaient pas agir. | `extension/options/options-bootstrap.js`, `extension/options/options.js`, `extension/options/options.html` | `tests/options_dom_flow.playwright.js`, `tests/test_options_controls.py`, `tests/test_regressions_3_2_9.py`, `tests/test_build_reproducible.py` | CORRIGÉ | 3.2.10 | Reproduit avec le XPI 3.2.9 (`options.js:1773:4`), puis validé avec le XPI 3.2.10 dans Thunderbird 153.0.1 : formulaire, état terminal, Enregistrer/Annuler, réouverture et persistance après redémarrage. |
| MP-2026-009 | 3.2.9 | Thunderbird journalise une erreur au démarrage lors de la création du menu de message affiché. | `menus.create()` recevait le contexte obsolète `message_display`, refusé par Thunderbird 153 ; l’action dédiée `messageDisplayAction` couvre déjà ce point d’entrée. | `extension/background.js` | `tests/test_message_menu_and_row_ux.py` | CORRIGÉ | 3.2.10 | Erreur reproduite dans la console du profil jetable, puis absente après installation du XPI 3.2.10 ; l’écouteur `messageDisplayAction.onClicked` est conservé. |
| MP-2026-010 | 3.2.10 | Cartes de réglage ambiguës, champs générés sans libellé et création Agenda d’une affaire en erreur. | Les cartes ne reflétaient pas explicitement le brouillon, les lignes dynamiques étaient construites sans structure de champ, et l’affaire forçait une tâche sans date tout en laissant l’Experiment choisir une échéance. | `extension/options/options.js`, `extension/options/options.css`, `extension/api/pinInbox/implementation.js` | `tests/options_dom_flow.playwright.js`, `tests/test_options_controls.py`, `tests/test_calendar_and_card_actions.py` | À VALIDER | 3.2.11 | Vérifier dans Thunderbird 153 avec un calendrier local synthétique : validations titre/date/calendrier, tâche incompatible refusée, événement créé et rendu des lignes sans chevauchement. |
| MP-2026-011 | 3.2.12 | L’identité Fluent reste presque identique à l’ancienne interface et le mode sombre de Thunderbird ne change pas réellement les surfaces. | La première intégration reposait principalement sur des alias `light-dark()` et conservait la structure visuelle antérieure ; aucune passerelle ne déterminait explicitement le thème actif de Thunderbird et le logo restait contraint à une petite tuile alignée. | `extension/styles/theme.js`, `extension/styles/tokens.css`, `extension/options/options.html`, `extension/options/options.css`, `extension/dashboard/dashboard.html`, `extension/dashboard/dashboard.css`, `extension/styles/pin.css` | `tests/theme_bridge.mjs`, `tests/static_checks.py`, `tests/test_ui_polish_3_2_3.py`, `npm run ci` | À VALIDER | 3.2.13 | Installer le XPI dans Thunderbird 128–153, basculer clair/sombre sans redémarrer, puis vérifier Options, dashboard et panneau à 100 % et 200 % de zoom. |
| MP-2026-012 | 1.1.0 | Deux conversations distinctes portant le même objet peuvent être proposées comme liées puis fusionnées. | La clé de repli de conversation pouvait se réduire à l’objet normalisé lorsqu’aucun identifiant Thunderbird/Gmail fort n’était disponible. | `extension/api/pinInbox/modules/identity.js`, `extension/api/pinInbox/implementation.js` | `tests/model_tests.mjs`, `tests/test_productivity_1_1_features.py` | CORRIGÉ | 1.1.1 | Le modèle pur couvre les identités fortes et refuse le rapprochement par objet seul ; la fusion reste confirmée par l’utilisateur. |
| MP-2026-013 | 1.1.0 | Un diagnostic ou un journal d’erreur peut conserver un chemin local, une URL avec credentials, une adresse ou le détail d’une exception API. | L’expurgation couvrait les identifiants métier mais pas toutes les formes de chaînes techniques ; certains appels journalisaient l’objet d’erreur complet. | `extension/api/pinInbox/modules/diagnostics.js`, `extension/api/pinInbox/implementation.js`, `extension/background.js` | `tests/test_security_hardening_3_2_4.py`, `tests/test_productivity_1_1_features.py` | CORRIGÉ | 1.1.1 | Tests automatisés avec valeurs synthétiques ; aucun secret réel n’est écrit dans les sorties. |
| MP-2026-014 | 1.1.0 | L’interface anglaise expose encore des libellés français dynamiques et certains noms accessibles ne suivent pas la langue active. | Plusieurs libellés de vues, actions, aides, statuts et attributs ARIA étaient codés en dur ou n’avaient pas de clé de catalogue. | `extension/_locales/`, `extension/options/`, `extension/dashboard/` | `tests/test_accessibility_localization.py`, `tests/test_dynamic_options_localization.py`, `tests/options_dom_flow.playwright.js`, `tests/dashboard_dom_flow.playwright.js` | CORRIGÉ | 1.1.1 | Chromium réel avec actifs de production : 98 contrôles Options et 7 vues dashboard en anglais, sans fuite française visible ; l’intégration XUL reste distincte. |
| MP-2026-015 | 1.1.0 | Une modification de version sur `main` peut publier une release avant le tag final et le workflow tente de supprimer silencieusement des branches de maintenance. | Le workflow de release était déclenché par les chemins de version sur `main` et contenait une étape de nettoyage distante non nécessaire à la publication. | `.github/workflows/release.yml` | `tests/test_cross_platform_ci.py` | CORRIGÉ | 1.1.1 | La release exige désormais un tag `v*` cohérent ou un lancement manuel ; aucune branche n’est supprimée par le workflow. |
| MP-2026-016 | 1.1.0 | Le build reviewer peut accepter des fichiers additionnels non suivis via un fichier d’allowlist locale. | Le script de packaging fusionnait une liste additionnelle au lieu d’exiger exclusivement l’inventaire Git pour les sources publiées. | `scripts/build.py` | `tests/test_build_reproducible.py` | CORRIGÉ | 1.1.1 | Le test refuse le contournement et compare deux builds binaires reproductibles. |
| MP-2026-017 | 1.1.0 | Dans un Thunderbird anglais, le panneau privilégié et son menu affichent un mélange de libellés anglais et français. | Les vues WebExtension avaient leur catalogue, mais 237 libellés de l’API Experiment utilisaient encore des chaînes françaises directes ou des jeux de clés incomplets. | `extension/api/pinInbox/implementation.js`, `extension/api/pinInbox/modules/localization.js` | `tests/test_accessibility_localization.py` | CORRIGÉ | 1.1.1 | Thunderbird 153.0.1 anglais, profil jetable avec compte local synthétique : panneau, compteur, groupe intelligent et 17 actions du menu natif exposés en anglais ; balayage UI Automation de 111 libellés accessibles sans libellé français MailPerch. |
| MP-2026-018 | 1.1.1 | Un build Windows et le workflow Linux produisent des SHA-256 d’archives différents alors que les fichiers emballés sont identiques. | `zipfile` conserve une métadonnée d’hôte différente et les implémentations zlib génèrent des flux DEFLATE différents selon la plateforme. | `scripts/build.py`, `tests/test_build_reproducible.py`, `release/BUILD_INSTRUCTIONS.md` | À ajouter : comparaison binaire croisée Windows/Linux dans la CI. | OUVERT | — | Comparaison de la release 1.1.1 : 47/47 entrées XPI et 165/165 entrées source dans le même ordre, zéro différence de contenu décompressé ; seules compression et métadonnées ZIP diffèrent. |

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

- `MP-2026-004` : alors **À VALIDER**, faute de compte et de messages dans le profil jetable ; validation réelle ajoutée le 5 août 2026 dans la note 1.1.1 ci-dessous.
- `MP-2026-005` : dock, Enregistrer, Annuler, réouverture et redémarrage observés dans Thunderbird 153.0.1 — **CORRIGÉ**.
- `MP-2026-007` : recommandations observées sur le profil neuf sans compte — **CORRIGÉ**.
- `MP-2026-008` : cause reproduite avec le XPI 3.2.9 et démarrage complet observé avec le XPI 3.2.10 — **CORRIGÉ**.

## Note de validation 1.1.1

- `MP-2026-004` : géométrie réellement observée dans Thunderbird 153.0.1 sur les variantes normale, sélectionnée, épinglée et avec pièce jointe — **CORRIGÉ**.
- `MP-2026-017` : défaut reproduit avec l’ancien XPI, puis panneau et menu natif entièrement anglais avec le XPI 1.1.1 corrigé — **CORRIGÉ**.
- Le profil, le compte local et les quatre messages utilisés étaient entièrement synthétiques. L’instance a été fermée proprement puis son profil temporaire et les captures ont été placés dans la Corbeille.
