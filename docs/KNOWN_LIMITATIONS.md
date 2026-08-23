# Limites connues — MailPin

## Source 1.7.6 / release publique 1.7.5

La source **1.7.6** est une candidate de maintenance. La release publique **1.7.5** reste la dernière version publiée tant que les gates exacts 1.7.6 ne sont pas terminés.

- compatibilité revendiquée : Thunderbird 153.0 à 154.* ;
- 1.7.6 corrige le chargement des épingles persistées au cold start via `runtime.onStartup` ;
- le correctif a été reproduit et validé sur Thunderbird 154.0 réel avant le versionnement 1.7.6, mais la candidate versionnée doit repasser le smoke exact avant publication ;
- le scénario multi-fenêtre Thunderbird distinct n’a pas été isolé comme gate séparé lors de la correction initiale ; l’idempotence des chemins startup, panneau et toggle a été validée ;
- Agenda reste facultatif et dépend des capacités réelles du calendrier ;
- fournisseurs réseau et calendriers distants restent des validations distinctes ;
- aucune nouvelle permission, migration, dépendance runtime ou connexion réseau n’est introduite.
