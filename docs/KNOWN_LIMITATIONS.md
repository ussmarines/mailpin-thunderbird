# Limites connues

- Le panneau, les épingles, le clic de carte, le compteur non lu, la géométrie des icônes et le menu natif anglais ont été validés dans Thunderbird 153.0.1 avec un compte local et quatre messages synthétiques. Les fonctions de productivité qui dépendent d’un fournisseur réel, d’Agenda ou d’un cycle long restent à valider par environnement.
- La page Options 3.2.10 et les cartes `about:3pane` ont été exécutées dans des profils Thunderbird 153.0.1 jetables distincts ; cette preuve ne couvre pas encore toute la plage 128–153 ni le zoom 200 %.
- Les gardes automatiques valident les contrats, la syntaxe, les modèles, les données et le build, mais ne remplacent pas les clics réels restant dans `docs/MANUAL_TEST_PLAN.md`.
- Les tests XPCShell/Mochitest fournis nécessitent un checkout de développement Thunderbird et ne sont pas exécutés par la CI générique.
- Une API Experiment déclenche un avertissement d’accès complet et peut casser lors d’une évolution interne de Thunderbird.
- Les pages Options et dashboard ainsi que le panneau privilégié, leurs contenus dynamiques et leurs noms accessibles sont disponibles en français et en anglais ; les codes de diagnostic internes restent volontairement techniques et indépendants de la langue.
- La matrice intégrée décrit les capacités détectées localement, mais ne garantit pas le comportement de chaque serveur sans test manuel.
- Les actions supprimer/archiver, les dossiers virtuels et la synchronisation Agenda doivent être validés sur chaque fournisseur utilisé.
- Le fichier principal de l’Experiment reste l’orchestrateur privilégié. Les logiques pures et stables sont séparées dans `modules/`, mais le découpage de l’intégration DOM doit rester progressif.
- Le portail ATN doit encore accepter l’identifiant, le nom et la licence ; l’identifiant déjà utilisé par les releases GitHub ne doit pas être remplacé silencieusement.

- La mémoire projet décrit le dépôt mais ne remplace pas une validation graphique réelle ;
  elle est contrôlée automatiquement pour la version et les points d’entrée.
- La purge immédiate s’appuie sur des écouteurs de cycle de vie enregistrés lorsque l’Experiment a été chargé et doit être validée dans Thunderbird réel. Si l’extension est restée désactivée depuis le démarrage, l’Experiment ne peut pas exécuter lui-même cette purge au moment exact de la suppression. La sentinelle stockée dans la zone locale que Gecko efface nativement force toutefois une purge des résidus avant toute initialisation lors d’une réinstallation normale. Les préférences de développement Firefox/Thunderbird permettant volontairement de conserver le stockage d’extension à la désinstallation peuvent neutraliser ce mécanisme et sont hors configuration utilisateur normale.
- Le propriétaire du profil local et toute personne disposant de Browser Toolbox contrôlent déjà le processus Thunderbird ; MailPerch ne peut pas créer une frontière d’autorisation contre cet acteur. Il n’existe donc aucun rôle administrateur client à contourner.
- Les sauvegardes exportées manuellement hors des dossiers gérés par MailPerch ne peuvent ni ne doivent être effacées automatiquement lors de la désinstallation.
- Une sécurité absolue ne peut pas être garantie ; toute nouvelle version de Thunderbird ou modification de l’API Experiment exige une nouvelle revue et des tests réels.
- Les actions GitHub sont épinglées à des commits précis et suivies par Dependabot ; une mise à jour doit être relue avant fusion plutôt que suivie automatiquement par un tag mobile.
- Les builds ZIP répétés sur un même environnement sont binaires identiques, mais Python `zipfile`/zlib encode des flux DEFLATE et des métadonnées d’hôte différents entre Windows et Linux. La release 1.1.1 contient les mêmes entrées et octets décompressés sur les deux systèmes ; ses SHA-256 Linux publiés sont autoritatifs. `MP-2026-018` suit une reproductibilité binaire réellement inter-plateforme.


## Validation des correctifs récents

MP-2026-004, MP-2026-005, MP-2026-007, MP-2026-008 et MP-2026-017 ont été validés dans Thunderbird 153.0.1 avec des profils jetables. MP-2026-010 reste à valider avec un calendrier synthétique ; MP-2026-011 conserve la matrice Thunderbird 128–153 et le zoom 200 % comme validations réelles restantes.
