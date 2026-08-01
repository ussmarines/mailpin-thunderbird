# Instructions de build pour reviewers

Prérequis : Python 3.11+ et Node.js 20+. Aucun téléchargement de dépendance npm ou Python n’est nécessaire : les contrôles utilisent uniquement la bibliothèque standard Python et Node fourni par l’environnement.

```bash
npm run ci
```

Cette commande exécute : contrôles du dépôt, détection de secrets, tests statiques et de modèles, test SQLite, gardes UI/compteurs et build reproductible.

Le XPI résultant se trouve dans `dist/`. Le contenu de `extension/` est placé directement à la racine du XPI. Aucun fichier d’exécution n’est minifié, transpilé, généré ou obfusqué. Les fichiers sont triés et les timestamps ZIP sont fixes pour permettre une reproduction binaire.

Le packaging sélectionne exclusivement les fichiers suivis par Git : un profil
Thunderbird, une sauvegarde, un export ou un secret local ignoré ne peut donc
pas entrer dans le XPI ni dans le ZIP source. Le ZIP source embarque la liste
des fichiers sélectionnés afin que cette même frontière reste applicable après
extraction, sans répertoire `.git`.
