# Passage de relais Codex — candidat local MailPerch 1.5.4

## Référence

- base de travail : commit local `038a8df5a9930894e9e6487cf9630c9d13fd399f` ;
- branche locale : `fix/pre-store-manual-findings-1.5.4` ;
- version publique inchangée : **1.5.3** ; candidat de retest : **1.5.4** ;
- identifiant canonique : `pin-mails@MailPerch.local` ;
- commit et push de la seule branche `fix/pre-store-manual-findings-1.5.4` autorisés pour consolider le candidat ; aucun PR, merge, tag, release ou téléversement ATN.

## Objet de la passe

Corriger les constats de recette réels de 1.5.3 : règles Options comprimées, modale Agenda et planification, toggle et badges d’attente, délai de relance individuel, doublons message/conversation et responsive du panneau selon le splitter Thunderbird. La passe transversale pré-store aligne désormais les transitions workflow de l'éditeur, des templates, des règles et d'Agenda, supprime les états `noReply*`/relance orphelins et empêche le Dashboard d'annoncer un succès si son état post-mutation n'a pas pu être rechargé. Le dernier constat Agenda est consolidé : toute création commence sur Événement et une tâche sans calendrier compatible est expliquée sans tentative de création.

Les régressions ciblées couvrent les contrats statiques/modèles, les flux Chromium, la géométrie continue du panneau et les nouveaux parcours panneau/workflow dans Thunderbird réel. Le XPI exact a passé le banc 50 références sous Thunderbird 153.0.3 avec zéro exception JavaScript, cleanup et réinstallation propre. Les preuves fraîches sont enregistrées dans `docs/AI_VALIDATION_STATE.json` et `VALIDATION_REPORT_1.5.4.md`.

## Readiness

**NO-GO publication.** Le XPI local 1.5.4 doit être retesté manuellement par l’utilisateur sur les scénarios signalés avant toute décision de publication. Les fournisseurs et calendriers réseau réels, la matrice multi-OS et les validations d’accessibilité humaines restent aussi hors preuve automatisée.
