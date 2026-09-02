# Plan de test manuel MailPin — 1.7.8

Utiliser de préférence un profil Thunderbird jetable pour les scénarios destructifs. Le présent plan complète les validations automatisées de la source 1.7.8 ; la dernière release publique est 1.7.8. Aucun contrôle non exécuté ne doit être présenté comme PASS.

## Recette 1.7.7 — Thunderbird 155 et cold start

1. Installer `MailPin_v1.7.7.xpi` dans Thunderbird 155.0 sur un profil de test.
2. Ouvrir une vue mail `about:3pane` et confirmer que le panneau MailPin et le toggle Quick Filter apparaissent une seule fois, sans erreur de démarrage `Trying to load untrusted URI`.
3. Épingler plusieurs messages et confirmer que l’action ne modifie ni l’état lu/non-lu ni les compteurs natifs Thunderbird.
4. Fermer complètement Thunderbird puis le relancer normalement, sans ouvrir le Dashboard ni cliquer sur une action MailPin.
5. Confirmer que le panneau et les épingles persistées réapparaissent automatiquement une fois l’interface prête.
6. Ouvrir le Dashboard et confirmer qu’un seul onglet est créé.
7. Réactiver ou changer d’onglet mail et confirmer l’absence de duplication de panneau, toggle, cartes ou listeners visibles.
8. Tester une action simple sur une carte épinglée puis désépingler le message et confirmer à nouveau l’absence de modification lu/non-lu ou des compteurs natifs.
9. Désinstaller puis réinstaller l’extension et confirmer le nettoyage des injections, puis une réinjection unique.

## Preuves automatisées disponibles

- candidate exacte `94ce4d2656df8eb9694ce794743b82c00d83e8a9` : QA `33688297275` — PASS ; smoke réel Thunderbird 155.0 `33688296968` — PASS ;
- `main` `f5d5c07a0f8d375ed7347b3a42fbc57f4bafb7fb` : QA post-merge `33689155033` — PASS ; smoke réel Thunderbird 155.0 `33689155048` — PASS ;
- workflow Release `33689378381` : `npm run ci`, préparation des métadonnées et publication `v1.7.7` — PASS.

Une recette humaine supplémentaire ne doit être déclarée PASS que si elle est réellement exécutée sur le XPI public correspondant. Les fournisseurs réseau et calendriers distants restent des validations séparées si ces comportements doivent être revendiqués formellement.
