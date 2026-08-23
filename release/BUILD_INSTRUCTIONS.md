# Instructions de build pour les reviewers — MailPin 1.7.6

## État

La release GitHub **1.7.5** est publiée. La source **1.7.6** est une candidate de maintenance pour le correctif de chargement des épingles au démarrage et conserve la compatibilité Thunderbird 153.0–154.*.

## Environnement

- Ubuntu 24.04 ou équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git uniquement pour un checkout ou les contrôles d’historique.

**Git n’est pas requis** pour reproduire le build depuis l’archive source extraite. Aucune dépendance npm/Python tierce n’est installée.

## Reproduction

Dans un checkout de la source MailPin 1.7.6 ou dans l’archive reviewer extraite sans `.git` :

```bash
npm run ci
```

Livrables :

```text
dist/MailPin_v1.7.6.xpi
dist/MailPin_GitHub_Repository_v1.7.6.zip
dist/SHA256SUMS.txt
```

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript/CSS n’est minifié, transpilé, concaténé, généré ou obfusqué.

## Portée 1.7.6

La 1.7.6 corrige le cold start des épingles persistées. Le background Manifest V3 enregistre `runtime.onStartup` et initialise les onglets mail existants via le chemin `setup` idempotent. Le banc Thunderbird ne réactive plus artificiellement l’onglet mail après redémarrage et exige le rendu automatique sans Dashboard ni interaction.

La version n’ajoute aucune permission, dépendance runtime, migration, schéma, réseau, télémétrie, publicité ou code distant. `PinCompatibility` et le stockage restent inchangés.

## Preuves avant versionnement

- correctif runtime PR #64 head `26fc0ac9b4d35009f125f543eefc5de9338bef71` : QA `32639780333` — PASS ;
- même head : smoke réel Thunderbird 154.0 `32639780313` — PASS ;
- cold start réel sans Dashboard : PASS ;
- merge dans `main` : `fa6782f8ecfaf259d9b8e54a08e5cf361172c669`.

Les QA/build, smoke Thunderbird 154.0, build reviewer hors `.git` et SHA-256 officiels de la candidate 1.7.6 seront consignés uniquement après exécution sur le head versionné exact. Aucun résultat futur n’est présenté ici comme PASS.
