# Plan de test manuel MailPin — 1.7.3

Utiliser de préférence un profil Thunderbird jetable pour les scénarios destructifs. Le présent plan complète les validations automatisées de la source 1.7.3 ; la dernière release publique est 1.7.2. Aucun contrôle non exécuté ne doit être présenté comme PASS.

## Recette 1.7.3 — consolidation UI en dur

1. Ouvrir Dashboard et Options, inspecter les ressources chargées : `interaction-stability.css` ne doit plus exister ni être chargé ; la composition doit provenir de `workspace.css`.
2. Dans Agenda, vérifier un espace visuel net entre les quatre cartes d’activation/synchronisation et la rangée Type par défaut / Calendrier préféré.
3. Dans Règles et actions automatiques, vérifier un espace net entre la rangée Activer les règles / Simulation / Conserver l’épingle et Groupe En attente / Erreurs / Actions max/minute.
4. Dans Centre de santé, vérifier un espace net entre les quatre cartes supérieures et Niveau minimal du journal / Événements conservés.
5. Modifier un réglage pour afficher la barre de sauvegarde : le bouton **Annuler** doit rester parfaitement lisible en thème sombre et clair ; tester hover et focus clavier.
6. Vérifier Enregistrer/Annuler et notifications au milieu et en bas d’une longue page : ils doivent rester dans le viewport sans déformer l’en-tête.
7. Ouvrir/fermer Plus de statistiques : aucun déplacement latéral du contrôle.
8. Vérifier les calendriers aux noms longs et les raccourcis clavier.
9. Refaire les points 2 à 8 à 100/125/200 %, largeur réduite, thèmes clair/sombre et contraste forcé.

## Invariants fonctionnels

- l’épinglage ne change pas lu/non-lu ni les compteurs natifs ;
- aucune fonction Agenda/Tags absente ne fait tomber MailPin ;
- aucune donnée ne quitte le poste ;
- aucun tag personnel n’est modifié ;
- le XPI testé correspond au commit candidat exact.

## Preuves déjà acquises avant versionnement

- PR #49 QA Linux/Windows + garde sécurité : `32027919000` PASS ;
- PR #49 smoke Thunderbird réel : `32027918991` PASS ;
- merge runtime : `ed54686f64626c37d5d38236ebcda8ec8e94a094`.

La candidate versionnée 1.7.3 doit repasser QA et smoke réels avant release.
