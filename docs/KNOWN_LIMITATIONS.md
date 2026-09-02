# Limites connues — MailPin

## Source 1.7.7 / release publique 1.7.6

La source **1.7.7** est candidate et la release publique **1.7.6** reste la référence publiée. La candidate restaure le chargement de l’Experiment sur Thunderbird 155.0 après le durcissement des sous-scripts privilégiés.

- compatibilité candidate : Thunderbird 153.0 à 155.* ;
- head pré-versionnement 1.7.7 : QA et smoke réel Thunderbird 155.0 PASS ; candidate versionnée exacte à revalider avant publication ;
- le scénario multi-fenêtre Thunderbird distinct n’a pas été isolé comme gate séparé lors de la correction initiale ; l’idempotence des chemins startup, panneau et toggle a été validée ;
- Agenda reste facultatif et dépend des capacités réelles du calendrier ;
- fournisseurs réseau et calendriers distants restent des validations distinctes ;
- aucune nouvelle permission, migration, dépendance runtime ou connexion réseau n’est introduite ;
- la vérification indépendante par téléchargement des assets publics et de leurs SHA n’a pas pu être exécutée depuis le connecteur utilisé pour cette finalisation.
