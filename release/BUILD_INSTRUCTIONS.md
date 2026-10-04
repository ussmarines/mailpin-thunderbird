# Instructions de build pour les reviewers — MailPin 1.7.10

Artefact XPI attendu : `MailPin_v1.7.10.xpi`. La release GitHub **1.7.10** est publiée.

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

La 1.7.10 conserve le runtime métier 1.7.9 et étend uniquement la compatibilité à Thunderbird 157. Candidate `565f565710da6262d7a91bfbe280a943047cdc6c` : QA `37213680870`, smoke `37213680824` PASS. Tag `v1.7.10` : cible `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0`, après QA `37213779632`, smoke `37213779633` et CodeQL `37213779727` PASS. Workflow Release `37214354533` PASS.

SHA-256 public du XPI : `fc0cc2ada46cce977de9ba8594b79d8f9ba065dc810be329455f998e3c729b62`.
