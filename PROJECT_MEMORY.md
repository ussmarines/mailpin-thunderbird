# Mémoire opérationnelle — MailPerch

> Version publique : **1.3.0**
> Branche de consolidation : `refactor/thunderbird-integration-and-ux`
> Base GitHub : `main` au commit `385815f546968acf721c8cd8486ff48f55f78a32`
> Extension ID : `pin-mails@MailPerch.local`

## Résumé

MailPerch est une extension Thunderbird Manifest V3 locale qui ajoute un panneau de messages épinglés et transforme ces épingles en suivis actionnables sans remplacer la liste native. La version 1.3.0 livre la consolidation sans nouveau métier : elle isole les dépendances Thunderbird derrière une couche de compatibilité, simplifie la page Options autour d’un mode **Recommandé** et ajoute un banc de smoke runtime sur un vrai binaire Thunderbird.

Les futures fonctions **Prochaine action**, **Timeline de conversation**, **Follow-up récurrent** et **Résultat du suivi** sont explicitement hors périmètre de cette branche.

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
- build et validation : `scripts/`, `tests/`, `.github/workflows/`
- publication et reviewers : `release/`, `STORE_RELEASE.md`, `docs/ATN_RELEASE_CHECKLIST.md`

## État de la consolidation

### Couche Thunderbird

`PinCompatibility` assemble trois adaptateurs injectables : Messages, Tags et Agenda. `implementation.js` orchestre leur usage mais ne doit plus porter les opérations natives qui ont été extraites. Les tests de contrat utilisent de faux services déterministes ; ils ne constituent pas une validation graphique réelle.

Le DOM `about:3pane` reste volontairement dans l’orchestrateur. Toute extraction future de cette zone doit être progressive, car elle dépend des structures internes `ThreadCard`, des fenêtres et menus natifs.

### Options

Les réglages sont présentés par familles : **Essentiel**, **Organisation**, **Automatisation**, **Avancé**. Le mode stocké `guided` est désormais présenté comme **Recommandé** ; la valeur persistée reste inchangée pour éviter une migration. En mode Recommandé, les sections techniques avancées sont masquées, mais aucun contrôle avancé n’est supprimé du produit.

L’action « appliquer les réglages recommandés » produit uniquement un brouillon et conserve les valeurs personnelles/environnementales telles que calendrier préféré, groupe d’attente, dossier de sauvegarde, couleurs de comptes et activation des boîtes. L’utilisateur doit encore cliquer sur Enregistrer.

La passe navigateur finale a révélé qu’un contrôle encore déclaré par le registre (`moveToWaitingOnReply`) avait disparu du HTML lors de la réorganisation : l’initialisation entière des Options échouait. Le contrôle a été restauré et la garde statique vérifie désormais le contrat dans les deux sens, HTML vers registre et registre vers HTML. Le scénario Playwright exerce 99 réglages persistants avec les actifs de production et une API synthétique.

`@fluentui/web-components` 3.0.3 a été évalué puis retiré : aucun fichier de l’extension ne l’importait, le build XPI n’a pas de bundler, le paquet exige Node 22/24 alors que le dépôt conserve Node 20 dans sa matrice, et son arbre n’apportait donc aucun composant au produit livré. La consolidation garde le langage Fluent 2 local, sans dépendance npm runtime ni lockfile.

### Banc Thunderbird

Le workflow `.github/workflows/thunderbird-smoke.yml` télécharge un binaire Thunderbird officiel et geckodriver, vérifie leurs empreintes, construit l’XPI, prépare un profil local synthétique, installe temporairement l’extension, contrôle le background MV3 et l’injection, désinstalle, contrôle le nettoyage puis réinstalle. Le 8 août 2026, ce cycle a réussi sur Thunderbird **153.0.1 ESR** Linux : `Startup: Complete`, un panneau, un bouton, nettoyage complet puis réinjection unique. Le banc a auparavant détecté un crash réel `ExtensionError is not defined`, corrigé par un import explicite depuis `ExtensionUtils.sys.mjs` et protégé par une garde. Cette preuve ne couvre pas la matrice fournisseurs/OS/versions.

### Outillage UI Codex

La source de vérité visuelle demeure `docs/UI_SPEC.md`; aucun `PRODUCT.md` ou `DESIGN.md` concurrent n’est nécessaire. Le skill global Impeccable 4.0.4 pilote l’UX/UI produit et ses finitions, UI UX Pro Max sert à la recherche de système, et `design-taste-frontend` à une direction artistique explicitement demandée. Le hook projet est silencieux sur les résultats propres, limité aux fichiers UI modifiés et réserve sa passe profonde à la fin de session.

Diagnostiquer l’environnement avec `npx skills ls -g` et le hook avec `node C:\Users\ussma\.agents\skills\impeccable\scripts\hook-admin.mjs status`. Pour une mise à jour, vérifier d’abord le dépôt officiel, la version et les écritures prévues ; utiliser `npx skills update -g` pour les sources suivies et l’installateur officiel Impeccable avec le fournisseur Codex explicite.

## État 1.3.0

- schéma SQLite : 5 ; schéma paramètres/données : 7 ;
- compatibilité déclarée : Thunderbird 128.0 à 153.* ;
- permission WebExtension : `menus` uniquement ;
- notes : 4 000 caractères maximum ; checklist : 50 éléments de 240 caractères maximum ; vues enregistrées : 30 maximum ;
- recherche globale limitée aux métadonnées déjà accessibles, jamais au corps ou aux pièces jointes ;
- synchronisation tags désactivée par défaut et propriété stricte ;
- synchronisation Agenda dépendante des capacités du fournisseur ;
- détection fournisseurs par domaine exact ou sous-domaine légitime ;
- aucune migration de stockage, nouvelle permission ou dépendance runtime ajoutée par cette consolidation.

## Commandes obligatoires

```bash
npm run check
npm test
npm run build
npm run ci
```

Tests ciblés de la consolidation :

```bash
python tests/test_thunderbird_compatibility_boundary.py
node tests/thunderbird_compatibility_contract.mjs
python tests/test_recommended_options_ux.py
python tests/test_thunderbird_test_bench.py
```

## Définition de terminé

- working tree propre et version publique inchangée tant qu’aucune release n’est décidée ;
- tests, scans de secrets et builds reproductibles verts ;
- frontière Thunderbird vérifiée sans réintroduction d’accès direct ;
- Options Recommandé/Avancé cohérentes en FR/EN et sans migration silencieuse ;
- README, changelog de développement, état projet, registre, architecture, sécurité et handoff à jour ;
- aucune permission, URL distante d’exécution, dépendance runtime ou schéma nouveau non justifié ;
- résultat du smoke runtime décrit honnêtement : vert réel ou limite documentée, jamais supposé ;
- aucune fusion `main`, aucun tag et aucune release avant la revue Codex puis l’autorisation de l’utilisateur.
