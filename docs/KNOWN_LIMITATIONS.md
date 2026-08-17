# Limites connues

## Source 1.7.3 / release publique 1.7.3

La source **1.7.3** et la release publique **1.7.3** sont alignées. La publication GitHub `v1.7.3` cible `814e07adc82f0a1b19051c83fbb0fec6a22836b0`.

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
- Le build Release 1.7.3 a produit l’XPI SHA-256 `66a10432457a509b9c9959e3df7bcdd2415d14668284b6104803dfa1d9362bc4` et l’archive source SHA-256 `ff5999a8b73392b0ad7e6778c69602ddddeeb687a3263d2162b2f93afddaf767`.

## Publication

- La release GitHub 1.7.3 est publiée et le workflow Release `32031451673` est PASS.
- ATN, la recette visuelle humaine et les matrices fournisseurs restent distincts de la publication GitHub et ne sont pas implicitement considérés comme validés.
