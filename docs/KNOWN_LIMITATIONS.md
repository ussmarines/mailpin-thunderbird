# Limites connues — MailPin

## Source 1.7.8 / release publique 1.7.8

La source **1.7.7** et la release publique **1.7.7** sont alignées. Cette maintenance restaure le chargement de l’Experiment sur Thunderbird 155.0 après le durcissement des sous-scripts privilégiés.

- compatibilité publiée : Thunderbird 153.0 à 155.* ;
- candidate exacte `94ce4d2656df8eb9694ce794743b82c00d83e8a9` : QA `33688297275` et smoke réel Thunderbird 155.0 `33688296968` — PASS ;
- `main` publié `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` : QA `33689155033` et smoke réel Thunderbird 155.0 `33689155048` — PASS ;
- le scénario multi-fenêtre Thunderbird distinct n’a pas été isolé comme gate séparé lors de la correction initiale ; l’idempotence des chemins startup, panneau et toggle a été validée ;
- Agenda reste facultatif et dépend des capacités réelles du calendrier ;
- fournisseurs réseau et calendriers distants restent des validations distinctes ;
- aucune nouvelle permission, migration, dépendance runtime ou connexion réseau n’est introduite ;
- les digests des trois assets publics sont exposés par les métadonnées GitHub de `v1.7.7`; un téléchargement indépendant octet-par-octet des assets n’a pas été consigné comme gate séparé.
