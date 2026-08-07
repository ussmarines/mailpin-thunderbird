# Modèle de données

## Référence épinglée

Une référence contient notamment :

- `stableKey` : clé interne de l’extension ;
- identifiants Message-ID, Gmail et signature de secours ;
- compte, dossier, clé locale et dernier emplacement connu ;
- objet, auteur, date et taille ;
- mode message/conversation ;
- note, checklist/sous-tâches, groupe, affaire, modèle et priorité ;
- échéance, rappel, relance et récurrence ;
- statut de workflow, `lastReplyAt`, `lastOutgoingAt`, `waitingSince` et dates d’activité ;
- `noReplyTracking`, `noReplyAt`, `noReplyStartedAt` et empreinte de départ pour le suivi sans réponse ;
- `snoozeUntil` pour masquer temporairement l’élément des vues actives ;
- `reminderFiredAt` et `reminderAcknowledgedAt` pour conserver l’état d’un rappel interactif sans le répéter après acquittement ;
- identifiants Agenda et éventuelle erreur de synchronisation ;
- état local de synchronisation des tags MailPerch (`tagLastSyncedAt`, erreur éventuelle) ;
- `updatedAt` pour la résolution de concurrence.

Le corps du message et les pièces jointes ne sont pas stockés.

## Tables et collections structurées

- `refs` : références épinglées ;
- `groups_data` : groupes personnalisés ;
- `rules_data` : règles ;
- `cases_data` : affaires ;
- `templates` : modèles ;
- `ui_state` / `state_data` : ordre, panneau, vue intelligente, dashboard et vues enregistrées ;
- `providerMatrix` : dernier résultat local de compatibilité des comptes/calendriers ;
- `activity`, `rule_log` et diagnostic : journaux bornés ;
- `undo_log` : pile d’annulation bornée ;
- snapshots/métadonnées : récupération, révision et santé.

## Identité d’un message

Ordre de préférence : identifiant Gmail, Message-ID normalisé, compte+dossier+clé, puis empreinte de secours. Une conversation privilégie le fil Gmail, la racine de `References`, le `threadId`, puis une signature prudente pour l’affichage et la résolution.

La détection des éléments fusionnables est volontairement plus stricte que la résolution générale : elle exige un fil Gmail, un Message-ID racine, un `threadId` Thunderbird ou une `conversationKey` construite à partir de l’une de ces identités fortes, dans le même compte. L’objet seul, même normalisé, ne permet jamais une fusion.

## Mise en veille et rappels

Une mise en veille place une date future dans `snoozeUntil`. Tant que cette date n’est pas atteinte :

- l’élément est exclu des vues de travail ordinaires ;
- il reste disponible dans la vue **En veille** ;
- il peut être réveillé manuellement ;
- son réveil alimente la vue Aujourd’hui/Revue lorsque l’échéance approche.

Lorsqu’un rappel devient exigible, `reminderFiredAt` est posé. Le centre interactif affiche l’élément tant que `reminderAcknowledgedAt` n’est pas plus récent. Reporter réinitialise l’acquittement et calcule une nouvelle échéance ; ignorer acquitte le rappel sans supprimer l’épingle.

## Vues Aujourd’hui et Revue

Les plans quotidien et hebdomadaire sont calculés à partir des références, sans collection persistante supplémentaire. Les catégories dérivées comprennent notamment :

- en retard ;
- aujourd’hui ;
- réponse attendue ;
- réveil de veille ;
- en attente ;
- inactif ;
- à venir.

Seuls le mode de revue et la vue choisie sont persistés dans `ui_state`. Les listes et compteurs sont recalculés au chargement afin de rester cohérents avec les dates courantes.

## Fusion des éléments associés

La fusion :

1. reçoit entre 2 et 50 `stableKey` ;
2. résout les références présentes ;
3. exige au moins une identité forte commune à toutes ;
4. refuse plusieurs liens Agenda distincts ;
5. crée ou actualise une référence de conversation ;
6. conserve les notes uniques, la priorité la plus haute et les premières échéances positives ;
7. retire les références devenues redondantes sans supprimer leurs éléments Agenda ;
8. enregistre une entrée d’historique et une opération annulable.

Les groupes et affaires divergents sont signalés dans le résultat. La référence principale conserve une valeur déterministe ; aucune fusion n’est déclenchée automatiquement.

## Règles et simulation

La simulation accepte un brouillon de règles non encore enregistré. Elle applique les mêmes normalisations et conditions que l’exécution, mais ne modifie ni les messages, ni les références, ni la base. Le résultat est borné et indique le volume scanné, les correspondances par règle et une éventuelle troncature.

## Raccourcis

Les raccourcis sont stockés dans la configuration sous forme d’un dictionnaire `commande → combinaison`. Ils sont appliqués via l’API `commands` et exportés avec les paramètres. L’ancien champ unique `shortcut` reste lu pour restaurer les sauvegardes antérieures.

## Vues intelligentes

Les vues sont calculées à partir des références et de l’état résolu du message. Elles ne dupliquent pas les références dans le stockage. Les compteurs sont dérivés au chargement à partir des échéances, statuts, réponses, erreurs Agenda, état lu/non lu, veille et messages introuvables.

## Migrations et restaurations

Le schéma logique paramètres/données courant est 7 ; le schéma SQLite physique reste 5 car les nouveaux champs sont contenus dans les payloads JSON et `state_data`. Une migration ou restauration doit :

1. valider format, version, collections, limites et clés ;
2. créer une sauvegarde préalable obligatoire ;
3. afficher les volumes et conflits avant écriture ;
4. être transactionnelle et reprenable après interruption ;
5. fusionner les entités par identifiant et horodatage ou remplacer explicitement ;
6. conserver l’ancien identifiant d’extension ;
7. ne jamais supprimer silencieusement les données non reconnues.

Les champs introduits en 1.1.0 et 1.2.0 sont facultatifs et reçoivent une valeur neutre lors de la normalisation, afin que les sauvegardes 1.0.0 à 1.1.x restent importables.

## Checklists et vues enregistrées

Une checklist contient au maximum 50 entrées. Chaque entrée possède un identifiant local borné, un texte de 240 caractères maximum, son état et ses dates de création/achèvement. La note d’une référence et la note d’une affaire sont bornées à 4 000 caractères.

Une vue enregistrée contient un nom et des critères fermés : vue intelligente, recherche, groupe, affaire, priorité, état de réponse et état de checklist. Elle ne contient aucune copie de message. Le nombre de vues est limité à 30.

## États de réponse et statistiques

`waitingForThem` signifie que le dernier événement de conversation connu est sortant, ou qu’un workflow d’attente/relance a été posé manuellement. `needsReply` signifie que le dernier événement connu est entrant et plus récent que le dernier sortant. Les statistiques sont dérivées localement des références et de l’historique : âges d’ouverture/attente, sous-tâches restantes et éléments terminés sur sept jours.

## Tags Thunderbird

Les clés gérées sont fermées (`mailperch-active`, `mailperch-waiting`, `mailperch-planned`, `mailperch-completed`, `mailperch-important`, `mailperch-follow-up`). MailPerch refuse une collision si une de ces clés existe avec un libellé différent. La suppression ne vise que les définitions dont la clé **et** le libellé correspondent exactement aux valeurs MailPerch.
