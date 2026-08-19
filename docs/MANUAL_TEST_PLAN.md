# Plan de test manuel MailPin — 1.7.4

Utiliser de préférence un profil Thunderbird jetable pour les scénarios destructifs. Le présent plan complète les validations automatisées de la source 1.7.4 ; la dernière release publique est 1.7.4. Aucun contrôle non exécuté ne doit être présenté comme PASS.

## Recette 1.7.4 — compatibilité Thunderbird 154

1. Installer le XPI 1.7.4 dans Thunderbird 154.0 et confirmer qu’il n’est plus signalé incompatible.
2. Ouvrir `about:3pane` et confirmer une seule instance du panneau MailPin et du bouton Quick Filter.
3. Épingler puis désépingler un message synthétique ; confirmer que lu/non-lu et compteurs natifs ne changent pas.
4. Ouvrir le Dashboard depuis le bouton du panneau et confirmer qu’un seul onglet Dashboard s’ouvre.
5. Ouvrir Options et vérifier que les réglages existants restent accessibles sans nouvelle erreur.
6. Si Agenda/Tags ne sont pas disponibles, confirmer que ces capacités se dégradent localement sans empêcher le cœur MailPin de démarrer.
7. Désinstaller MailPin et confirmer le nettoyage du panneau/bouton ; réinstaller et confirmer une injection unique.
8. Refaire les contrôles UI pertinents en thème clair/sombre et largeur réduite si une validation humaine est effectuée avant ATN.

## Invariants fonctionnels

- l’épinglage ne change pas lu/non-lu ni les compteurs natifs ;
- aucune fonction Agenda/Tags absente ne fait tomber MailPin ;
- aucune donnée ne quitte le poste ;
- aucun tag personnel n’est modifié ;
- le XPI testé doit correspondre exactement à la candidate/release 1.7.4 concernée.

## Preuves automatisées

- candidate versionnée `c2527b57de4775f4fd228af22b9792937e7ce6ea` : QA Linux/Windows + garde sécurité `32300356172` PASS ;
- même candidate : smoke réel Thunderbird 154.0 `32300356085` PASS ;
- déclencheur de publication : QA `32300831724` PASS ;
- tag `v1.7.4` identique au commit publié `b74c0c7f264cf387269be0aaf18e47e99cf07600`.

La candidate versionnée 1.7.4 a donc passé QA et smoke réels avant release. La recette humaine ci-dessus n’est pas déclarée comme exécutée tant qu’elle ne l’a pas été réellement.
