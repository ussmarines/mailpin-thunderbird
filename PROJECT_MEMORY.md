# Mémoire opérationnelle — MailPerch

> Version publique : **1.1.2**
> Branche de référence : `main`
> Correctif source : `ac74f188adf9832d2e164a73d418a9e47967bfcd`
> Extension ID : `pin-mails@MailPerch.local`

## Résumé

MailPerch est une extension Thunderbird Manifest V3 locale qui ajoute un panneau de messages épinglés, des suivis, rappels, vues Aujourd’hui/Revue, groupes, affaires, règles, Agenda et un dashboard. La version 1.1.2 corrige le vide responsive du panneau et la bande orange d’un centre de rappels vide.

## Invariants non négociables

1. Aucun appel réseau, aucune télémétrie, publicité ou ressource distante.
2. Ne jamais modifier indirectement les compteurs natifs ou l’état lu lors d’un épinglage.
3. Ne jamais stocker le corps complet des messages ni les pièces jointes.
4. Toute entrée de l’Experiment est bornée et normalisée.
5. SQLite reste transactionnel, incrémental et sérialisé.
6. Les ressources injectées, observateurs et timers sont nettoyés.
7. Les actions destructives restent confirmées et les imports automatisés sont neutralisés.
8. L’identité publique reste `ussmarines`; aucune donnée personnelle ne doit être réintroduite.

## Carte complète des fichiers

- manifeste : `extension/manifest.json`
- background : `extension/background.js`
- schéma Experiment : `extension/api/pinInbox/schema.json`
- implémentation privilégiée : `extension/api/pinInbox/implementation.js`
- paramètres : `extension/options/options.html`
- dashboard : `extension/dashboard/dashboard.html`
- mémoire projet : `PROJECT_MEMORY.md`
- frontière de sécurité : `docs/SECURITY_BOUNDARY.md`
- registre des bugs : `docs/BUG_TRACKER.md`
- état machine : `docs/PROJECT_STATE.json`

## Où modifier quoi

- panneau, menus natifs et cycle Thunderbird : `extension/api/pinInbox/implementation.js`
- apparence du panneau : `extension/styles/pin.css` et `extension/styles/tokens.css`
- logique métier pure : `extension/api/pinInbox/modules/`
- paramètres : `extension/options/`
- dashboard : `extension/dashboard/`
- build et validation : `scripts/`, `tests/`, `.github/workflows/`
- publication et reviewers : `release/`, `STORE_RELEASE.md`, `docs/ATN_RELEASE_CHECKLIST.md`

## État 1.1.2

Le correctif responsive neutralise la base flexible de la recherche quand la barre d’outils passe en colonne, étend le sélecteur de vue à la largeur disponible et impose `display: none` au centre de rappels portant `hidden`. La garde se trouve dans `tests/test_ui_regressions.py`. La validation graphique finale dans Thunderbird réel reste suivie sous `MP-2026-019`.

## Commandes obligatoires

```bash
npm run check
npm test
npm run build
npm run ci
```

## Définition de terminé

- working tree propre et versions synchronisées ;
- tests, scan de secrets et builds reproductibles verts ;
- README, changelog, état projet, registre et documents reviewer à jour ;
- XPI et archive source construits depuis le commit publié ;
- limites manuelles indiquées honnêtement ;
- tag et release GitHub correspondant exactement au commit de `main`.
