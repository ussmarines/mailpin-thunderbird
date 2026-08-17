# Instructions de build pour les reviewers — MailPin 1.7.2

## État

La release GitHub **1.7.1** est publiée. La source **1.7.2** est une candidate corrective UI/navigation ; elle doit encore franchir ses gates de release et n’est pas présentée comme publiée.

## Environnement

- Ubuntu 24.04 ou système équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git uniquement pour travailler depuis un checkout Git ou lancer les contrôles d’historique.

**Git n’est pas requis pour reproduire le build depuis l’archive source reviewer extraite.** La CI de référence et la comparaison binaire utilisent Node.js 24 et Python 3.12. Aucune dépendance npm/Python tierce n’est installée.

## Reproduction depuis le dépôt

À la racine du checkout candidate :

```bash
npm run ci
```

Livrables attendus :

```text
dist/MailPin_v1.7.2.xpi
dist/MailPin_GitHub_Repository_v1.7.2.zip
dist/SHA256SUMS.txt
```

## Reproduction depuis l’archive reviewer

Après génération de l’archive candidate, extraire cette archive dans un répertoire neuf **sans dossier `.git`**, puis exécuter exactement :

```bash
npm run ci
```

Quand les métadonnées Git sont absentes, le garde de sécurité du tree et le build utilisent exclusivement `.mailpin-source-files.json`. Les chemins absolus, traversées `..`, doublons, symlinks ou fichiers absents sont refusés. Le contrôle `python .github/scripts/security_guard.py --history` reste réservé à un checkout Git.

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript/CSS n’est minifié, transpilé, concaténé, généré ou obfusqué. Les entrées ZIP sont triées avec horodatages fixes.

## Portée 1.7.2

La candidate corrige la stabilité de navigation et plusieurs compositions Dashboard/Options. Elle n’ajoute aucune permission, dépendance runtime, migration, schéma, accès réseau, télémétrie, publicité ou code distant.

## Gate release / reviewer

Avant publication de 1.7.2 :

1. QA Linux/Windows et garde sécurité/identité PASS sur le candidat exact ;
2. smoke Thunderbird réel PASS sur le candidat exact ;
3. `npm run ci` PASS dans le dépôt puis depuis une extraction neuve sans `.git` ;
4. XPI reproductible et structure vérifiée ;
5. merge sur `main` puis workflow Release depuis ce commit ;
6. empreintes finales des assets publiés vérifiées et consignées.

Les preuves PR #47 (`32024824818` QA, `32024824756` smoke) démontrent le runtime corrigé avant versionnement ; elles ne remplacent pas les gates exacts de la source 1.7.2.
