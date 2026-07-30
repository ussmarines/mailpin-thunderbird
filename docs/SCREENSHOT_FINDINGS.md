# Constats issus des captures du 30 juillet 2026

## Capture du panneau

- les anciens contrôles « C », « ↗ » et « + » étaient cryptiques ; remplacés par des icônes avec libellés accessibles ;
- une carte sélectionnée affichait trop d’actions symboliques ; la barre rapide est réduite et le reste passe dans un menu ;
- le clic droit ne produisait pas de résultat visible ; le menu est désormais capturé, fixé au viewport et accessible au clavier.

## Capture du dashboard

- la page apparaissait comme du HTML non stylé, sans données ; l’ancienne implémentation l’ouvrait directement depuis le contexte privilégié ; cette route empêchait une validation fiable du chargement des ressources ;
- l’ouverture passe maintenant par un événement vers le background puis `tabs.create` ;
- la page comprend une feuille de style, un état de chargement, un état d’erreur et des vues vides explicites.

## Capture avec contour bleu pointillé

- le panneau conservait un attribut de cible de drop après certaines sorties de drag ;
- les attributs visuels sont nettoyés à chaque dragover, dragend, dragleave, drop, blur, resize et changement de dossier ;
- la règle CSS est limitée au panneau.

Ces correctifs restent à confirmer dans une session Thunderbird réelle.
