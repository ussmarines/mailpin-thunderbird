# Limites connues

## Version 1.3.0 et portée de validation

La version **1.3.0** livre la consolidation Thunderbird et Options. L’utilisateur a effectué le 8 août 2026 une passe réelle de la 1.2.1 sur son Thunderbird sans anomalie signalée ; la 1.3.0 bénéficie en plus des validations automatisées, de la revue Codex et du smoke Thunderbird 153.0.1 ESR. Cela ne remplace pas une matrice exhaustive par système, version, fournisseur, type de dossier et calendrier.

La branche `refactor/thunderbird-integration-and-ux` a été revue par Codex et validée par la CI GitHub ainsi que par le smoke Thunderbird réel. Les scénarios fournisseurs/OS/zoom/accessibilité qui restent manuels sont détaillés ci-dessous et doivent être distingués de cette validation automatisée.

## Compatibilité Thunderbird

- Le manifeste déclare Thunderbird `128.0` à `153.*`, mais tous les points internes ne sont pas automatiquement prouvés sur chaque version de cette plage.
- MailPerch utilise une API Experiment privilégiée. Une évolution interne de Thunderbird peut donc exiger une adaptation même si les APIs WebExtension publiques restent compatibles.
- Les opérations Messages, Tags et Agenda sont désormais isolées dans des adaptateurs dédiés ; cela réduit la surface d’adaptation future mais ne supprime pas la nécessité des tests réels.
- Le DOM `about:3pane`, la structure `ThreadCard`, les fenêtres et menus natifs restent orchestrés dans `implementation.js`. Cette zone est volontairement extraite progressivement plutôt que réécrite en bloc.
- Les dossiers virtuels, actions supprimer/archiver et comportements de fournisseurs doivent toujours être observés dans les environnements réellement utilisés.

## Agenda et tags

- La synchronisation Agenda dépend des capacités et ACL du calendrier. Un calendrier local, CalDAV ou un fournisseur tiers peut exposer des comportements différents.
- La synchronisation Tags est facultative et ne doit gérer que les définitions dont la propriété MailPerch est démontrée par clé et libellé exacts.
- Une indisponibilité Agenda ou Tags doit dégrader uniquement la fonction concernée ; cette politique est testée par contrat, mais les comportements propres aux fournisseurs exigent encore une validation réelle.

## Banc de test Thunderbird

- Les gardes statiques et contrats de la branche sont exécutables sans Thunderbird.
- Le workflow `.github/workflows/thunderbird-smoke.yml` a réussi le 8 août 2026 sur Thunderbird **153.0.1 ESR** Linux avec un profil Local Folders synthétique : installation, background `Startup: Complete`, injection unique, désinstallation/cleanup et réinstallation propre ont été observés. Cette preuve est limitée à ce scénario local sans fournisseur réseau.
- Un smoke Linux sur une version épinglée ne prouve pas Windows/macOS, les extrêmes de version, les fournisseurs réels, le zoom 200 %, l’accessibilité ni les performances à grande échelle.
- Les tests XPCShell/Mochitest fournis nécessitent un checkout/build Thunderbird et ne sont pas exécutés par la CI générique du dépôt.

## Interface et accessibilité

- Options et dashboard sont disponibles en français et en anglais ; les codes de diagnostic internes restent volontairement techniques.
- Le mode **Recommandé** masque les réglages avancés mais ne supprime pas leurs fonctions. Le stockage conserve la valeur historique `guided` afin d’éviter une migration.
- Le plancher CSS de 12 px est contrôlé automatiquement, mais le rendu effectif à zoom 200 %, avec polices système différentes, contraste élevé et lecteurs d’écran doit être observé manuellement.
- Les gardes DOM/Playwright utilisent des actifs réels mais une API synthétique ; elles ne remplacent pas les interactions dans `about:3pane`.
- Les scénarios Chromium ont validé Options et dashboard après les corrections finales, mais ils ne prouvent ni le rendu dans un onglet Thunderbird ni le zoom navigateur réel à 200 %.

## Cycle de vie et stockage

- La purge immédiate repose sur des écouteurs de cycle de vie enregistrés lorsque l’Experiment est chargé. Si l’extension est restée désactivée depuis le démarrage, l’Experiment ne peut pas exécuter lui-même cette purge au moment exact de la suppression.
- La sentinelle stockée dans la zone locale que Gecko efface normalement force toutefois la purge des résidus avant une réinstallation normale. Les préférences de développement qui demandent volontairement à Gecko de conserver le stockage à la désinstallation sont hors configuration utilisateur normale.
- Les sauvegardes exportées manuellement hors des dossiers gérés par MailPerch ne peuvent ni ne doivent être effacées automatiquement.
- Le propriétaire du profil local et toute personne disposant de la Browser Toolbox contrôlent déjà le processus Thunderbird ; MailPerch ne peut pas créer une frontière d’autorisation contre cet acteur.

## Build et publication

- Les builds ZIP répétés sur un même environnement sont binaires identiques, mais Python `zipfile`/zlib peut produire des conteneurs différents entre Windows et Linux malgré des entrées décompressées identiques. `MP-2026-018` suit cette reproductibilité inter-plateforme.
- Les SHA-256 de la release GitHub sont autoritatifs pour les artefacts publiés.
- Les actions GitHub sont épinglées à des commits précis et suivies par Dependabot ; une mise à jour doit être relue avant fusion.
- Le portail ATN doit encore accepter l’identifiant, le nom, la licence et la matrice de compatibilité réelle avant toute diffusion catalogue.

## Sécurité

Une sécurité absolue ne peut pas être garantie. Toute nouvelle version Thunderbird ou modification de l’API Experiment exige une nouvelle revue des frontières privilégiées et des tests réels. Les téléchargements Thunderbird/geckodriver du banc sont des dépendances **de test uniquement** et ne modifient pas la promesse locale/no-network de l’extension installée.
