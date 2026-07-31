# Constats issus des captures du 30 juillet 2026

## Capture du panneau

- les anciens contrôles « C », « ↗ » et « + » étaient cryptiques ; remplacés par des icônes avec libellés accessibles ;
- une carte sélectionnée affichait trop d’actions symboliques ; la barre rapide est réduite et le reste passe dans un menu ;
- le clic droit ne produisait pas de résultat visible ; le menu est désormais un `menupopup` Thunderbird natif, accessible au bouton, au pointeur et au clavier.

## Capture du dashboard

- la page apparaissait comme du HTML non stylé, sans données ; l’ancienne implémentation l’ouvrait directement depuis le contexte privilégié ; cette route empêchait une validation fiable du chargement des ressources ;
- l’ouverture passe maintenant par un événement vers le background puis `tabs.create` ;
- la page comprend une feuille de style, un état de chargement, un état d’erreur et des vues vides explicites.

## Capture avec contour bleu pointillé

- le panneau conservait un attribut de cible de drop après certaines sorties de drag ;
- les attributs visuels sont nettoyés à chaque dragover, dragend, dragleave, drop, blur, resize et changement de dossier ;
- la règle CSS est limitée au panneau.

Ces correctifs restent à confirmer dans une session Thunderbird réelle.

## Captures du 31 juillet 2026 — passe 3.2.3

- l’étoile native et la punaise MailPerch étaient réparties entre deux sous-lignes et trop proches des bordures ;
  elles sont regroupées avec le bouton « Plus » dans un rail centré ;
- le réglage de confort visuel modifiait également le panneau principal ; il est désormais limité aux paramètres ;
- les toggles plaçaient l’aide comme troisième colonne flex, provoquant des chevauchements ;
- plusieurs classes HTML/JS n’avaient aucune règle CSS (`button-row`, `account-header`, `form-footer`, etc.) ;
- les aides de boutons se concaténaient, les groupes se répartissaient sur deux lignes incohérentes et les comptes
  répétaient leur adresse ;
- le libellé Agenda « Inscriptible » ne décrivait pas les capacités réelles ;
- le bouton de fermeture du toast occupait une seconde ligne à cause d’une grille à deux colonnes pour trois éléments ;
- le footer ajoutait un second bouton Enregistrer alors que le dock persistant suffisait ;
- la CI Windows conservait un retour chariot dans un chemin Git suivi.

Les règles 3.2.3 corrigent ces points et une garde vérifie désormais que chaque classe utilisée par les paramètres
possède une règle CSS.


## Captures du 31 juillet 2026 — passe 3.2.4

- le bandeau Enregistrer/Annuler apparaissait mais ses actions pouvaient rester inopérantes lorsque l’état de configuration n’était pas initialisé ; les états `configurationReady`, `dirty` et `saveInFlight` sont désormais explicites et protégés ;
- la liste native pouvait afficher deux glyphes d’étoile lorsque Thunderbird exposait simultanément `.button-star` et `.tree-button-flag` ; un seul contrôle canonique est conservé et les attributs sont nettoyés à la fermeture ;
- une réinstallation conservait les données de profil historiques ; le cycle de désinstallation ferme maintenant SQLite avant de purger base, récupération, sauvegardes internes et préférences, et une sentinelle native déclenche une purge avant initialisation si des résidus subsistent ;
- les valeurs recommandées d’une installation neuve sont Guidé, Équilibré, densité Normale et automatismes sensibles désactivés ;
- la demande de sécurité a conduit à documenter la frontière réelle : aucune notion d’administrateur client, validation au niveau Experiment, imports non fiables et chemins de fichiers réservés au sélecteur natif.
