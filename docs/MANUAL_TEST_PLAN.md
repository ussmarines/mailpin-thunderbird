# Plan de test manuel MailPin — 1.7.12

Utiliser de préférence un profil Thunderbird jetable pour les scénarios destructifs. Le présent plan complète les validations automatisées de la source 1.7.12 ; la dernière release publique est 1.7.11. Aucun contrôle non exécuté ne doit être présenté comme PASS.

## Candidate 1.7.12 — Thunderbird 159.0

Sur profil jetable avec le XPI candidat : installer l'extension, vérifier injection unique `about:3pane`, épinglage/désépinglage, compteur de non-lus et état lu inchangés, Dashboard/Options, persistance au cold start, Quick Filter, menus/tags et Agenda facultatif, désinstallation/nettoyage. Vérifier les logs de l'Experiment ; ne déclarer PASS qu'après smoke réel et revue des sorties.

## Release 1.7.11 — Thunderbird 158.0

Les critères C/D synthétiques exécutés sous Windows et le smoke Linux 158 sont consignés dans `../VALIDATION_REPORT_1.7.11.md`. Les fournisseurs réseau, macOS et l’accessibilité assistée restent à valider séparément. Les validations ci-dessous de 1.7.10 restent historiques et ne prouvent pas 158.

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
