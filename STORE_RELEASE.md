# Publication MailPin 1.6.1

## Identité

- **Nom :** MailPin
- **Nom complet :** MailPin — Email Follow-up & Productivity for Thunderbird
- **Version publique :** 1.6.1
- **Sous-titre FR :** Suivi d’e-mails & productivité pour Thunderbird.
- **Subtitle EN:** Email Follow-up & Productivity for Thunderbird
- **Auteur public :** ussmarines
- **Identifiant permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité déclarée :** Thunderbird 153.0 à 153.*
- **Licence :** MailPin Source-Available License 1.1

L’identifiant a été adopté volontairement en 1.6.0 avant la première publication ATN. Il doit conserver exactement la même casse et ne plus être modifié après publication ATN.

## Pourquoi 1.6.1

La 1.6.0 a réalisé le rebranding **MailPerch → MailPin**, l’adoption de l’ID public définitif et la nouvelle direction artistique. Son runtime intégré par la PR #35 (`4fdb978e1828325001f95951c115059a931b8b6e`) a passé QA Linux/Windows, garde sécurité et smoke Thunderbird 153 réel. La release GitHub v1.6.0 a ensuite été publiée depuis `main`.

Un contrôle reviewer post-publication a détecté que certains documents actifs de l’archive source 1.6.0 contenaient encore des preuves textuelles héritées de la préparation 1.5.4 (ancien numéro de PR/SHA, ancien hash XPI et une phrase niant à tort le changement d’identité). **Aucun défaut runtime n’a été trouvé.**

La 1.6.1 corrige uniquement cette cohérence de publication et le numéro de version. Aucun comportement métier, permission, schéma, stockage, dépendance runtime, réseau, télémétrie, publicité ou code distant n’est modifié.

## Preuves correctement attribuées

- recette manuelle utilisateur : dernière preuve fraîche sur le candidat pré-rebranding 1.5.4 ; réutilisable uniquement pour les comportements métier inchangés ;
- rebranding/runtime MailPin 1.6.0 : PR #35 puis commit `4fdb978e1828325001f95951c115059a931b8b6e`, QA Linux/Windows + garde sécurité + smoke Thunderbird réel verts ;
- release 1.6.0 : XPI publié SHA-256 `6860e0177795b163cb672edd1a93897260785c4b8eeeeac71d1b3d32dca281ae` ;
- 1.6.1 : la PR et la release doivent refaire la QA complète et le smoke Thunderbird car le manifeste/version est modifié ; les résultats publiés par GitHub Actions et `SHA256SUMS.txt` constituent la preuve fraîche de cette version.

Aucune recette manuelle fraîche du XPI 1.6.1 n’est revendiquée tant qu’elle n’a pas été réellement effectuée.

## Livrables GitHub / ATN

Le workflow Release publie, après `npm run ci` :

- `dist/MailPin_v1.6.1.xpi` — extension ;
- `dist/MailPin_GitHub_Repository_v1.6.1.zip` — sources complètes pour review ;
- `dist/SHA256SUMS.txt` — empreintes définitives ;
- `release/ATN_REVIEW_NOTES_TEMPLATE.md` — informations reviewers ;
- `release/BUILD_INSTRUCTIONS.md` — reproduction du build.

Pour une soumission ATN, **les sommes du `SHA256SUMS.txt` attaché à la release v1.6.1 sont la référence définitive** ; aucun ancien hash 1.5.x/1.6.0 ne doit être recopié dans le dossier reviewer.

## Informations de fiche ATN

### Description courte FR

Épinglez, organisez et suivez vos e-mails importants dans Thunderbird avec portée par comptes, notes, sous-tâches, rappels, vues, Agenda et tableau de bord local.

### Short description EN

Pin, organize, and follow up on important email in Thunderbird with account scoping, notes, subtasks, reminders, saved views, Calendar integration, and a local dashboard.

### Confidentialité

MailPin ne transmet aucune donnée. Aucun corps complet de message ni contenu de pièce jointe n’est copié dans sa base. Voir `PRIVACY.md`.

### Permission privilégiée

L’API Experiment `pinInbox` est nécessaire pour intégrer le panneau dans `about:3pane`, résoudre les messages déplacés, utiliser SQLite, écouter les changements de dossiers, gérer les tags MailPin et créer/synchroniser les tâches ou événements Agenda compatibles. Cette API explique l’avertissement d’accès complet affiché par Thunderbird.

## Limites restant externes à GitHub

- recette humaine ciblée du XPI 1.6.1 avant ATN ;
- matrice Windows/Linux/macOS Thunderbird réelle exhaustive ;
- Gmail/Microsoft/IMAP et calendriers réseau réels hors banc ;
- validation humaine complète zoom 200 %, contraste OS élevé et lecteurs d’écran ;
- accès au compte développeur et décision finale des reviewers ATN.
