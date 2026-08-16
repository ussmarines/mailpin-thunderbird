# Instructions de build pour les reviewers — candidat 1.7.1

## État

La source courante est **1.7.1** ; la dernière release publique est **1.7.1**. Ce document décrit comment reproduire les artefacts issus du candidat 1.7.1 désormais publié.

## Environnement

- Ubuntu 24.04 ou système équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git.

La CI utilise Node.js 24 et Python 3.12. Aucune dépendance npm/Python tierce n’est installée.

## Reproduction

```bash
npm run ci
```

Livrables :

```text
dist/MailPin_v1.7.1.xpi
dist/MailPin_GitHub_Repository_v1.7.1.zip
dist/SHA256SUMS.txt
```

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript/CSS n’est minifié, transpilé, concaténé, généré ou obfusqué. Les entrées ZIP sont triées avec horodatages fixes. L’archive reviewer sélectionne uniquement les fichiers suivis (ou la liste bornée générée `.mailpin-source-files.json`) et exclut profils, sauvegardes, secrets et fichiers ignorés.
