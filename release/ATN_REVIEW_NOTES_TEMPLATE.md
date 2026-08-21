# Notes pour les reviewers ATN — MailPin 1.7.5

## Statut

- **Dernière release GitHub publique :** 1.7.4
- **Source candidate :** 1.7.5
- **Version :** 1.7.5
- **Soumission ATN :** à effectuer après publication

## Identité

- **Nom :** MailPin — Email Follow-up & Productivity
- **Version :** 1.7.5
- **ID :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 154.*
- **Permission WebExtension :** `menus` uniquement

## Correctif 1.7.5

Le nom localisé précédent contenait 56 caractères et dépassait la limite ATN de 50 caractères. La 1.7.5 utilise `MailPin — Email Follow-up & Productivity` (40 caractères). Aucun comportement runtime n’est modifié.

Aucune permission, migration, dépendance runtime, télémétrie, publicité, connexion réseau ou code distant n’est ajouté.

## Build

Voir `release/BUILD_INSTRUCTIONS.md`. La commande reviewer est `npm run ci` depuis l’archive source extraite.

## Test rapide

1. Installer le XPI dans Thunderbird 154.0 et confirmer le nom `MailPin — Email Follow-up & Productivity`.
2. Confirmer l’injection unique du panneau et du bouton Quick Filter.
3. Ouvrir le Dashboard depuis le panneau et confirmer un seul onglet.
4. Épingler/désépingler et confirmer l’absence de modification lu/non-lu ou compteurs natifs.
5. Désinstaller/réinstaller et confirmer le nettoyage puis l’injection unique.

Voir `PRIVACY.md`, `SECURITY.md`, `SECURITY_AUDIT_1.7.5.md` et `release/BUILD_INSTRUCTIONS.md`.
