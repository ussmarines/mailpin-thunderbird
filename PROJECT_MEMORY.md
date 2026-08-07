# Mémoire opérationnelle — MailPerch

> Version publique : **1.2.1**
> Branche de maintenance 1.2 : `security/mailperch-1.2.1-codeql-hosts`
> Base GitHub : `main` au commit `85569eaec54971d38aa38b7502b1c62b18136559`
> Extension ID : `pin-mails@MailPerch.local`

## Résumé

MailPerch est une extension Thunderbird Manifest V3 locale qui ajoute un panneau de messages épinglés et transforme ces épingles en suivis actionnables sans remplacer la liste native. La version 1.2.0 ajoute checklists, recherche globale, tags MailPerch facultatifs, vues enregistrées, palette de commandes, états **J’attends / Je dois répondre**, statistiques enrichies et consolide la synchronisation bidirectionnelle Agenda. La version 1.2.1 durcit la détection locale des fournisseurs de messagerie en remplaçant les tests de sous-chaîne de noms d’hôte signalés par CodeQL par des correspondances de domaines à frontière stricte.

## Invariants non négociables

1. Aucun appel réseau, aucune télémétrie, publicité, CDN, police distante ou code distant.
2. Ne jamais modifier indirectement les compteurs natifs ou l’état lu lors d’un épinglage.
3. Ne jamais stocker le corps complet des messages ni le contenu des pièces jointes.
4. Toute entrée de l’Experiment est bornée, normalisée et revalidée côté privilégié.
5. SQLite reste transactionnel, incrémental et sérialisé.
6. Les ressources injectées, observateurs, timers et données gérées sont nettoyés selon leur cycle de vie.
7. Les actions destructives restent confirmées et les imports automatisés sont neutralisés.
8. Les tags personnels Thunderbird ne doivent jamais être renommés ou supprimés ; seuls les tags possédés par MailPerch, reconnus par clé **et** libellé exacts, peuvent être gérés.
9. L’identité publique reste `ussmarines`; aucune donnée personnelle ou secrète ne doit être réintroduite.
10. Aucune permission WebExtension supplémentaire n’est ajoutée sans justification documentée et testée.

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

- panneau, menus natifs, tags et cycle Thunderbird : `extension/api/pinInbox/implementation.js`
- logique métier pure : `extension/api/pinInbox/modules/` (`analytics.js`, `checklists.js`, `saved-views.js`, `tag-sync.js` et modules historiques)
- apparence du panneau : `extension/styles/pin.css` et `extension/styles/tokens.css`
- paramètres : `extension/options/`
- dashboard, recherche, vues et palette : `extension/dashboard/`
- build et validation : `scripts/`, `tests/`, `.github/workflows/`
- publication et reviewers : `release/`, `STORE_RELEASE.md`, `docs/ATN_RELEASE_CHECKLIST.md`

## État 1.2.1

- schéma SQLite : 5 ; schéma paramètres/données : 7 ;
- compatibilité déclarée : Thunderbird 128.0 à 153.* ;
- permission WebExtension : `menus` uniquement ;
- notes : 4 000 caractères maximum ; checklist : 50 éléments de 240 caractères maximum ; vues enregistrées : 30 maximum ;
- recherche globale limitée aux métadonnées MailPerch/Thunderbird déjà accessibles, jamais au corps ou aux pièces jointes ;
- synchronisation tags désactivée par défaut et limitée aux tags `mailperch-*` dont le libellé attendu correspond exactement ;
- synchronisation Agenda bidirectionnelle toujours dépendante des capacités du fournisseur et doit être validée dans Thunderbird réel ;
- interface Options/dashboard basée sur des polices système locales et un plancher typographique de 12 px ;
- détection des fournisseurs limitée à des noms de domaine exacts ou à leurs sous-domaines légitimes ; aucun test de sous-chaîne de type `live.com`/`me.com` n’est accepté.

## Commandes obligatoires

```bash
npm run check
npm test
npm run build
npm run ci
```

## Définition de terminé

- working tree propre et versions synchronisées ;
- tests, scans de secrets et builds reproductibles verts ;
- README, changelog, état projet, registre, licence et documents reviewer à jour ;
- aucune permission, URL distante ou dépendance nouvelle non justifiée ;
- XPI et archive source construits depuis le commit publié ;
- limites manuelles indiquées honnêtement ;
- tag et release GitHub correspondant exactement au commit de `main`.
