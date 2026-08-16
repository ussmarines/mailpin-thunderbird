# Limites connues

## Source 1.7.1 / release publique 1.7.0

La source **1.7.1** est un candidat de durcissement pré-publication construit sur la release GitHub **1.7.0**. Elle ne modifie pas le runtime métier : elle réaligne les métadonnées actives et renforce les gardes de version et de ressources locales. Les preuves 1.7.0 ne sont réutilisées que pour les surfaces inchangées ; le candidat 1.7.1 doit repasser ses gates automatisés propres.

## Interface et accessibilité

- Le smoke Thunderbird valide installation, injection, ouverture du Dashboard, nettoyage et réinstallation ; il ne juge pas la qualité visuelle pixel par pixel.
- Une recette humaine reste nécessaire sur Dashboard, Options et panneau avec splitter continu, thèmes clair/sombre, zoom 200 %, contraste élevé et lecteurs d’écran.
- La 1.7.1 ne modifie pas Dashboard/Options/panneau ; la recette humaine visuelle supplémentaire de 1.7.0 reste non consignée et demeure pertinente pour une soumission ATN, sans être présentée comme PASS.

## Compatibilité Thunderbird

- Le manifeste déclare Thunderbird `153.0` à `153.*`.
- MailPin utilise une API Experiment privilégiée ; les évolutions internes `about:3pane`, `ThreadCard`, Messages, Tags et Agenda restent des surfaces à surveiller.
- Les adaptateurs `PinCompatibility` réduisent le rayon de changement mais ne remplacent pas un test réel après une mise à jour Thunderbird.

## Fournisseurs / Agenda / Tags

- Les comptes synthétiques ne remplacent pas Gmail, Microsoft, un serveur IMAP réel ou un fournisseur CalDAV réel.
- La synchronisation Agenda dépend des capacités/ACL du calendrier.
- Les tags MailPin utilisent volontairement les clés historiques `mailperch-*` pour préserver la compatibilité des profils ; seuls les tags possédés par clé **et** libellé exacts peuvent être gérés.

## Build et stockage

- `MP-2026-018` suit encore la reproductibilité binaire inter-plateforme du conteneur ZIP ; les entrées décompressées et les builds répétés sur un même environnement sont déterministes.
- Les sauvegardes/exportations manuelles hors des dossiers gérés restent sous contrôle utilisateur et ne sont pas supprimées automatiquement.
- Les identifiants persistants historiques (`mailperch.installation`, `mailperch-*`, `pin-mails-v2.sqlite`, préférences legacy) sont conservés lorsqu’ils servent une migration ou la continuité des données ; ils ne sont pas des résidus de marque à renommer mécaniquement.

## Publication

- Aucun tag/release 1.7.1 ne doit être créé avant que QA, build reproductible et smoke Thunderbird du candidat exact soient verts.
- La disponibilité juridique de la marque, le portail ATN et la matrice externe restent des validations humaines/externes.
