# Rapport de validation — MailPin 1.7.9

## Résultat

**PASS — publiée.** MailPin 1.7.9 est validé pour Thunderbird 153.0 à 156.*.

## Preuves

- candidate exacte `da9d97a874f5043b43a212d09b9090ad0f77d681` : QA `35224045803` PASS ; smoke réel Thunderbird 156.0 `35224046106` PASS ;
- `main` / cible du tag `46bb9fc27256cc143743e74e4a04fb48d48f6e85` : QA `35224161719` PASS ; smoke réel Thunderbird 156.0 `35224161877` PASS ;
- workflow canonique Release `35224299551` : build/vérification/publication PASS ;
- XPI public SHA-256 `41248fb7f68dde8a7858e5500e008a09248f7c3a4968b045e1f8c2d6d5839fb2` ;
- archive source SHA-256 `b3aef29587f653433dd211dfeb7d077f44832d1b83331de26151c40c334e9397` ;
- `SHA256SUMS.txt` asset SHA-256 `ea5f9801b5d952368290ca2754e8dbc0df3a01133759b594b59c2d812609bcb0`.

Aucun changement métier `pinInbox`, permission, schéma, stockage, dépendance runtime ou réseau n’a été nécessaire pour Thunderbird 156.
