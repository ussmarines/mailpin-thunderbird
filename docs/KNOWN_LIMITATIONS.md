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

- La mémoire projet décrit le dépôt mais ne remplace pas une validation graphique réelle ;
  elle est contrôlée automatiquement pour la version et les points d’entrée.
- La purge immédiate s’appuie sur des écouteurs de cycle de vie enregistrés lorsque l’Experiment a été chargé et doit être validée dans Thunderbird réel. Si l’extension est restée désactivée depuis le démarrage, l’Experiment ne peut pas exécuter lui-même cette purge au moment exact de la suppression. La sentinelle stockée dans la zone locale que Gecko efface nativement force toutefois une purge des résidus avant toute initialisation lors d’une réinstallation normale. Les préférences de développement Firefox/Thunderbird permettant volontairement de conserver le stockage d’extension à la désinstallation peuvent neutraliser ce mécanisme et sont hors configuration utilisateur normale.
- Le propriétaire du profil local et toute personne disposant de Browser Toolbox contrôlent déjà le processus Thunderbird ; MailPerch ne peut pas créer une frontière d’autorisation contre cet acteur. Il n’existe donc aucun rôle administrateur client à contourner.
- Les sauvegardes exportées manuellement hors des dossiers gérés par MailPerch ne peuvent ni ne doivent être effacées automatiquement lors de la désinstallation.
- Une sécurité absolue ne peut pas être garantie ; toute nouvelle version de Thunderbird ou modification de l’API Experiment exige une nouvelle revue et des tests réels.
- Les actions GitHub sont épinglées à des commits précis et suivies par Dependabot ; une mise à jour doit être relue avant fusion plutôt que suivie automatiquement par un tag mobile.


## Validation des correctifs récents

Les incidents MP-2026-004 et MP-2026-005 ont été rouverts après l’échec de la 3.2.5 dans Thunderbird réel ; MP-2026-007 couvre les recommandations absentes ou partielles. La 3.2.8 change leurs frontières responsables et ajoute des tests dans un navigateur réel, mais ces bugs restent `À VALIDER` dans `docs/BUG_TRACKER.md`. Une API Thunderbird simulée ne remplace pas un clic dans l’onglet Options ni le rendu d’une liste virtualisée Thunderbird.
