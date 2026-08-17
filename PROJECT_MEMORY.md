# Mémoire opérationnelle — MailPin

> Version source : **1.7.2**
> Dernière release publique : **1.7.1**
> Branche courante : `release/1.7.2-ui-stability` ; baseline candidate : `main` à `5284e39a43513d38ededec5e7f939a685f7fdd2c`
> Base de l’audit global : `0c0400170aac631d13d795050d669cbb1a83ea7f`
> Extension ID : `ussmarines.mailpin@addons.thunderbird.net`

## Résumé

MailPin est une extension Thunderbird Manifest V3 locale qui transforme des messages épinglés en suivis actionnables sans remplacer la liste native. La dernière release publique est **1.7.1**. La source **1.7.2** est une candidate corrective issue de la recette réelle du 17 août 2026 : elle stabilise la navigation du Dashboard et des Options, la géométrie des statistiques, la barre Enregistrer/Annuler, les espacements, les cartes Agenda et l’action des raccourcis. Elle ne modifie ni permissions, schémas, stockage, identité, logique métier, dépendances runtime ni politique réseau. La PR #47 a intégré le runtime UI sur `main` après QA et smoke Thunderbird réels verts ; le candidat versionné 1.7.2 doit encore franchir ses propres gates avant publication.

Les futures fonctions **Prochaine action**, **Timeline de conversation**, **Follow-up récurrent** et **Résultat du suivi** restent hors périmètre de cette release.

## Invariants non négociables

1. Aucun appel réseau d’exécution, aucune télémétrie, publicité, CDN, police distante ou code distant.
2. Ne jamais modifier indirectement les compteurs natifs ou l’état lu lors d’un épinglage.
3. Ne jamais stocker le corps complet des messages ni le contenu des pièces jointes.
4. Toute entrée de l’Experiment est bornée, normalisée et revalidée côté privilégié.
5. SQLite reste transactionnel, incrémental et sérialisé.
6. Les ressources injectées, observateurs, timers et données gérées sont nettoyés selon leur cycle de vie.
7. Les actions destructives restent confirmées et les imports automatisés sont neutralisés.
8. Les tags personnels Thunderbird ne doivent jamais être renommés ou supprimés ; seuls les tags possédés par MailPin, reconnus par clé et libellé exacts, peuvent être gérés.
9. L’identité publique reste `ussmarines`; aucune donnée personnelle ou secrète ne doit être réintroduite.
10. Aucune permission WebExtension supplémentaire n’est ajoutée sans justification documentée et testée.
11. Une capacité facultative Tags/Agenda indisponible ne doit pas empêcher le cœur MailPin de démarrer.
12. Le métier ne doit pas réintroduire d’appels directs à `MailServices`, `MailUtils`, `MessageArchiver`, `cal`, `CalEvent` ou `CalTodo` en dehors de la frontière de compatibilité.
13. Le mode **Recommandé** prépare des valeurs sûres mais ne sauvegarde jamais automatiquement ; Enregistrer/Annuler restent explicites.
14. Toute classe ou service privilégié injecté dans `PinCompatibility` doit être importé/défini explicitement avant la création des adaptateurs ; aucun identifiant global implicite ne doit être requis au bootstrap.
15. Organic Workspace repose sur HTML natif et les jetons CSS locaux ; le shell Dashboard/Options est écrit directement dans les sources et aucun framework UI, bundler ou actif distant n’entre dans le XPI.
16. La portée « Comptes sélectionnés » utilise `account.key` comme identité canonique de bout en bout ; `incomingServer.key` n’est pas une clé de sélection persistée.

## Carte complète des fichiers

- manifeste : `extension/manifest.json`
- background : `extension/background.js`
- schéma Experiment : `extension/api/pinInbox/schema.json`
- implémentation privilégiée : `extension/api/pinInbox/implementation.js`
- façade compatibilité : `extension/api/pinInbox/modules/compatibility.js`
- adaptateur Messages : `extension/api/pinInbox/modules/thunderbird-messages.js`
- adaptateur Tags : `extension/api/pinInbox/modules/thunderbird-tags.js`
- adaptateur Agenda : `extension/api/pinInbox/modules/thunderbird-calendar.js`
- paramètres : `extension/options/options.html`
- dashboard : `extension/dashboard/dashboard.html`
- mémoire projet : `PROJECT_MEMORY.md`
- frontière de sécurité : `docs/SECURITY_BOUNDARY.md`
- architecture : `docs/ARCHITECTURE.md`
- compatibilité Thunderbird : `docs/THUNDERBIRD_COMPATIBILITY.md`
- banc Thunderbird : `docs/THUNDERBIRD_TEST_BENCH.md`
- registre des bugs : `docs/BUG_TRACKER.md`
- état machine : `docs/PROJECT_STATE.json`
- handoff agents : `docs/CODEX_HANDOFF.md`

## Où modifier quoi

- cycle Experiment et DOM `about:3pane` : `extension/api/pinInbox/implementation.js`
- accès aux API internes Messages/Tags/Agenda : uniquement les adaptateurs `thunderbird-*.js` et la façade `compatibility.js`
- logique métier pure : `extension/api/pinInbox/modules/` (`analytics.js`, `checklists.js`, `saved-views.js`, `workflow.js`, `rules.js`, etc.)
- apparence du panneau : `extension/styles/pin.css` et `extension/styles/tokens.css`
- stabilité UI Dashboard/Options issue de la recette 1.7.2 : `extension/styles/interaction-stability.css` et `extension/options/options-navigation-stability.js`
- paramètres et mode Recommandé : `extension/options/`
- dashboard, recherche, vues et palette : `extension/dashboard/`
- contrats de compatibilité : `tests/thunderbird_compatibility_contract.mjs` et `tests/test_thunderbird_compatibility_boundary.py`
- smoke vrai Thunderbird : `tests/thunderbird/real_smoke.py` et `.github/workflows/thunderbird-smoke.yml`
- banc fonctionnel/charge : `tests/thunderbird/functional_bench.py` et `.github/workflows/thunderbird-functional-bench.yml`
- build et validation : `scripts/`, `tests/`, `.github/workflows/`
- publication et reviewers : `release/`, `STORE_RELEASE.md`, `docs/ATN_RELEASE_CHECKLIST.md`

## État de la consolidation

### Couche Thunderbird

`PinCompatibility` assemble trois adaptateurs injectables : Messages, Tags et Agenda. `implementation.js` orchestre leur usage mais ne doit plus porter les opérations natives qui ont été extraites. Les tests de contrat utilisent de faux services déterministes ; ils ne constituent pas une validation graphique réelle.

Le DOM `about:3pane` reste volontairement dans l’orchestrateur. Toute extraction future de cette zone doit être progressive, car elle dépend des structures internes `ThreadCard`, des fenêtres et menus natifs.

La portée « Comptes sélectionnés » utilise `account.key` comme identité canonique. La collecte accepte les collections Thunderbird itérables et XPCOM indexées ; `selectedAccountKeys` reste borné et normalisé. Le banc réel a validé la portée vide à 0 épingle ainsi que A=18, B=16, A+C=34 sans B et A+B+C=50.

### Options et Dashboard

Les réglages sont présentés par familles : **Essentiel**, **Automatisation**, **Organisation**, **Avancé**. Le mode stocké `guided` est présenté comme **Recommandé** ; la valeur persistée reste inchangée. L’action « appliquer les réglages recommandés » produit uniquement un brouillon et conserve les valeurs personnelles/environnementales ; l’utilisateur doit encore cliquer sur Enregistrer.

La correction 1.7.2 garde Enregistrer/Annuler et les notifications dans le viewport, stabilise la section active de la navigation même pour les longues sections, redonne de l’espace entre groupes indépendants et empêche les badges Agenda de chevaucher les noms longs. Le Dashboard garde le contrôle « Plus de statistiques » au même emplacement pendant son ouverture. Ces changements restent purement UI et n’élargissent aucune capacité privilégiée.

### Banc Thunderbird

Le workflow `.github/workflows/thunderbird-smoke.yml` télécharge un binaire Thunderbird officiel et geckodriver, vérifie leurs empreintes, construit l’XPI, prépare un profil local synthétique, installe temporairement l’extension, contrôle le background MV3 et l’injection, vérifie l’ouverture unique du Dashboard, désinstalle, contrôle le nettoyage puis réinstalle.

Le banc fonctionnel `.github/workflows/thunderbird-functional-bench.yml` / `tests/thunderbird/functional_bench.py` couvre les volumes 50, 100, 500, 1 000 et 2 000 épingles et les principaux chemins métier. Ces preuves anciennes restent valides pour les zones inchangées ; elles ne remplacent pas le smoke frais exigé pour le runtime UI 1.7.2.

La PR #47 a passé sur son head exact `551841858e974482f046a1980e52cfc84be71a6c` le workflow QA `32024824818` et le smoke Thunderbird réel `32024824756`, puis a été fusionnée par squash dans `main` à `5284e39a43513d38ededec5e7f939a685f7fdd2c`. Aucun contrôle visuel humain post-correction n’est déclaré comme exécuté.

### Outillage UI Codex

La source de vérité visuelle demeure `docs/UI_SPEC.md`; aucun `PRODUCT.md` ou `DESIGN.md` concurrent n’est nécessaire. Les outils UI restent optionnels et utilisés seulement lorsqu’ils apportent une valeur matérielle. Aucun actif distant ni dépendance UI runtime n’est ajouté.

## État technique courant

- schéma SQLite : 5 ; schéma paramètres : 8 ; schéma données : 7 ;
- compatibilité déclarée : Thunderbird 153.0 à 153.* ;
- permission WebExtension : `menus` uniquement ;
- notes : 4 000 caractères maximum ; checklist : 50 éléments de 240 caractères maximum ; vues enregistrées : 30 maximum ;
- recherche globale limitée aux métadonnées déjà accessibles, jamais au corps ou aux pièces jointes ;
- synchronisation tags désactivée par défaut et propriété stricte ;
- synchronisation Agenda dépendante des capacités du fournisseur ;
- détection fournisseurs par domaine exact ou sous-domaine légitime ;
- portée multi-comptes basée sur `account.key`, sélection maximale bornée à 50 comptes ;
- volume conseillé : jusqu’à 2 000 épingles, sans blocage technique au-delà ;
- aucune nouvelle permission, dépendance runtime, migration de stockage ou connexion réseau introduite par la 1.7.2 ;
- 1.7.2 modifie les surfaces UI Dashboard/Options et leurs contrats de régression ; la logique métier et les frontières privilégiées restent inchangées ;
- le candidat 1.7.2 n’est publiable qu’après QA Linux/Windows, garde sécurité, build reproductible et smoke Thunderbird réel sur le candidat exact.

## Commandes obligatoires

```bash
npm run check
npm test
npm run build
npm run ci
```

Tests ciblés de la frontière, des réglages et de l’UI :

```bash
python tests/test_organic_workspace_ui.py
python tests/test_options_controls.py
python tests/test_recommended_options_ux.py
python tests/test_thunderbird_compatibility_boundary.py
node tests/thunderbird_compatibility_contract.mjs
python tests/test_thunderbird_test_bench.py
```

## Définition de terminé

- source candidate 1.7.2 et dernière release publique 1.7.1 déclarées sans ambiguïté avant publication ;
- tests, scans de secrets et builds reproductibles verts ;
- frontière Thunderbird vérifiée sans réintroduction d’accès direct ;
- Dashboard/Options 1.7.2 passent leurs contrats UI et un smoke Thunderbird réel sur le candidat exact ;
- README, changelog, état projet, registre, sécurité, validation et handoff à jour lorsque leur contenu est affecté ;
- aucune permission, URL distante d’exécution, dépendance runtime ou schéma nouveau non justifié ;
- résultats runtime décrits honnêtement : preuve réelle verte ou limite documentée, jamais supposée ;
- tag/release uniquement après autorisation explicite de l’utilisateur — autorisation reçue le 17 août 2026 pour la PR, le merge et une nouvelle release, sous réserve de gates verts.
