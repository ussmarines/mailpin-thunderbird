# Limites connues

## Source 1.7.3 / release publique 1.7.2

La source **1.7.3** est une candidate corrective UI. La release publique **1.7.2** reste la version installable officielle jusqu’à publication de 1.7.3.

## Interface et accessibilité

- Le smoke Thunderbird valide le runtime fonctionnel mais ne juge pas la qualité visuelle pixel par pixel.
- Une recette humaine reste recommandée en clair/sombre, zoom 100/125/200 %, contraste forcé et largeurs réduites.
- 1.7.3 consolide les corrections dans `workspace.css`, augmente le rythme vertical et corrige le contraste Annuler ; l’absence de `interaction-stability.css` est protégée par contrat.

## Compatibilité Thunderbird

- Le manifeste déclare Thunderbird `153.0` à `153.*`.
- L’Experiment privilégié et les surfaces internes `about:3pane`, Messages, Tags et Agenda restent à surveiller lors des mises à jour Thunderbird.

## Fournisseurs / Agenda / Tags

- Les comptes synthétiques ne remplacent pas une matrice réelle Gmail/Microsoft/IMAP/CalDAV.
- Agenda dépend des capacités et ACL du calendrier.
- Les tags personnels ne sont jamais gérés comme tags MailPin sans propriété exacte.

## Build et stockage

- `MP-2026-018` suit encore l’identité binaire inter-plateforme du conteneur ZIP.
- Les sauvegardes manuelles externes restent sous contrôle utilisateur.

## Publication

- La release GitHub 1.7.2 est publiée ; 1.7.3 est candidate jusqu’aux gates et au workflow Release.
- ATN et les validations humaines restent distincts de la publication GitHub.
