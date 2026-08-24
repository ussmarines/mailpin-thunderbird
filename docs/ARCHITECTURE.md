# Architecture MailPin 2.0

## Principe

MailPin 2.0 est une MailExtension Manifest V3 pure. Aucun code privilégié ou Experiment API n’est autorisé.

## Flux

1. L’utilisateur sélectionne un ou plusieurs messages dans Thunderbird.
2. `background.js` reçoit l’action via menu, raccourci ou `message_display_action`.
3. Seules les métadonnées nécessaires sont conservées : `headerMessageId`, dossier/compte, objet, auteur, date et tags, plus les données MailPin créées par l’utilisateur.
4. `storage.local` conserve l’état MailPin ; les écritures sont sérialisées par une file Promise.
5. Le Dashboard communique avec le background par `runtime.sendMessage`.
6. Les références sont résolues à la demande avec `messages.query({headerMessageId})`, ce qui évite de dépendre du `messageId` volatile entre redémarrages/déplacements.
7. `alarms` et `notifications` gèrent les échéances localement.

## Frontières

- Aucun accès au DOM `about:3pane`.
- Aucun accès SQLite Thunderbird.
- Aucun corps complet de message ou pièce jointe stocké.
- Aucun réseau runtime.
- Les tags personnels Thunderbird sont lus/appliqués uniquement via les APIs natives ; MailPin ne les renomme, n’adopte ni ne supprime.

## Fonctionnalités remplacées

- Panneau inline -> Dashboard dédié + menus/raccourcis/action message.
- Agenda Thunderbird privilégié -> Planning MailPin interne.
- SQLite -> `storage.local`.
- Conversations internes -> sélection explicite de messages et résolution par `headerMessageId`.
- Détection automatique « sans réponse » -> état manuel fiable dans cette première candidate, en attendant une solution native vérifiable.
