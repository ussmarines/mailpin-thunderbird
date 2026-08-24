# Plan de test manuel MailPin — 1.7.6

Utiliser de préférence un profil Thunderbird jetable pour les scénarios destructifs. Le présent plan complète les validations automatisées de la source 1.7.6 ; la dernière release publique est 1.7.6. Aucun contrôle non exécuté ne doit être présenté comme PASS.

## Recette 1.7.6 — cold start des épingles persistées

1. Installer le XPI 1.7.6 dans Thunderbird 154.0 sur un profil de test.
2. Épingler plusieurs messages puis fermer complètement Thunderbird.
3. Relancer Thunderbird normalement et ne cliquer sur aucune action MailPin.
4. Sans ouvrir le Dashboard, confirmer que le panneau MailPin et les épingles persistées apparaissent automatiquement une fois l’interface prête.
5. Confirmer qu’un seul panneau et un seul toggle Quick Filter sont présents.
6. Ouvrir ensuite le Dashboard et confirmer un seul onglet et que cette action n’est plus nécessaire au chargement de la boîte mail.
7. Réactiver/changer d’onglet mail et confirmer l’absence de duplication de panneau, boutons, listeners visibles ou cartes.
8. Épingler/désépingler un message et confirmer l’absence de changement lu/non-lu ou des compteurs natifs.
9. Désinstaller/réinstaller et confirmer le nettoyage puis l’injection unique.

La candidate versionnée 1.7.6 a déjà passé le smoke automatisé réel Thunderbird 154.0. Une recette humaine supplémentaire ne doit être déclarée PASS que si elle est réellement exécutée sur le XPI public correspondant.
