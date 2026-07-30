# Limites connues

- La build n’a pas été exécutée dans une session Thunderbird graphique par l’environnement qui l’a produite.
- Les tests XPCShell/Mochitest fournis nécessitent l’environnement de développement Thunderbird et ne sont pas exécutés par la CI générique.
- Une API Experiment déclenche un avertissement d’accès complet et peut casser lors d’une évolution interne de Thunderbird.
- La localisation complète de l’interface injectée, des options et du dashboard n’est pas encore réalisée ; le manifeste et les menus sont FR/EN.
- L’identifiant, le nom et la licence doivent être validés avant ATN.
- Les actions supprimer/archiver et la synchronisation Agenda nécessitent des tests sur plusieurs fournisseurs.
- Le fichier principal de l’Experiment reste volumineux ; les sous-domaines les plus stables sont isolés dans `modules/`, mais un découpage supplémentaire devra être réalisé prudemment avec des tests Thunderbird.
