# Couche de compatibilité Thunderbird

## Objectif

Cette couche isole les appels aux API internes de Thunderbird du métier MailPin. Elle ne cherche pas à masquer toutes les différences de version possibles ; elle fournit des contrats petits, testables et explicites pour les fonctions que MailPin utilise réellement.

Le principe est :

```text
Logique MailPin
  pins / règles / workflows / checklists / vues / analytics
                         │
                         ▼
                  PinCompatibility
                 /       |        \
                /        |         \
        messages        tags       calendar
            │             │           │
  MailServices/MailUtils  │       cal / CalEvent /
  MessageArchiver         │       CalTodo / ACL
                          │
                  MailServices.tags
                  mots-clés dossier
                         │
                         ▼
               API internes Thunderbird
```

`extension/api/pinInbox/implementation.js` reste responsable du cycle de vie de l’Experiment, de l’injection `about:3pane` et de la coordination. Il ne doit plus réimplémenter les opérations Messages, Tags ou Agenda qui appartiennent aux adaptateurs.

## Fichiers

- façade : `extension/api/pinInbox/modules/compatibility.js` ;
- messages : `extension/api/pinInbox/modules/thunderbird-messages.js` ;
- tags : `extension/api/pinInbox/modules/thunderbird-tags.js` ;
- Agenda : `extension/api/pinInbox/modules/thunderbird-calendar.js` ;
- orchestrateur : `extension/api/pinInbox/implementation.js` ;
- garde de frontière : `tests/test_thunderbird_compatibility_boundary.py` ;
- tests de contrat : `tests/thunderbird_compatibility_contract.mjs`.

## Contrat Messages

L’adaptateur Messages concentre notamment :

- l’énumération des comptes et identités ;
- le parcours de dossiers, avec repli pour les formes d’énumérateur plus anciennes ;
- la résolution d’un compte et d’un dossier ;
- la résolution bornée d’un en-tête ;
- l’enregistrement et le retrait des notifications de dossiers ;
- l’affichage d’un dossier ou d’un message ;
- l’ouverture d’une réponse ;
- l’archivage via `MessageArchiver` ;
- un instantané des capacités réellement injectées.

La résolution d’en-tête reste bornée. Une modification future ne doit pas transformer une recherche de référence en balayage illimité du profil.

## Contrat Tags

L’adaptateur Tags est la seule frontière chargée de manipuler les définitions de tags Thunderbird et les mots-clés des messages.

Invariants :

1. toutes les collisions de définitions sont vérifiées **avant** la première création ;
2. un tag existant dont le libellé ne correspond pas exactement à celui attendu par MailPin est traité comme une collision ;
3. MailPin ne renomme, n’adopte et ne supprime jamais un tag personnel ;
4. les opérations par messages sont regroupées par dossier ;
5. la désactivation retire uniquement les mots-clés et définitions dont la propriété MailPin est démontrée.

## Contrat Agenda

L’adaptateur Agenda concentre :

- l’énumération/résolution des calendriers ;
- la détection des tâches et événements supportés ;
- `readOnly`, désactivation, ACL et capacité d’écriture ;
- la conversion des dates ;
- la construction d’événements et tâches ;
- l’ajout, la modification, la lecture et la suppression d’items ;
- l’enregistrement et le retrait des observateurs Agenda ;
- un instantané des capacités disponibles.

Agenda est une capacité facultative. Une indisponibilité de `cal`, `CalEvent` ou `CalTodo` doit dégrader la fonction concernée et apparaître dans la matrice de compatibilité ; elle ne doit pas empêcher le panneau MailPin de démarrer.

## Construction de la façade

`PinCompatibility.create(dependencies)` reçoit explicitement les services privilégiés. Cette injection a deux buts :

- rendre les dépendances Thunderbird visibles à un seul endroit ;
- permettre aux tests Node de fournir des faux services déterministes sans démarrer Thunderbird.

Toute dépendance privilégiée injectée doit elle-même être importée ou définie explicitement **avant** la création de la façade. La branche a démontré pourquoi : rendre `ExtensionError` immédiatement nécessaire a révélé un identifiant global implicite et provoqué un crash de bootstrap réel. `ExtensionError` est désormais importé depuis `ExtensionUtils.sys.mjs` et une garde protège ce contrat.

Les tests de contrat ne prétendent pas remplacer un vrai Thunderbird. Ils vérifient le contrat de la couche de compatibilité et empêchent les régressions de logique avant le banc runtime.

## Ce qui reste volontairement dans l’orchestrateur

Le DOM interne `about:3pane` reste actuellement dans `implementation.js`, notamment `_setupAbout3Pane()`. Cette zone est couplée aux structures de `ThreadCard`, au `tabmail`, au menu contextuel natif et au cycle des fenêtres.

La déplacer en une seule passe serait plus risqué que bénéfique. Les futures extractions doivent être progressives et accompagnées d’un test runtime réel. L’objectif de cette consolidation est de réduire les accès directs aux services Thunderbird sans réécrire simultanément toute l’intégration graphique.

## Politique de dégradation

Une fonction facultative indisponible ne doit pas faire tomber tout MailPin.

- Messages : indispensable au fonctionnement principal ; une absence de services cœur est une incompatibilité bloquante clairement diagnostiquée.
- Tags : facultatifs et désactivés par défaut ; une absence doit neutraliser uniquement la synchronisation de tags.
- Agenda : facultatif ; une absence ou un calendrier non inscriptible doit neutraliser uniquement les actions concernées.
- UI `about:3pane` : si la structure native change, MailPin doit éviter les doubles injections, nettoyer ce qu’il a créé et produire un diagnostic technique expurgé.

## Règle pour le nouveau code

Tout nouveau code métier doit demander une opération à la façade ou à un module pur. Il ne doit pas importer ni appeler directement `MailServices`, `MailUtils`, `MessageArchiver`, `cal`, `CalEvent` ou `CalTodo` depuis une nouvelle logique métier.

Avant d’ajouter une nouvelle capacité Thunderbird :

1. identifier si elle appartient à Messages, Tags, Agenda ou à une future frontière distincte ;
2. définir le plus petit contrat nécessaire ;
3. injecter la dépendance native dans l’adaptateur ;
4. ajouter un test de contrat avec faux services ;
5. ajouter ou adapter une garde de frontière ;
6. exécuter les tests ciblés puis `npm run ci` ;
7. valider le chemin dans un vrai Thunderbird si le comportement dépend du DOM, du fournisseur ou du cycle de vie.

## Compatibilité de versions

Depuis 1.5.1, le manifeste déclare Thunderbird `153.0` à `153.*`. Cette plage a été resserrée après des essais réels : 128/140 injectent le panneau après activation mais ne garantissent pas l’ouverture du Dashboard via le pont MV3 Experiment → background. MailPin ne revendique donc que la branche 153 réellement validée.

Toute future adaptation de version doit rester localisée autant que possible dans ces adaptateurs et être documentée dans `docs/KNOWN_LIMITATIONS.md` et `docs/BUG_TRACKER.md` si elle corrige une régression observée.

### Preuve runtime actuelle

Le 8 août 2026, le banc réel a validé Thunderbird **153.0.1 ESR** Linux sur un profil local synthétique : vue `about:3pane` prête, Experiment/background à `Startup: Complete`, panneau et bouton injectés une seule fois, nettoyage après désinstallation, puis réinstallation sans duplication. Cela valide le bootstrap et le cycle de vie de la frontière sur la branche 153 déclarée, pas les fournisseurs réels.
