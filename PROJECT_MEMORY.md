# Mémoire du projet MailPerch

> **Fichier d’entrée unique pour Codex et les nouveaux contributeurs.**
> Lire ce document avant tout autre fichier. Il donne l’état courant, les invariants,
> la carte du dépôt et les chemins exacts à ouvrir selon la tâche.
>
> Version publique : **1.1.0**
> Base de travail vérifiée : `main` au commit `a1e26bee9400279109b447cc80b90b24913b8bca`
> Produit : **MailPerch — Email Pins & Follow-up**
> Extension ID source : `pin-mails@ussmarines.local`
> Publication : **bloquée** tant que la migration d’identité et la continuité des données Thunderbird ne sont pas validées manuellement.

## 1. Résumé en 30 secondes

MailPerch est une MailExtension Thunderbird Manifest V3. Elle ajoute un panneau de
messages épinglés au-dessus de la liste native, sans filtrer ni remplacer « Tous les
messages ». Les épingles, notes, groupes, workflows, rappels, règles, affaires, vues
intelligentes, sauvegardes et liens Agenda restent locaux.

L’extension comporte deux mondes :

1. **WebExtension non privilégiée** : `background.js`, paramètres et dashboard.
2. **Experiment privilégié** : `api/pinInbox/implementation.js`, accès à
   `about:3pane`, SQLite, dossiers, en-têtes de messages et Agenda.

Après cette mémoire, lire `docs/BUG_TRACKER.md` avant toute correction afin de ne pas rouvrir un bug déjà connu ni perdre un défaut non résolu.

La version 3.2.5 conserve le durcissement 3.2.4 et corrige trois régressions observées dans Thunderbird réel : étoile native dupliquée, commandes Enregistrer/Annuler peu fiables et faux positif CRLF de la CI Windows. Elle ajoute aussi `docs/BUG_TRACKER.md`, registre permanent des bugs connus lu par Codex et vérifié par la CI.

La version 3.2.8 remplace les listes parallèles de paramètres par une source de
vérité partagée et un registre de contrôles vérifié au démarrage. Les configurations
absentes, partielles, anciennes ou invalides sont normalisées avant tout rendu ;
les choix `false` explicites restent respectés. Un test Playwright charge les vrais
HTML/JS/CSS et exerce 98 contrôles, Enregistrer, Annuler, les événements pointeur,
les erreurs et la reconstruction de page. Dans les cartes Thunderbird 153,
`.thread-card-icon-info` devient un rail de grille couvrant toutes les lignes au
lieu de rester dans la rangée basse native. MP-2026-004, MP-2026-005 et
MP-2026-007 restent `À VALIDER` jusqu'à observation dans Thunderbird.

La version 3.2.9 borne l’initialisation de la page Paramètres : configuration,
raccourcis et composants secondaires ont un délai maximal ; l’Agenda, la santé et
les sauvegardes se chargent après le formulaire. Toute erreur atteint un panneau
terminal avec Réessayer et un diagnostic expurgé, jamais un chargement permanent.

La version 3.2.10 corrige la cause observée dans Thunderbird 153 : la traduction
du libellé de restauration supprimait son champ fichier enfant, puis le script
échouait avant d’entrer dans l’initialisation 3.2.9. Un bootstrap minimal précède
désormais les dépendances, journalise des étapes expurgées, capture les erreurs
globales et garantit un état terminal même si un script ou l’API manque. Dans un
profil jetable sans compte, Thunderbird 153.0.1 a validé les recommandations, le
dock Enregistrer/Annuler, la réouverture et la persistance après redémarrage.

La version 3.2.11 rend l’état des cartes de réglage strictement dépendant de leur
case, avec un badge séparé pour une recommandation désactivée. Elle donne une
structure accessible aux affaires, modèles et règles, et bloque toute création
Agenda d’affaire sans titre, date, type et calendrier compatible ; l’Experiment
applique les mêmes validations et ne crée plus une échéance artificielle.

La version publique 1.0.0 appliquait l’identité Fluent 2 aux paramètres,
au dashboard et au panneau natif via `extension/styles/tokens.css`. Un pont local
`extension/styles/theme.js` suit le thème courant de Thunderbird et utilise le
thème système comme repli. Les en-têtes donnent désormais une vraie place au logo,
les surfaces, boutons, champs et états disposent d’une hiérarchie claire, tandis
que les identifiants, comportements, données et géométrie native restent inchangés.

La version publique 1.1.0 ajoute une couche de productivité sans réseau ni nouveau
schéma de données : suivi automatique sans réponse, mise en veille réelle, vue
Aujourd’hui, revue quotidienne/hebdomadaire, rappels interactifs, actions groupées
étendues, capture rapide, aperçu des règles, dix raccourcis personnalisables et
fusion prudente des conversations. Les décisions de revue et de fusion sont isolées
dans `modules/review.js` et `modules/related.js` ; une fusion exige une identité
Thunderbird/Gmail forte et reste confirmée par l’utilisateur.

## 2. Invariants non négociables

1. Ne jamais modifier les compteurs natifs de nouveaux messages, non-lus ou totaux.
2. Épingler ne doit jamais marquer un message lu/non lu.
3. Le panneau MailPerch reste distinct de la liste native « Tous les messages ».
4. Aucun réseau, télémétrie, publicité, CDN, code distant ou dépendance npm.
5. Aucun `eval`, `new Function`, `innerHTML`, `outerHTML` ou HTML construit depuis
   des métadonnées de courrier.
6. Ne jamais stocker le corps des messages ni le contenu des pièces jointes.
7. L’ID source est `pin-mails@ussmarines.local`. Toute release suivant un changement d’identité exige un test manuel de migration, persistance, redémarrage et désinstallation dans un profil jetable.
8. Le dashboard est ouvert par le background avec `tabs.create`.
9. Les écritures SQLite restent incrémentales, transactionnelles et sérialisées.
10. Chaque écouteur, observer, timer, popup, feuille de style et nœud injecté doit
    être nettoyé à la fermeture.
11. Une sauvegarde de sécurité précède une migration ou une restauration.
12. Toute action destructrice groupée respecte les confirmations configurées.
13. Toute publication exige une version synchronisée, `npm run ci` réussi et un accord explicite du propriétaire.
14. Aucun rôle administrateur client, secret maître ou autorisation fondée sur le DOM.
15. Toute entrée de page/import est revalidée et bornée dans l’Experiment.
16. Une désinstallation ferme le stockage avant de purger les données gérées.
17. Une sentinelle native effacée par Gecko distingue une installation active d’une réinstallation et force la purge avant l’ouverture de SQLite.
18. Les workflows n’installent aucun helper Python depuis le réseau et toutes les actions externes sont épinglées par SHA.
19. Les règles de `SECURITY_PRODUCTION_RULES.md` sont obligatoires ; les secrets restent hors du contexte des agents, sont injectés à l’exécution et sont expurgés des logs.

## 3. État technique courant

| Élément | Valeur |
|---|---|
| Version extension/package | `1.1.0` |
| Thunderbird déclaré | `128.0` à `153.*` |
| Manifest | MV3 |
| Permission WebExtension | `menus` uniquement |
| Base SQLite | `pin-mails-v2.sqlite` |
| Schéma SQLite | `5` |
| Schéma paramètres | `6` |
| Schéma données | `6` |
| Stockage | SQLite incrémental + WAL + récupération atomique |
| Réseau | Aucun |
| Locales | Français et anglais |
| Build | Python standard, sans dépendance npm ni helper téléchargé |
| CI | Linux complet + contrôles Windows, actions épinglées par SHA |

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
- Les sauvegardes JSON sont validées, bornées et vérifiées avant fusion/remplacement.
- Les automatismes, chemins locaux et liens Agenda importés sont neutralisés.
- Le diagnostic exporté est expurgé et anonymise les comptes/calendriers.
- La désinstallation arrête les ressources, ferme SQLite puis purge les fichiers et préférences gérés.
- Une sentinelle primitive dans le stockage local natif de l’extension est vérifiée avant toute lecture des préférences ou ouverture SQLite ; son absence déclenche une purge sur une installation neuve/réinstallation, avec conservation unique des données lors de la migration depuis une version antérieure à 3.2.4.

## 5. Où modifier quoi

| Besoin | Fichier principal | Compléments |
|---|---|---|
| Manifeste, permissions, compatibilité | `extension/manifest.json` | `release/manifest-store-template.json` |
| Menus Thunderbird et commandes | `extension/background.js` | locales FR/EN |
| API publique | `extension/api/pinInbox/schema.json` | contrat `tests/test_api_schema_contract.py` |
| Recommandations/réglages | `extension/api/pinInbox/modules/settings.js` | registre Options + `tests/settings_defaults.mjs` |
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
| Revue Aujourd’hui/hebdomadaire | `modules/review.js` | dashboard + rappels |
| Conversations associées | `modules/related.js` | détection/fusion confirmée |
| Style panneau et liste native | `extension/styles/pin.css` | `docs/UI_SPEC.md` |
| Bootstrap paramètres | `extension/options/options-bootstrap.js` | capture terminale + chargement des dépendances |
| Paramètres HTML | `extension/options/options.html` | `options-bootstrap.js`, `options.js`, `options.css` |
| Paramètres logique | `extension/options/options.js` | schema API |
| Paramètres style | `extension/options/options.css` | captures UX |
| Dashboard | `extension/dashboard/*` | contrat DOM |
| Traductions | `extension/_locales/*/messages.json` | test localisation |
| Build reproductible | `scripts/build.py` | test build |
| Audit dépôt | `scripts/check_repo.py`, `deep_audit.py` | CI |
| Cohérence versions | `scripts/check_versions.py` | README/CHANGELOG |
| Secrets | `scripts/scan_secrets.py`, `.github/scripts/security_guard.py` | CI |
| CI GitHub | `.github/workflows/ci.yml`, `.github/workflows/security-secrets.yml` | `tests/test_cross_platform_ci.py` |
| Release candidate | `.github/workflows/release.yml` | `release/` |
| Bugs connus | `docs/BUG_TRACKER.md` | `scripts/check_bug_tracker.py` |

## 6. Carte complète des fichiers

### Racine

- `.editorconfig` : règles d’édition.
- `.gitattributes` : fins de ligne et attributs Git.
- `.gitignore` : caches, builds et artefacts ignorés.
- `AGENTS.md` : règles rapides pour les agents.
- `PROJECT_MEMORY.md` : ce document, entrée unique de contexte.
- `docs/BUG_TRACKER.md` : registre durable des bugs ouverts, corrigés et à valider.
- `README.md` / `README.en.md` : présentation et installation.
- `CHANGELOG.md` : historique des versions.
- `ROADMAP.md` : priorités encore ouvertes.
- `SECURITY.md`, `SECURITY_PRODUCTION_RULES.md`, `PRIVACY.md`, `NOTICE.md`, `LICENSE` : sécurité, vie privée, marques et licence.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md` : contribution/support.
- `BRANDING.md`, `STORE_RELEASE.md`, `THIRD_PARTY_NOTICES.md` : publication.
- `TEST_PLAN.md` : point d’entrée vers la validation.
- `package.json` : commandes et version.
- `dist/.gitkeep` : conserve le répertoire de build vide.

### `.github/`

- `CODEOWNERS` : zones sensibles.
- `ISSUE_TEMPLATE/*` : bugs, compatibilité, fonctions.
- `PULL_REQUEST_TEMPLATE.md` : checklist PR.
- `workflows/ci.yml` : CI Linux/Windows.
- `workflows/security-secrets.yml` : scan expurgé des secrets et références personnelles.
- `workflows/release.yml` : build reproductible et release GitHub automatique lors d’un changement de version fusionné dans `main`.
- `dependabot.yml` : suivi hebdomadaire des GitHub Actions épinglées.

### `extension/`

- `manifest.json` : manifeste installable.
- `background.js` : menus/commandes/dashboard.
- `AGENTS.md` : règles propres au code installable.
- `_locales/fr/messages.json` et `_locales/en/messages.json` : toutes les chaînes.
- `icons/*.svg` : icônes locales.
- `styles/pin.css` : styles injectés dans Thunderbird.
- `styles/tokens.css` : tokens Fluent partagés entre les surfaces HTML et le panneau.
- `options/options-bootstrap.js` : garde terminale précoce et chargement contrôlé.
- `options/options.html` : structure de la page paramètres.
- `options/options.js` : chargement, rendu, sauvegarde et outils.
- `options/options.css` : design responsive et accessible.
- `extension/dashboard/dashboard.html` : structure dashboard.
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
- `modules/settings.js` : recommandations, types et migration partagés par l'Experiment et Options.
- `modules/smart.js` : vues intelligentes.
- `modules/storage.js` : diff/checksum/sauvegardes.
- `modules/workflow.js` : statuts/récurrences.

### `scripts/`

- `build.py` : XPI + ZIP source reproductibles.
- `check_repo.py` : structure, ressources, CSS/HTML/JS.
- `check_versions.py` : versions cohérentes.
- `check_project_memory.py` : empêche cette mémoire de devenir obsolète.
- `check_bug_tracker.py` : valide les identifiants, statuts et champs du registre des bugs.
- `deep_audit.py` : audit de chaque fichier texte, compatible Windows.
- `scan_secrets.py` : secrets et identifiants sensibles.

### `tests/`

- `static_checks.py` : invariants globaux.
- `test_api_schema_contract.py` : API Experiment.
- `test_folder_counter_guard.py` : compteurs Thunderbird.
- `test_ui_regressions.py` : régressions UI historiques.
- `test_options_controls.py` : paramètres/feedback.
- `settings_defaults.mjs` : recommandations et migrations absentes/partielles/invalides.
- `options_dom_flow.playwright.js` : vrais contrôles et événements de la page Options.
- `thread_card_geometry.playwright.js` : géométrie et hit-tests du DOM ThreadCard 153.
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
- `BUG_TRACKER.md` : source unique des bugs connus et de leur statut.
- `ARCHITECTURE.md` : architecture détaillée.
- `CODEX_HANDOFF.md` : relais court vers cette mémoire.
- `DATA_MODEL.md` : modèle de données.
- `DEBUGGING.md` : diagnostic et collecte.
- `DECISIONS.md` : décisions durables.
- `KNOWN_LIMITATIONS.md` : limites honnêtes.
- `FUNCTIONAL_AUDIT_3.2.8.md` : matrice de preuves fonctionnelles de la version courante.
- `MANUAL_TEST_PLAN.md` : matrice manuelle.
- `SCREENSHOT_FINDINGS.md` : constats visuels.
- `UI_SPEC.md` : règles UX/UI.
- `THREAT_MODEL.md` : menaces.
- `ATN_RELEASE_CHECKLIST.md` : publication.

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
- l'étoile et la punaise partagent le rail structurel issu de la zone d'informations ; le bouton Plus reste dans l'en-tête natif sans recouvrement.

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
- Le changement d’identité de l’extension n’est pas considéré comme livrable avant validation manuelle de la continuité des données.

## 12. Définition de terminé

Une modification est terminée seulement si :

- `npm run ci` passe ;
- le ZIP extrait repasse la CI ;
- la version est cohérente ;
- les docs et cette mémoire sont à jour ;
- les invariants sont respectés ;
- les tests Thunderbird réellement exécutés sont listés honnêtement ;
- toute publication distante correspond à une version explicitement préparée et validée.

## Frontière de sécurité 1.0.0

Lire `docs/SECURITY_BOUNDARY.md` et `SECURITY_AUDIT_1.0.0.md` avant toute
modification de l’Experiment, des imports, des sauvegardes ou du cycle de vie.

Règles essentielles :

- MailPerch n’a aucun serveur, compte applicatif ou rôle administrateur ;
- ne jamais ajouter de `admin`, `isAdmin`, jeton maître ou secret client ;
- toute entrée de page ou de sauvegarde reste non fiable dans l’Experiment ;
- ne jamais accepter un chemin disque depuis `setConfiguration` ;
- toute action automatique importée reste désactivée jusqu’à validation ;
- toute donnée persistante nouvelle doit être ajoutée à la purge d’uninstall ;
- le propriétaire local du profil contrôle sa Boîte à outils : la protection doit
  être au niveau de la frontière privilégiée, jamais dans un bouton caché.

Points de contrôle rapides :

| Besoin | Fichier principal | Test obligatoire |
|---|---|---|
| Entrée API/import | `extension/api/pinInbox/implementation.js` | `tests/test_security_hardening_3_2_4.py` |
| Forme API | `extension/api/pinInbox/schema.json` | `tests/test_api_schema_contract.py` |
| Secrets/CSP | `scripts/scan_secrets.py`, `extension/manifest.json` | `npm run check` |
| Désinstallation | `implementation.js` (`registerMailPerchLifecycle`, `_prepareForUninstall`) | test sécurité 3.2.4 |
| Politique | `SECURITY.md`, `docs/SECURITY_BOUNDARY.md`, `docs/THREAT_MODEL.md` | revue documentaire |
