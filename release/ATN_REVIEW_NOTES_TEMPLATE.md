# Notes pour les reviewers ATN — MailPin 1.7.8

## Statut

- **Dernière release GitHub publique :** 1.7.7
- **Source candidate :** 1.7.8
- **Version :** 1.7.8
- **Soumission ATN :** à préparer séparément de la release GitHub si souhaitée

## Identité

- **Nom :** MailPin — Email Follow-up & Productivity
- **Longueur du nom :** 40 caractères
- **ID :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 155.*
- **Permission WebExtension :** `menus` uniquement

## Correctif 1.7.7

Thunderbird 155.0 durcit le chargement des sous-scripts privilégiés et refuse par défaut les URI `jar:`, `file:` et `moz-extension:` via `loadSubScript()`. MailPin charge ses modules Experiment depuis l’XPI ; le démarrage échouait donc avec `Trying to load untrusted URI` avant l’injection du panneau.

MailPin utilise désormais `loadSubScriptWithOptions` avec `allowUnsafeURL: true` uniquement pour la liste fixe `MODULE_PATHS` résolue sous `context.extension.rootURI`. Aucune entrée API, donnée mail ou URL utilisateur ne construit ce chemin.

Aucune permission, migration, dépendance runtime, télémétrie, publicité, connexion réseau ou code distant n’est ajouté. `PinCompatibility`, les schémas, le stockage et le comportement lu/non-lu sont inchangés.

## Build et validation

Voir `release/BUILD_INSTRUCTIONS.md`. La commande reviewer est `npm run ci` depuis l’archive source extraite.

La candidate versionnée `94ce4d2656df8eb9694ce794743b82c00d83e8a9` a passé la QA `33688297275` et le smoke réel Thunderbird 155.0 `33688296968`. Après intégration, `main` `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` a passé la QA `33689155033` et le smoke réel Thunderbird 155.0 `33689155048`. Le workflow Release `33689378381` a publié `v1.7.7` depuis ce commit.

XPI public : SHA-256 `ec80836aebcb972d8148063cd4035df836e5e66a663003e7785146a7d798ce4e`.

## Test rapide

1. Installer le XPI 1.7.7 dans Thunderbird 155.0.
2. Confirmer le chargement du panneau et du toggle Quick Filter sans erreur `Trying to load untrusted URI`.
3. Épingler plusieurs messages, fermer complètement Thunderbird puis le relancer sans cliquer sur MailPin.
4. Confirmer que le panneau et les épingles persistées apparaissent automatiquement sans ouvrir le Dashboard.
5. Confirmer une seule instance du panneau et du bouton Quick Filter.
6. Ouvrir ensuite le Dashboard et confirmer un seul onglet.
7. Épingler/désépingler et confirmer l’absence de modification lu/non-lu ou compteurs natifs.
8. Désinstaller/réinstaller et confirmer le nettoyage puis l’injection unique.

Voir `PRIVACY.md`, `SECURITY.md`, `SECURITY_AUDIT_1.7.7.md` et `release/BUILD_INSTRUCTIONS.md`.
