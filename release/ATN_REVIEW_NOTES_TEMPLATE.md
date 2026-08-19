# Notes pour les reviewers ATN — MailPin 1.7.4

## Statut

- **Release GitHub publique actuelle :** 1.7.3
- **Source candidate :** 1.7.4
- **Version :** 1.7.4
- **Soumission ATN :** non effectuée

## Identité

- **Nom :** MailPin — Email Follow-up & Productivity for Thunderbird
- **Version :** 1.7.4
- **ID :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 154.*
- **Permission WebExtension :** `menus` uniquement

## Correctif 1.7.4

- extension de `strict_max_version` de `153.*` à `154.*` afin de rétablir l’installation avec Thunderbird 154 ;
- smoke runtime déplacé sur le binaire officiel Thunderbird 154.0 ;
- aucune modification de logique métier, `PinCompatibility`, stockage, schéma ou identité.

Aucune permission, migration, dépendance runtime, télémétrie, publicité, connexion réseau ou code distant n’est ajoutée.

## Réseau, données et code

- `connect-src 'none'` et aucun appel réseau runtime ;
- aucune télémétrie, publicité ou code distant ;
- aucun corps complet de message ni pièce jointe copié ;
- aucune dépendance runtime/build tierce ;
- source non minifiée et build reproductible.

Voir `PRIVACY.md`, `SECURITY.md`, `SECURITY_AUDIT_1.7.4.md` et `release/BUILD_INSTRUCTIONS.md`.

## Preuves pré-versionnement

- head `3e1943f2be7a18ebcceef5952810675442e91a33` ;
- QA Linux/Windows + garde sécurité `32299537328` — PASS ;
- smoke Thunderbird 154.0 réel `32299537485` — PASS.

## Gates avant publication / soumission

- QA et smoke 154 sur le head exact versionné 1.7.4 ;
- merge PR et workflow Release ;
- vérification des SHA-256 des artefacts publiés ;
- avant ATN, `npm run ci` depuis une extraction neuve de l’archive source publiée sans `.git`.

## Test rapide

1. Installer le XPI dans Thunderbird 154.0 et confirmer qu’il est accepté.
2. Confirmer l’injection unique du panneau et du bouton Quick Filter.
3. Ouvrir le Dashboard depuis le panneau et confirmer un seul onglet.
4. Épingler/désépingler et confirmer l’absence de modification lu/non-lu ou compteurs natifs.
5. Désinstaller/réinstaller et confirmer le nettoyage puis l’injection unique.

Aucune recette humaine non exécutée n’est présentée comme PASS.
