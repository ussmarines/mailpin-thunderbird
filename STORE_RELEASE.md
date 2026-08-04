# Publication de MailPerch 1.1.0

## Identité

- **Nom :** MailPerch
- **Nom complet :** MailPerch — Email Pins & Follow-up
- **Version publique :** 1.1.0
- **Sous-titre FR :** Épinglez, organisez et suivez vos e-mails dans Thunderbird.
- **Subtitle EN:** Pin, organize and follow up on your emails in Thunderbird.
- **Auteur public :** ussmarines
- **Identifiant permanent :** `pin-mails@MailPerch.local`
- **Compatibilité déclarée :** Thunderbird 128.0 à 153.*
- **Licence :** MailPerch Source-Available License 1.0

L’identifiant historique est conservé comme identifiant public permanent afin de ne pas créer une seconde installation ni séparer les données des utilisateurs existants. Il ne doit plus être modifié après la première publication.

## État de préparation

La release candidate 1.1.0 est construite de manière reproductible et les contrôles automatisés du dépôt couvrent la syntaxe, les ressources, les permissions, la CSP, l’absence de réseau, les contrats API, les migrations, les compteurs natifs, l’accessibilité, les modèles JavaScript/SQLite, le scan de secrets et le packaging.

La soumission Add-ons for Thunderbird reste une action manuelle : seul le portail ATN et ses reviewers peuvent valider ou refuser la publication. Avant l’envoi, le propriétaire doit terminer les cases manuelles de `docs/ATN_RELEASE_CHECKLIST.md`, rendre accessibles publiquement la page de support et la politique de confidentialité, puis tester le XPI dans les versions et systèmes annoncés.

## Fichiers à soumettre

Après `npm run ci` :

- `dist/MailPerch_v1.1.0.xpi` — extension à téléverser ;
- `dist/MailPerch_GitHub_Repository_v1.1.0.zip` — sources complètes pour review ;
- `dist/SHA256SUMS.txt` — empreintes des deux archives ;
- `release/ATN_REVIEW_NOTES_TEMPLATE.md` — informations de test et justification de l’Experiment ;
- `release/BUILD_INSTRUCTIONS.md` — reproduction exacte du build.

## Informations de fiche ATN

### Description courte FR

Épinglez, organisez et suivez vos e-mails importants directement dans Thunderbird, avec rappels, groupes, Agenda et tableau de bord local.

### Short description EN

Pin, organize, and follow up on important email directly in Thunderbird with reminders, groups, Calendar integration, and a local dashboard.

### Confidentialité

MailPerch ne transmet aucune donnée. Aucun corps complet de message ni contenu de pièce jointe n’est copié dans sa base. Voir `PRIVACY.md`.

### Permission privilégiée

L’API Experiment `pinInbox` est nécessaire pour intégrer le panneau dans `about:3pane`, résoudre les messages déplacés, utiliser SQLite, écouter les changements de dossiers et créer des tâches/événements Agenda. Cette API explique l’avertissement d’accès complet affiché par Thunderbird.

## Blocages externes restants

- publication du dépôt, de la politique de confidentialité et du support à des URL accessibles au public ;
- validation manuelle Windows, Linux et macOS sur les versions Thunderbird réellement annoncées ;
- création du compte développeur et soumission dans le portail Add-ons for Thunderbird ;
- décision finale des reviewers ATN.
