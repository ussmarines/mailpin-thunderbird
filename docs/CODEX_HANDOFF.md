# Passage de relais — MailPin 1.7.10 publiée

## État

- branche : `main` ;
- version source : **1.7.10** ;
- dernière release publique : **1.7.10** ;
- Thunderbird : 153.0 à 157.* ;
- ID : `ussmarines.mailpin@addons.thunderbird.net` ;
- tag/release : `v1.7.10` → `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0`.

## Résultat

MailPin 1.7.10 étend la compatibilité à Thunderbird 157 sans modifier le runtime métier. Candidate `565f565710da6262d7a91bfbe280a943047cdc6c` : QA `37213680870` PASS, smoke Thunderbird 157.0.1 `37213680824` PASS. `main`/tag target `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0` : QA `37213779632`, smoke `37213779633` et CodeQL `37213779727` PASS. Publisher canonique `37214354533` PASS.

Artefacts publics : XPI `fc0cc2ada46cce977de9ba8594b79d8f9ba065dc810be329455f998e3c729b62`, archive source `ecb990f72cf44c880fb4e6f819f185cd6f477dd55525bed907332627fa266e94`, SHA256SUMS asset `b213b5dc7f6fa8dc89812ccb838db7889ca143915df5523689e6eb011d7f8744`.

## Actions GitHub

La QA automatique doit s’exécuter sur les PR et sur les pushes vers `main`, mais pas sur chaque push de branche de travail. Les workflows manuels sécurité, release et banc fonctionnel restent disponibles sans consommer de minutes tant qu’ils ne sont pas déclenchés.

La soumission Add-ons for Thunderbird reste distincte de la release GitHub. La PR #74 et sa branche prototype upstream restent hors de cette maintenance.

Codex Security n’est pas requis.
