# Plan de test manuel MailPin — 1.7.1

Utiliser de préférence un profil Thunderbird jetable avec des messages synthétiques pour les scénarios destructifs ou de migration. Pour une validation utilisateur finale, un profil réel peut être utilisé après sauvegarde, en évitant toute opération destructive non nécessaire.

Le présent plan complète les validations automatisées de la source 1.7.1. La dernière release publique est 1.7.0. La 1.7.1 ne modifie pas le runtime UI ou métier ; elle durcit les métadonnées et gardes de dépôt. La recette humaine Organic Workspace ci-dessous reste utile pour ATN et pour toute évolution UI future, mais elle n’est pas artificiellement rejouée comme gate de cette maintenance si aucun fichier UI/runtime concerné n’a changé.

## Recette Organic Workspace conservée — validation humaine/ATN

1. Dans Options, ouvrir les règles personnalisées en FR puis EN et vérifier à 100/125/200 % que l’aide reste lisible, que les trois actions passent proprement à la ligne et qu’aucun scroll horizontal n’apparaît.
2. Dans le Dashboard puis le panneau Thunderbird, ouvrir Agenda sur une petite fenêtre : une nouvelle création doit démarrer sur **Événement** ; créer un événement avec début/fin personnalisés, puis choisir Tâche avec et sans calendrier compatible. Sans destination tâche, aucun sélecteur vide ne doit apparaître, l’explication doit être visible et la création désactivée. Vérifier aussi qu’un élément Agenda existant conserve son type réel.
3. Sur une carte active, cliquer **En attente** : un seul badge En attente doit apparaître. Cliquer **Repasser à traiter** : statut actif, aucun badge d’attente et aucune échéance résiduelle liée à cette attente.
4. Ouvrir **Me relancer si aucune réponse**, tester la valeur par défaut, demain, 3/5/7 jours et une date personnalisée ; vérifier l’aperçu, la modification d’un suivi existant et son arrêt.
5. Épingler une ligne/message puis utiliser une autre entrée générique : la seconde action doit désépingler sans carte parallèle. Refaire toolbar → ligne, avec cibles par défaut message/conversation et conversations activées/désactivées.
6. Utiliser l’action explicitement conversation puis une entrée générique inverse ; vérifier qu’une seule référence logique subsiste et que notes, checklist, échéance, groupe et Agenda ne sont pas perdus.
7. Avec une fenêtre Thunderbird globalement large, déplacer continûment le splitter du panneau entre environ 800 et 280 px ; vérifier header, recherche, filtres, cartes, actions et absence de scroll horizontal ou sauts de layout.

Pour GitHub, le GO 1.7.1 dépend des QA Linux/Windows, de la garde sécurité, du build reproductible et du smoke Thunderbird réel sur le candidat exact. La recette UI humaine supplémentaire n’est pas déclarée comme exécutée ; elle reste une validation ATN/humaine distincte puisque cette release ne modifie pas ces surfaces.

## Priorité A — intégration Thunderbird consolidée

1. Installer l’XPI construit depuis le commit testé et vérifier l’ID/niveau d’accès attendu.
2. Ouvrir plusieurs fenêtres ou onglets de courrier et confirmer une seule injection du panneau par `about:3pane`.
3. Épingler puis désépingler depuis : ligne native, menu contextuel, message affiché et carte épinglée.
4. Clic, double-clic, clic droit, `Shift+F10` et bouton Plus sur plusieurs variantes de cartes.
5. Ouvrir **Modifier** sur une carte avec et sans checklist, ajouter/cocher une sous-tâche, enregistrer, rouvrir et confirmer l’absence d’exception ainsi que la persistance.
6. Vérifier qu’un simple épinglage ne change ni état lu/non lu ni compteurs natifs.
7. Déplacer/copier un message entre dossiers puis vérifier que la référence reste résoluble lorsque Thunderbird fournit les identités nécessaires.
8. Archiver un message depuis MailPin et vérifier le résultat natif sans double action.
9. Ouvrir une réponse depuis MailPin et confirmer le bon message/conversation.
10. Fermer/réouvrir Thunderbird, puis confirmer que le panneau, les épingles et les listeners reviennent une seule fois.
11. Désactiver/réactiver l’extension dans un profil de test et contrôler l’absence de nœuds/listeners dupliqués.

## Priorité B — Tags Thunderbird

1. Créer auparavant au moins un tag personnel Thunderbird et noter sa clé/libellé.
2. Activer la synchronisation MailPin Tags.
3. Vérifier la création des tags MailPin attendus et leur application selon statut/priorité/relance.
4. Changer le statut d’une épingle puis contrôler la mise à jour des mots-clés.
5. Tester une conversation et, si utilisé, un dossier virtuel.
6. Désactiver la synchronisation : seuls les mots-clés/définitions possédés par MailPin doivent être retirés.
7. Vérifier que le tag personnel est strictement inchangé.
8. Dans un profil jetable, provoquer une collision de clé avec un autre libellé : MailPin doit refuser sans créer partiellement les autres définitions.

## Priorité C — Agenda

1. Tester un calendrier local inscriptible.
2. Créer explicitement une tâche puis un événement depuis une épingle.
3. Choisir le calendrier voulu lorsque plusieurs calendriers sont présents.
4. Modifier échéance/état dans MailPin puis confirmer Agenda.
5. Modifier échéance/état dans Agenda puis confirmer le retour MailPin.
6. Tester un calendrier lecture seule/non compatible : l’action concernée doit être indisponible ou échouer proprement, sans casser le panneau.
7. Refaire avec chaque fournisseur Agenda réellement annoncé/utilisé avant publication générale.
8. Fermer/réouvrir Thunderbird et vérifier que les observateurs ne créent ni doublon ni boucle.

## Priorité D — Options simplifiées

### Mode Recommandé

1. Ouvrir Options sur un profil existant et noter : calendrier préféré, groupe d’attente, dossier de sauvegarde, couleurs de comptes et boîtes activées.
2. Vérifier les catégories visibles : **Essentiel**, **Organisation**, **Automatisation** ; les blocs techniques **Avancé** doivent être masqués.
3. Utiliser la recherche et la navigation sur les sections visibles.
4. Cliquer sur l’action d’application des réglages recommandés.
5. Vérifier qu’aucun enregistrement n’a encore eu lieu et que le formulaire est marqué modifié.
6. Vérifier que les valeurs propres au profil notées à l’étape 1 sont conservées.
7. Cliquer Annuler : la configuration enregistrée doit rester intacte.
8. Réappliquer puis cliquer Enregistrer : fermer/réouvrir Options et Thunderbird, puis confirmer la persistance.

### Mode Avancé

1. Passer en mode Avancé et confirmer l’apparition des sections **Avancé**.
2. Vérifier qu’aucun réglage historique n’a disparu.
3. Modifier un champ texte, une case, un nombre et une liste ; tester Enregistrer, Annuler et `Ctrl/Cmd+S`.
4. Vérifier que les notifications de succès/erreur restent visibles à l’endroit où l’utilisateur se trouve.
5. Tester clair/sombre, largeur réduite et zoom 100/125/200 %.

## Priorité E — fonctions 1.2 conservées

1. **Notes/checklists** : saisir, ajouter/cocher/décocher/supprimer, redémarrer et confirmer la persistance.
2. **Recherche globale** : retrouver par objet, auteur, note, sous-tâche, groupe, affaire et tag ; aucun résultat ne doit dépendre du corps.
3. **Palette de commandes** : bouton dashboard, `Ctrl/Cmd+K`, navigation clavier, Entrée/Échap.
4. **Vues enregistrées** : créer, redémarrer, appliquer puis supprimer.
5. **J’attends / Je dois répondre** : contrôler sur des messages entrants/sortants connus.
6. **Statistiques** : comparer avec un jeu de données connu.
7. **Rappels / veille / revue** : échéance, report, acquittement, réveil et vues Aujourd’hui/Revue.
8. **Dashboard/Kanban** : vues, états vides, actions groupées et historique.

## Priorité F — responsive MP-2026-019

1. Ouvrir une liste comportant plusieurs épingles.
2. Réduire puis agrandir plusieurs fois la largeur du volet autour du seuil responsive.
3. Vérifier l’absence de grand bloc vide entre outils et cartes.
4. Sans rappel actif, vérifier l’absence totale de bande orange.
5. Avec un rappel arrivé à échéance, le centre orange doit apparaître avec contenu/actions.
6. Acquitter ou reporter : il doit disparaître lorsqu’il redevient vide.
7. Refaire en clair/sombre et zoom 100/125/200 %.

Le 8 août 2026, l’utilisateur a indiqué ne pas avoir reproduit de problème pendant la passe réelle 1.2.1 demandée. La matrice zoom/thème/rappel reste néanmoins utile lors de la future release car l’interface Options et l’intégration auront changé.

## Priorité G — migration et cycle de vie

1. Sur profil jetable, partir d’une release stable avec données synthétiques et exporter une sauvegarde.
2. Installer la future release de consolidation et confirmer pins, notes, groupes, affaires, règles, vues et Agenda.
3. Redémarrer Thunderbird et vérifier à nouveau.
4. Désinstaller dans le profil jetable puis vérifier la purge des données gérées.
5. Réinstaller et confirmer un démarrage propre avec valeurs recommandées.
6. Restaurer une sauvegarde valide et tester l’aperçu d’un import malformé/volumineux sans écriture partielle.

## Matrice à consigner avant ATN

Pour chaque validation formelle, noter :

- version Thunderbird exacte ;
- système et version ;
- IMAP/POP/local/Gmail/Microsoft/autre ;
- dossier normal/boîte unifiée/virtuel ;
- calendrier local/fournisseur ;
- thème et zoom ;
- XPI + SHA-256 ;
- résultat et capture/log si échec.

## Invariants finaux

- l’épinglage ne change pas l’état lu/non lu ni les compteurs ;
- une seule étoile native et une seule punaise MailPin sont visibles ;
- aucun tag personnel n’est modifié ;
- une capacité Agenda/Tags absente ne fait pas tomber tout MailPin ;
- aucune action destructive n’est exécutée sans confirmation attendue ;
- aucune donnée utilisateur ne quitte le poste ;
- le XPI testé correspond au SHA-256 du commit/release contrôlé.
