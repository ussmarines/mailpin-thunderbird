# Rapport de validation — MailPin 1.6.0

## Portée

Validation de la migration de marque/identité, du packaging, des locales, des SVG et du design system. Les comportements métier non modifiés réutilisent leurs preuves 1.5.4 tant que leur dépendance n’est pas invalidée.

## Contrôles de la branche

Le workflow de rebranding exécute avant commit :

- contrôles ciblés d’identité/métadonnées ;
- `npm run ci` ;
- `git diff --check`.

La PR vers `main` doit ensuite recevoir les checks GitHub Actions habituels avant squash. Le smoke Thunderbird réel sera relancé si le workflow de PR le déclenche sur la surface modifiée ; sinon la limite sera indiquée dans la release.

## Identité

- produit : MailPin ;
- baseline : Email Follow-up & Productivity for Thunderbird ;
- version : 1.6.0 ;
- ID : `ussmarines.mailpin@addons.thunderbird.net`.
