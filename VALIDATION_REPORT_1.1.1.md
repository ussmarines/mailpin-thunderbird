# Rapport de validation MailPerch 1.1.1

Date : 5 août 2026
Statut : validation de candidat en cours ; ce document ne préjuge pas de la
publication finale.

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
| Suite classique complète | Cinq contrôles réussis ; seul le garde historique signale les 189 occurrences de confidentialité déjà inventoriées, sans valeur dans le rapport expurgé |

Les tests navigateur chargent les actifs de production et de vrais catalogues de
langue, mais remplacent l’API privilégiée par des données synthétiques locales.

## Contrôles finaux requis avant publication

- `npm run ci` depuis le commit final après réécriture ;
- suite de sécurité classique complète en mode strict après réécriture ;
- deux builds binaires comparés, inspection XPI/source et SHA-256 ;
- installation du XPI final dans Thunderbird 153.0.1 avec profil jetable ;
- recherche de confidentialité dans toutes les références après réécriture ;
- vérification de la CI GitHub, du tag et des téléchargements de release.

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

## Artefacts

Les noms, tailles, SHA-256 et liens seront ajoutés uniquement après construction
depuis le commit final de `main`, après nettoyage de l’historique.
