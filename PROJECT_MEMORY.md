# Mémoire opérationnelle — MailPin

> Version source : **1.7.1**
> Dernière release publique : **1.7.1**
> Branche courante : `main` ; release 1.7.1 : `c2b886677413a205d57a191234b1dac6279b86d6`
> Base de l’audit global : `0c0400170aac631d13d795050d669cbb1a83ea7f`
> Extension ID : `ussmarines.mailpin@addons.thunderbird.net`

## Résumé

MailPin est une extension Thunderbird Manifest V3 locale qui ajoute un panneau de messages épinglés et transforme ces épingles en suivis actionnables sans remplacer la liste native. La dernière release publique est **1.7.1**, ciblant exactement `c2b886677413a205d57a191234b1dac6279b86d6`. Cette maintenance corrige la cohérence des métadonnées actives et renforce les gardes de release/local-first sans modifier la logique métier, les permissions, les schémas, les dépendances runtime, l’identité ni le réseau. Organic Workspace et les corrections QoL restent le runtime métier issu de 1.7.0. Les nouvelles créations Agenda démarrent sur **Événement**. Le changement d’ID a été introduit volontairement en 1.6.0 avant la première publication ATN.

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

La portée « Comptes sélectionnés » utilise désormais `account.key` comme identité canonique. La collecte accepte les collections Thunderbird itérables et XPCOM indexées ; `selectedAccountKeys` reste borné et normalisé. Le banc réel a validé la portée vide à 0 épingle ainsi que A=18, B=16, A+C=34 sans B et A+B+C=50.

### Options

Les réglages sont présentés par familles : **Essentiel**, **Automatisation**, **Organisation**, **Avancé**. Le mode stocké `guided` est présenté comme **Recommandé** ; la valeur persistée reste inchangée. En mode Recommandé, les sections techniques avancées sont masquées, mais aucun contrôle avancé n’est supprimé du produit.

L’action « appliquer les réglages recommandés » produit uniquement un brouillon et conserve les valeurs personnelles/environnementales telles que calendrier préféré, groupe d’attente, dossier de sauvegarde, couleurs de comptes, activation des boîtes et comptes sélectionnés. L’utilisateur doit encore cliquer sur Enregistrer.

La sélection de comptes apparaît uniquement pour la portée « Comptes sélectionnés », conserve le brouillon lors d’un changement temporaire de portée et affiche les comptes Thunderbird avec leurs libellés lisibles. Le banc 1.5.2 valide automatiquement la sauvegarde Options → panneau et la persistance A+C (34 épingles, B absent) après redémarrage sur le même profil.

`@fluentui/web-components` 3.0.3 a été évalué puis retiré : aucun fichier de l’extension ne l’importait, le build XPI n’a pas de bundler, le paquet exige Node 22/24 alors que le dépôt conserve Node 20 dans sa matrice, et son arbre n’apportait donc aucun composant au produit livré. MailPin garde Organic Workspace local, sans dépendance npm runtime ni lockfile ; Fluent 2 reste uniquement une référence historique de décisions antérieures.

### Banc Thunderbird

Le workflow `.github/workflows/thunderbird-smoke.yml` télécharge un binaire Thunderbird officiel et geckodriver, vérifie leurs empreintes, construit l’XPI, prépare un profil local synthétique, installe temporairement l’extension, contrôle le background MV3 et l’injection, vérifie l’ouverture unique du Dashboard, désinstalle, contrôle le nettoyage puis réinstalle. La PR #24 a repassé ce smoke sur Thunderbird **153.0.1 ESR** Linux avec succès.

Le banc fonctionnel `.github/workflows/thunderbird-functional-bench.yml` / `tests/thunderbird/functional_bench.py` couvre les volumes 50, 100, 500, 1 000 et 2 000 épingles. En 1.5.2, il sait aussi installer l’extension de façon non temporaire dans un profil jetable exact, redémarrer Thunderbird dans un second processus, vérifier SQLite et les réglages persistés, réveiller naturellement le background MV3 par activation d’onglet et revalider le panneau sans réinstallation artificielle.

Le 10 août 2026, une nouvelle passe Linux sur Thunderbird 153.0.1 ESR/geckodriver 0.37.1 a revalidé la matrice 50/100/500/1000/2000 après correction d’une assertion erronée du harness : le compteur du panneau reste volontairement le total de la portée pendant une recherche, tandis que seules les cartes rendues sont filtrées. Les cinq volumes passent sans timeout ni exception JavaScript ; à 500/1000/2000, toute la pagination est chargée sans doublon et les positions début/milieu/fin sont présentes.

Avant rebranding, le banc ciblé 50 références sous Thunderbird 153.0.3 a revalidé les chemins métier ensuite conservés : réconciliation cross-entry, transitions workflow, relance, Agenda, Dashboard/Options, cleanup et réinstallation. Le rebranding a été intégré par la PR #35. Le commit runtime `4fdb978e1828325001f95951c115059a931b8b6e` a repassé les workflows QA Linux/Windows, la garde sécurité et le smoke Thunderbird réel avec succès.

### Outillage UI Codex

La source de vérité visuelle demeure `docs/UI_SPEC.md`; aucun `PRODUCT.md` ou `DESIGN.md` concurrent n’est nécessaire. Le skill global Impeccable pilote l’UX/UI produit et ses finitions, UI UX Pro Max sert à la recherche de système, et `design-taste-frontend` à une direction artistique explicitement demandée. Le hook projet est silencieux sur les résultats propres, limité aux fichiers UI modifiés et réserve sa passe profonde à la fin de session.

Diagnostiquer l’environnement avec `npx skills ls -g` et le hook avec `node C:\Users\ussma\.agents\skills\impeccable\scripts\hook-admin.mjs status`. Pour une mise à jour, vérifier d’abord le dépôt officiel, la version et les écritures prévues ; utiliser `npx skills update -g` pour les sources suivies et l’installateur officiel Impeccable avec le fournisseur Codex explicite.

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
- aucune nouvelle permission, dépendance runtime ou connexion réseau introduite par la 1.7.1 ;
- recette utilisateur pré-rebranding 1.5.4 verte pour le métier inchangé ; cette preuve n’est pas renommée recette 1.6.1 ;
- runtime MailPin `4fdb978e1828325001f95951c115059a931b8b6e` : QA Linux/Windows, garde sécurité et smoke Thunderbird 153 réel verts ;
- 1.7.1 modifie uniquement la version distribuée, les documents actifs et les gardes de dépôt/release ; PR #43, QA Linux/Windows, garde identité/sécurité, smoke Thunderbird réel et publication depuis le commit exact sont PASS.

## Commandes obligatoires

```bash
npm run check
npm test
npm run build
npm run ci
```

Tests ciblés de la frontière et des réglages :

```bash
python tests/test_thunderbird_compatibility_boundary.py
node tests/thunderbird_compatibility_contract.mjs
python tests/test_recommended_options_ux.py
python tests/test_thunderbird_test_bench.py
```

## Définition de terminé

- `main` publié et déclarations source/release publique 1.7.1 synchronisées après publication ;
- tests, scans de secrets et builds reproductibles verts ;
- frontière Thunderbird vérifiée sans réintroduction d’accès direct ;
- Options Recommandé/Avancé et portée multi-comptes cohérentes en FR/EN ;
- README, changelog, état projet, registre, architecture, sécurité et handoff à jour lorsque leur contenu est affecté ;
- aucune permission, URL distante d’exécution, dépendance runtime ou schéma nouveau non justifié ;
- résultats runtime décrits honnêtement : preuve réelle verte ou limite documentée, jamais supposée ;
- tag/release uniquement après autorisation explicite de l’utilisateur — autorisation complète reçue le 16 août 2026 ; release GitHub 1.7.1 publiée après gates techniques verts.
