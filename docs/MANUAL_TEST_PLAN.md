# Plan de test manuel MailPin — 1.7.13

Utiliser de préférence un profil Thunderbird jetable pour les scénarios destructifs. Le présent plan complète les validations automatisées de la source 1.7.13 ; la dernière release publique est 1.7.13. Aucun contrôle non exécuté ne doit être présenté comme PASS.

## Release 1.7.13 — Thunderbird 160.0

Sur un profil jetable Thunderbird 160.0 et sur le XPI exact : vérifier au démarrage le panneau `about:3pane`, l’injection unique, les épingles persistées après redémarrage, Dashboard/Options, pin/unpin sans effet sur lu/non-lu ni compteurs, Quick Filter, nettoyage à la désinstallation et réinstallation. Vérifier l’Experiment et le background MV3, puis enregistrer les captures/résultats du smoke. **Smoke automatisé Linux PASS** sur `9bc7a0ef2c28fc2547420ea4d1e6172d50e7cf0d` (run `43237043458`) : injection unique, pin/unpin sans modification des flags/compteurs, Dashboard, nettoyage et réinstallation. La persistance après cold start complet, les fournisseurs distants, Windows/macOS en UI réelle et la recette humaine restent à valider séparément.

## Release 1.7.12 — Thunderbird 159.0

Sur profil jetable avec le XPI candidat : installer l'extension, vérifier injection unique `about:3pane`, épinglage/désépinglage, compteur de non-lus et état lu inchangés, Dashboard/Options, persistance au cold start, Quick Filter, menus/tags et Agenda facultatif, désinstallation/nettoyage. Le smoke réel Linux Thunderbird 159.0 `40755718258` est PASS sur la cible publiée, sans profil personnel. Les fournisseurs distants, macOS et la recette humaine restent non vérifiés. Voir `../VALIDATION_REPORT_1.7.12.md`.

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
