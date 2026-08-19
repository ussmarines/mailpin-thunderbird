# Journal des modifications

## 1.7.4 — compatibilité Thunderbird 154

- étend la compatibilité déclarée de Thunderbird `153.0` jusqu’à `154.*` afin de rétablir l’installation sur Thunderbird 154 ;
- déplace le smoke runtime automatisé sur le binaire officiel Thunderbird 154.0, téléchargé et vérifié par SHA-256 ;
- valide sur Thunderbird 154 le démarrage de l’Experiment/background MV3, l’injection unique du panneau, l’ouverture unique du Dashboard, le nettoyage après désinstallation et la réinstallation propre ;
- conserve `PinCompatibility`, la logique métier, les schémas, le stockage et l’identité inchangés ;
- n’ajoute aucune permission, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant.

## 1.7.3 — consolidation UI en dur et contraste

- supprime la couche runtime `interaction-stability.css` et son chargement dynamique depuis `theme.js` ;
- consolide les corrections de stabilité directement dans `extension/styles/workspace.css`, source de vérité Organic Workspace ;
- augmente l’espacement structurel entre les groupes de réglages, notamment Agenda, Règles et Centre de santé ;
- restaure un contraste sémantique lisible du bouton **Annuler** dans la barre de sauvegarde en thème sombre comme clair ;
- conserve les correctifs 1.7.2 sur les statistiques Dashboard, navigation des Paramètres, notifications, cartes Agenda et raccourcis ;
- ajoute des contrats de non-régression interdisant le retour d’une feuille CSS corrective empilée ;
- ne modifie aucune permission, migration, schéma, logique métier, dépendance runtime, connexion réseau, télémétrie ou identité.

## 1.7.2 — stabilité de navigation et corrections d’interface

- stabilise « Plus de statistiques » et la navigation Options ;
- maintient Enregistrer/Annuler et les notifications dans le viewport ;
- améliore espacements, cartes Agenda et raccourcis ;
- conserve les frontières Thunderbird, permissions, stockage et politique local-first inchangés.

## 1.7.1 — durcissement pré-publication et cohérence des métadonnées

- corrige la dérive des métadonnées post-release ;
- renforce les gardes de version et de source reviewer hors Git ;
- conserve la logique métier, les permissions, les schémas et le réseau inchangés.

## Historique antérieur

Les détails complets des versions 1.7.0 et antérieures restent conservés dans l’historique Git et les releases GitHub. Les documents actifs se concentrent sur les versions encore pertinentes pour les validations courantes.
