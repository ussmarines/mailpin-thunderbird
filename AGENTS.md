# AGENTS.md — Épingles de messages pour Thunderbird

Ce dépôt contient une MailExtension Thunderbird Manifest V3 avec une API Experiment privilégiée. Lire ce fichier avant toute modification.

## But du produit

Afficher des messages épinglés dans un panneau distinct au-dessus de la liste native, sans filtrer ni déplacer la liste « Tous les messages ». Les épingles, notes, workflows, rappels et données Agenda restent locales.

## Invariants non négociables

1. Ne jamais modifier les compteurs natifs de nouveaux messages ou de non-lus.
2. Ne jamais marquer un message lu/non lu lors d’un simple épinglage.
3. Un clic sur une carte doit afficher le message sans faire défiler la liste native.
4. Aucun réseau, télémétrie, publicité, code distant ou dépendance CDN.
5. Aucun `eval`, `new Function`, `innerHTML`, `outerHTML` ou HTML construit avec des métadonnées de courrier.
6. Ne jamais stocker le corps des messages ni le contenu des pièces jointes.
7. Conserver l’ID `pin-mails@MailPerch.local` pendant les builds de développement afin de préserver les migrations.
8. Le tableau de bord doit être ouvert par le background via `tabs.create`; l’Experiment émet `onDashboardRequested`.
9. Les écritures SQLite doivent rester incrémentales, transactionnelles et sérialisées.
10. Toute écoute, minuterie, feuille de style, menu et nœud injecté doit être nettoyé dans `onShutdown`/`cleanup`.

## Carte rapide

- `extension/manifest.json` : manifeste installable.
- `extension/background.js` : API WebExtension publique, menus, commandes, ouverture du dashboard.
- `extension/api/pinInbox/implementation.js` : intégration privilégiée et orchestration.
- `extension/api/pinInbox/modules/` : identité, stockage, workflow, règles, Agenda.
- `extension/styles/pin.css` : panneau et adaptation des lignes natives.
- `extension/dashboard/` : tableau de bord global.
- `extension/options/` : paramètres et outils de diagnostic.
- `tests/` : modèles, stockage et gardes anti-régression.
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

1. Reproduire le problème dans un profil Thunderbird de test.
2. Ajouter ou renforcer un test de modèle/statique.
3. Modifier la plus petite surface possible.
4. Lancer `npm run ci`.
5. Tester manuellement les scénarios de `docs/MANUAL_TEST_PLAN.md`.
6. Documenter les limites restantes dans `docs/CODEX_HANDOFF.md`.

## Zones à haut risque

- `_setupAbout3Pane()` : DOM interne Thunderbird, clics, menu contextuel, drag-and-drop.
- `PinStructuredStore` : concurrence, migrations et récupération.
- `_resolveReference()` et conversations : Gmail/IMAP/copies/déplacements.
- observateurs Agenda et dossiers : boucles, doublons et nettoyage.
- règles automatiques : limite d’actions et anti-boucle.

## Définition de « terminé »

Une correction n’est pas considérée terminée sur la seule base de contrôles statiques. Il faut indiquer explicitement quels tests Thunderbird réels ont été exécutés. Ne jamais affirmer qu’un comportement graphique fonctionne sans l’avoir observé dans Thunderbird.
