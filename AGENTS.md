# AGENTS.md — MailPerch

Ce dépôt contient une MailExtension Thunderbird Manifest V3 avec une API Experiment privilégiée.

**Ordre de lecture obligatoire pour économiser le contexte :**

1. `docs/IDENTITY_MIGRATION_REQUIRED.md` — décision canonique et historique de l’identifiant ;
2. `PROJECT_MEMORY.md` — état courant, carte complète et procédures ;
3. `docs/AI_VALIDATION_STATE.json` — dernières preuves de validation encore potentiellement réutilisables ;
4. `docs/CODEX_HANDOFF.md` — objectif et périmètre de la branche active ;
5. `docs/BUG_TRACKER.md` — bugs ouverts, corrigés et validations réelles restantes ;
6. `docs/THUNDERBIRD_COMPATIBILITY.md` uniquement si la frontière Thunderbird est touchée ;
7. le fichier `AGENTS.md` le plus proche de la zone modifiée ;
8. uniquement les fichiers spécialisés indiqués par la mémoire.

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
- Ne jamais utiliser Codex Security par défaut. Si les outils standards ne permettent pas de conclure sur une question de sécurité précise, demander l’autorisation explicite de l’utilisateur avant une analyse Codex Security strictement ciblée.

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
