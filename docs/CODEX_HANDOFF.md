# Passage de relais Codex

## État exact

Produit : **MailPerch — Email Pins & Follow-up**. Build locale : **3.2.0**, ID de développement `pin-mails@MailPerch.local`.

La base distante utilisée pour cette évolution est `main` en **3.1.5**, commit `ecce60f7b8395b6c19b680e3fe8bc38dbcff1a46`. La version 3.2.0 est construite localement et ne doit pas être considérée comme publiée tant qu’un commit/push explicite n’a pas été réalisé.

## Évolution 3.2.0

- vues intelligentes et compteurs calculés localement ;
- actions groupées validées par un module dédié ;
- suivi automatique sans réponse avec annulation sur réponse entrante ;
- centre de santé, diagnostic expurgé et matrice fournisseurs/calendriers ;
- sauvegarde préalable obligatoire, analyse d’import et fusion sûre ;
- cache de cartes, signature de rendu et chargement progressif ;
- paramètres guidés et aérés, navigation groupée, recherche et feedback local ;
- accessibilité clavier, focus restauré, contraste élevé et réduction de mouvement ;
- couverture déclarative FR/EN et localisation du panneau injecté principal ;
- CI Linux/Windows, contrôle des versions et workflow de Release Candidate ;
- zone de punaise de la liste native agrandie et recentrée.

## Modules purs ajoutés

`bulk.js`, `diagnostics.js`, `health.js`, `localization.js`, `migrations.js`, `performance.js`, `providers.js` et `smart.js` ne doivent pas dépendre du DOM Thunderbird. `implementation.js` reste l’orchestrateur privilégié.

## Validation Thunderbird encore obligatoire

1. Clic droit et bouton « Plus d’actions » sur chaque zone d’une carte.
2. Vues intelligentes, sélection multiple et chaque action groupée.
3. Suivi sans réponse après envoi, réponse entrante et redémarrage.
4. Centre de santé, export/effacement du diagnostic et réparations sûres.
5. Prévisualisation puis fusion/remplacement d’une sauvegarde.
6. Comptes IMAP, POP, Gmail, Microsoft, boîte unifiée et dossiers virtuels.
7. Calendriers local, CalDAV, lecture seule, désactivé et incompatible.
8. Paramètres guidés/avancés, recherche, navigation clavier et zoom 200 %.
9. Punaise de la liste native en vues Cartes et Tableau.
10. Deux fenêtres, redémarrage forcé et compteurs natifs inchangés.

## Commande obligatoire

```bash
npm run ci
```

## Invariants

- aucun réseau, CDN, télémétrie ou publicité ;
- aucun stockage du corps des messages ou des pièces jointes ;
- aucune modification des compteurs natifs lu/non lu/nouveau ;
- conservation de l’ID `pin-mails@MailPerch.local`, du stockage SQLite et de la sécurité multi-fenêtre ;
- pas de `innerHTML`, `eval` ou `new Function` ;
- nettoyage des écouteurs, popups, timers et nœuds à l’arrêt ;
- aucune publication distante sans accord explicite.
