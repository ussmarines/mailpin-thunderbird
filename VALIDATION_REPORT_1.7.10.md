# Rapport de validation — MailPin 1.7.10

## Résultat

**PASS — publiée.** MailPin 1.7.10 est validé pour Thunderbird 153.0 à 157.*.

## Preuves

- candidate exacte `565f565710da6262d7a91bfbe280a943047cdc6c` : QA `37213680870` PASS ; smoke réel Thunderbird 157.0.1 `37213680824` PASS ;
- `main` / cible du tag `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0` : QA `37213779632` PASS ; smoke réel Thunderbird 157.0.1 `37213779633` PASS ;
- CodeQL post-merge `37213779727` PASS ;
- workflow canonique Release `37214354533` : build/vérification/publication PASS ;
- XPI public SHA-256 `fc0cc2ada46cce977de9ba8594b79d8f9ba065dc810be329455f998e3c729b62` ;
- archive source SHA-256 `ecb990f72cf44c880fb4e6f819f185cd6f477dd55525bed907332627fa266e94` ;
- `SHA256SUMS.txt` asset SHA-256 `b213b5dc7f6fa8dc89812ccb838db7889ca143915df5523689e6eb011d7f8744`.

Aucun changement métier `pinInbox`, permission, schéma, stockage, dépendance runtime ou réseau n’a été nécessaire pour Thunderbird 157.
