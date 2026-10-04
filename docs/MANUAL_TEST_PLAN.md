# Plan de test manuel MailPin — 1.7.10

Utiliser de préférence un profil Thunderbird jetable pour les scénarios destructifs. Le présent plan complète les validations automatisées de la source 1.7.10 ; la dernière release publique est 1.7.9. Aucun contrôle non exécuté ne doit être présenté comme PASS.

## Recette 1.7.10 — Thunderbird 157.0.1

1. Installer `MailPin_v1.7.10.xpi` dans Thunderbird 157.0.1 sur un profil de test.
2. Ouvrir une vue mail `about:3pane` et confirmer que le panneau MailPin et le toggle Quick Filter apparaissent une seule fois, sans erreur de démarrage.
3. Épingler plusieurs messages et confirmer que l’action ne modifie ni l’état lu/non-lu ni les compteurs natifs Thunderbird.
4. Fermer complètement Thunderbird puis le relancer normalement, sans ouvrir le Dashboard ni cliquer sur une action MailPin.
5. Confirmer que le panneau et les épingles persistées réapparaissent automatiquement une fois l’interface prête.
6. Ouvrir le Dashboard et confirmer qu’un seul onglet est créé.
7. Réactiver ou changer d’onglet mail et confirmer l’absence de duplication de panneau, toggle, cartes ou listeners visibles.
8. Tester une action simple sur une carte épinglée puis désépingler le message et confirmer à nouveau l’absence de modification lu/non-lu ou des compteurs natifs.
9. Désinstaller puis réinstaller l’extension et confirmer le nettoyage des injections, puis une réinjection unique.

## Preuves automatisées disponibles

La release publique 1.7.9 reste validée sur Thunderbird 156.0 : candidate `da9d97a874f5043b43a212d09b9090ad0f77d681` — QA `35224045803`, smoke `35224046106` PASS ; target `46bb9fc27256cc143743e74e4a04fb48d48f6e85` — QA `35224161719`, smoke `35224161877` PASS.

La preuve Thunderbird 157.0.1 de 1.7.10 est en attente tant que les workflows du head exact n’ont pas terminé avec succès. Une recette humaine supplémentaire ne doit être déclarée PASS que si elle est réellement exécutée sur le XPI correspondant.
