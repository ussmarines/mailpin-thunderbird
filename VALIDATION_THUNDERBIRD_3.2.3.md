# Validation Thunderbird — MailPerch 3.2.3

Base : Thunderbird 153.0.1 sous Windows, puis au moins une version ESR prise en charge.
Utiliser un profil de test et fermer toutes les fenêtres Thunderbird après installation du XPI.

## 1. Liste générale des messages

- Vérifier une carte avec étoile, punaise et bouton `…` : les trois commandes sont centrées verticalement, avec une marge haute et basse équivalente.
- Contrôler les vues Compacte, Normale et Tactile de Thunderbird : aucune commande ne chevauche la date, l’objet ou l’aperçu.
- Tester objet long, expéditeur long, message nouveau, non lu, étoilé et avec pièce jointe.
- Faire défiler un dossier volumineux : aucune dérive verticale ni superposition progressive.

## 2. Densités MailPerch

- Choisir Compact, Recommandé puis Aéré dans les paramètres.
- Confirmer que seul l’espacement de la page Paramètres change.
- Confirmer que les lignes de messages natives et le panneau principal restent lisibles et stables.
- Tester les cartes épinglées avec objet, note, groupe, échéance et actions rapides.

## 3. Notifications des paramètres

- Enregistrer une modification.
- Vérifier que le bouton de fermeture `×` est en haut à droite du toast.
- Vérifier que le toast ne masque ni la navigation ni la barre Enregistrer/Annuler.
- Tester succès, erreur et opération en cours.

## 4. Paramètres et formulaires

- Vérifier chaque interrupteur : case, titre et aide sont alignés sans chevauchement.
- Vérifier les boutons Simuler, Ajouter une règle et Vider le journal : chaque aide reste sous son propre bouton.
- Créer/modifier/supprimer un groupe : nom, couleur, ordre et suppression restent lisibles.
- Vérifier les comptes : aucune adresse n’est répétée deux fois lorsque nom et e-mail sont identiques.
- Vérifier Agenda : les capacités Tâches/Événements correspondent réellement au calendrier et aucun libellé « Inscriptible » n’apparaît.
- Vérifier qu’il n’existe qu’une seule action principale d’enregistrement visible lorsque la page est modifiée.

## 5. Centre de santé

- Lancer Analyser maintenant.
- Vérifier que les aides de chaque bouton ne se mélangent pas.
- Exporter le diagnostic et vérifier qu’aucun corps de message ni pièce jointe n’est présent.

## 6. Régressions fonctionnelles

- Clic droit et bouton `…` sur une carte épinglée.
- Épingler/désépingler depuis la liste native.
- Affecter puis retirer un groupe.
- Ouvrir le tableau de bord et toutes ses vues.
- Créer une tâche et un événement dans un calendrier compatible.
- Choisir un dossier de sauvegarde, sauvegarder et prévisualiser une restauration.

## 7. Résultat attendu

Consigner : version Thunderbird, OS, thème, densité native, espacement des paramètres, compte testé et résultat. Aucun échec visuel ne doit être masqué par la CI statique : joindre une capture et un diagnostic local en cas d’anomalie.
