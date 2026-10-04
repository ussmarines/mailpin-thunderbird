# Confidentialité / Privacy

Dernière mise à jour / Last updated: 2 septembre 2026 / September 2, 2026

## Français

### Données traitées localement

MailPin peut conserver les métadonnées nécessaires à ses fonctions : identifiants techniques, compte et dossier, objet, auteur, date, état lu, notes et sous-tâches saisies, groupes, affaires, vues enregistrées, échéances, règles, historique d’actions, état de suivi et liens Agenda. Lorsque la synchronisation de tags est activée, MailPin ajoute uniquement ses propres mots-clés de tag aux messages concernés dans Thunderbird.

L’extension ne copie pas dans sa base :

- le corps complet des messages ;
- le contenu des pièces jointes ;
- les mots de passe ou jetons de compte.

### Transmission

MailPin 2.2.0 ne contient aucun appel réseau, télémétrie, publicité, service de licence ni chargement de code distant. Les données restent dans le profil Thunderbird ou dans un fichier de sauvegarde choisi explicitement par l’utilisateur.

### Sauvegardes et diagnostics

- les sauvegardes sont déclenchées et configurées localement ;
- les exports retirent le chemin de sauvegarde, le calendrier préféré et la matrice de fournisseurs propres au profil ;
- le diagnostic expurgé utilise des identifiants hachés ou anonymes et des compteurs ;
- l’utilisateur doit vérifier un fichier avant de le partager : une sauvegarde contient encore les métadonnées nécessaires aux épingles ;
- aucune sauvegarde n’est téléversée automatiquement.

### Suppression (candidate native)

Les tags personnels ne sont jamais adoptés/renommés/supprimés. Désactiver explicitement le sync avant désinstallation retire uniquement les définitions possédées selon clé, définition exacte et registre local. Le natif n'a pas de hook privilégié d'uninstall : les tags peuvent rester après désinstallation directe. Thunderbird gère les pages/listeners/Space et le cycle du stockage WebExtension. Aucun accès/purge du SQLite historique 1.7.10 ; exporter avant mise à niveau/désinstallation. Les exports téléchargés restent sous contrôle utilisateur.

## English

### Data processed locally

MailPin may store metadata required for its features: technical identifiers, account and folder, subject, sender, date, read state, user notes and subtasks, groups, cases, saved views, deadlines, rules, action history, follow-up state, and Calendar links. When tag synchronization is enabled, MailPin adds only its own tag keywords to the relevant messages in Thunderbird.

The extension does not copy into its database:

- complete message bodies;
- attachment contents;
- account passwords or tokens.

### Transmission

MailPin 2.2.0 contains no network call, telemetry, advertising, license service, or remotely loaded code. Data remains in the Thunderbird profile or in a backup file explicitly selected by the user.

### Backups and diagnostics

- backups are configured and triggered locally;
- exports remove the backup path, preferred calendar, and provider matrix specific to the profile;
- redacted diagnostics use hashed or anonymous identifiers and counters;
- users should inspect a file before sharing it because a backup still contains metadata required for pinned messages;
- backups are never uploaded automatically.

### Deletion

Uninstalling closes storage and removes the database, recovery files, preferences, and internal backups managed by MailPin. In an external folder selected through Thunderbird’s native picker, only verifiable MailPin backup envelopes are removed; other files and the folder remain untouched.

Disabling tag synchronization or uninstalling removes only tags whose key and label exactly match MailPin-owned definitions; personal tags are not removed.

Manually downloaded exports are not tracked by the extension and remain under the user’s control.
