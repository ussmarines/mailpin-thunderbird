# Notes pour les reviewers ATN — MailPerch 1.3.0

## Identité

- **Nom :** MailPerch — Email Pins & Follow-up
- **Nom court :** MailPerch
- **Version :** 1.3.0
- **ID :** `pin-mails@MailPerch.local`
- **Compatibilité :** Thunderbird 128.0 à 153.*
- **Langues :** français et anglais

## Fonction principale

MailPerch ajoute un panneau local de messages épinglés au-dessus de la liste native, avec suivis, échéances, rappels, notes, sous-tâches, vues enregistrées, groupes, règles, Agenda et tableau de bord. La liste native des messages et ses compteurs ne sont pas remplacés.

## Permission et API privilégiée

La permission WebExtension déclarée est uniquement `menus`. L’extension embarque l’Experiment `pinInbox`, nécessaire pour :

- intégrer le panneau dans `about:3pane` ;
- résoudre les messages déplacés à partir des bases locales ;
- gérer le stockage SQLite local ;
- écouter les notifications de dossiers ;
- créer et synchroniser les tâches et événements Agenda compatibles ;
- gérer les tags MailPerch locaux lorsque cette option est explicitement activée ;
- gérer correctement l’arrêt, la mise à jour et la désinstallation.

L’Experiment possède par nature un accès privilégié et provoque l’avertissement d’accès complet de Thunderbird. Les entrées sont validées par schéma et dans l’implémentation privilégiée.

## Réseau, données et code

- aucun appel réseau et `connect-src 'none'` ;
- aucune télémétrie, publicité ou collecte distante ;
- aucun code distant, `eval`, fonction générée ou HTML injecté ;
- aucun corps complet de message ni contenu de pièce jointe copié ;
- aucune dépendance d’exécution ou de build tierce ;
- code source lisible, non minifié et build reproductible.

Voir `PRIVACY.md`, `SECURITY.md`, `SECURITY_AUDIT_1.2.0.md` et `release/BUILD_INSTRUCTIONS.md`.

## Scénario de test rapide

1. Installer le XPI dans un profil Thunderbird propre.
2. Épingler un message depuis la liste, le menu contextuel et le bouton du message affiché.
3. Vérifier que le message apparaît dans le panneau sans quitter la liste native.
4. Tester clic simple, double-clic, clic droit, menu `…` et désépinglage.
5. Ajouter une échéance et un rappel.
6. Créer une tâche ou un événement dans un calendrier compatible choisi explicitement.
7. Ouvrir le dashboard : tester recherche globale, checklist, vues enregistrées, états de réponse et palette de commandes.
8. Activer les tags MailPerch, modifier statut/priorité puis confirmer qu’un tag personnel témoin reste intact après désactivation.
9. Ouvrir les paramètres, puis basculer les thèmes clair et sombre et vérifier le zoom 200 %.
10. Vérifier que les compteurs natifs de dossiers et l’état lu/non lu ne changent pas.
11. Exporter une sauvegarde, la prévisualiser et la restaurer en mode sûr.
12. Désinstaller depuis un profil de test et vérifier la purge des données internes et des seuls tags MailPerch possédés.

## Validation automatisée

`npm run ci` contrôle le dépôt, les permissions, la CSP, les ressources, l’absence de réseau, les contrats de l’Experiment, les migrations, le stockage, les actions de cartes, l’accessibilité, les traductions, la reproductibilité et les secrets.

## Validation manuelle à renseigner avant soumission

| Thunderbird | Système | Type de compte | Thème | Résultat |
|---|---|---|---|---|
| À compléter | À compléter | IMAP/POP/local | clair/sombre | À compléter |
