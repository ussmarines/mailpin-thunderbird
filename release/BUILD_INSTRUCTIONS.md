# Instructions de build pour les reviewers

## Environnement

Le build 1.5.1 est conçu pour l’environnement reviewer standard et a besoin uniquement de :

- Ubuntu 24.04 ou système équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git.

La CI du projet utilise Node.js 24 et Python 3.12. Aucune dépendance npm ou Python tierce n’est installée : les scripts reposent uniquement sur Python et Node fournis par l’environnement.

## Reproduction

Depuis la racine de l’archive source :

```bash
npm run ci
```

Cette commande exécute les contrôles du dépôt, le scan de secrets, les tests statiques et de modèles, les tests SQLite, les gardes UI/compteurs, puis deux constructions comparées pour vérifier la reproductibilité.

Les fichiers produits sont :

```text
dist/MailPerch_v1.5.1.xpi
dist/MailPerch_GitHub_Repository_v1.5.1.zip
dist/SHA256SUMS.txt
```

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript ou CSS n’est minifié, transpilé, concaténé, généré ou obfusqué. Les fichiers sont triés et les horodatages ZIP sont fixes afin de permettre une comparaison binaire.

Le packaging sélectionne exclusivement les fichiers suivis par Git ou listés dans `.mailperch-source-files.json` dans l’archive reviewer. Un profil Thunderbird, une sauvegarde, un export, un secret local ou un fichier ignoré ne peut donc pas être inclus accidentellement.
