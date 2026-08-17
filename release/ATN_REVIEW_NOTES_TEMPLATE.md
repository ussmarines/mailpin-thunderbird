# Notes pour les reviewers ATN — MailPin 1.7.3

## Statut

- **Release GitHub publique actuelle :** 1.7.3
- **Source publiée :** 1.7.3
- **Version :** 1.7.3
- **Soumission ATN :** non effectuée

## Identité

- **Nom :** MailPin — Email Follow-up & Productivity for Thunderbird
- **Version :** 1.7.3
- **ID :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 153.*
- **Permission WebExtension :** `menus` uniquement

## Correctifs 1.7.3

- suppression de la feuille corrective runtime `interaction-stability.css` ;
- consolidation de sa logique utile dans le stylesheet canonique `workspace.css` ;
- espacement structurel renforcé entre les groupes de réglages, notamment Agenda, Règles et Centre de santé ;
- contraste sémantique explicite du bouton Annuler dans la barre de sauvegarde en clair/sombre ;
- conservation des corrections précédentes sur Dashboard, navigation Options, notifications, calendriers et raccourcis.

Aucune permission, migration, schéma, stockage, logique métier, dépendance runtime, télémétrie, publicité, connexion réseau ou identité n’est modifié.

## Réseau, données et code

- `connect-src 'none'` et aucun appel réseau runtime ;
- aucune télémétrie, publicité ou code distant ;
- aucun corps complet de message ni pièce jointe copié ;
- aucune dépendance runtime/build tierce ;
- source non minifiée et build reproductible.

Voir `PRIVACY.md`, `SECURITY.md`, `SECURITY_AUDIT_1.7.3.md` et `release/BUILD_INSTRUCTIONS.md`.

## Preuves de publication

- candidate exacte `a247dc53e3b707335b04ae00b227acad52ddb8b5` ;
- QA Linux/Windows + garde sécurité `32028928653` — PASS ;
- smoke Thunderbird réel `32028928636` — PASS ;
- commit release `814e07adc82f0a1b19051c83fbb0fec6a22836b0` ;
- workflow Release `32031451673` — PASS ;
- release `v1.7.3` publique, non draft, non prerelease ;
- XPI SHA-256 `66a10432457a509b9c9959e3df7bcdd2415d14668284b6104803dfa1d9362bc4` ;
- archive source SHA-256 `ff5999a8b73392b0ad7e6778c69602ddddeeb687a3263d2162b2f93afddaf767` ;
- `SHA256SUMS.txt` SHA-256 `af405970d942b42cbb1d224538795811ddc00ba3cadba3ab9de6e53eea1194e9`.

## Test rapide

1. Ouvrir Dashboard/Options et confirmer qu’aucune ressource `interaction-stability.css` n’est chargée.
2. Vérifier l’espacement Agenda, Règles et Centre de santé.
3. Modifier un réglage et vérifier la lisibilité de **Annuler** en thème sombre et clair.
4. Tester Enregistrer/Annuler, navigation Options et Plus de statistiques à plusieurs zooms.
5. Épingler/désépingler et confirmer l’absence de modification lu/non-lu ou compteurs natifs.

Avant soumission ATN, exécuter encore `npm run ci` depuis une extraction neuve de l’archive source 1.7.3 publiée sans `.git`, puis consigner le résultat. Aucune recette visuelle humaine non exécutée n’est présentée comme PASS.
