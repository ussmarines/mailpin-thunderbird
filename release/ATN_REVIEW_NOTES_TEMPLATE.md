# Notes pour les reviewers ATN — MailPin 1.7.3

## Statut

- **Release GitHub publique actuelle :** 1.7.2
- **Candidate source :** 1.7.3
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

## Preuves pré-versionnement

PR #49 head `caee1248495f8ba88e5f398b0dc9ff8db6711b8e` : QA `32027919000` PASS et smoke Thunderbird réel `32027918991` PASS ; squash `ed54686f64626c37d5d38236ebcda8ec8e94a094`.

La candidate versionnée 1.7.3 doit repasser QA, garde sécurité, build reproductible et smoke Thunderbird réel avant publication.

## Test rapide

1. Ouvrir Dashboard/Options et confirmer qu’aucune ressource `interaction-stability.css` n’est chargée.
2. Vérifier l’espacement Agenda, Règles et Centre de santé.
3. Modifier un réglage et vérifier la lisibilité de **Annuler** en thème sombre et clair.
4. Tester Enregistrer/Annuler, navigation Options et Plus de statistiques à plusieurs zooms.
5. Épingler/désépingler et confirmer l’absence de modification lu/non-lu ou compteurs natifs.

Aucune recette visuelle humaine non exécutée n’est présentée comme PASS.
