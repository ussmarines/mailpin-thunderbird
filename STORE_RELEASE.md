# Publication MailPerch 1.5.4

## Identité

- **Nom :** MailPerch
- **Nom complet :** MailPerch — Email Pins & Follow-up
- **Version publique :** 1.5.4
- **Sous-titre FR :** Épinglez, organisez et suivez vos e-mails dans Thunderbird.
- **Subtitle EN:** Pin, organize and follow up on your emails in Thunderbird.
- **Auteur public :** ussmarines
- **Identifiant permanent :** `pin-mails@MailPerch.local`
- **Compatibilité déclarée :** Thunderbird 153.0 à 153.*
- **Licence :** MailPerch Source-Available License 1.1

L’identifiant propre au produit doit conserver exactement la même casse et ne plus être modifié après signature ou publication.

## État de préparation

MailPerch 1.5.4 corrige les défauts observés pendant la recette de 1.5.3 : géométrie des règles Options, Agenda planifiable avant création, toggle d’attente, relance sans réponse configurable, épinglage canonique entre entrées et responsive du panneau fondé sur son conteneur réel. La passe finale centralise aussi les transitions workflow, empêche les faux succès Dashboard après échec de rafraîchissement et gère explicitement l’absence de calendrier compatible avec les tâches. Les nouvelles créations Agenda démarrent sur **Événement**.

La recette utilisateur finale du XPI 1.5.4 est verte. La PR #33 a été fusionnée par squash dans `main`; les workflows GitHub Actions **QA** et **Thunderbird runtime smoke** sont verts sur le commit intégré. Aucune nouvelle permission, dépendance runtime, connexion réseau, télémétrie, publicité, migration de stockage ou modification d’identité n’est introduite.

La **publication GitHub 1.5.4 est autorisée et prête**. La soumission Add-ons for Thunderbird reste une action distincte et manuelle : seul le portail ATN et ses reviewers peuvent valider ou refuser la publication. Avant l’envoi ATN, le propriétaire doit terminer les cases manuelles de `docs/ATN_RELEASE_CHECKLIST.md`, confirmer que support et politique de confidentialité sont accessibles publiquement, puis tester les fournisseurs/systèmes restant hors preuve.

## Livrables GitHub / ATN

Le workflow `Release` exécute `npm run ci`, puis publie :

- `dist/MailPerch_v1.5.4.xpi` — extension ;
- `dist/MailPerch_GitHub_Repository_v1.5.4.zip` — sources complètes pour review ;
- `dist/SHA256SUMS.txt` — empreintes des deux archives ;
- `release/ATN_REVIEW_NOTES_TEMPLATE.md` — informations de test et justification de l’Experiment ;
- `release/BUILD_INSTRUCTIONS.md` — reproduction exacte du build.

Le build Linux final de `main` avant la préparation documentaire a produit un XPI SHA-256 `13de009d165ea6eb33ef4319be22a0731dfe317cab0d409272c6cd92919e54ff`, identique octet pour octet au build Linux de la PR. Les sommes publiées par `SHA256SUMS.txt` dans la release restent la référence définitive.

## Informations de fiche ATN

### Description courte FR

Épinglez, organisez et suivez vos e-mails importants dans Thunderbird avec portée par comptes, notes, sous-tâches, rappels, vues, Agenda et tableau de bord local.

### Short description EN

Pin, organize, and follow up on important email in Thunderbird with account scoping, notes, subtasks, reminders, saved views, Calendar integration, and a local dashboard.

### Confidentialité

MailPerch ne transmet aucune donnée. Aucun corps complet de message ni contenu de pièce jointe n’est copié dans sa base. Voir `PRIVACY.md`.

### Permission privilégiée

L’API Experiment `pinInbox` est nécessaire pour intégrer le panneau dans `about:3pane`, résoudre les messages déplacés, utiliser SQLite, écouter les changements de dossiers, gérer les tags MailPerch et créer/synchroniser des tâches ou événements Agenda. Cette API explique l’avertissement d’accès complet affiché par Thunderbird.

## Blocages externes restant pour ATN

- validation manuelle complète Windows, Linux et macOS sur les versions Thunderbird réellement annoncées ;
- validation des fournisseurs/comptes réels restant au plan ATN ;
- création/accès au compte développeur et soumission dans le portail Add-ons for Thunderbird ;
- décision finale des reviewers ATN.
