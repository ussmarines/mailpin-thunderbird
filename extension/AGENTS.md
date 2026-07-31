# AGENTS.md — Runtime WebExtension

> Contexte global : lire `PROJECT_MEMORY.md` à la racine avant ce fichier.

Ce dossier est exactement le contenu placé à la racine du XPI.

## Règles

- Ne pas ajouter de dépendance distante, CDN, télémétrie ou requête réseau.
- Toutes les pages doivent rester compatibles avec la CSP du manifeste.
- Utiliser `textContent`, `createElement` et des attributs normalisés ; ne jamais injecter de HTML provenant des messages.
- Les pages non privilégiées appellent uniquement l’API `messenger.pinInbox` décrite par le schéma.
- Tout nouveau fichier utilisé à l’exécution doit être ajouté aux contrôles de `scripts/check_repo.py` et aux tests statiques.
- L’interface publique doit conserver les thèmes clair/sombre, le clavier, le contraste forcé et la réduction des animations.

## Validation minimale

```bash
npm run ci
```

Puis tester dans Thunderbird avec `docs/MANUAL_TEST_PLAN.md`.
