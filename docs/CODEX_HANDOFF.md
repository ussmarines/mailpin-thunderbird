# Passage de relais Codex

Lire d’abord [`IDENTITY_MIGRATION_REQUIRED.md`](IDENTITY_MIGRATION_REQUIRED.md), puis [`../PROJECT_MEMORY.md`](../PROJECT_MEMORY.md). Ce fichier est volontairement court afin d’éviter de dupliquer le contexte.

En cas de contradiction sur l’identité de l’extension, le manifeste, `docs/PROJECT_STATE.json` et l’historique d’identité sont prioritaires sur les mentions anciennes de la mémoire.

## État courant

- version publique : **1.1.0** ;
- base GitHub de référence avant intégration : `main` au commit `48d00fac37cb9f7efd1d5bff056149ba80c5d718` ;
- ID canonique : `pin-mails@MailPerch.local` ;
- décision d’identité résolue le 4 août 2026 avant toute publication, signature ou diffusion catalogue ;
- une installation locale portant une ancienne identité doit être sauvegardée, réinstallée et restaurée selon `docs/IDENTITY_MIGRATION_REQUIRED.md` ;
- productivité 1.1.0 : Aujourd’hui, Revue, veille, rappels interactifs, capture rapide, aperçu des règles, raccourcis et fusion prudente ;
- schémas : SQLite 5, paramètres 6, données 6 ;
- une modification de version fusionnée dans `main` déclenche la QA, le build et la release GitHub correspondante.

## Décision d’identité du 4 août 2026

- MailPerch est un projet personnel indépendant de Sibylla ;
- le produit n’avait encore jamais été publié sur ATN, AMO ou un autre catalogue ;
- l’identifiant intermédiaire de la branche de sécurité a été remplacé avant fusion ;
- le nouvel identifiant doit conserver exactement sa casse dans le manifeste, le modèle de publication, l’état projet, les tests et les contrôles ;
- ne jamais réintroduire les anciennes références nominatives ;
- avant la première publication, vérifier la disponibilité de l’ID et les exigences de manifeste applicables ;
- après la première signature ou publication, considérer l’ID comme immuable.

## Passe 3.2.4

- rail étoile/punaise/menu centré dans les lignes natives ;
- confort des paramètres séparé de la densité des cartes ;
- densités compactes maintenues lisibles ;
- toast fermé depuis son coin supérieur droit ;
- primitives CSS ajoutées pour les classes options auparavant non stylées ;
- toggles, aides de boutons, groupes, comptes, calendriers et centre de santé réorganisés ;
- duplication visible des comptes supprimée ;
- état Agenda reformulé selon les capacités réelles ;
- duplication du bouton Enregistrer supprimée ;
- audit Git Windows rendu robuste aux fins de ligne CRLF ;
- `PROJECT_MEMORY.md` et `docs/PROJECT_STATE.json` ajoutés ;
- validation récursive et bornée de toutes les entrées privilégiées sensibles ;
- imports neutralisés avant persistance et diagnostic anonymisé ;
- chemins de sauvegarde réservés au sélecteur natif ;
- purge complète des données gérées lors de la désinstallation et sentinelle native de réinstallation propre ;
- correction du flux Enregistrer/Annuler et de l’étoile native dupliquée ;
- manifeste/CSP, scan de secrets, frontière de confiance et audit sécurité documentés.

## Validation obligatoire

```bash
npm run ci
```

Puis suivre `docs/MANUAL_TEST_PLAN.md`, particulièrement la section 3.2.4 et la procédure locale de changement d’identité.

## Identité Fluent 1.0.0

- `extension/styles/tokens.css` est la source visuelle commune et expose des palettes explicites clair/sombre ;
- `extension/styles/theme.js` synchronise Options et dashboard avec le thème Thunderbird, avec repli `prefers-color-scheme` ;
- Options et dashboard ont été réorganisés visuellement sans modifier leurs IDs, contrats DOM ni logique métier ;
- le panneau natif consomme les mêmes tokens tout en conservant ses interactions et sa géométrie Thunderbird ;
- les captures navigateur clair/sombre sont validées, mais les thèmes, le zoom 200 % et le panneau restent à confirmer dans Thunderbird 128–153.

## Passe 3.2.5

- étoiles natives laissées intactes en mode indépendant ;
- sauvegarde/annulation des paramètres basées sur les événements natifs du formulaire ;
- audit Git Windows converti aux flux NUL-délimités binaires ;
- registre permanent des bugs ajouté et contrôlé par la CI.

## Passe 3.2.7

Priorité absolue : MP-2026-004 et MP-2026-005. Ne pas les déclarer corrigés sur la seule base des tests statiques. Lire `docs/BUG_TRACKER.md`, conserver l’étoile dans le DOM natif en mode indépendant et maintenir un gestionnaire direct sur les boutons visibles des paramètres.

## Passe 3.2.8

- `modules/settings.js` est la source unique des recommandations et migrations ;
- le registre Options doit rester exhaustif et son validateur doit échouer visiblement si le DOM et le schéma divergent ;
- les tests Playwright chargent les vrais actifs mais utilisent une API synthétique locale ; ils ne constituent pas une validation de l'onglet Thunderbird ;
- le rail d'actions repose sur la structure réelle de ThreadCard 153 et ne doit pas être remplacé par un offset de capture ;
- le lancement Thunderbird temporaire a réussi, mais WebDriver BiDi n'a exposé aucun contexte d'onglet ;
- MP-2026-004, MP-2026-005 et MP-2026-007 restent `À VALIDER`.

## Passe 3.2.9

- l’initialisation Options est terminale : formulaire prêt ou panneau d’erreur avec Réessayer ;
- toute attente API de configuration est bornée, et Agenda/santé/sauvegarde sont secondaires ;
- les diagnostics d’initialisation ne contiennent que des codes techniques expurgés ;
- Playwright local a validé le timeout, le panneau terminal et Réessayer sur les vrais actifs ; Thunderbird 153.0.1 a chargé l’XPI dans un profil vierge sans compte, mais son onglet Options n’était pas automatisable ;
- la validation graphique réelle dans Thunderbird reste obligatoire.

## Passe 3.2.10

- le XPI 3.2.9 a été reproduit dans Thunderbird 153.0.1 : `localize()` supprimait
  `input#import-file`, puis `options.js:1773:4` échouait avant l’initialisation ;
- `options-bootstrap.js` garantit une trace expurgée et un état terminal même si
  les réglages, le module principal ou l’API Experiment manquent ou se bloquent ;
- la localisation ne peut plus remplacer un élément qui contient des contrôles ;
- la matrice Playwright couvre les actifs réels, les échecs pré-module et API,
  les 98 contrôles, une sauvegarde unique et Réessayer sans écouteur dupliqué ;
- Thunderbird 153.0.1, profil jetable sans compte, a validé recommandations,
  Enregistrer, Annuler, réouverture et persistance après redémarrage ;
- MP-2026-004 reste à valider dans une vraie liste de messages.
