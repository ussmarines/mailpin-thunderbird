# Modèle de données

## Référence épinglée

Une référence contient notamment :

- `stableKey` : clé interne de l’extension ;
- identifiants Message-ID, Gmail et signature de secours ;
- compte, dossier, clé locale et dernier emplacement connu ;
- objet, auteur, date et taille ;
- mode message/conversation ;
- note, groupe, affaire, modèle et priorité ;
- échéance, rappel, relance et récurrence ;
- statut de workflow et dates d’activité ;
- `noReplyTracking`, `noReplyAt`, `noReplyStartedAt` et empreinte de départ pour le suivi sans réponse ;
- identifiants Agenda et éventuelle erreur de synchronisation ;
- `updatedAt` pour la résolution de concurrence.

Le corps du message et les pièces jointes ne sont pas stockés.

## Tables et collections structurées

- `refs` : références épinglées ;
- `groups_data` : groupes personnalisés ;
- `rules_data` : règles ;
- `cases_data` : affaires ;
- `templates` : modèles ;
- `ui_state` : ordre, panneau, vue intelligente et dashboard ;
- `providerMatrix` : dernier résultat local de compatibilité des comptes/calendriers ;
- `activity`, `rule_log` et diagnostic : journaux bornés ;
- `undo_log` : pile d’annulation bornée ;
- snapshots/métadonnées : récupération, révision et santé.

## Identité d’un message

Ordre de préférence : identifiant Gmail, Message-ID normalisé, compte+dossier+clé, puis empreinte de secours. Une conversation privilégie le fil Gmail, la racine de `References`, le `threadId`, puis une signature prudente. L’objet seul n’est qu’un dernier recours.

## Vues intelligentes

Les vues sont calculées à partir des références et de l’état résolu du message. Elles ne dupliquent pas les références dans le stockage. Les compteurs sont dérivés au chargement à partir des échéances, statuts, réponses, erreurs Agenda, état lu/non lu et messages introuvables.

## Migrations et restaurations

Le schéma logique courant est 6. Une migration ou restauration doit :

1. valider format, version, collections, limites et clés ;
2. créer une sauvegarde préalable obligatoire ;
3. afficher les volumes et conflits avant écriture ;
4. être transactionnelle et reprenable après interruption ;
5. fusionner les entités par identifiant et horodatage ou remplacer explicitement ;
6. conserver l’ancien identifiant d’extension ;
7. ne jamais supprimer silencieusement les données non reconnues.
