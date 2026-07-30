# Modèle de données

## Référence épinglée

Une référence contient notamment :

- `stableKey` : clé interne de l’extension ;
- identifiants Message-ID, Gmail et signature de secours ;
- compte, dossier, clé locale et dernier emplacement connu ;
- objet, auteur, date et taille ;
- mode message/conversation ;
- note, groupe, affaire, priorité ;
- échéance, rappel, relance et récurrence ;
- statut de workflow et dates d’activité ;
- identifiants Agenda ;
- `updatedAt` pour la résolution de concurrence.

Le corps du message et les pièces jointes ne sont pas stockés.

## Tables structurées

- `refs` : références épinglées ;
- `groups_data` : groupes personnalisés ;
- `rules_data` : règles ;
- `cases_data` : affaires ;
- `templates` : modèles ;
- `ui_state` : ordre, panneau et dashboard ;
- `activity` et `rule_log` : journaux bornés ;
- `undo_log` : pile d’annulation bornée ;
- `snapshots`/métadonnées : récupération et révision.

## Identité d’un message

Ordre de préférence : identifiant Gmail, Message-ID normalisé, compte+dossier+clé, puis empreinte de secours. Une conversation privilégie le fil Gmail, la racine de `References`, le `threadId`, puis une signature prudente. L’objet seul n’est qu’un dernier recours.

## Migrations

Les migrations doivent :

1. créer une sauvegarde préalable ;
2. être transactionnelles ;
3. conserver l’ancien identifiant d’extension ;
4. être reprenables après interruption ;
5. ne jamais supprimer les données non reconnues sans journaliser le choix.
