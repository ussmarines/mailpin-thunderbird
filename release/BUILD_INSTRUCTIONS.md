# Instructions de build pour reviewers

Prérequis : Python 3.11+ et Node.js 20+. Aucun téléchargement de dépendance npm ou Python n’est nécessaire : les contrôles utilisent uniquement la bibliothèque standard Python et Node fourni par l’environnement.

```bash
npm run ci
```

Cette commande exécute : contrôles du dépôt, détection de secrets, tests statiques et de modèles, test SQLite, gardes UI/compteurs et build reproductible.

Le XPI résultant se trouve dans `dist/`. Le contenu de `extension/` est placé directement à la racine du XPI. Aucun fichier d’exécution n’est minifié, transpilé, généré ou obfusqué. Les fichiers sont triés et les timestamps ZIP sont fixes pour permettre une reproduction binaire.
