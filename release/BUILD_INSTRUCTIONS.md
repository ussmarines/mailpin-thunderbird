# Instructions de build pour les reviewers — MailPin 1.7.3

## État

La release GitHub **1.7.2** est publiée. La source **1.7.3** est une candidate corrective UI.

## Environnement

- Ubuntu 24.04 ou équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git uniquement pour un checkout ou les contrôles d’historique.

**Git n’est pas requis pour reproduire le build depuis l’archive source extraite.** Aucune dépendance npm/Python tierce n’est installée.

## Reproduction

Dans le checkout candidat ou dans une archive reviewer extraite sans `.git` :

```bash
npm run ci
```

Livrables :

```text
dist/MailPin_v1.7.3.xpi
dist/MailPin_GitHub_Repository_v1.7.3.zip
dist/SHA256SUMS.txt
```

Sans `.git`, le garde de sécurité et le build utilisent exclusivement `.mailpin-source-files.json`. Les chemins absolus, traversées `..`, doublons, symlinks et fichiers absents sont refusés. `security_guard.py --history` reste réservé à un checkout Git.

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript/CSS n’est minifié, transpilé, concaténé, généré ou obfusqué.

## Portée 1.7.3

La candidate supprime `interaction-stability.css` et consolide les corrections UI dans `workspace.css`, renforce l’espacement des groupes de réglages et le contraste Annuler. Elle n’ajoute aucune permission, dépendance runtime, migration, schéma, réseau, télémétrie, publicité ou code distant.

## Gates

1. QA Linux/Windows + garde sécurité sur le candidat exact ;
2. smoke Thunderbird réel sur le candidat exact ;
3. build reproductible et structure XPI ;
4. merge PR release vers `main` ;
5. workflow Release depuis `main` ;
6. vérification des assets et SHA-256 publiés ;
7. avant ATN, `npm run ci` depuis une extraction neuve de l’archive source publiée sans `.git`.

La preuve runtime pré-versionnement est PR #49 : QA `32027919000`, smoke `32027918991`, tous deux PASS.
