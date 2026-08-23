# Notes pour les reviewers ATN — MailPin 1.7.6

## Statut

- **Dernière release GitHub publique :** 1.7.6
- **Source publiée :** 1.7.6
- **Version :** 1.7.6
- **Soumission ATN :** prête à préparer séparément de la release GitHub

## Identité

- **Nom :** MailPin — Email Follow-up & Productivity
- **Longueur du nom :** 40 caractères
- **ID :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 154.*
- **Permission WebExtension :** `menus` uniquement

## Correctif 1.7.6

Après un démarrage complet de Thunderbird, des épingles persistées pouvaient ne pas être rendues dans la boîte mail tant qu’une action MailPin, telle que l’ouverture du Dashboard, n’avait pas réveillé le background Manifest V3. La 1.7.6 enregistre le background sur `runtime.onStartup` et initialise les onglets mail existants via le chemin idempotent déjà utilisé.

Le banc Thunderbird persistant ne provoque plus d’activation artificielle de l’onglet mail et vérifie le cold start sans interaction utilisateur.

Aucune permission, migration, dépendance runtime, télémétrie, publicité, connexion réseau ou code distant n’est ajouté. `PinCompatibility`, les schémas et le stockage sont inchangés.

## Build et validation

Voir `release/BUILD_INSTRUCTIONS.md`. La commande reviewer est `npm run ci` depuis l’archive source extraite.

La candidate versionnée `c502175041c85e3cb6e37666a0784f7df0a9e367` a passé la QA `32640198347` et le smoke réel Thunderbird 154.0 `32640198339`. La release `v1.7.6` cible `522042df08c2eb7a18a13cbb83631943e54abf2c`.

Les SHA-256 publics ne sont pas recopiés ici tant qu’un téléchargement indépendant des assets n’a pas été effectué.

## Test rapide

1. Installer le XPI 1.7.6 dans Thunderbird 154.0 et épingler plusieurs messages.
2. Fermer complètement Thunderbird puis le relancer sans cliquer sur MailPin.
3. Confirmer que le panneau et les épingles persistées apparaissent automatiquement sans ouvrir le Dashboard.
4. Confirmer une seule instance du panneau et du bouton Quick Filter.
5. Ouvrir ensuite le Dashboard et confirmer un seul onglet.
6. Épingler/désépingler et confirmer l’absence de modification lu/non-lu ou compteurs natifs.
7. Désinstaller/réinstaller et confirmer le nettoyage puis l’injection unique.

Voir `PRIVACY.md`, `SECURITY.md`, `SECURITY_AUDIT_1.7.6.md` et `release/BUILD_INSTRUCTIONS.md`.
