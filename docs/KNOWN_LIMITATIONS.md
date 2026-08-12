# Limites connues

## Version 1.5.4 et portée de validation

Le candidat **1.5.4** modifie l’API Agenda bornée, la résolution des identités d’épinglage et plusieurs surfaces UI. Il ne modifie ni les permissions ni les schémas de stockage. Les validations automatisées fraîches sont consignées dans `VALIDATION_REPORT_1.5.4.md` et `docs/AI_VALIDATION_STATE.json`; la recette manuelle utilisateur reste requise.

Une matrice exhaustive de tous les systèmes, versions Thunderbird, fournisseurs réels, types de dossiers, calendriers, lecteurs d’écran et configurations de profil reste hors de portée d’un banc automatisé unique. Les éléments non observés restent explicitement documentés.

## Compatibilité Thunderbird

- Le manifeste 1.5.4 déclare Thunderbird `153.0` à `153.*`.
- MailPerch utilise une API Experiment privilégiée ; une évolution interne de Thunderbird peut exiger une adaptation.
- Messages, Tags et Agenda restent isolés dans leurs adaptateurs dédiés.
- Le DOM `about:3pane`, `ThreadCard`, les fenêtres et menus natifs restent des surfaces internes à surveiller.
- Les comportements propres aux fournisseurs et dossiers réels doivent toujours être validés dans les environnements concernés.

## Agenda, tags et fournisseurs réseau

- Les comptes POP/IMAP synthétiques du banc valident la logique locale et les portées sans utiliser de secret ni de service externe. Ils ne remplacent pas un test contre Gmail, Microsoft, un serveur IMAP réel ou un autre fournisseur.
- La synchronisation Agenda dépend des capacités et ACL du calendrier. Un fournisseur CalDAV ou tiers réel peut se comporter différemment du scénario local.
- La synchronisation Tags reste facultative et ne doit gérer que les définitions dont la propriété MailPerch est démontrée par clé et libellé exacts.
- Aucun compte, jeton ou credential réel n’est incorporé au dépôt ou au banc.

## Banc de test Thunderbird

- Les gardes statiques et contrats restent exécutables sans Thunderbird.
- Le smoke réel vérifie le XPI construit, le background MV3, l’injection unique, l’ouverture du Dashboard, le cleanup et la réinstallation.
- Le banc Thunderbird exécute les scénarios DOM Dashboard et Options dans leurs vrais onglets Thunderbird via le `BrowsingContext`/acteur Marionette du processus de contenu.
- L’éditeur de carte est ouvert via la commande XUL native `doCommand()` ; notes, checklist, priorité, groupe, échéances, statut et relance sont modifiés dans le runtime réel.
- Le banc mesure automatiquement en clair et sombre le clipping, le débordement horizontal, l’alignement des contrôles et le contraste texte de base.
- La persistance est testée avec une extension non temporaire sur le même profil jetable à travers deux processus Thunderbird distincts ; SQLite et les réglages sont contrôlés avant réveil naturel du background MV3 par activation d’onglet.
- Le smoke/banc Linux sur Thunderbird 153.0.1 ESR et la passe Windows 153.0.2 du 12 août 2026 ne prouvent pas à eux seuls macOS, tous les extrêmes de version ni les fournisseurs réseau externes.

## Interface et accessibilité

- Le plancher CSS de 12 px, le clipping, les débordements et le contraste texte de base sont contrôlés automatiquement.
- Le jugement esthétique pixel par pixel, le rendu exact à zoom 200 %, les polices système atypiques, le contraste élevé OS et l’usage complet avec lecteurs d’écran conservent une part d’inspection humaine.
- Les scénarios Chromium restent utiles pour les contrats DOM mais ne sont plus la seule preuve des onglets Dashboard/Options.

## Cycle de vie et stockage

- La purge immédiate dépend du cycle de vie de l’Experiment lorsqu’il est chargé ; la sentinelle Gecko continue de protéger la réinstallation normale.
- Les sauvegardes exportées manuellement hors des dossiers gérés par MailPerch ne peuvent ni ne doivent être effacées automatiquement.
- Le propriétaire du profil local et toute personne disposant de la Browser Toolbox contrôlent déjà le processus Thunderbird ; MailPerch ne crée pas une frontière d’autorisation contre cet acteur.

## Build et publication

- Les builds ZIP répétés sur un même environnement sont binaires identiques, mais Python `zipfile`/zlib peut produire des conteneurs différents entre Windows et Linux malgré des entrées décompressées identiques. `MP-2026-018` suit cette reproductibilité inter-plateforme.
- Les SHA-256 de la release GitHub sont autoritatifs pour les artefacts publiés.
- Les actions GitHub sont épinglées à des commits précis et suivies par Dependabot.
- Le portail ATN doit encore accepter l’identifiant, le nom, la licence et la matrice de compatibilité réelle avant diffusion catalogue.

## Sécurité

Une sécurité absolue ne peut pas être garantie. Toute nouvelle version Thunderbird ou modification de l’API Experiment exige une nouvelle revue des frontières privilégiées et des tests réels. Les téléchargements Thunderbird/geckodriver du banc sont des dépendances **de test uniquement** et ne modifient pas la promesse locale/no-network de l’extension installée.
