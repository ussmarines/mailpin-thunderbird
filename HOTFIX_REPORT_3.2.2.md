# Correctif MailPerch 3.2.2

Base GitHub : `main` au commit `b8f8a00ff267602b7e7e718af32f11a1e5b1a4b8` (3.2.1).

## Incidents corrigés

- objet des messages trop proche de la bordure basse en vue Cartes ;
- première sous-ligne artificiellement agrandie par la punaise MailPerch ;
- alignement vertical incohérent entre indicateur, texte, date et boutons ;
- paramètres utilisables avant le retour de leur configuration, produisant `configuration is null` ;
- scripts npm basés sur `python3`, indisponible sous le runner Windows configuré par `actions/setup-python`.

## Choix techniques

- conservation de la hauteur virtuelle native de 46 px utilisée par `ThreadCard` ;
- répartition explicite des marges entre les deux lignes de texte ;
- punaise ramenée à une cible de 24 px dans la vue Cartes, avec icône de 18 px et variante tactile de 28 px ;
- centrage de la colonne d’état, des deux lignes, des informations d’icônes et des boutons ;
- chargement de configuration validé et retenté quatre fois sur une courte fenêtre ;
- boutons Enregistrer/Annuler désactivés tant que la configuration n’est pas prête ;
- scripts npm et workflow de release basés sur `python`, multiplateforme après `actions/setup-python`.

## Validation

- `npm run ci` passe dans le dépôt corrigé ;
- la même CI passe depuis l’archive source extraite ;
- les XPI et archives sources reconstruits sont identiques ;
- une validation visuelle dans Thunderbird reste nécessaire pour confirmer le rendu avec les densités Compacte, Normale et Tactile.
