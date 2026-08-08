# Frontière de sécurité MailPerch

## Principe

MailPerch n’a ni serveur, ni compte applicatif, ni rôle administrateur. Toutes les données sont locales au profil Thunderbird. Il ne doit donc jamais exister de paramètre `admin`, `isAdmin`, rôle caché, jeton maître ou contrôle d’autorisation reposant uniquement sur l’interface.

La frontière de confiance réelle est la suivante :

```text
message / sauvegarde JSON / interaction utilisateur
                    │ données non fiables
                    ▼
pages WebExtension (options, dashboard, background)
                    │ API structurée et validée
                    ▼
Experiment privilégié pinInbox
                    │ validation / orchestration
                    ▼
          couche de compatibilité
       Messages / Tags / Agenda
                    │ opérations Thunderbird autorisées
                    ▼
messages, Agenda, SQLite, préférences et sauvegardes locales
```

## Ce qui est protégé

- le contenu d’un message ne peut pas injecter de HTML, script ou style actif ;
- une sauvegarde importée est bornée, normalisée et rendue inerte ;
- une page d’extension ne peut pas choisir arbitrairement un chemin disque ;
- aucune connexion réseau, télémétrie, publicité ou code distant n’est permis ;
- les opérations groupées et objets API ont des limites de taille et de profondeur ;
- les suppressions déclenchées depuis l’interface utilisent les confirmations prévues ;
- la désinstallation ferme les écritures puis supprime les données du profil ;
- les diagnostics exportés masquent comptes, calendriers, chemins et contenu sensible ;
- les sauvegardes exportées retirent les chemins locaux et la matrice fournisseur propre au profil.

## Actions 1.1.0

Les fonctions de productivité utilisent la même frontière privilégiée que le reste du produit :

- la capture rapide n’accepte qu’un preset fermé (`simple`, `today`, `tomorrow`, `waiting`, `noReply`) ;
- la veille, le réveil et l’acquittement passent par `performReferenceAction` et les validations de lot ;
- les rappels interactifs n’exécutent ni envoi, ni suppression, ni déplacement de message ;
- la simulation de règles reçoit un brouillon borné et ne persiste rien ;
- les raccourcis sont appliqués par l’API Thunderbird `commands`, sans interprétation de code ;
- la fusion exige de 2 à 50 références, une identité forte commune et une confirmation visible ;
- plusieurs liens Agenda distincts provoquent un refus, pas une résolution implicite ;
- les vues Aujourd’hui/Revue et les groupes associés sont des projections locales, non de nouvelles autorisations.

Le dashboard reste non privilégié. Le fait qu’il affiche une proposition de fusion ou une action disponible ne suffit pas : l’Experiment revalide systématiquement la sélection et son contexte avant toute écriture.

## Inspecteur et propriétaire du profil

Le propriétaire local qui ouvre la Boîte à outils du navigateur Thunderbird agit avec les droits de son propre profil. Il peut appeler les mêmes commandes que l’interface, modifier ses fichiers ou désinstaller l’extension. Aucun contrôle JavaScript client ne peut rendre ce propriétaire local « non administrateur ».

La protection correcte consiste donc à :

1. ne pas avoir de mode administrateur contournable ;
2. valider toutes les données au niveau privilégié ;
3. n’exposer aucune exécution de code, URL réseau ou chemin arbitraire ;
4. limiter les actions à l’ensemble explicitement supporté ;
5. considérer les imports et contenus de messages comme non fiables.

Un logiciel malveillant ayant déjà accès au profil Thunderbird, au système de fichiers ou à la Boîte à outils privilégiée est hors du modèle de menace de l’extension. MailPerch ne doit cependant pas faciliter son action par un secret, un jeton maître ou une porte dérobée : aucun de ces mécanismes n’existe.

## Désinstallation

Une API Experiment ne peut pas recevoir l’événement statique `uninstall` du manifeste. MailPerch utilise donc un écouteur AddonManager pour le signal précoce et annulable `onUninstalling`, puis l’événement cœur WebExtension `Management.uninstall`, dont la promesse est attendue par le bootstrap Gecko. L’ancien écouteur se retire sur `update` afin d’éviter une purge lors d’une mise à niveau.

Lors d’une désinstallation réelle, MailPerch :

1. bloque les nouvelles écritures de récupération ;
2. arrête observateurs, minuteries et interfaces injectées ;
3. attend la fermeture et le flush SQLite ;
4. supprime la base, WAL, SHM, journal, récupération et sauvegardes internes ;
5. retire uniquement les enveloppes `pin-mails-*.json` vérifiables d’un dossier externe choisi ;
6. supprime toute la branche de préférences `extensions.pinMails.*`.

En complément, une sentinelle primitive est conservée dans le stockage local natif de l’extension. Gecko efface ce stockage pendant sa propre procédure de désinstallation. Avant d’ouvrir SQLite, MailPerch vérifie cette sentinelle : si elle manque et qu’il ne s’agit pas de la migration unique depuis une version antérieure à 3.2.4, les éventuels résidus sont purgés et les valeurs recommandées sont recréées.

Les exports téléchargés manuellement par l’utilisateur ne sont pas suivis et ne peuvent pas être supprimés automatiquement sans risquer d’effacer des fichiers qui ne relèvent plus du profil Thunderbird.


## Isolation des API internes Thunderbird

La consolidation post-1.2.1 ne crée pas une nouvelle autorisation privilégiée : elle réduit au contraire les endroits qui connaissent les services internes Thunderbird. `PinCompatibility` injecte les services natifs dans trois adaptateurs dédiés : Messages, Tags et Agenda.

Règles de sécurité de cette frontière :

- la logique métier ne doit pas appeler directement les services cœur extraits ;
- l’adaptateur Tags conserve la vérification atomique des collisions avant toute création et la propriété par libellé exact ;
- l’adaptateur Messages conserve des recherches bornées et un nettoyage explicite des listeners ;
- l’adaptateur Agenda conserve les ACL/capacités et le nettoyage des observateurs ;
- une capacité facultative indisponible doit être signalée/désactivée localement plutôt que provoquer un repli dangereux ou un accès alternatif implicite ;
- aucun nouvel objet provenant des pages WebExtension ne devient fiable parce qu’il traverse un adaptateur : la validation de l’Experiment reste obligatoire.

Les tests de contrat injectent de faux services uniquement pendant les tests. Ils n’ajoutent aucune API ou possibilité d’exécution au XPI publié.

## Chaîne de test runtime

Le workflow de smoke Thunderbird télécharge un binaire Thunderbird et geckodriver uniquement dans GitHub Actions. Ces outils ne sont ni empaquetés dans l’extension ni appelés par elle à l’exécution. Le workflow vérifie les SHA-256 obtenus depuis les sources officielles avant lancement et utilise un profil de test éphémère.

Cette activité réseau appartient à la chaîne CI, pas au produit installé ; la promesse « aucun réseau/télémétrie dans MailPerch » reste inchangée.

## Dépendances de l’interface

Le XPI ne contient aucune dépendance npm runtime, aucun composant chargé depuis un CDN et aucun code généré à l’installation. L’évaluation de `@fluentui/web-components` 3.0.3 n’a trouvé aucun import dans l’extension et aucun chemin de bundle vers le XPI ; conserver le paquet aurait ajouté une chaîne de dépendances inutilisée et une exigence Node 22/24. Le paquet et le lockfile ont donc été retirés. Les contrôles restent natifs et les jetons Fluent 2 sont versionnés localement dans `extension/styles/tokens.css`.

## Règles pour les futures modifications

- toute nouvelle méthode Experiment doit valider et borner ses entrées ;
- toute opération proposée dans l’interface doit être revalidée côté privilégié ;
- aucune permission ne doit être ajoutée sans justification documentée ;
- aucune URL distante ou dépendance d’exécution ne doit être introduite ;
- aucun secret ne doit être nécessaire au fonctionnement ;
- toute action automatique importée doit rester désactivée jusqu’à validation ;
- toute nouvelle donnée persistante doit être incluse dans la purge de désinstallation ;
- les tests de sécurité historiques, les gardes de frontière Thunderbird et les contrôles de release de la version courante doivent rester verts.

## Extension de frontière 1.2 — tags, vues et checklists

- `updateReferenceDetails` accepte uniquement note/checklist, avec objet borné, note ≤ 4 000 caractères, checklist ≤ 50 éléments et texte ≤ 240 caractères.
- Les vues enregistrées sont limitées à 30 et n’acceptent que des critères fermés et bornés.
- La recherche globale n’accède pas au corps du message ni au contenu des pièces jointes.
- La synchronisation de tags n’ajoute aucune permission WebExtension. Elle passe par l’Experiment déjà privilégié, avec un ensemble fermé de clés `mailperch-*`.
- Une clé existante portant un autre libellé est une collision bloquante ; MailPerch ne la renomme pas, ne l’adopte pas et ne la supprime pas.
- À la désactivation ou désinstallation, les mots-clés sont retirés des messages avant la suppression des seules définitions de tags reconnues comme possédées.
- Les états **J’attends / Je dois répondre** sont dérivés d’horodatages locaux et ne déclenchent ni envoi ni appel réseau.
