# Rapport de validation — MailPerch 1.2.0

Date : 7 août 2026
Statut : **validation automatisée locale terminée — validation GitHub et Thunderbird réelle à compléter**

## Validation automatisée locale

La 1.2.0 ajoute des gardes dédiées aux notes/checklists, vues enregistrées, recherche globale, états de réponse, statistiques, tags Thunderbird, palette de commandes, typographie et migrations.

Résultats obtenus sur la branche locale :

- `npm run check` : **OK** ;
- toutes les commandes de `npm test` : **OK** ;
- `python tests/test_build_reproducible.py` : **OK** ;
- `node tests/model_tests.mjs` : **OK** ;
- `python tests/sqlite_model_tests.py` : **OK** ;
- `npm run build` : **OK** ;
- `git diff --check` : **OK** ;
- garde sécurité sur l’historique Git complet : **OK**, aucun finding ;
- accessibilité/localisation : **731 chaînes UI WebExtension, 244 chaînes UI privilégiées, 807 messages localisés** ;
- registre Options : **101 contrôles statiques** ;
- contrat DOM dashboard : **55 identifiants référencés**.

La commande agrégée `npm run ci` commence correctement mais dépasse la limite de temps d’un appel de cet environnement pendant la suite de tests. Pour ne pas masquer un éventuel échec, les mêmes commandes ont été rejouées en segments ; chaque segment a réussi.

## Validation fonctionnelle couverte par modèles/gardes

- migration logique vers les schémas paramètres/données 7 ;
- conservation des données 1.1.x et normalisation des nouvelles propriétés ;
- notes jusqu’à 4 000 caractères ;
- checklists bornées à 50 éléments et statistiques de progression ;
- recherche sur objet/auteur/note/sous-tâches/tags/groupes/affaires/états ;
- vues enregistrées et critères fermés ;
- dérivation **J’attends / Je dois répondre** depuis les horodatages entrants/sortants ;
- statistiques de suivi enrichies ;
- synchronisation de tags strictement opt-in, collision bloquante et nettoyage limité aux tags possédés ;
- import durci : synchro tags et Agenda bidirectionnel non réactivés automatiquement ;
- palette de commandes et raccourci global sans remplacement des raccourcis existants ;
- plancher CSS explicite de 12 px et nouvelle pile typographique locale.

## Validation Thunderbird réelle

Aucune nouvelle validation Thunderbird réelle n’est revendiquée depuis cet environnement de travail : aucun exécutable Thunderbird n’y est disponible. Les observations antérieures de la 1.1.x restent historiques et ne sont pas utilisées comme preuve des nouvelles fonctions 1.2.0.

Les scénarios encore requis sont décrits dans `docs/MANUAL_TEST_PLAN.md`, notamment :

- migration 1.1.2 → 1.2.0 dans un profil de test ;
- notes/checklists et vues enregistrées après redémarrage ;
- recherche par chaque type de métadonnée ;
- tags MailPerch, collision volontaire et préservation d’un tag personnel témoin ;
- synchronisation Agenda dans les deux sens ;
- palette de commandes et navigation clavier ;
- états **J’attends / Je dois répondre** avec messages synthétiques ;
- Options/dashboard/panneau à zoom 100/125/200 %, clair/sombre et largeurs étroites ;
- fournisseurs et versions Thunderbird annoncés dans la matrice projet.

## État de publication

Le présent rapport décrit l’état local pré-push. Avant publication de `v1.2.0`, le PR doit obtenir sa CI GitHub verte et les deux workflows de sécurité manuels doivent être exécutés en mode bloquant. Le résultat distant sera vérifié sur le commit exact destiné à `main`.
