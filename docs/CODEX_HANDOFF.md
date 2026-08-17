# Passage de relais — MailPin 1.7.2 candidate

## Référence

- dépôt : `ussmarines/mailpin-thunderbird` ;
- baseline : `main` à `5284e39a43513d38ededec5e7f939a685f7fdd2c` ;
- branche release : `release/1.7.2-ui-stability` ;
- version source : **1.7.2** ;
- dernière release publique : **1.7.1** ;
- `releaseStatus` : **candidate** ;
- identifiant canonique : `ussmarines.mailpin@addons.thunderbird.net`.

## Résultat visé

Publier une maintenance 1.7.2 dédiée aux problèmes UI/navigation observés dans la recette réelle du 17 août 2026 : statistiques Dashboard, navigation Options, Enregistrer/Annuler, notifications, espacements, cartes Agenda et raccourcis. Aucun élargissement métier, permission, schéma, stockage, réseau ou dépendance runtime.

## Preuves déjà acquises

- PR UI #47 sur head exact `551841858e974482f046a1980e52cfc84be71a6c` ;
- QA Linux/Windows et garde sécurité PASS — run `32024824818` ;
- smoke Thunderbird 153 réel PASS — run `32024824756` ;
- squash merge UI : `5284e39a43513d38ededec5e7f939a685f7fdd2c`.

## Gates encore requis pour la candidate versionnée

- QA Linux/Windows sur le head exact de la PR release ;
- garde sécurité/identité et build reproductible ;
- smoke Thunderbird réel sur le head exact de la PR release ;
- merge release sur `main` ;
- workflow Release depuis `main` avec `releaseStatus=candidate` ;
- vérification de `v1.7.2`, des assets et de leurs empreintes ;
- synchronisation documentaire post-publication.

La recette visuelle humaine post-correction n’est pas encore enregistrée comme exécutée. `MP-2026-018` reste `À VALIDER` pour l’identité binaire du conteneur ZIP entre plateformes.

Codex Security n’est pas utilisé.
