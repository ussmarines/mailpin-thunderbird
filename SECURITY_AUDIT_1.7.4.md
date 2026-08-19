# Audit de sécurité — MailPin 1.7.4

## Périmètre

MailPin 1.7.4 est une maintenance de compatibilité Thunderbird. Le changement runtime se limite à étendre `strict_max_version` de `153.*` à `154.*`; la logique métier, l’Experiment API, les adaptateurs `PinCompatibility`, le stockage et les permissions restent inchangés. Le banc runtime est déplacé sur le binaire officiel Thunderbird 154.0 afin que cette compatibilité soit démontrée et non supposée.

## Invariants

- Manifest V3 local ;
- ID `ussmarines.mailpin@addons.thunderbird.net` inchangé ;
- permission WebExtension `menus` uniquement ;
- `connect-src 'none'` ;
- aucune télémétrie, publicité, CDN ou code distant ;
- aucun corps complet ni pièce jointe stocké ;
- aucune nouvelle dépendance runtime/build tierce ;
- aucune migration ni modification de schéma ;
- `PinCompatibility` et les adaptateurs Thunderbird sont inchangés.

## Preuves pré-versionnement

Head exact `3e1943f2be7a18ebcceef5952810675442e91a33` de la PR #52 :

- QA Linux/Windows, garde sécurité/identité et CI complète : `32299537328` — PASS ;
- smoke sur le binaire officiel Thunderbird 154.0 : `32299537485` — PASS ;
- téléchargement Thunderbird et geckodriver vérifiés par SHA-256 dans le workflow ;
- aucune correction de logique MailPin n’a été nécessaire pour obtenir le PASS 154.

## Gate de candidate versionnée

La candidate MailPin 1.7.4 doit repasser la QA complète et le smoke Thunderbird 154 sur son head exact après le changement de version et de documentation. Ces contrôles ne sont pas déclarés PASS avant leur exécution.

Codex Security n’est pas utilisé.
