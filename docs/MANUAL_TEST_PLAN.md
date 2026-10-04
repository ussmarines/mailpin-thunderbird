> Source 2.2.0 — candidate native uniquement. Version source : **2.2.0**. Dernière release publique : **1.7.10** ; release publique 1.7.10 inchangée.
> Contrat courant et différences : docs/NATIVE_2.2.0_HANDOFF.md. Les sections 1.7.x ci-dessous restent historiques et ne prouvent pas le natif.

Plan natif — 2.2.0 ; la dernière release publique est 1.7.10. Scénarios propriétaires dans le handoff natif ; aucune vérification graphique ancienne n’est réutilisée pour la candidate.

# Plan de test manuel MailPin — 1.7.10

Utiliser de préférence un profil Thunderbird jetable pour les scénarios destructifs. Le présent plan complète les validations automatisées de la source 1.7.10 ; la dernière release publique est 1.7.10. Aucun contrôle non exécuté ne doit être présenté comme PASS.

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

La release publique 1.7.10 est validée sur Thunderbird 157.0.1 : candidate `565f565710da6262d7a91bfbe280a943047cdc6c` — QA `37213680870`, smoke `37213680824` PASS ; target `704b3d5c2b35a2eceb4fbe1136b50a86dfadd6f0` — QA `37213779632`, smoke `37213779633` et CodeQL `37213779727` PASS ; workflow Release `37214354533` PASS.

Une recette humaine supplémentaire ne doit être déclarée PASS que si elle est réellement exécutée sur le XPI public correspondant.
