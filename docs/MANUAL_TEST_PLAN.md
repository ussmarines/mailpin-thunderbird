# Plan de test manuel MailPin — 1.7.5

Utiliser de préférence un profil Thunderbird jetable pour les scénarios destructifs. Le présent plan complète les validations automatisées de la source 1.7.5 ; la dernière release publique est 1.7.5. Aucun contrôle non exécuté ne doit être présenté comme PASS.

## Recette 1.7.5 — identité ATN

1. Installer le XPI 1.7.5 dans Thunderbird 154.0.
2. Vérifier que le nom affiché est `MailPin — Email Follow-up & Productivity`.
3. Confirmer que l’extension démarre et que le panneau MailPin est injecté une seule fois.
4. Ouvrir le Dashboard et confirmer un seul onglet.
5. Épingler/désépingler un message et confirmer l’absence de changement lu/non-lu ou des compteurs natifs.
6. Désinstaller/réinstaller et confirmer le nettoyage puis l’injection unique.

Le XPI testé doit correspondre exactement à la release publique 1.7.5. La recette humaine n’est pas déclarée PASS tant qu’elle n’a pas été exécutée.
