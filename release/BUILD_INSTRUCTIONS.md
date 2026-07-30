# Instructions de build pour reviewers

Prérequis : Python 3.11+ et Node.js 20+. Aucun téléchargement de dépendance npm n’est nécessaire. Les deux aides Python utilisées par le contrôle du dépôt (`beautifulsoup4` et `tinycss2`) sont installées dans la CI ; elles doivent être présentes localement pour `npm run check`.

```bash
npm run ci
```

Cette commande exécute : contrôles du dépôt, détection de secrets, tests statiques et de modèles, test SQLite, gardes UI/compteurs et build reproductible.

Le XPI résultant se trouve dans `dist/`. Le contenu de `extension/` est placé directement à la racine du XPI. Aucun fichier d’exécution n’est minifié, transpilé, généré ou obfusqué. Les fichiers sont triés et les timestamps ZIP sont fixes pour permettre une reproduction binaire.
