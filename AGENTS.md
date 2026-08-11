# AGENTS.md — MailPerch

Ce dépôt contient une MailExtension Thunderbird Manifest V3 avec une API Experiment privilégiée.

**Ordre de lecture obligatoire pour économiser le contexte :**

1. `MAILPERCH_AI_RULES.md` — gouvernance IA, économie de tokens, choix modèle/puissance et règles Git ;
2. `docs/IDENTITY_MIGRATION_REQUIRED.md` — décision canonique et historique de l’identifiant ;
3. `PROJECT_MEMORY.md` — état courant, carte complète et procédures ;
4. `docs/AI_VALIDATION_STATE.json` — dernières preuves de validation encore potentiellement réutilisables ;
5. `docs/CODEX_HANDOFF.md` — objectif et périmètre de la branche active ;
6. `docs/BUG_TRACKER.md` — bugs ouverts, corrigés et validations réelles restantes ;
7. `docs/THUNDERBIRD_COMPATIBILITY.md` uniquement si la frontière Thunderbird est touchée ;
8. le fichier `AGENTS.md` le plus proche de la zone modifiée ;
9. `docs/SUPERPOWERS_POLICY.md` uniquement si Superpowers est explicitement demandé ou si une tâche complexe/risquée peut en tirer une valeur matérielle ; ne pas le charger pour les micro-tâches ;
10. uniquement les fichiers spécialisés indiqués par la mémoire.

En cas de contradiction sur l’identité de l’extension, `docs/IDENTITY_MIGRATION_REQUIRED.md`, `extension/manifest.json` et `docs/PROJECT_STATE.json` sont prioritaires sur les anciennes mentions conservées dans la mémoire historique.

## But du produit

Afficher des messages épinglés dans un panneau distinct au-dessus de la liste native, sans filtrer ni déplacer la liste « Tous les messages ». Les épingles, notes, workflows, rappels et données Agenda restent locales.

## Invariants non négociables

1. Ne jamais modifier les compteurs natifs de nouveaux messages ou de non-lus.
2. Ne jamais marquer un message lu/non lu lors d’un simple épinglage.
3. Un clic sur une carte doit afficher le message sans faire défiler la liste native.
4. Aucun réseau, télémétrie, publicité, code distant ou dépendance CDN.
5. Aucun `eval`, `new Function`, `innerHTML`, `outerHTML` ou HTML construit avec des métadonnées de courrier.
6. Ne jamais stocker le corps des messages ni le contenu des pièces jointes.
7. L’identifiant canonique et sensible à la casse est `pin-mails@MailPerch.local`. Toute modification future doit mettre à jour dans le même changement Git le manifeste, les métadonnées de publication, l’état projet, la documentation et les tests listés dans `docs/IDENTITY_MIGRATION_REQUIRED.md`.
8. Le tableau de bord doit être ouvert par le background via `tabs.create`; l’Experiment émet `onDashboardRequested`.
9. Les écritures SQLite doivent rester incrémentales, transactionnelles et sérialisées.
10. Toute écoute, minuterie, feuille de style, menu et nœud injecté doit être nettoyé dans `onShutdown`/`cleanup`.
11. Toute entrée de page ou de sauvegarde est non fiable : borne, valide et normalise avant un sink privilégié.
12. Aucun rôle `admin`, secret client, chemin de fichier arbitraire ou autorisation fondée sur le DOM.
13. Lire `docs/SECURITY_BOUNDARY.md` avant toute modification de l’API Experiment, des imports ou du stockage.
14. Ne pas contourner `PinCompatibility` pour les opérations Messages, Tags ou Agenda déjà extraites.
15. Le mode Recommandé ne sauvegarde jamais automatiquement et ne doit pas écraser les choix propres au profil.

## Validation différentielle et économie de contexte

- Commencer par l’état Git réel puis le diff ; ne pas relire tout le dépôt par défaut.
- Consulter `docs/AI_VALIDATION_STATE.json` avant de relancer un contrôle déjà exécuté.
- Réutiliser une preuve verte uniquement si aucun chemin ou environnement qui l’invalide n’a changé et qu’aucun nouveau signal ne la remet en cause.
- Ne jamais enregistrer comme validé un test qui n’a pas réellement été exécuté ou vérifié dans GitHub.
- Après une modification, lancer d’abord les contrôles les plus ciblés ; réserver une passe complète au jalon final ou à un changement transversal qui la justifie.
- Mettre à jour le registre avec la dernière preuve utile uniquement ; ne pas en faire un historique croissant.
- Avant chaque prompt destiné à Codex, appliquer `MAILPERCH_AI_RULES.md` et afficher séparément le modèle GPT-5.6 recommandé et la puissance avant le prompt.
- Ne jamais utiliser Codex Security par défaut. Si les outils standards ne permettent pas de conclure sur une question de sécurité précise, demander l’autorisation explicite de l’utilisateur avant une analyse Codex Security strictement ciblée.

## Routage UI/UX

- Les invariants MailPerch, l’intégration Thunderbird et `docs/UI_SPEC.md` restent prioritaires sur tout skill global.
- Pour une tâche UI produit, audit, polish, responsive ou accessibilité, utiliser `impeccable` comme skill principal.
- Utiliser `ui-ux-pro-max` seulement pour explorer une direction ou un design system, et `design-taste-frontend` seulement pour un redesign artistique explicitement demandé.
- Charger le minimum de skills nécessaire ; ne pas empiler les trois pour une modification localisée.
- Le hook Impeccable reste différentiel : règles mécaniques après une édition UI, passe profonde à l’arrêt, sorties propres silencieuses via `.impeccable/config.json`.
- `awesome-design-md` et `awesome-design-skills` sont des catalogues à la demande, jamais des installations globales complètes. `img2threejs` n’est ni installé ni requis.

## Superpowers

- Ce dépôt opte explicitement pour le plugin Superpowers installé globalement dans Codex, mais uniquement selon `docs/SUPERPOWERS_POLICY.md`.
- `AGENTS.md`, `MAILPERCH_AI_RULES.md`, les documents canoniques spécialisés et les invariants MailPerch restent prioritaires sur les comportements génériques de Superpowers.
- La règle générique d’auto-invocation systématique de Superpowers est explicitement restreinte : la disponibilité d’un skill ne suffit pas à justifier son utilisation.
- Une tâche simple ou localisée ne doit pas déclencher automatiquement brainstorming, plan formel, worktree, TDD complet, sous-agents, reviewer séparé ou workflow de fin de branche.
- Utiliser un workflow Superpowers uniquement s’il réduit matériellement l’ambiguïté, le risque ou le coût total d’une tâche réellement complexe.
- Réutiliser les validations encore valides de `docs/AI_VALIDATION_STATE.json` et conserver la validation différentielle ; Superpowers ne justifie jamais de retester les surfaces inchangées.
- Superpowers ne donne aucune permission supplémentaire pour Git/GitHub, Codex Security, les dépendances, le réseau, les permissions Thunderbird ou les opérations de release.

## Secrets, identité et agents

- Lire et appliquer `SECURITY_PRODUCTION_RULES.md` avant toute opération touchant la configuration, la CI, la production, une release ou des credentials.
- Ne jamais ouvrir, afficher, copier ou résumer un `.env`, un fichier de credentials, un coffre, une clé privée ou `~/.codex/auth.json` sans nécessité exacte et autorisation explicite.
- Vérifier les fichiers sensibles par leur chemin, leurs permissions ou leur schéma sans exposer les valeurs.
- Les secrets restent dans un coffre et sont injectés uniquement à l’exécution. Ils ne passent ni dans les prompts, ni dans les arguments de commande, ni dans les logs, artefacts, captures ou rapports.
- Tout secret exposé doit être révoqué ou tourné immédiatement, puis l’incident et sa cause doivent être examinés.
- Utiliser uniquement l’identité publique `ussmarines` et le profil `https://github.com/ussmarines` pour le mainteneur ; l’identifiant technique de l’extension reste indépendant et lié au produit MailPerch.

## Carte rapide

La carte exhaustive est dans `PROJECT_MEMORY.md`. Cette liste ne conserve que les points d’entrée.

- `extension/manifest.json` : manifeste installable.
- `extension/background.js` : API WebExtension publique, menus, commandes, ouverture du dashboard.
- `extension/api/pinInbox/implementation.js` : intégration privilégiée et orchestration.
- `extension/api/pinInbox/modules/compatibility.js` + `thunderbird-*.js` : frontière Messages / Tags / Agenda.
- `extension/api/pinInbox/modules/` : logique métier pure, identité, stockage, workflows et règles.
- `extension/styles/pin.css` : panneau et adaptation des lignes natives.
- `extension/dashboard/` : tableau de bord global.
- `extension/options/` : paramètres et outils de diagnostic.
- `tests/` : modèles, contrats de compatibilité, stockage et gardes anti-régression.
- `.github/workflows/thunderbird-smoke.yml` : smoke sur vrai binaire Thunderbird, distinct de la QA générique.
- `docs/AI_VALIDATION_STATE.json` : cache des validations réutilisables et de leurs conditions d’invalidation.
- `docs/SUPERPOWERS_POLICY.md` : politique opt-in et seuil d’utilisation de Superpowers.
- `docs/` : architecture, sécurité, débogage et validation manuelle.

## Commandes

```bash
npm run check
npm test
npm run build
npm run ci
```

Le XPI est construit dans `dist/`. Aucun outil de compilation externe n’est requis.

## Ordre de modification recommandé

1. Reproduire le problème dans un profil Thunderbird de test si le comportement dépend de Thunderbird.
2. Identifier le diff et la plus petite surface affectée.
3. Ajouter ou renforcer le test de modèle/statique le plus ciblé si nécessaire.
4. Modifier la plus petite surface possible.
5. Lancer d’abord les tests ciblés affectés ; ne pas relancer ceux dont la preuve reste valide.
6. Lancer `npm run ci` une seule fois au jalon final si la portée de la tâche le justifie.
7. Tester manuellement uniquement les scénarios pertinents de `docs/MANUAL_TEST_PLAN.md` lorsqu’une preuve réelle Thunderbird est nécessaire.
8. Mettre à jour `docs/AI_VALIDATION_STATE.json` avec les contrôles réellement exécutés, puis `docs/BUG_TRACKER.md` / `docs/CODEX_HANDOFF.md` seulement si leur contenu doit réellement changer.

## Zones à haut risque

- `_setupAbout3Pane()` : DOM interne Thunderbird, clics, menu contextuel, drag-and-drop.
- `PinStructuredStore` : concurrence, migrations et récupération.
- `_resolveReference()` et conversations : Gmail/IMAP/copies/déplacements.
- `PinCompatibility` et `thunderbird-*.js` : évolution des API internes, listeners, ACL et propriété des tags.
- `.github/workflows/thunderbird-smoke.yml` / `tests/thunderbird/real_smoke.py` : compatibilité du banc avec le binaire réel.
- observateurs Agenda et dossiers : boucles, doublons et nettoyage.
- règles automatiques : limite d’actions et anti-boucle.

## Définition de « terminé »

Une correction n’est pas considérée terminée sur la seule base de contrôles statiques. Il faut indiquer explicitement quels tests Thunderbird réels ont été exécutés lorsque la surface exige une preuve runtime. Ne jamais affirmer qu’un comportement graphique fonctionne sans l’avoir observé dans Thunderbird. La restitution doit distinguer les tests exécutés, les preuves réutilisées car encore valides et les contrôles non relancés.

## Navigation structurelle

- Pour une architecture transversale, un chemin d'appel, des relations multi-modules, une analyse d'impact ou une zone inconnue, utiliser le skill projet `graphify` seulement s'il économise des lectures ; ne pas l'invoquer pour une petite tâche déjà localisée.
- Graphify fournit une carte, jamais la preuve finale : vérifier le code avec la recherche et la lecture directes avant toute modification ou conclusion.
- Graphify complète `PROJECT_MEMORY.md`, Brain et `mailperch-project-knowledge`. Ne pas activer strict mode, hook ou watcher ; garder `graphify-out/` local et régénérable.
- Les règles canoniques Headroom compression-only et l'échelle de simplicité sont dans `MAILPERCH_AI_RULES.md`.

<!-- BEGIN brain.md -->
## Project Brain

This project keeps a **Project Brain** complementary to the canonical MailPerch sources. Its priority is below the current user instruction, observed Git/GitHub state, `MAILPERCH_AI_RULES.md`, this `AGENTS.md`, and canonical MailPerch documents. Read `./BRAIN.md` for the scoped read/write contract.

Use it selectively:
- First verify Git and the diff, then read the MailPerch rules; load Brain only when a durable decision relevant to the task's scope may matter.
- Record only a durable, hard-to-reconstruct decision, constraint, requirement, or rationale. Never store transient Git/GitHub state, CI or test evidence, releases, bugs, TODOs, or ordinary implementation detail.
- All reads and writes go through the `brain` CLI — never hand-edit brain files.
- Do not run `brain-bootstrap` by default; do not install a Brain pre-commit hook without explicit approval.

The brain skills (`brain-setup`, `brain-page`, `brain-ingest`, `brain-bootstrap`) are installed in your global skills directory.
<!-- END brain.md -->
