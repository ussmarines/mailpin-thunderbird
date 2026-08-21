# Préparation MailPin 1.7.5

## État

- **Version source :** 1.7.5 — candidate
- **Dernière release publique :** 1.7.4
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 154.*

## Portée 1.7.5

La 1.7.5 corrige uniquement la conformité du nom Add-ons for Thunderbird : le nom 1.7.4 embarqué faisait 56 caractères, au-delà de la limite ATN de 50. Le nom devient `MailPin — Email Follow-up & Productivity` (40 caractères).

Aucune logique métier, API Experiment, frontière `PinCompatibility`, permission, migration, schéma, stockage, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant n’est modifié.

## Artefacts attendus

- `MailPin_v1.7.5.xpi` ;
- `MailPin_GitHub_Repository_v1.7.5.zip` ;
- `SHA256SUMS.txt`.

## Gates

- [x] cause ATN reproduite dans la 1.7.4 : nom localisé de 56 caractères ;
- [x] nouveau nom mesuré à 40 caractères ;
- [ ] QA Linux/Windows sur la candidate exacte ;
- [ ] build reproductible et structure XPI ;
- [ ] smoke Thunderbird 154.0 sur la candidate exacte ;
- [ ] merge sur `main` ;
- [ ] release `v1.7.5` et empreintes publiées ;
- [ ] `npm run ci` depuis une extraction neuve de l’archive reviewer publiée sans `.git` ;
- [ ] soumission ATN.
