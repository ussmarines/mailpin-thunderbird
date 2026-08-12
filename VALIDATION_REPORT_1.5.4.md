# Rapport de validation final — MailPerch 1.5.4

Date : 2026-08-12
Référence runtime intégrée : `main` au commit `ca7206329045b58aff3384e7bd4c3b99eeecd2b3`
PR d’intégration : #33
Thunderbird cible : 153.0–153.*

## Delta validé

MailPerch 1.5.4 corrige les constats de recette 1.5.3 : géométrie Options, modale et planification Agenda, toggle/badges d’attente, délai de relance individuel, réconciliation des identités d’épinglage et responsive du panneau selon sa largeur réelle. Les passes transversales ont aussi centralisé les transitions workflow de l’éditeur, des templates, des règles et d’Agenda, supprimé les états `noReply*`/relance orphelins et empêché le Dashboard d’annoncer un succès si son état post-mutation n’a pas pu être rechargé. Le dernier constat Agenda impose **Événement** à toute nouvelle création et rend l’absence réelle de calendrier tâche explicite, sans appel backend invalide.

## Contrôles ciblés réussis avant intégration

- gardes Python ciblées : findings 1.5.4, schéma API, Options, UI, Agenda/cartes, Dashboard, accessibilité/localisation et banc Thunderbird ;
- modèles JavaScript et contrat `PinCompatibility` ;
- flux Chromium Dashboard : 7 vues, 9 statistiques, 11 cartes, toggle attente, relance, validations Agenda et échec explicite du rafraîchissement post-mutation avec sélection conservée, sans overflow horizontal ;
- flux Chromium Options : 106 contrôles, FR/EN et géométrie aux largeurs/zooms ciblés, sans overflow horizontal ;
- panneau Chromium : resize continu 800→280 px, 27 mesures sans débordement ni élément échappé ;
- `npm run check`, `npm run build` et `git diff --check` verts.

## Thunderbird réel

- `functional_bench.py --volumes 50` sur Thunderbird 153.0.3 / geckodriver 0.37.1 : 50 références, scénario cross-entry dans les deux sens, éditeur `waiting`, relance personnalisée, Agenda panneau, transition `planned`, nettoyages `noReply`, Dashboard/Options réels, thèmes clair/sombre, lifecycle, réinstallation propre et zéro exception JavaScript ;
- création et liaison d’un événement puis d’une tâche dans un calendrier mémoire local inscriptible ;
- workflow GitHub Actions **Thunderbird runtime smoke** vert sur la PR #33 puis à nouveau vert sur le commit squash intégré à `main`.

## Recette utilisateur finale

La recette utilisateur du XPI final Windows est **verte**. Les surfaces corrigées ont été retestées ; aucun autre défaut fonctionnel n’a été signalé. Le dernier scénario Agenda confirme :

- nouvelle création sur **Événement** par défaut ;
- calendrier événement sélectionnable ;
- passage sur **Tâche** sans calendrier `taskCompatible` expliqué clairement ;
- sélecteur vide masqué ;
- création tâche désactivée et aucun appel backend invalide ;
- retour sur Événement fonctionnel.

Le XPI Windows testé avait le SHA-256 `9ebaa2a49db29ec28339be9d99f4de85f53dec298c84a56912d5765f6d84eb3f`.

## Gate GitHub final

La PR #33 a été fusionnée par **squash**. Sur le commit intégré `ca7206329045b58aff3384e7bd4c3b99eeecd2b3` :

- **QA / Full verification (Linux)** : succès, incluant `npm run ci` et vérification de la structure XPI ;
- **QA / Security guard regression** : succès ;
- **QA / Source and model checks (Windows)** : succès ;
- **Thunderbird runtime smoke** : succès sur Thunderbird 153 réel.

Le build Linux de la PR et le build Linux post-merge sont identiques octet pour octet :

- `MailPerch_v1.5.4.xpi` — SHA-256 `13de009d165ea6eb33ef4319be22a0731dfe317cab0d409272c6cd92919e54ff` ;
- l’écart binaire avec le XPI Windows testé correspond au problème connu MP-2026-018 de conteneur ZIP multiplateforme ; il ne constitue pas une différence de source runtime démontrée ;
- `SHA256SUMS.txt` publié par le workflow `Release` reste l’autorité définitive pour les artefacts GitHub.

## Readiness

**GO pour publication GitHub 1.5.4.**

La soumission Add-ons for Thunderbird reste séparée et n’est pas déclarée prête tant que les contrôles externes/manuels restants du plan ATN ne sont pas terminés.

## Limites restantes pour ATN

- fournisseurs mail et calendriers réseau réels ;
- matrice Windows/Linux/macOS complète ;
- inspection humaine à zoom 200 %, contraste OS élevé et lecteur d’écran ;
- distinction historique entre doublons accidentels et épingles volontairement distinctes : aucune déduplication globale automatique n’est appliquée.

Codex Security n’a pas été utilisé et n’était pas requis.
