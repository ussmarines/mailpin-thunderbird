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

## Règles pour les futures modifications

- toute nouvelle méthode Experiment doit valider et borner ses entrées ;
- toute opération proposée dans l’interface doit être revalidée côté privilégié ;
- aucune permission ne doit être ajoutée sans justification documentée ;
- aucune URL distante ou dépendance d’exécution ne doit être introduite ;
- aucun secret ne doit être nécessaire au fonctionnement ;
- toute action automatique importée doit rester désactivée jusqu’à validation ;
- toute nouvelle donnée persistante doit être incluse dans la purge de désinstallation ;
- les tests de sécurité 3.2.4 et les contrôles de release 1.1.2 doivent rester verts.
