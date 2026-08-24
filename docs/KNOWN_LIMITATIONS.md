# Limites connues — MailPin

## Source 1.7.6 / release publique 1.7.6

La source **1.7.6** et la release publique **1.7.6** sont alignées. Cette maintenance corrige le chargement des épingles persistées au cold start via `runtime.onStartup`.

- compatibilité revendiquée : Thunderbird 153.0 à 154.* ;
- candidate versionnée 1.7.6 : QA et smoke réel Thunderbird 154.0 PASS avant publication ;
- le scénario multi-fenêtre Thunderbird distinct n’a pas été isolé comme gate séparé lors de la correction initiale ; l’idempotence des chemins startup, panneau et toggle a été validée ;
- Agenda reste facultatif et dépend des capacités réelles du calendrier ;
- fournisseurs réseau et calendriers distants restent des validations distinctes ;
- aucune nouvelle permission, migration, dépendance runtime ou connexion réseau n’est introduite ;
- la vérification indépendante par téléchargement des assets publics et de leurs SHA n’a pas pu être exécutée depuis le connecteur utilisé pour cette finalisation.
