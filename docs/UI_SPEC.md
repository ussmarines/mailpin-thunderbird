# Spécification d’interface — MailPin Organic Workspace

## Direction canonique

MailPin n’utilise plus Fluent comme direction artistique. Le produit adopte **Organic Workspace** : une interface de travail locale, calme mais vivante, qui privilégie le contenu, le contexte et les transitions plutôt que l’empilement de cartes administratives.

Références de conception : espaces de travail créatifs, interfaces command-first et outils de productivité modernes. Elles servent de principes, jamais de composants copiés. MailPin conserve sa propre identité et n’ajoute aucune dépendance UI externe.

Principes :

- **workspace avant dashboard** : navigation persistante, canvas central et contexte secondaire ;
- **contenu avant chrome** : hiérarchie par typographie, espace, proximité et mouvement plutôt que bordures systématiques ;
- **progressive disclosure** : les outils avancés apparaissent au bon moment sans masquer les capacités existantes ;
- **command-first sans command-only** : la palette accélère le clavier, toutes les actions importantes restent aussi accessibles visuellement ;
- **mouvement fonctionnel** : une transition explique un changement d’état ou de contexte ; elle ne décore jamais gratuitement ;
- **zéro effet générique** : pas de dégradé, glow, glassmorphism, blob décoratif ou animation spectaculaire de landing page ;
- **local par construction** : aucune police, icône, texture, script ou ressource distante.

## Architecture du workspace

### Dashboard

Le Dashboard est un espace de travail à trois zones lorsque la largeur le permet :

1. **rail de navigation** : recherche, vues principales, vues intelligentes et vues enregistrées ;
2. **canvas** : contexte courant, métriques utiles, focus et contenu actionnable ;
3. **inspector** : diagnostic, activité et informations secondaires qui ne doivent pas concurrencer la tâche principale.

Sous 1260 px, l’inspector sort de la colonne et rejoint le flux. Sous 920 px, le rail devient une barre de workspace compacte. Aucun contenu essentiel ne doit devenir inaccessible.

Les vues Aujourd’hui, Liste, Kanban, Affaires, Revue, Historique et Santé conservent leur contrat métier et leurs raccourcis. La vue active doit être identifiable sans dépendre de la couleur seule.

### Panneau Thunderbird

Le panneau est un **compagnon compact** : voir → agir → repartir. Il ne doit pas reproduire le Dashboard en miniature.

- panneau au-dessus de la liste native, repliable et à défilement interne ;
- en-tête court avec portée, tri et actions réellement utiles ;
- recherche et vue intelligente immédiatement disponibles lorsque activées ;
- cartes traitées comme des lignes éditoriales, avec un repère de compte et peu de chrome ;
- détails secondaires révélés sans augmenter inutilement la hauteur de toutes les cartes ;
- container queries obligatoires pour les largeurs réellement imposées par le splitter Thunderbird ;
- aucune modification de la hauteur virtuelle ou de la géométrie de la liste native.

### Options

Options est un **éditeur de réglages**, pas un tableau de bord.

- rail persistant avec recherche et navigation ;
- scène de contenu centrale avec sections éditoriales ;
- familles fonctionnelles stables tant qu’aucun besoin produit ne justifie leur migration ;
- contrôles existants et registre `SETTINGS_CONTROL_DEFINITIONS` préservés ;
- mode Recommandé = réduction de charge cognitive, jamais sauvegarde implicite ;
- un seul dock Enregistrer/Annuler, visible uniquement lorsqu’un brouillon diffère de l’état persisté ;
- résultat d’une action affiché à proximité et via toast non bloquant.

## Typographie

Aucune police distante. MailPin utilise des familles locales privilégiant les variantes système à métriques modernes :

- display : `Segoe UI Variable Display`, `Aptos Display`, puis système ;
- texte : `Segoe UI Variable Text`, `Aptos`, puis système ;
- mono : `Cascadia Code`, `SFMono-Regular`, `Consolas`, puis mono système.

La hiérarchie utilise davantage l’échelle, la graisse et l’espace que les encadrements. Aucun texte explicite ne descend sous 12 px.

## Couleur

La base reste chaude et naturelle : Ink, Paper, Sage, Slate et Brass. Les valeurs runtime vivent dans `extension/styles/tokens.css`.

- Sage = progression/action ;
- Slate = information structurelle ;
- Brass = attention contextuelle ;
- états succès/alerte/danger restent sémantiques et ne sont jamais remplacés uniquement par la marque ;
- les thèmes clair, sombre et couleurs forcées doivent garder la même hiérarchie d’information.

Les dégradés et halos sont exclus du système produit.

## Géométrie et profondeur

- rayons plus organiques sur les surfaces interactives, pas sur chaque séparation ;
- bordures faibles et rares ;
- ombres uniquement pour une surface réellement détachée : dialog, dock, élément temporairement élevé ;
- une liste de mails ne devient pas une grille de cartes sans raison fonctionnelle ;
- l’alignement peut être asymétrique si la lecture et l’ordre clavier restent évidents.

## Motion

Durées de référence :

- hover/feedback : 100–140 ms ;
- changement d’état : 180–240 ms ;
- déplacement ou changement de contexte : 240–320 ms.

Utiliser une courbe organique de décélération. `prefers-reduced-motion` et le réglage MailPin de réduction du mouvement désactivent les déplacements non indispensables.

Une animation ne doit jamais retarder une action, bloquer le clavier ou masquer l’état final.

## Accessibilité et ergonomie

- clavier complet sur Dashboard, Options et panneau ;
- focus visible, ordre de tabulation cohérent et `aria-current` / `aria-pressed` selon le rôle ;
- zoom 200 % sans perte de fonctionnalité ;
- thèmes clair/sombre, contraste élevé et `forced-colors` ;
- cibles d’action suffisamment grandes sans gonfler toute l’interface ;
- aucun état uniquement communiqué par couleur ;
- scroll interne seulement lorsqu’il préserve le contexte ; éviter les scrolls imbriqués inutiles ;
- erreurs réessayables et états de chargement explicites.

## Invariants Thunderbird

- ne jamais modifier un compteur natif ou l’état lu/non-lu lors d’un simple épinglage ;
- clic carte = afficher le message sans faire défiler artificiellement la liste native ; double-clic = comportement natif prévu ;
- menu contextuel Thunderbird natif et focus restauré après fermeture ;
- étoile native intacte en mode indépendant ; transformation réversible en mode `nativeStar` ;
- aucune modification de l’intégration `PinCompatibility` pour un besoin uniquement visuel.

## Sécurité de l’interface

- aucune autorisation ou rôle simulé dans le DOM ;
- aucune entrée de formulaire considérée fiable avant validation privilégiée ;
- aucun `innerHTML` ou HTML construit avec des métadonnées mail ;
- import en aperçu sûr et automatismes neutralisés ;
- sélecteur natif obligatoire pour tout chemin local ;
- les confirmations UX complètent les contrôles privilégiés mais ne sont jamais la barrière unique.

## Critère de validation visuelle

Une refonte n’est pas considérée validée parce que ses tests statiques passent. Toute affirmation concernant géométrie, responsive, focus, thème ou mouvement dans Thunderbird exige une observation sur le vrai runtime lorsque la surface concernée y est rendue.

## Quality of Life

- Création Groupe / Affaire / Modèle / Règle : focus immédiat sur le nom et sélection du libellé par défaut.
- Un champ optionnel ne devient requis qu’au moment de l’action qui en dépend ; Agenda valide échéance et calendrier au moment de créer/synchroniser.
- Les couleurs automatiques utilisent Sage, Berry, Moss, Indigo, Brass, Ocean, Clay et Plum, en privilégiant la couleur la moins utilisée.
- Les couleurs personnalisées sont conservées.
- Menus, inspector et statistiques progressives restent dans le flux ou recomposent le layout avant toute superposition.
- Les commandes Enregistrer/Annuler restent dans l’en-tête sticky et aucune surface flottante ne recouvre un champ éditable.
- Un seul landmark `main` par document ; aucun `main` imbriqué.
