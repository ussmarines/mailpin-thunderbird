# Instructions de build pour les reviewers — MailPin 1.7.1

## État

La release GitHub **1.7.1** est publiée ; la soumission Add-ons for Thunderbird (ATN) est en préparation.
La source reviewer ATN corrigée a été régénérée après les correctifs de reproductibilité hors Git et validée depuis une extraction neuve.

L’archive source publiée avec la release GitHub 1.7.1 reste un artefact historique du commit de release.
Elle reste distincte de la source reviewer ATN corrigée qui a franchi le gate d’extraction hors Git ci-dessous.

## Environnement

- Ubuntu 24.04 ou système équivalent ;
- Python 3.11+ ;
- Node.js 20+ et npm 10+ ;
- Git uniquement pour travailler depuis un checkout Git ou lancer les contrôles d’historique.

**Git n’est pas requis pour reproduire le build depuis l’archive source reviewer extraite.**
La CI de référence et la comparaison binaire exacte utilisent Node.js 24 et Python 3.12. Aucune dépendance npm/Python tierce n’est installée.

## Reproduction depuis l’archive reviewer

Extraire l’archive dans un répertoire neuf, sans y ajouter de dossier `.git`, puis exécuter à sa racine :

```bash
npm run ci
```

Quand les métadonnées Git sont absentes, le garde de sécurité du tree et le build utilisent exclusivement la liste bornée
`.mailpin-source-files.json` embarquée dans l’archive. Aucun parcours large du système de fichiers ne doit remplacer ce fallback borné.

Le contrôle d’historique `python .github/scripts/security_guard.py --history` est réservé à un checkout Git et n’appartient pas à la commande reviewer `npm run ci`.

Livrables :

```text
dist/MailPin_v1.7.1.xpi
dist/MailPin_GitHub_Repository_v1.7.1.zip
dist/SHA256SUMS.txt
```

Le contenu de `extension/` est placé directement à la racine du XPI. Aucun JavaScript/CSS n’est minifié, transpilé, concaténé, généré ou obfusqué. Les entrées ZIP sont triées avec horodatages fixes.

## Gate ATN

Preuves obtenues depuis une extraction neuve de la source reviewer corrigée :

1. `npm run ci` termine avec succès sans `.git` ;
2. sous Python 3.12, le XPI reconstruit correspond exactement au XPI GitHub 1.7.1 ;
3. les documents reviewer inclus distinguent la release GitHub de la soumission ATN encore non effectuée ;
4. l’inventaire et les empreintes du pack ATN régénéré correspondent au contenu réel.
