# Plan de test manuel

Consigner version Thunderbird, OS, thème, vue, type de compte et résultat.

## Installation et migration

- installation propre ;
- mise à niveau 3.1.4 → 3.1.5 ;
- redémarrage normal et redémarrage forcé ;
- sauvegarde puis restauration.

## Panneau

- 0, 1, 10, 100 et 1 000 épingles ;
- boîte actuelle, compte et tous les comptes ;
- thèmes clair, sombre, contraste élevé ;
- vues cartes et tableau ;
- repli, recherche, tri et groupes.

## Interactions

- clic simple sans défilement natif ;
- double-clic ;
- clic droit et toutes ses commandes ;
- `Shift+F10`, touche Menu, flèches et Échap ;
- sélection multiple ;
- drag réussi et drag annulé ;
- aucune bordure pointillée résiduelle.

## Dashboard

- ouverture depuis l’en-tête, l’action et le menu ;
- CSS/JS chargés ;
- liste, Kanban, affaires, historique ;
- actions unitaires et groupées ;
- erreur simulée et bouton Réessayer.

## Données et compteurs

- compteur non lu/nouveau inchangé après épinglage ;
- message lu et non lu ;
- déplacement, copie, archive, corbeille et restauration ;
- dossier renommé ;
- deux fenêtres simultanées ;
- hors ligne puis reconnexion.

## Agenda, règles et rappels

- calendrier local et CalDAV modifiable ;
- calendrier en lecture seule ;
- création, modification, fin et suppression ;
- règle simulée puis appliquée ;
- limite et anti-boucle ;
- veille, réveil et rappel manqué.

## Validation ciblée 3.1.5

### Cartes épinglées

- clic droit sur auteur, objet, espace vide, bouton d’action et punaise : le menu natif MailPerch s’ouvre à l’emplacement du pointeur ;
- bouton « Plus d’actions » : le même menu natif s’ouvre sous le bouton ;
- vérifier que le menu reste visible en thème clair, sombre et contraste élevé, puis qu’il se ferme après une commande, Échap, un changement de dossier ou une perte de focus ;
- tester après un tri manuel et un glisser-déposer afin de confirmer que les boutons ne déclenchent jamais le déplacement de la carte ;
- exécuter ouvrir, répondre, lu/non lu, archiver, supprimer, groupe, attente, planifier, terminer, rappel et Agenda ;
- désépingler par la punaise puis par le menu ;
- vérifier le résultat visible et l’absence de double exécution ;
- tester `Shift+F10`, touche Menu, Échap et navigation clavier.

### Agenda

- vérifier la liste des calendriers dans les paramètres, le panneau, l’éditeur et le dashboard ;
- choisir un calendrier local inscriptible, créer une tâche puis un événement ;
- refaire le test avec un calendrier CalDAV inscriptible ;
- vérifier qu’un calendrier en lecture seule, désactivé, sans ACL ou incompatible reste expliqué mais non sélectionnable ;
- modifier l’échéance et le titre d’un élément déjà lié ;
- provoquer une erreur fournisseur et vérifier que le message indique le calendrier et la cause détectée.

### Paramètres

- utiliser la recherche pour retrouver une option et un bouton ;
- parcourir chaque section avec la navigation collante ;
- vérifier une explication sous chaque contrôle et chaque bouton ;
- modifier une option en bas de page : le feedback local et le toast restent visibles ;
- vérifier les états « modifications non enregistrées », Enregistrer et Annuler ;
- lancer une opération de maintenance sans perdre les modifications en cours.

## Régressions vidéo du 30 juillet 2026

- le dashboard charge sans erreur `Unexpected properties` ;
- enregistrer les paramètres ne produit aucune erreur de schéma ;
- clic droit sur chaque zone d’une carte : auteur, objet, espace vide et punaise ;
- clic simple : le message s’affiche sans conserver la bordure de sélection multiple ;
- les actions rapides disparaissent quand la souris quitte la carte ;
- `Ctrl`/`Cmd` et `Maj` conservent leur sélection multiple distincte ;
- couleur de compte visible sur les punaises du panneau et de la liste native ;
- punaise inactive visible au survol de ligne, puis retour renforcé au survol direct ;
- punaise centrée dans son bouton en vue Cartes et Tableau ;
- création et affectation d’un groupe sans dialogue natif du navigateur ;
- ouverture du dashboard juste après le démarrage de Thunderbird, sans faux message d’indisponibilité.

## Régressions de la seconde vidéo du 30 juillet 2026

- faire défiler les paramètres jusqu’en bas, lancer chaque action et vérifier le toast dans le viewport ;
- modifier une option puis lancer Vérifier SQLite : la modification non enregistrée doit rester présente ;
- vérifier le bandeau fixe Enregistrer/Annuler après toute saisie ;
- cliquer sur auteur, objet, espace vide, bouton Plus et punaise : aucune zone morte ;
- clic droit sur chaque zone de la carte : menu MailPerch visible, jamais le menu natif seul ;
- quitter la carte : les actions rapides invisibles ne doivent plus capter les clics ;
- vérifier les couleurs de compte et le centrage des punaises dans les deux thèmes ;
- exécuter chaque action du dashboard : état occupé puis succès ou erreur visible ;
- déplacer une carte Kanban et vérifier le feedback et l’absence de contour résiduel.

## Validation ciblée 3.2.0

### Vues intelligentes et performances

- vérifier Toutes, Aujourd’hui, En retard, Cette semaine, En attente, Sans réponse, Sans échéance, Non lus, Introuvables, Agenda à vérifier et Récemment terminés ;
- comparer les compteurs entre panneau et dashboard ;
- tester 100, 500, 1 000 et 2 000 épingles ;
- confirmer que le chargement progressif ne perd ni sélection ni ordre ;
- modifier une carte et vérifier que seules les cartes nécessaires sont remplacées.

### Actions groupées

- sélectionner avec Ctrl/Cmd, Maj, clavier et Tout sélectionner dans la vue ;
- tester statut, priorité, échéance, groupe, affaire, modèle, lu/non lu et suivi sans réponse ;
- tester archivage, désépinglage et suppression avec confirmation ;
- confirmer le résultat partiel et le message d’erreur lorsqu’un message n’est plus disponible.

### Suivi automatique sans réponse

- envoyer un message avec le suivi automatique activé ;
- vérifier la date de relance, la vue Sans réponse et le redémarrage ;
- recevoir une réponse dans la conversation et confirmer l’annulation ;
- tester Message-ID dupliqué, conversation déplacée et compte hors ligne.

### Santé, diagnostic et fournisseurs

- exécuter l’analyse de santé sur une base saine puis avec une référence introuvable ;
- exporter le diagnostic et confirmer l’absence de corps, pièce jointe, adresse brute et chemin privé ;
- vider le diagnostic sans modifier les épingles ;
- exécuter la matrice sur IMAP, POP, Gmail, Microsoft, dossiers locaux et chaque calendrier ;
- vérifier les réparations sûres après création automatique d’une sauvegarde.

### Restauration et migration

- prévisualiser une sauvegarde valide, ancienne, conflictuelle, trop volumineuse et malformée ;
- vérifier les stratégies Fusionner et Remplacer ;
- confirmer la sauvegarde de sécurité avant chaque écriture ;
- interrompre volontairement une restauration et vérifier le rollback ou la récupération.

### UX, accessibilité et liste générale

- utiliser la navigation groupée des paramètres, la recherche et Échap pour effacer la recherche ;
- tester les modes Guidé/Avancé et Compact/Équilibré/Très aéré ;
- vérifier zoom 125 %, 150 % et 200 %, thèmes clair/sombre/contraste élevé ;
- tester Tab, flèches, Home, End, PageUp, PageDown, Entrée, Espace, Shift+F10 et Échap ;
- confirmer que le focus revient au bouton après fermeture du menu ;
- vérifier que la ligne générale est légèrement plus haute et que la punaise 36×36 est centrée, éloignée du bord supérieur et ne chevauche aucun texte.

## Validation ciblée 3.2.1

### Tableau de bord

- ouvrir successivement Liste, Kanban, Affaires, Historique et Centre de santé ;
- confirmer l’absence d’écran d’erreur et le retour correct à la vue Liste ;
- vérifier Réessayer après une erreur provoquée volontairement dans un profil de test.

### Menu des messages généraux

- sur un message non épinglé, vérifier les libellés « Épingler ce message » et « Épingler toute la conversation liée » ;
- après épinglage, vérifier les libellés inverses sans entrée dupliquée ;
- tester une sélection multiple et confirmer l’emploi du pluriel ;
- confirmer que l’action Conversation agit sur toute la conversation et non uniquement sur le message sélectionné.

### Groupes et liste générale

- affecter une épingle à un groupe, puis cliquer sur la puce `Nom du groupe ×` ;
- vérifier aussi « Retirer du groupe » dans le menu natif de la carte ;
- contrôler l’espacement des lignes et de l’aperçu en vue Cartes ;
- recevoir un message neuf et vérifier sa bordure, son fond, sa typographie et son icône agrandie en thèmes clair, sombre et contraste élevé.

## Validation ciblée 3.2.2

### Géométrie de la liste générale

- tester la vue Cartes avec les densités Compacte, Normale et Tactile ;
- vérifier que l’expéditeur, la date, l’objet, l’indicateur nouveau/non lu, la punaise et le menu sont centrés dans leur zone ;
- confirmer qu’une marge visible reste présente sous l’objet et qu’aucun texte ne touche la bordure ;
- vérifier les dossiers de 10, 100 et plusieurs milliers de messages afin d’écarter tout décalage de virtualisation ;
- tester les messages avec pièce jointe, étiquette, étoile, conversation et texte très long.

### Paramètres

- ouvrir la page puis changer immédiatement le niveau de réglages avant la fin du chargement ;
- vérifier qu’aucune erreur `configuration is null` n’apparaît ;
- confirmer que Enregistrer et Annuler restent désactivés pendant le chargement puis deviennent disponibles ;
- simuler une indisponibilité temporaire de l’API et vérifier le message de chargement lisible.

### CI multiplateforme

- vérifier que les jobs Linux et Windows exécutent `npm run check` puis `npm test` ;
- confirmer l’absence de commande `python3` dans les scripts npm et le workflow de release.
