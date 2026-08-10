# Audit sécurité delta — MailPerch 1.5.2

Date : 2026-08-11
Workflow de validation : `31440019097`

## Portée

1.5.2 ne modifie ni l’API Experiment privilégiée, ni `PinCompatibility`, ni les permissions WebExtension, ni les schémas SQLite/Settings/Data, ni la politique réseau. Les changements produit sont limités au Dashboard local et au CSS du panneau ; le reste concerne le banc de test et la documentation.

## Contrôles exécutés

- garde sécurité du dépôt et scan de secrets via `npm run ci` : réussis ;
- audit structurel et tests de contrats inclus dans `npm run ci` : réussis ;
- QA de branche Linux/Windows avant préparation de version : verte ;
- smoke et banc Thunderbird réels 1.5.2 : réussis sans exception JavaScript MailPerch ;
- aucune nouvelle permission, dépendance runtime, télémétrie, publicité, CDN, code distant ou connexion réseau runtime.

## Contrôles réutilisés car inchangés

L’audit exhaustif 1.5.1 reste applicable aux frontières privilégiées, dépendances, permissions, migrations et stockage, ces chemins n’ayant pas changé dans le delta 1.5.2. Codex Security n’a pas été utilisé et n’était pas nécessaire.

## Conclusion

Aucun élargissement de privilège ou de surface réseau runtime n’est introduit par 1.5.2.
