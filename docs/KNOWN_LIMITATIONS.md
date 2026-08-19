# Limites connues

## Source 1.7.4 / release publique 1.7.3

La source **1.7.4** est une candidate de compatibilité Thunderbird 154. La release publique **1.7.3** reste la dernière version publiée jusqu’aux gates finaux et au workflow Release.

## Interface et accessibilité

- Le smoke Thunderbird valide le runtime fonctionnel mais ne juge pas la qualité visuelle pixel par pixel.
- Une recette humaine reste recommandée en clair/sombre, zoom 100/125/200 %, contraste forcé et largeurs réduites.
- 1.7.4 ne modifie pas la logique UI ni les styles de 1.7.3.

## Compatibilité Thunderbird

- Le manifeste candidate déclare Thunderbird `153.0` à `154.*`.
- Le head pré-versionnement `3e1943f2be7a18ebcceef5952810675442e91a33` a passé le smoke officiel Thunderbird 154.0 `32299537485`.
- L’Experiment privilégié et les surfaces internes `about:3pane`, Messages, Tags et Agenda restent à surveiller lors de chaque future mise à jour Thunderbird ; une nouvelle version majeure ne doit pas être revendiquée sans preuve runtime fraîche.

## Fournisseurs / Agenda / Tags

- Les comptes synthétiques ne remplacent pas une matrice réelle Gmail/Microsoft/IMAP/CalDAV.
- Agenda dépend des capacités et ACL du calendrier.
- Les tags personnels ne sont jamais gérés comme tags MailPin sans propriété exacte.

## Build et stockage

- `MP-2026-018` suit encore l’identité binaire inter-plateforme du conteneur ZIP.
- Les sauvegardes manuelles externes restent sous contrôle utilisateur.
- Aucun schéma, stockage ou migration n’est modifié par 1.7.4.

## Publication

- La release GitHub 1.7.3 reste publiée ; 1.7.4 demeure candidate jusqu’à QA + smoke 154 sur le head versionné, merge et workflow Release.
- ATN, la recette visuelle humaine et les matrices fournisseurs restent distincts de la publication GitHub et ne sont pas implicitement considérés comme validés.
