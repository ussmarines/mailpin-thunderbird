# Instructions de build pour les reviewers — MailPin 1.7.6

## État

La release GitHub **1.7.6** est publiée. La source **1.7.6** correspond à la maintenance du correctif de chargement des épingles au démarrage et conserve la compatibilité Thunderbird 153.0–154.*.

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

## Preuves

- candidate versionnée `c502175041c85e3cb6e37666a0784f7df0a9e367` : QA `32640198347` — PASS ;
- smoke réel Thunderbird 154.0 `32640198339` — PASS ;
- tag `v1.7.6` : cible `522042df08c2eb7a18a13cbb83631943e54abf2c` ;
- le publisher one-shot qui a créé la release exécute `npm run ci` puis reconstruit depuis une archive source fraîche sans `.git` et compare le SHA-256 du XPI avant la publication ;
- la vérification indépendante des fichiers publics après publication reste non consignée car le connecteur disponible ne permet pas leur téléchargement.
