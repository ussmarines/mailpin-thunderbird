# Modèle de menace

## Actifs

- métadonnées des messages épinglés ;
- notes et échéances personnelles ;
- base locale et sauvegardes ;
- accès privilégié à Thunderbird ;
- intégrité des messages et compteurs.

## Menaces principales

1. injection de contenu provenant d’un objet/auteur de message ;
2. fuite de données par réseau ou journal ;
3. suppression/archivage involontaire ;
4. corruption ou écrasement concurrent de la base ;
5. règle automatique en boucle ;
6. observateur/minuterie restant actif après mise à jour ;
7. incompatibilité d’une version Thunderbird interne ;
8. import de sauvegarde malformée ou trop volumineuse.

## Mesures

- DOM construit avec `textContent` ;
- CSP restrictive, aucun réseau et aucun code distant ;
- confirmation des actions destructives ;
- transactions, révisions, WAL, récupération et checksums ;
- limites de règles, garde anti-boucle et désactivation sur erreurs ;
- mode de compatibilité réduit ;
- normalisation et limites d’import ;
- nettoyage complet de l’Experiment ;
- tests dédiés aux compteurs natifs.

## Risque résiduel

L’Experiment a un accès complet au client et dépend de DOM/API internes. Une validation humaine du code et des tests dans chaque version Thunderbird ciblée restent nécessaires.
