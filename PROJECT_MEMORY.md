# Mémoire du projet MailPerch

> **Fichier d’entrée unique pour Codex et les nouveaux contributeurs.**
> Lire ce document avant tout autre fichier. Il donne l’état courant, les invariants,
> la carte du dépôt et les chemins exacts à ouvrir selon la tâche.
>
> Version de travail : **3.2.3**
> Base GitHub vérifiée : `main` au commit `8b3495baca5d89358d703c42add9d773c09517af`
> Produit : **MailPerch — Email Pins & Follow-up**
> Extension ID de développement : `pin-mails@MailPerch.local`

## 1. Résumé en 30 secondes

MailPerch est une MailExtension Thunderbird Manifest V3. Elle ajoute un panneau de
messages épinglés au-dessus de la liste native, sans filtrer ni remplacer « Tous les
messages ». Les épingles, notes, groupes, workflows, rappels, règles, affaires, vues
intelligentes, sauvegardes et liens Agenda restent locaux.

L’extension comporte deux mondes :

1. **WebExtension non privilégiée** : `background.js`, paramètres et dashboard.
2. **Experiment privilégié** : `api/pinInbox/implementation.js`, accès à
   `about:3pane`, SQLite, dossiers, en-têtes de messages et Agenda.

La version 3.2.3 stabilise l’interface : rail d’actions centré dans les lignes
Thunderbird, densités de cartes sûres, paramètres réorganisés, toast corrigé,
comptes non dupliqués, capacités Agenda lisibles et CI Windows robuste.

## 2. Invariants non négociables

1. Ne jamais modifier les compteurs natifs de nouveaux messages, non-lus ou totaux.
2. Épingler ne doit jamais marquer un message lu/non lu.
3. Le panneau MailPerch reste distinct de la liste native « Tous les messages ».
4. Aucun réseau, télémétrie, publicité, CDN, code distant ou dépendance npm.
5. Aucun `eval`, `new Function`, `innerHTML`, `outerHTML` ou HTML construit depuis
   des métadonnées de courrier.
6. Ne jamais stocker le corps des messages ni le contenu des pièces jointes.
7. Conserver l’ID `pin-mails@MailPerch.local` durant le développement et les migrations.
8. Le dashboard est ouvert par le background avec `tabs.create`.
9. Les écritures SQLite restent incrémentales, transactionnelles et sérialisées.
10. Chaque écouteur, observer, timer, popup, feuille de style et nœud injecté doit
    être nettoyé à la fermeture.
11. Une sauvegarde de sécurité précède une migration ou une restauration.
12. Toute action destructrice groupée respecte les confirmations configurées.
13. Aucune publication, branche distante ou release sans accord explicite.

## 3. État technique courant

| Élément | Valeur |
|---|---|
| Version extension/package | `3.2.3` |
| Thunderbird déclaré | `128.0` à `153.*` |
| Manifest | MV3 |
| Permission WebExtension | `menus` uniquement |
| Base SQLite | `pin-mails-v2.sqlite` |
| Schéma SQLite | `5` |
| Schéma paramètres observé | `5` |
| Schéma données | `6` |
| Stockage | SQLite incrémental + WAL + récupération atomique |
| Réseau | Aucun |
| Locales | Français et anglais |
| Build | Python standard, sans dépendance npm |
| CI | Linux complet + contrôles Windows |

## 4. Parcours d’exécution

### Démarrage

1. Thunderbird charge `extension/manifest.json`.
2. `extension/background.js` initialise menus, commandes et ouverture du dashboard.
3. L’API Experiment définie dans `schema.json` charge `implementation.js`.
4. L’Experiment normalise les réglages, initialise le stockage et injecte
   l’interface dans chaque fenêtre `about:3pane`.
5. Les pages `options/` et `dashboard/` appellent `messenger.pinInbox.*`.

### Panneau principal

`_setupAbout3Pane()` dans `implementation.js` :

- crée le panneau Épinglés ;
- injecte la punaise dans les lignes natives ;
- construit les cartes et leurs actions ;
- ouvre le menu natif `menupopup` ;
- gère sélection multiple, drag-and-drop et vues intelligentes ;
- restaure le focus et nettoie tout à la fermeture.

### Données

- Les références de messages utilisent des clés stables.
- Les recherches privilégient dossier + Message-ID + propriétés normalisées.
- Les écritures passent par `PinStructuredStore`.
- Les sauvegardes JSON sont validées et vérifiées avant fusion/remplacement.
- Le diagnostic exporté est expurgé.

## 5. Où modifier quoi

| Besoin | Fichier principal | Compléments |
|---|---|---|
| Manifeste, permissions, compatibilité | `extension/manifest.json` | `release/manifest-store-template.json` |
| Menus Thunderbird et commandes | `extension/background.js` | locales FR/EN |
| API publique | `extension/api/pinInbox/schema.json` | contrat `tests/test_api_schema_contract.py` |
| Cycle de vie privilégié | `extension/api/pinInbox/implementation.js` | `extension/api/pinInbox/AGENTS.md` |
| Identité/résolution message | `modules/identity.js` | tests modèle |
| Stockage/checksum/diff | `modules/storage.js` | tests SQLite |
| Workflow/récurrence | `modules/workflow.js` | `modules/smart.js` |
| Règles/anti-boucle | `modules/rules.js` | options + simulation |
| Agenda | `modules/calendar.js` + `implementation.js` | tests Agenda |
| Actions groupées | `modules/bulk.js` | dashboard/panneau |
| Diagnostic | `modules/diagnostics.js` | centre de santé |
| Santé | `modules/health.js` | options/dashboard |
| Migrations/restauration | `modules/migrations.js` | sauvegardes |
| Performance/cache | `modules/performance.js` | rendu du panneau |
| Fournisseurs | `modules/providers.js` | matrice comptes/calendriers |
| Vues intelligentes | `modules/smart.js` | panneau/dashboard |
| Style panneau et liste native | `extension/styles/pin.css` | `docs/UI_SPEC.md` |
| Paramètres HTML | `extension/options/options.html` | `options.js`, `options.css` |
| Paramètres logique | `extension/options/options.js` | schema API |
| Paramètres style | `extension/options/options.css` | captures UX |
| Dashboard | `extension/dashboard/*` | contrat DOM |
| Traductions | `extension/_locales/*/messages.json` | test localisation |
| Build reproductible | `scripts/build.py` | test build |
| Audit dépôt | `scripts/check_repo.py`, `deep_audit.py` | CI |
| Cohérence versions | `scripts/check_versions.py` | README/CHANGELOG |
| Secrets | `scripts/scan_secrets.py` | CI |
| CI GitHub | `.github/workflows/ci.yml` | `tests/test_cross_platform_ci.py` |
| Release candidate | `.github/workflows/release.yml` | `release/` |

## 6. Carte complète des fichiers

### Racine

- `.editorconfig` : règles d’édition.
- `.gitattributes` : fins de ligne et attributs Git.
- `.gitignore` : caches, builds et artefacts ignorés.
- `AGENTS.md` : règles rapides pour les agents.
- `PROJECT_MEMORY.md` : ce document, entrée unique de contexte.
- `README.md` / `README.en.md` : présentation et installation.
- `CHANGELOG.md` : historique des versions.
- `ROADMAP.md` : priorités encore ouvertes.
- `SECURITY.md`, `PRIVACY.md`, `NOTICE.md`, `LICENSE` : sécurité, vie privée,
  marques et licence.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md` : contribution/support.
- `BRANDING.md`, `STORE_RELEASE.md`, `THIRD_PARTY_NOTICES.md` : publication.
- `TEST_PLAN.md` : point d’entrée vers la validation.
- `AUDIT_REPORT_*.md`, `HOTFIX_REPORT_*.md` : archives historiques ; ne les lire
  que pour comprendre une régression ancienne.
- `package.json` : commandes et version.
- `dist/.gitkeep` : conserve le répertoire de build vide.

### `.github/`

- `CODEOWNERS` : zones sensibles.
- `ISSUE_TEMPLATE/*` : bugs, compatibilité, fonctions.
- `PULL_REQUEST_TEMPLATE.md` : checklist PR.
- `workflows/ci.yml` : CI Linux/Windows.
- `workflows/release.yml` : Release Candidate manuelle.

### `extension/`

- `manifest.json` : manifeste installable.
- `background.js` : menus/commandes/dashboard.
- `AGENTS.md` : règles propres au code installable.
- `_locales/fr/messages.json` et `_locales/en/messages.json` : toutes les chaînes.
- `icons/*.svg` : icônes locales.
- `styles/pin.css` : styles injectés dans Thunderbird.
- `options/options.html` : structure de la page paramètres.
- `options/options.js` : chargement, rendu, sauvegarde et outils.
- `options/options.css` : design responsive et accessible.
- `dashboard/dashboard.html` : structure dashboard.
- `dashboard/dashboard.js` : vues, actions et santé.
- `dashboard/dashboard.css` : style dashboard.

### `extension/api/pinInbox/`

- `schema.json` : surface API clonable.
- `implementation.js` : Experiment privilégié et orchestration.
- `AGENTS.md` : règles de la zone à haut risque.
- `modules/bulk.js` : validation d’actions groupées.
- `modules/calendar.js` : capacités Agenda pures.
- `modules/diagnostics.js` : journal borné/expurgé.
- `modules/health.js` : score et anomalies.
- `modules/identity.js` : clés stables et conversations.
- `modules/localization.js` : traductions de l’UI injectée.
- `modules/migrations.js` : aperçu, conflits et fusion.
- `modules/performance.js` : signatures et métriques locales.
- `modules/providers.js` : fournisseurs et calendriers.
- `modules/rules.js` : règles et anti-boucle.
- `modules/smart.js` : vues intelligentes.
- `modules/storage.js` : diff/checksum/sauvegardes.
- `modules/workflow.js` : statuts/récurrences.

### `scripts/`

- `build.py` : XPI + ZIP source reproductibles.
- `check_repo.py` : structure, ressources, CSS/HTML/JS.
- `check_versions.py` : versions cohérentes.
- `check_project_memory.py` : empêche cette mémoire de devenir obsolète.
- `deep_audit.py` : audit de chaque fichier texte, compatible Windows.
- `scan_secrets.py` : secrets et identifiants sensibles.

### `tests/`

- `static_checks.py` : invariants globaux.
- `test_api_schema_contract.py` : API Experiment.
- `test_folder_counter_guard.py` : compteurs Thunderbird.
- `test_ui_regressions.py` : régressions UI historiques.
- `test_options_controls.py` : paramètres/feedback.
- `test_calendar_and_card_actions.py` : Agenda et cartes.
- `test_native_card_menu.py` : menu XUL natif.
- `test_data_integrity_guards.py` : imports/migrations/concurrence.
- `test_accessibility_localization.py` : accessibilité/locales.
- `test_ux_3_2_features.py` : vues, santé et nouvelles fonctions.
- `test_dashboard_dom_contract.py` : IDs JS/HTML dashboard.
- `test_message_menu_and_row_ux.py` : menu messages et lignes.
- `test_cross_platform_ci.py` : CI multiplateforme.
- `test_ui_polish_3_2_3.py` : densités, alignements et mémoire projet.
- `ux_3_2_model_tests.mjs` : modèles UX.
- `model_tests.mjs` : modèles généraux.
- `sqlite_model_tests.py` : schéma et stockage.
- `test_build_reproducible.py` : archives identiques.
- `browser/` et `xpcshell/` : points de départ pour un harnais Thunderbird réel.
- `AGENTS.md` : règles de tests.

### `docs/`

- `PROJECT_STATE.json` : état machine-lisible courant.
- `ARCHITECTURE.md` : architecture détaillée.
- `CODEX_HANDOFF.md` : relais court vers cette mémoire.
- `DATA_MODEL.md` : modèle de données.
- `DEBUGGING.md` : diagnostic et collecte.
- `DECISIONS.md` : décisions durables.
- `KNOWN_LIMITATIONS.md` : limites honnêtes.
- `MANUAL_TEST_PLAN.md` : matrice manuelle.
- `SCREENSHOT_FINDINGS.md` : constats visuels.
- `UI_SPEC.md` : règles UX/UI.
- `THREAT_MODEL.md` : menaces.
- `ATN_RELEASE_CHECKLIST.md` : publication.
- `VIDEO_REVIEW_*.md` : analyses historiques de vidéos.

### `release/`

- `BUILD_INSTRUCTIONS.md` : reconstruction reviewer.
- `ATN_REVIEW_NOTES_TEMPLATE.md` : notes ATN.
- `manifest-store-template.json` : manifeste de publication futur.

## 7. Paramètres et UX

Deux réglages distincts ne doivent pas être confondus :

- **Espacement des paramètres (`uiPreset`)** : agit uniquement sur la page Options.
- **Densité des cartes (`density`)** : agit uniquement sur les cartes épinglées.

Aucun de ces réglages ne doit changer la hauteur virtuelle ou la lisibilité des
messages natifs Thunderbird.

Principes :

- le bouton Fermer d’un toast reste en haut à droite ;
- chaque contrôle possède un libellé et une aide non superposée ;
- les boutons d’une même action ont leur aide dans leur propre colonne ;
- le dock Enregistrer/Annuler est l’unique action persistante ;
- les comptes n’affichent pas deux fois la même adresse ;
- les calendriers indiquent « Tâches », « Événements », les deux ou indisponible ;
- les boutons étoile/punaise/plus d’une ligne native forment un rail centré.

## 8. Données et confidentialité

Le diagnostic peut contenir version, plateforme, compteurs agrégés, hashes de clés,
performances et capacités. Il ne doit pas contenir :

- corps ou extraits de messages ;
- pièces jointes ;
- chemins locaux complets ;
- adresses brutes dans les événements techniques ;
- jetons, cookies ou mots de passe.

## 9. Commandes obligatoires

```bash
npm run check
npm test
npm run build
npm run ci
```

Le dernier contrôle doit être répété depuis le ZIP source extrait dans un dossier
neuf. Le XPI et le ZIP doivent être reproductibles.

## 10. Procédure selon le type de tâche

### Bug d’interface Thunderbird

1. Lire `docs/UI_SPEC.md`.
2. Chercher dans `_setupAbout3Pane()` et `extension/styles/pin.css`.
3. Vérifier le DOM officiel Thunderbird de la version visée.
4. Ajouter une garde dans `tests/test_ui_regressions.py` ou un test dédié.
5. Tester cartes/tableau, thèmes, densités et plusieurs fenêtres.

### Bug paramètres

1. Ouvrir `options.html`, `options.js`, `options.css`.
2. Vérifier que toute classe HTML/JS possède une règle CSS.
3. Vérifier configuration `null`, feedback local, toast et dock.
4. Tester Guidé/Avancé, recherche, zoom 200 % et largeur étroite.

### Bug données

1. Lire `DATA_MODEL.md`.
2. Modifier un module pur lorsque possible.
3. Valider import, sauvegarde, rollback et multi-fenêtre.
4. Ne jamais réparer automatiquement une opération destructive.

### Nouvelle fonction

1. Ajouter d’abord le modèle pur dans `modules/`.
2. Exposer une API clonable dans `schema.json`.
3. Orchestrer dans `implementation.js`.
4. Ajouter l’UI puis les locales.
5. Ajouter tests et documentation.

## 11. Limites actuelles

- Les tests graphiques réels nécessitent toujours Thunderbird.
- L’API Experiment dépend d’éléments internes susceptibles de changer.
- La matrice fournisseurs doit continuer à être validée sur comptes réels.
- La localisation de certaines chaînes générées dynamiquement reste perfectible.
- `implementation.js` demeure volumineux ; tout découpage doit être progressif.

## 12. Définition de terminé

Une modification est terminée seulement si :

- `npm run ci` passe ;
- le ZIP extrait repasse la CI ;
- la version est cohérente ;
- les docs et cette mémoire sont à jour ;
- les invariants sont respectés ;
- les tests Thunderbird réellement exécutés sont listés honnêtement ;
- aucune publication distante n’a été faite sans accord.


## 13. Points d’entrée exacts pour les outils

Ces chemins doivent rester écrits intégralement afin que les vérifications et les agents puissent les ouvrir sans recherche supplémentaire :

- `extension/manifest.json`
- `extension/background.js`
- `extension/api/pinInbox/schema.json`
- `extension/api/pinInbox/implementation.js`
- `extension/options/options.html`
- `extension/dashboard/dashboard.html`
- `PROJECT_MEMORY.md`
