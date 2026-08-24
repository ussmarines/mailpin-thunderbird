# Rapport de validation MailPerch 1.1.1

Date : 5 août 2026
Statut : validation technique et publication GitHub `v1.1.1` terminées.

## Environnement observé

- système : Windows ;
- Thunderbird disponible : 153.0.1 ;
- Node.js et Python : versions contrôlées par les gardes du dépôt ;
- navigateur UI : Chromium réel piloté par Playwright CLI ;
- profil Thunderbird réel : exclusivement jetable lorsqu’il est utilisé.

## Résultats déjà exécutés

| Contrôle | Résultat |
|---|---|
| Syntaxe des modules Options, dashboard et Experiment modifiés | Réussi |
| Modèles JavaScript 3.2.8, y compris identité de conversation | Réussi |
| Localisation/accessibilité | Réussi — 706 chaînes WebExtension, 237 chaînes privilégiées et 777 messages par catalogue |
| Contrats de localisation dynamique Options | Réussi — 63 clés FR/EN |
| Contrats navigateur Options/dashboard | Réussi |
| Playwright Options | Réussi — 98 contrôles, 21 lectures, 2 tentatives d’écriture, 1 écriture confirmée |
| Playwright dashboard | Réussi — 7 vues, 8 statistiques, action groupée, largeur 720 px sans débordement |
| Géométrie des cartes synthétiques | Réussi — normal, compact, tactile, zoom 125 % et étoile native |
| Thème sombre et mouvement réduit du dashboard | Réussi dans Chromium |
| Installation XPI dans Thunderbird | Réussi — Thunderbird 153.0.1, profil et compte local jetables, quatre messages synthétiques |
| Panneau `about:3pane` | Réussi — panneau séparé au-dessus de « All messages », clic de carte sans défilement de la liste native |
| Invariants de lecture | Réussi — épinglage direct sans modification de l’état lu et compteur de dossier inchangé |
| Géométrie native Thunderbird | Réussi à 100 % — cartes normale, sélectionnée, épinglée et avec pièce jointe observées, icônes centrées |
| Menu natif privilégié en anglais | Réussi — 17 actions inspectées via l’accessibilité Windows, aucune fuite française MailPerch parmi 111 libellés accessibles visibles |
| `npm run ci` sur le candidat courant | Réussi — contrôles, tests, reproductibilité et build 1.1.1 |
| Suite classique rapide `--enforce` | Réussi — identité courante, Gitleaks, OpenGrep, Trivy, SBOM et Zizmor |
| Suite classique complète `--enforce` | Réussi — identité courante et historique, Gitleaks, OpenGrep, Trivy, SBOM et Zizmor ; zéro occurrence d’identité privée après réécriture |
| Assets GitHub 1.0.0 et 1.1.0 | Réussi — reconstruits depuis les tags assainis, remplacés, retéléchargés, empreintes concordantes et zéro occurrence résiduelle |

Les tests navigateur chargent les actifs de production et de vrais catalogues de
langue, mais remplacent l’API privilégiée par des données synthétiques locales.

## Contrôles finaux de publication

- terminé : `npm run ci` depuis l’historique assaini ;
- terminé : deux builds binaires comparés, inspection XPI/source et SHA-256 ;
- terminé : installation du XPI 1.1.1 dans Thunderbird 153.0.1 avec profil jetable ;
- terminé : recherche de confidentialité sur toutes les références et surfaces GitHub accessibles ;
- terminé : remplacement, téléchargement et contrôle des assets 1.0.0 et 1.1.0 ;
- terminé : tag `v1.1.1`, workflow Release, état public de la release et trois
  téléchargements distants vérifiés.

## Validation graphique honnête

Le panneau `about:3pane` 1.1.1 a été observé dans Thunderbird 153.0.1 sous Windows,
avec le thème sombre et un compte local synthétique. Le test couvre le rendu à
100 %, les variantes de cartes citées ci-dessus, l’ouverture d’un message depuis
une carte, l’épinglage direct et le menu natif. Le profil utilisateur réel n’a
jamais été ouvert. L’instance a été fermée proprement ; le profil et les captures
temporaires ont ensuite été placés dans la Corbeille et restent récupérables.

Cette observation ne couvre pas encore la matrice Thunderbird 128–152, le zoom
200 %, un fournisseur IMAP/Gmail/Microsoft réel ni un calendrier réel. Ces limites
restent explicitement suivies dans `docs/MANUAL_TEST_PLAN.md` et
`docs/KNOWN_LIMITATIONS.md`.

## Artefacts publiés

| Fichier | Taille | SHA-256 |
|---|---:|---|
| [`MailPerch_v1.1.1.xpi`](https://github.com/ussmarines/mailpin-thunderbird/releases/download/v1.1.1/MailPerch_v1.1.1.xpi) | 232 053 octets | `20b0821bfd0e5f1e2457e3dc9148ba6ec0f553be6ccdfb98b1e56380435bf79f` |
| [`MailPerch_GitHub_Repository_v1.1.1.zip`](https://github.com/ussmarines/mailpin-thunderbird/releases/download/v1.1.1/MailPerch_GitHub_Repository_v1.1.1.zip) | 457 774 octets | `2a2bc1c097ec6ceb49d1bd704c572febdf7da7280d043f3580c1b089dcdd7468` |
| [`SHA256SUMS.txt`](https://github.com/ussmarines/mailpin-thunderbird/releases/download/v1.1.1/SHA256SUMS.txt) | 192 octets | `b0e61e9920c6d3f43e521efe4d1717663c06f599cb480663b67885b2cdeacadf` |

Le fichier `SHA256SUMS.txt` téléchargé valide les deux archives publiées. Une
comparaison Windows/Linux trouve les mêmes 47 entrées XPI et 165 entrées source,
dans le même ordre, avec zéro différence de contenu décompressé. Les flux DEFLATE
et les métadonnées d’hôte ZIP diffèrent néanmoins entre les implémentations ; les
empreintes du workflow Linux ci-dessus sont donc les références de cette release.
