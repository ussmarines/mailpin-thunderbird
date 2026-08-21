# Audit de sécurité source — MailPin 1.7.2

## Statut

**Candidate — validation finale en cours.** Ce document décrit la portée sécurité de la source 1.7.2 avant publication. Les gates non encore exécutés ne sont pas présentés comme PASS.

## Portée du changement

MailPin 1.7.2 est une maintenance UI/navigation issue de la recette réelle du 17 août 2026. Les modifications runtime concernent uniquement :

- la stabilité du disclosure de statistiques du Dashboard ;
- le suivi de navigation des Paramètres ;
- la composition Enregistrer/Annuler et des notifications ;
- l’espacement de groupes de réglages ;
- le wrapping des cartes Agenda ;
- la clarté de l’action des raccourcis ;
- les contrats de non-régression correspondants.

Aucune modification n’est apportée aux permissions WebExtension, au schéma de l’Experiment, au stockage SQLite, aux migrations, aux modules métier Messages/Tags/Agenda, aux sauvegardes/imports, à l’identité publique ou aux dépendances runtime.

## Invariants sécurité

- Manifest V3 local ;
- ID `ussmarines.mailpin@addons.thunderbird.net` ;
- permission WebExtension `menus` uniquement ;
- CSP avec `connect-src 'none'` ;
- aucun appel réseau runtime, télémétrie, publicité, CDN, code ou police distante ;
- aucun `eval`, `new Function`, `innerHTML`/`outerHTML` dangereux introduit ;
- aucun corps complet de message ni contenu de pièce jointe stocké ;
- frontières privilégiées `PinCompatibility` inchangées ;
- tags personnels Thunderbird inchangés ;
- stockage SQLite et cycle de vie inchangés.

## Preuves déjà disponibles

Le correctif UI avant versionnement a été validé sur le head exact de la PR #47 (`551841858e974482f046a1980e52cfc84be71a6c`) :

- QA Linux/Windows et garde sécurité : run `32024824818` — PASS ;
- smoke Thunderbird réel : run `32024824756` — PASS ;
- merge squash vers `main` : `5284e39a43513d38ededec5e7f939a685f7fdd2c`.

Un défaut de compatibilité du pont de thème avec le harness Node minimal a été découvert pendant ces checks, corrigé de façon bornée puis revalidé avant merge. Aucun contournement de sécurité n’a été ajouté.

## Gates requis sur le candidat 1.7.2 exact

Avant publication :

- [ ] `npm run ci` PASS ;
- [ ] garde sécurité/identité PASS ;
- [ ] contrôles Linux/Windows PASS ;
- [ ] build reproductible et XPI structurellement valide ;
- [ ] smoke Thunderbird réel PASS sur le head exact de la PR release ;
- [ ] archive reviewer extraite sans `.git` capable d’exécuter `npm run ci` ;
- [ ] empreintes des artefacts définitifs vérifiées après publication.

## Conclusion candidate

Aucune nouvelle frontière de sécurité ni capacité privilégiée n’est introduite par MailPin 1.7.2. Le risque spécifique de cette maintenance est une régression de composition/navigation UI ; il est couvert par des contrats ciblés et doit encore être confirmé sur le candidat versionné par CI et smoke Thunderbird réel. Codex Security n’est pas utilisé.
