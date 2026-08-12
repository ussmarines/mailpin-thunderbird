# Préparation du candidat MailPerch 1.5.4

## Identité

- **Nom :** MailPerch
- **Nom complet :** MailPerch — Email Pins & Follow-up
- **Version publique :** 1.5.3
- **Version candidate locale :** 1.5.4
- **Sous-titre FR :** Épinglez, organisez et suivez vos e-mails dans Thunderbird.
- **Subtitle EN:** Pin, organize and follow up on your emails in Thunderbird.
- **Auteur public :** ussmarines
- **Identifiant permanent :** `pin-mails@MailPerch.local`
- **Compatibilité déclarée :** Thunderbird 153.0 à 153.*
- **Licence :** MailPerch Source-Available License 1.1

L’identifiant propre au produit doit conserver exactement la même casse et ne plus être modifié après signature ou publication.

## État de préparation

Le candidat 1.5.4 corrige les défauts observés pendant la recette manuelle de 1.5.3 : géométrie des règles Options, Agenda planifiable avant création, toggle d’attente, relance sans réponse configurable, épinglage canonique entre entrées et responsive du panneau fondé sur son conteneur réel. Il conserve les permissions, le stockage local, les schémas et l’absence de dépendance runtime ou de connexion réseau.

La preuve runtime 1.5.3 a été invalidée par le delta 1.5.4. Les contrôles réels frais du candidat sont consignés dans `VALIDATION_REPORT_1.5.4.md`; la recette utilisateur des scénarios corrigés reste obligatoire et maintient la readiness à **NO-GO**.

La soumission Add-ons for Thunderbird reste une action manuelle : seul le portail ATN et ses reviewers peuvent valider ou refuser la publication. Avant l’envoi, le propriétaire doit terminer les cases manuelles de `docs/ATN_RELEASE_CHECKLIST.md`, confirmer que support et politique de confidentialité sont accessibles publiquement, puis tester le XPI dans les versions et systèmes annoncés.

## Fichiers à soumettre

Après `npm run ci` :

- `dist/MailPerch_v1.5.4.xpi` — extension à téléverser ;
- `dist/MailPerch_GitHub_Repository_v1.5.4.zip` — sources complètes pour review ;
- `dist/SHA256SUMS.txt` — empreintes des deux archives ;
- `release/ATN_REVIEW_NOTES_TEMPLATE.md` — informations de test et justification de l’Experiment ;
- `release/BUILD_INSTRUCTIONS.md` — reproduction exacte du build.

## Informations de fiche ATN

### Description courte FR

Épinglez, organisez et suivez vos e-mails importants dans Thunderbird avec portée par comptes, notes, sous-tâches, rappels, vues, Agenda et tableau de bord local.

### Short description EN

Pin, organize, and follow up on important email in Thunderbird with account scoping, notes, subtasks, reminders, saved views, Calendar integration, and a local dashboard.

### Confidentialité

MailPerch ne transmet aucune donnée. Aucun corps complet de message ni contenu de pièce jointe n’est copié dans sa base. Voir `PRIVACY.md`.

### Permission privilégiée

L’API Experiment `pinInbox` est nécessaire pour intégrer le panneau dans `about:3pane`, résoudre les messages déplacés, utiliser SQLite, écouter les changements de dossiers, gérer les tags MailPerch et créer/synchroniser des tâches ou événements Agenda. Cette API explique l’avertissement d’accès complet affiché par Thunderbird.

## Blocages externes restants

- validation manuelle complète Windows, Linux et macOS sur les versions Thunderbird réellement annoncées ;
- validation des fournisseurs/comptes réels restant au plan ATN ;
- création/accès au compte développeur et soumission dans le portail Add-ons for Thunderbird ;
- décision finale des reviewers ATN.
