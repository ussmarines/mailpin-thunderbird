# Mémoire opérationnelle — MailPerch

> Version publique : **1.4.0**
> Branche de préparation release : `release/mailperch-1.4.0`
> Base GitHub : `main` au commit `26af48770930653ebbf9f4836854e0e078eca112`
> Extension ID : `pin-mails@MailPerch.local`

## Résumé

MailPerch est une extension Thunderbird Manifest V3 locale qui ajoute un panneau de messages épinglés et transforme ces épingles en suivis actionnables sans remplacer la liste native. La version 1.4.0 consolide les retours runtime post-1.3.0 : portée par comptes Thunderbird sélectionnés, fiabilité Options/Dashboard/panneau, icônes de punaise adaptées au thème et banc fonctionnel réel jusqu’à 2 000 épingles. La frontière `PinCompatibility`, le fonctionnement local et les invariants de confidentialité restent inchangés.

Les futures fonctions **Prochaine action**, **Timeline de conversation**, **Follow-up récurrent** et **Résultat du suivi** restent hors périmètre de cette release.

## Invariants non négociables

1. Aucun appel réseau d’exécution, aucune télémétrie, publicité, CDN, police distante ou code distant.
2. Ne jamais modifier indirectement les compteurs natifs ou l’état lu lors d’un épinglage.
3. Ne jamais stocker le corps complet des messages ni le contenu des pièces jointes.
4. Toute entrée de l’Experiment est bornée, normalisée et revalidée côté privilégié.
5. SQLite reste transactionnel, incrémental et sérialisé.
6. Les ressources injectées, observateurs, timers et données gérées sont nettoyés selon leur cycle de vie.
7. Les actions destructives restent confirmées et les imports automatisés sont neutralisés.
8. Les tags personnels Thunderbird ne doivent jamais être renommés ou supprimés ; seuls les tags possédés par MailPerch, reconnus par clé et libellé exacts, peuvent être gérés.
9. L’identité publique reste `ussmarines`; aucune donnée personnelle ou secrète ne doit être réintroduite.
10. Aucune permission WebExtension supplémentaire n’est ajoutée sans justification documentée et testée.
11. Une capacité facultative Tags/Agenda indisponible ne doit pas empêcher le cœur MailPerch de démarrer.
12. Le métier ne doit pas réintroduire d’appels directs à `MailServices`, `MailUtils`, `MessageArchiver`, `cal`, `CalEvent` ou `CalTodo` en dehors de la frontière de compatibilité.
13. Le mode **Recommandé** prépare des valeurs sûres mais ne sauvegarde jamais automatiquement ; Enregistrer/Annuler restent explicites.
14. Toute classe ou service privilégié injecté dans `PinCompatibility` doit être importé/défini explicitement avant la création des adaptateurs ; aucun identifiant global implicite ne doit être requis au bootstrap.
15. L’apparence Fluent 2 repose sur les composants HTML natifs et les jetons CSS locaux de `extension/styles/tokens.css` ; aucun paquet Fluent, bundler ou actif distant n’entre dans le XPI.
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

La sélection de comptes apparaît uniquement pour la portée « Comptes sélectionnés », conserve le brouillon lors d’un changement temporaire de portée et affiche les comptes Thunderbird avec leurs libellés lisibles. La sauvegarde Options → panneau a été validée manuellement sur le profil de test multi-comptes.

`@fluentui/web-components` 3.0.3 a été évalué puis retiré : aucun fichier de l’extension ne l’importait, le build XPI n’a pas de bundler, le paquet exige Node 22/24 alors que le dépôt conserve Node 20 dans sa matrice, et son arbre n’apportait donc aucun composant au produit livré. MailPerch garde le langage Fluent 2 local, sans dépendance npm runtime ni lockfile.

### Banc Thunderbird

Le workflow `.github/workflows/thunderbird-smoke.yml` télécharge un binaire Thunderbird officiel et geckodriver, vérifie leurs empreintes, construit l’XPI, prépare un profil local synthétique, installe temporairement l’extension, contrôle le background MV3 et l’injection, vérifie l’ouverture unique du Dashboard, désinstalle, contrôle le nettoyage puis réinstalle. La PR #24 a repassé ce smoke sur Thunderbird **153.0.1 ESR** Linux avec succès.

Le banc fonctionnel `.github/workflows/thunderbird-functional-bench.yml` / `tests/thunderbird/functional_bench.py` couvre les volumes 50, 100, 500, 1 000 et 2 000 épingles. La passe réelle Windows sur Thunderbird 153.0.2/geckodriver 0.37.1 a validé les cinq volumes, la pagination sans doublon et les scénarios multi-comptes. La persistance entre deux processus avec une extension temporaire reste limitée par le harness : le stockage SQLite peut être supprimé lors de la fermeture de l’extension temporaire ; ce point n’est pas présenté comme un défaut produit.

### Outillage UI Codex

La source de vérité visuelle demeure `docs/UI_SPEC.md`; aucun `PRODUCT.md` ou `DESIGN.md` concurrent n’est nécessaire. Le skill global Impeccable pilote l’UX/UI produit et ses finitions, UI UX Pro Max sert à la recherche de système, et `design-taste-frontend` à une direction artistique explicitement demandée. Le hook projet est silencieux sur les résultats propres, limité aux fichiers UI modifiés et réserve sa passe profonde à la fin de session.

Diagnostiquer l’environnement avec `npx skills ls -g` et le hook avec `node C:\Users\ussma\.agents\skills\impeccable\scripts\hook-admin.mjs status`. Pour une mise à jour, vérifier d’abord le dépôt officiel, la version et les écritures prévues ; utiliser `npx skills update -g` pour les sources suivies et l’installateur officiel Impeccable avec le fournisseur Codex explicite.

## État 1.4.0

- schéma SQLite : 5 ; schéma paramètres/données : 7 ;
- compatibilité déclarée : Thunderbird 128.0 à 153.* ;
- permission WebExtension : `menus` uniquement ;
- notes : 4 000 caractères maximum ; checklist : 50 éléments de 240 caractères maximum ; vues enregistrées : 30 maximum ;
- recherche globale limitée aux métadonnées déjà accessibles, jamais au corps ou aux pièces jointes ;
- synchronisation tags désactivée par défaut et propriété stricte ;
- synchronisation Agenda dépendante des capacités du fournisseur ;
- détection fournisseurs par domaine exact ou sous-domaine légitime ;
- portée multi-comptes basée sur `account.key`, sélection maximale bornée à 50 comptes ;
- volume conseillé : jusqu’à 2 000 épingles, sans blocage technique au-delà ;
- aucune nouvelle permission, dépendance runtime ou connexion réseau introduite par la 1.4.0.

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

- branche de release propre et déclarations 1.4.0 synchronisées avant toute publication ;
- tests, scans de secrets et builds reproductibles verts ;
- frontière Thunderbird vérifiée sans réintroduction d’accès direct ;
- Options Recommandé/Avancé et portée multi-comptes cohérentes en FR/EN ;
- README, changelog, état projet, registre, architecture, sécurité et handoff à jour lorsque leur contenu est affecté ;
- aucune permission, URL distante d’exécution, dépendance runtime ou schéma nouveau non justifié ;
- résultats runtime décrits honnêtement : preuve réelle verte ou limite documentée, jamais supposée ;
- aucun tag ni release sans autorisation explicite de l’utilisateur.
