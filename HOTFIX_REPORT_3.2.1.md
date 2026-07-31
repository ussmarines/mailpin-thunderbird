# Correctif MailPerch 3.2.1

Base GitHub : `main` au commit `387f1ab86aa3ec699e98388ac9f93b585b7e8072` (3.2.0).

## Incidents corrigés

- tableau de bord inutilisable à cause de l’accès à une section inexistante `#list` ;
- menu de message ambigu et dupliqué ;
- absence d’action rapide pour retirer une épingle de son groupe ;
- lignes générales trop serrées et indication des nouveaux messages trop discrète.

## Choix techniques

- table explicite `VIEW_SECTION_IDS` avec validation de présence des sections ;
- un seul système de menu de messages, basé sur `messenger.menus` ;
- état de sélection enrichi pour distinguer le message et la conversation ;
- retrait du groupe par l’action groupée existante avec `groupId: ""` ;
- styles fondés sur les états natifs `data-properties~="unread"` et `data-properties~="new"`.

## Validation

Exécuter `npm run ci`, puis suivre la section 3.2.1 de `docs/MANUAL_TEST_PLAN.md`.
