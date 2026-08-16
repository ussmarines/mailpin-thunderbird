# Notes pour les reviewers ATN — MailPin 1.7.1 (candidate)

## Identité

- **Nom :** MailPin — Email Follow-up & Productivity for Thunderbird
- **Nom court :** MailPin
- **Version :** 1.7.1
- **ID :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 153.*
- **Langues :** français et anglais

## Fonction principale

MailPin ajoute un panneau local de messages épinglés au-dessus de la liste native, avec portée par boîte courante, comptes Thunderbird sélectionnés ou tous les comptes, suivis, échéances, rappels, notes, sous-tâches, vues enregistrées, groupes, règles, Agenda et tableau de bord. La liste native des messages et ses compteurs ne sont pas remplacés.

## Permission et API privilégiée

La permission WebExtension déclarée est uniquement `menus`. L’extension embarque l’Experiment `pinInbox`, nécessaire pour :

- intégrer le panneau dans `about:3pane` ;
- résoudre les messages déplacés à partir des bases locales ;
- gérer le stockage SQLite local ;
- écouter les notifications de dossiers ;
- créer et synchroniser les tâches et événements Agenda compatibles ;
- gérer les tags MailPin locaux lorsque cette option est explicitement activée ;
- gérer correctement l’arrêt, la mise à jour et la désinstallation.

L’Experiment possède par nature un accès privilégié et provoque l’avertissement d’accès complet de Thunderbird. Les entrées sont validées par schéma et dans l’implémentation privilégiée.

## Réseau, données et code

- aucun appel réseau et `connect-src 'none'` ;
- aucune télémétrie, publicité ou collecte distante ;
- aucun code distant, `eval`, fonction générée ou HTML injecté ;
- aucun corps complet de message ni contenu de pièce jointe copié ;
- aucune dépendance d’exécution ou de build tierce ;
- code source lisible, non minifié et build reproductible.

Voir `PRIVACY.md`, `SECURITY.md`, `SECURITY_AUDIT_1.7.1.md` et `release/BUILD_INSTRUCTIONS.md`.

## Scénario de test rapide

1. Installer le XPI dans un profil Thunderbird propre.
2. Épingler un message depuis la liste, le menu contextuel et le bouton du message affiché.
3. Vérifier que le message apparaît dans le panneau sans quitter la liste native.
4. Dans Options, tester la portée « Comptes sélectionnés », enregistrer puis vérifier le filtrage du panneau.
5. Tester clic simple, double-clic, clic droit, menu `…` et désépinglage.
6. Ajouter une échéance et un rappel.
7. Créer une tâche ou un événement dans un calendrier compatible choisi explicitement.
8. Ouvrir le dashboard : tester recherche globale, checklist, vues enregistrées, états de réponse et palette de commandes.
9. Activer les tags MailPin, modifier statut/priorité puis confirmer qu’un tag personnel témoin reste intact après désactivation.
10. Ouvrir les paramètres, puis basculer les thèmes clair et sombre et vérifier le zoom 200 %.
11. Vérifier que les compteurs natifs de dossiers et l’état lu/non lu ne changent pas.
12. Exporter une sauvegarde, la prévisualiser et la restaurer en mode sûr.
13. Désinstaller depuis un profil de test et vérifier la purge des données internes et des seuls tags MailPin possédés.

## Validation automatisée

`npm run ci` contrôle le dépôt, les permissions, la CSP, les ressources, l’absence de réseau, les contrats de l’Experiment, les migrations, le stockage, les actions de cartes, l’accessibilité, les traductions, la reproductibilité et les secrets.

Le banc Thunderbird fonctionnel dédié couvre 50, 100, 500, 1 000 et 2 000 épingles. La validation multi-comptes de référence utilise une portée vide=0, A=18, B=16, A+C=34 et A+B+C=50. Les téléchargements de Thunderbird/geckodriver appartiennent uniquement au banc de test et sont vérifiés par SHA-256 ; ils ne sont pas des dépendances runtime.

## Validation manuelle à renseigner avant soumission

| Thunderbird | Système | Type de compte | Thème | Résultat |
|---|---|---|---|---|
| À compléter | À compléter | IMAP/POP/local | clair/sombre | À compléter |
