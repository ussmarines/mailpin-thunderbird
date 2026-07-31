# Rapport d’évolution MailPerch 3.2.0

## Base

- dépôt : `ussmarines/mailperch-thunderbird` ;
- base de travail : MailPerch 3.1.5 ;
- cible : 3.2.0 ;
- aucune publication distante effectuée par la génération locale.

## Fonctions livrées

- modules séparés pour actions groupées, diagnostic, santé, localisation, migrations, performances, fournisseurs et vues intelligentes ;
- vues Aujourd’hui, En retard, Cette semaine, En attente, Sans réponse, Sans échéance, Non lus, Introuvables, Agenda en erreur et Récemment terminés ;
- actions groupées de statut, priorité, échéance, groupe, affaire, modèle, lecture, archivage, désépinglage et suppression ;
- suivi automatique local sans réponse, avec annulation à la détection d’une réponse entrante ;
- centre de santé, matrice fournisseurs/calendriers et export diagnostic expurgé ;
- prévisualisation et fusion des restaurations, contrôle des conflits et sauvegarde de sécurité obligatoire ;
- rendu différentiel, cache de cartes et chargement progressif ;
- paramètres guidés, navigation groupée, recherche et feedback local ;
- accessibilité clavier renforcée et couverture déclarative FR/EN ;
- zone de punaise de la liste générale agrandie et recentrée ;
- CI Linux/Windows et workflow manuel de Release Candidate.

## Sécurité des données

- rejet des formats, versions, collections et clés d’import non sûrs ;
- limite du nombre d’entités importées ;
- fusion par identifiant et horodatage ;
- sauvegarde automatique avant migration ou restauration ;
- diagnostic borné et expurgé ;
- aucune télémétrie ni requête réseau ajoutée.

## Validation attendue

`npm run ci` doit être exécuté dans le dépôt source puis une seconde fois après extraction de l’archive livrée. Une validation manuelle Thunderbird reste obligatoire pour le DOM privilégié, les popups XUL, le sélecteur de dossiers, les fournisseurs réels et l’Agenda.
