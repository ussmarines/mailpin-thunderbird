# Instructions de build pour les reviewers — MailPin 1.7.10

Artefact XPI attendu : `MailPin_v1.7.10.xpi`. La release GitHub **1.7.9** est publiée ; 1.7.10 est candidate.

## Environnement

- Ubuntu 24.04 ou équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git uniquement pour un checkout ou les contrôles d’historique.

**Git n’est pas requis** pour reproduire le build depuis l’archive source extraite. Aucune dépendance npm/Python tierce n’est installée.

## Reproduction

Dans un checkout de la source MailPin 1.7.10 ou dans l’archive reviewer extraite sans `.git` :

```bash
npm run ci
```

Livrables :

```text
dist/MailPin_v1.7.10.xpi
dist/MailPin_GitHub_Repository_v1.7.10.zip
dist/SHA256SUMS.txt
```

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript/CSS n’est minifié, transpilé, concaténé, généré ou obfusqué.

## Portée et preuves

La 1.7.10 conserve le runtime métier validé en 1.7.9 et ne modifie que la version source, la borne de compatibilité et le binaire de smoke. La compatibilité Thunderbird 157.0.1 reste en attente jusqu’aux PASS exacts de la candidate puis du target `main`. Aucun résultat futur n’est présenté comme acquis.
