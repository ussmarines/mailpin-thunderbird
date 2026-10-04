# Rapport de validation — MailPin 1.7.10

## Portée

Candidate de compatibilité Thunderbird 157 sans changement métier, permission, schéma, stockage, dépendance runtime ou réseau.

## Baseline réutilisée

MailPin 1.7.9 est la baseline publiée Thunderbird 156.0 : candidate `da9d97a874f5043b43a212d09b9090ad0f77d681` QA `35224045803` / smoke `35224046106` PASS ; target `46bb9fc27256cc143743e74e4a04fb48d48f6e85` QA `35224161719` / smoke `35224161877` PASS.

## Gates requis avant publication

- `npm run ci` / QA Linux : en attente ;
- garde sécurité/identité : en attente ;
- checks Windows : en attente ;
- smoke réel Thunderbird 157.0.1 sur head exact : en attente ;
- QA + smoke post-merge sur `main` : en attente ;
- workflow Release v1.7.10 : en attente.

Aucun contrôle non exécuté n’est présenté comme PASS.
