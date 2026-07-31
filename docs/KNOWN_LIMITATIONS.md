# Limites connues

- La build n’a pas été exécutée dans une session Thunderbird graphique par l’environnement qui l’a produite.
- Les gardes automatiques valident les contrats, la syntaxe, les modèles, les données et le build, mais ne remplacent pas un clic réel dans `about:3pane`.
- Les tests XPCShell/Mochitest fournis nécessitent un checkout de développement Thunderbird et ne sont pas exécutés par la CI générique.
- Une API Experiment déclenche un avertissement d’accès complet et peut casser lors d’une évolution interne de Thunderbird.
- Les pages déclaratives et les actions principales sont disponibles en français et en anglais ; quelques diagnostics techniques rares restent rédigés en français.
- La matrice intégrée décrit les capacités détectées localement, mais ne garantit pas le comportement de chaque serveur sans test manuel.
- Les actions supprimer/archiver, les dossiers virtuels et la synchronisation Agenda doivent être validés sur chaque fournisseur utilisé.
- Le fichier principal de l’Experiment reste l’orchestrateur privilégié. Les logiques pures et stables sont séparées dans `modules/`, mais le découpage de l’intégration DOM doit rester progressif.
- L’identifiant, le nom et la licence doivent être validés avant une publication ATN.
