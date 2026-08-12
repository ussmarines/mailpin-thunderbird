# Rapport de validation différentiel — candidat MailPerch 1.5.4

Date : 2026-08-12
Branche locale : `fix/pre-store-manual-findings-1.5.4`
Base : `038a8df5a9930894e9e6487cf9630c9d13fd399f`
Thunderbird cible : 153.0–153.*

## Delta validé

Le candidat corrige les six constats de la recette 1.5.3 : géométrie Options, modale et planification Agenda, toggle/badges d’attente, délai de relance individuel, réconciliation des identités d’épinglage et responsive du panneau selon sa largeur réelle. La passe transversale ajoute six corrections démontrées : statut éditeur non écrasé, nettoyage symétrique des états `noReply*` et relances par toutes les entrées workflow, relance individuelle configurable dans le panneau, horaires Agenda configurables dans ce même point d’entrée et refus d’un faux succès Dashboard après échec du rafraîchissement post-mutation. Le dernier constat utilisateur Agenda impose Événement à toute nouvelle création et rend l’absence réelle de calendrier tâche explicite, sans création backend.

## Contrôles ciblés réussis

- gardes Python ciblées : findings 1.5.4, schéma API, Options, UI, Agenda/cartes, Dashboard, accessibilité/localisation et banc Thunderbird ;
- modèles JavaScript et contrat `PinCompatibility` ;
- flux Chromium Dashboard : 7 vues, 9 statistiques, 11 cartes, toggle attente, relance, validations Agenda et échec explicite du rafraîchissement post-mutation avec sélection conservée, sans overflow horizontal à 720 px ;
- flux Chromium Options : 106 contrôles, FR/EN et géométrie aux largeurs/zooms ciblés, sans overflow horizontal ;
- panneau Chromium : resize continu 800→280 px par pas de 20, 27 mesures sans débordement ni élément échappé ;
- `git diff --check`.

## Thunderbird réel

- `functional_bench.py --volumes 50` sur Thunderbird 153.0.3 / geckodriver 0.37.1 : installation du nouvel XPI, 50 références, scénario cross-entry dans les deux sens, éditeur `waiting`, dialogue relance personnalisé, dialogue Agenda panneau, transition metadata `planned`, nettoyages `noReply → active`, `noReply → completed` et template, Dashboard/Options réels, thèmes clair/sombre, géométrie, lifecycle, réinstallation propre et zéro exception JavaScript réussis en 16,761 s ;
- le Dashboard réel a créé et relié un événement puis une tâche dans un calendrier mémoire local inscriptible, avec dates/heures préparées dans la modale et deux identifiants Agenda natifs distincts.

Quatre exécutions intermédiaires du banc ont servi au diagnostic : deux lors de la passe initiale (densité recherche/filtre puis référence DOM du test Agenda), une preuve rouge reproduisant l’écrasement `planned → active`, puis une mesure de densité rendue instable par les badges ajoutés durant le nouveau scénario. Les causes produit ont été corrigées et le banc mesure désormais deux cartes ordinaires stables avant la passe verte.

## Jalon repository/build

L’unique `npm run ci` demandé a exécuté `check` puis presque toute la suite, avant de s’arrêter dans `test_build_reproducible.py` : les nouveaux rapports non suivis n’étaient pas visibles de `git ls-files`, conformément à la frontière de packaging. Sans modifier l’index réel, un index Git temporaire borné aux cinq nouveaux fichiers avait ensuite permis de réussir le test reproductible et la build source. Après la passe transversale finale, `npm run check`, les gardes ciblées, les flux Dashboard/Options, le scénario Thunderbird 50 et la build ont été réexécutés ; ni `npm test`, ni le scan sécurité standard complet, ni un second `npm run ci` n’ont été relancés. Codex Security n'a pas été utilisé.

## Preuves historiques non réutilisées pour le delta

Les preuves runtime 1.5.3 sur `extension/**`, le banc et le packaging sont invalidées par les modifications 1.5.4. La matrice multi-comptes/persistance ne sera pas relancée si le contrôle ciblé 50 couvre le chemin d’épinglage modifié et si les couches de portée/stockage inchangées conservent leur preuve 1.5.3.

## Readiness

**NO-GO publication.** Même si toutes les validations automatisables sont vertes, les six scénarios corrigés doivent être retestés manuellement dans le XPI 1.5.4 exact.

## Limites

- fournisseurs mail et calendriers réseau réels ;
- matrice Windows/Linux/macOS complète ;
- inspection humaine à zoom 200 %, contraste OS élevé et lecteur d’écran ;
- distinction historique entre doublons accidentels et épingles volontairement distinctes : aucune déduplication globale automatique n’est appliquée.

## Artefact de retest

- `dist/MailPerch_v1.5.4.xpi` — 264759 octets — SHA-256 `9ebaa2a49db29ec28339be9d99f4de85f53dec298c84a56912d5765f6d84eb3f`.
