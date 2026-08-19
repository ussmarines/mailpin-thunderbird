# Préparation MailPin 1.7.4

## État

- **Version source :** 1.7.4 — candidate
- **Dernière release publique :** 1.7.3
- **Dernière publication :** `v1.7.3`, commit `814e07adc82f0a1b19051c83fbb0fec6a22836b0`
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité candidate :** Thunderbird 153.0 à 154.*

## Portée 1.7.4

La 1.7.4 rétablit l’installation sur Thunderbird 154 en étendant `strict_max_version` à `154.*` et déplace le smoke runtime sur le binaire officiel Thunderbird 154.0. Aucun code métier ni adaptateur `PinCompatibility` n’a dû être modifié pendant la validation pré-versionnement.

Aucune permission WebExtension, migration, schéma, stockage, dépendance runtime, connexion réseau, télémétrie, publicité, code distant ou identité n’est modifié.

## Preuves pré-versionnement

Head exact `3e1943f2be7a18ebcceef5952810675442e91a33` :

- QA Linux/Windows + garde sécurité `32299537328` — PASS ;
- smoke Thunderbird 154.0 réel `32299537485` — PASS.

Ces preuves établissent la compatibilité technique avant le bump de version mais ne remplacent pas les gates du head versionné 1.7.4.

## Artefacts attendus

- `MailPin_v1.7.4.xpi` ;
- `MailPin_GitHub_Repository_v1.7.4.zip` ;
- `SHA256SUMS.txt`.

Les tailles et SHA-256 ne seront consignés qu’après le workflow Release ; aucune empreinte n’est inventée à l’avance.

## Gates de publication

- [ ] QA Linux/Windows sur la candidate 1.7.4 exacte ;
- [ ] garde sécurité/identité sur la candidate ;
- [ ] build reproductible et structure XPI ;
- [ ] smoke Thunderbird 154.0 réel sur la candidate exacte ;
- [ ] merge PR release sur `main` ;
- [ ] workflow Release depuis `main` ;
- [ ] `v1.7.4` publique et empreintes des artefacts vérifiées.

La recette visuelle humaine et la soumission ATN restent distinctes des preuves automatisées et ne sont pas déclarées comme exécutées si elles ne l’ont pas été.

Codex Security n’est pas utilisé.
