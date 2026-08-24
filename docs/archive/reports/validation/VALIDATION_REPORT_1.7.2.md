# Rapport de validation — MailPin 1.7.2

## Verdict courant

**CANDIDATE — gates de release en cours.** MailPin 1.7.2 n’est pas encore déclaré publié. La dernière release publique reste 1.7.1.

## Objectif

La 1.7.2 corrige les problèmes UI/navigation observés dans les captures et la vidéo du 17 août 2026, sans modifier la logique métier ou les frontières privilégiées.

## Corrections couvertes

- Dashboard : contrôle « Plus de statistiques » stable à l’ouverture ;
- Options : navigation active déterministe sur les longues sections ;
- Options : Enregistrer/Annuler et notifications maintenus dans le viewport ;
- Options : espacement explicite entre groupes indépendants ;
- Agenda : noms longs et badges de capacité sans collision ;
- Raccourcis : action d’enregistrement clairement séparée ;
- responsive, focus et réduction du mouvement préservés ;
- tests Organic Workspace étendus pour ces régressions.

## Validation déjà obtenue avant versionnement

Sur le head exact PR #47 `551841858e974482f046a1980e52cfc84be71a6c` :

| Gate | Preuve | Résultat |
|---|---|---|
| QA Linux/Windows + garde sécurité | run `32024824818` | PASS |
| Thunderbird runtime smoke réel | run `32024824756` | PASS |
| Merge squash UI | `5284e39a43513d38ededec5e7f939a685f7fdd2c` | PASS |

Deux échecs intermédiaires du harness Node ont été utilisés comme information de boucle : `URL` puis `document.querySelector` manquaient dans le DOM minimal de `tests/theme_bridge.mjs`. La correction finale fait du chargement de la feuille de stabilité une opération optionnelle dans les environnements sans DOM complet, tout en la chargeant normalement dans Thunderbird. La QA finale et le smoke ont ensuite été verts.

## Gates candidate 1.7.2 exacte

| Gate | État |
|---|---|
| versions/métadonnées source 1.7.2 cohérentes | EN COURS |
| `npm run ci` Linux | À EXÉCUTER |
| contrôles source/modèle Windows | À EXÉCUTER |
| garde sécurité/identité | À EXÉCUTER |
| build reproductible / XPI | À EXÉCUTER |
| smoke Thunderbird réel | À EXÉCUTER |
| source reviewer `npm run ci` sans `.git` | À EXÉCUTER avant dossier reviewer final |
| merge release sur `main` | À EXÉCUTER après gates |
| workflow Release `v1.7.2` | À EXÉCUTER après merge |
| vérification assets/hashes publiés | À EXÉCUTER après release |

## Validation différentielle

Les changements métier, stockage, migrations, permissions, tags, logique Agenda, sauvegardes et réseau ne sont pas modifiés. Le focus de validation fraîche reste donc UI Dashboard/Options, packaging, métadonnées de release et smoke Thunderbird. Les preuves historiques restent réutilisables pour les zones inchangées.

## Validation humaine

La recette visuelle humaine post-correction n’est pas encore enregistrée comme exécutée. Le smoke Thunderbird est une preuve runtime réelle mais ne remplace pas une inspection esthétique pixel par pixel. Cette limite reste explicitement ouverte avant une éventuelle soumission ATN.

Codex Security n’est pas utilisé.
