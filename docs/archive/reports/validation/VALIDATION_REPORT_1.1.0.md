# Rapport de validation MailPerch 1.1.0

Date : 4 août 2026

## Périmètre

Validation de la version 1.1.0 construite depuis le projet fourni, basé sur le commit GitHub de référence `a1e26bee9400279109b447cc80b90b24913b8bca`, avec l’intégration des fonctions de productivité demandées.

## Fonctions couvertes

- suivi automatique des réponses et relances sans réponse ;
- mise en veille réelle et réveil ;
- vue Aujourd’hui ;
- revue quotidienne ou hebdomadaire ;
- actions groupées avec sélection par plage ;
- centre de rappels interactif ;
- capture rapide depuis un message ;
- aperçu des règles avant enregistrement ou activation ;
- personnalisation et sauvegarde des raccourcis ;
- détection et fusion contrôlée des éléments associés.

## Contrôles automatisés

| Contrôle | Résultat |
|---|---|
| Cohérence du dépôt, versions et documentation | Réussi |
| Analyse structurelle profonde | Réussi |
| Scan de secrets | Réussi |
| Contrat du schéma Experiment | Réussi |
| Syntaxe JavaScript/MJS | Réussi |
| Validation JSON | Réussi |
| Localisation FR/EN et accessibilité statique | Réussi |
| Modèles Aujourd’hui, Revue, veille, rappels et fusion | Réussi |
| Régressions UI, Agenda, stockage et cycle de vie | Réussi |
| Sécurité 3.2.4 et contrôles 1.1.0 | Réussi |
| Build XPI et archive source reproductibles | Réussi |
| Inspection des fichiers nécessaires dans les archives | Réussi |

## Sécurité et confidentialité

- permission WebExtension : `menus` uniquement ;
- CSP : `connect-src 'none'` ;
- aucun appel réseau, code distant, secret ou télémétrie ;
- aucune primitive `eval`, `Function`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `XMLHttpRequest`, `WebSocket` ou `fetch` dans le code d’exécution ;
- actions groupées bornées à 500 références ;
- fusion bornée à 50 références et limitée aux identités fortes communes ;
- conflits Agenda distincts refusés ;
- aucune fusion, suppression, transmission ou envoi automatique déclenché par une suggestion.

## Packaging

Le build utilise les fichiers suivis du dépôt ainsi qu’une allowlist explicite des nouveaux fichiers 1.1.0. Il ne parcourt pas librement le répertoire de travail. Les archives n’incluent ni `.git`, ni profil Thunderbird, ni cache, ni artefact historique imbriqué.

## Limites de cette validation

Les tests automatisés ne remplacent pas une session graphique Thunderbird réelle. Restent à valider localement :

- rendu et interactions dans une liste de messages virtualisée ;
- comptes IMAP réels et détection des réponses selon les fournisseurs ;
- calendriers utilisés sur le poste de test ;
- conflits éventuels de raccourcis avec le système ou d’autres extensions ;
- thèmes clair/sombre, zoom 200 % et matrice Windows/Linux/macOS ;
- comportement aux limites de la plage Thunderbird déclarée.

La matrice détaillée est disponible dans `docs/MANUAL_TEST_PLAN.md`.
