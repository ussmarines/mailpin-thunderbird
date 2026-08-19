# Rapport de validation — MailPin 1.7.4

## Objet

MailPin 1.7.4 rétablit la compatibilité d’installation avec Thunderbird 154 et déplace la preuve runtime automatisée sur le binaire officiel Thunderbird 154.0.

## Critères PASS

- manifeste : Thunderbird `153.0` à `154.*` ;
- installation et démarrage sur Thunderbird 154.0 ;
- background MV3 à `Startup: Complete` ;
- panneau et bouton MailPin injectés une seule fois dans `about:3pane` ;
- bouton Dashboard ouvrant exactement un onglet Dashboard ;
- nettoyage après désinstallation puis réinstallation propre ;
- aucune nouvelle permission, dépendance runtime, migration, schéma, logique métier ou connexion réseau ;
- QA Linux/Windows, garde sécurité et build reproductible PASS sur la candidate exacte ;
- smoke Thunderbird 154 réel PASS sur la candidate exacte.

## Preuves pré-versionnement

Head `3e1943f2be7a18ebcceef5952810675442e91a33` de la PR #52 :

- QA `32299537328` — PASS ;
- smoke réel Thunderbird 154.0 `32299537485` — PASS ;
- job runtime nommé `Real Thunderbird 154 runtime smoke`, avec construction XPI, téléchargement officiel vérifié, installation, smoke, désinstallation et réinstallation tous terminés avec succès.

## État

La compatibilité 154 est démontrée avant versionnement. La candidate 1.7.4 doit maintenant repasser les mêmes gates sur son head exact ; la publication GitHub n’est pas déclarée PASS avant ces résultats et le workflow Release.
