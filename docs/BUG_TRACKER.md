# Registre des bugs MailPin

Version source : **1.7.3**

Dernière release publique : **1.7.3**

Les détails historiques complets restent dans Git et les audits archivés. Le registre courant conserve les entrées encore actionnables, les dernières corrections et les IDs historiques utilisés comme preuves permanentes par les gardes de régression.

## Bugs ouverts

| ID | Introduit | Symptôme | Cause | Fichiers | Test | Statut | Correction | Validation |
|---|---|---|---|---|---|---|---|---|
| MP-2026-018 | 1.1.1 | L’empreinte binaire du ZIP peut différer entre Windows et Linux malgré des contenus extraits identiques. | Différences de conteneur ZIP entre plateformes. | `scripts/build.py`, tests de reproductibilité | `tests/test_build_reproducible.py` | À VALIDER | — | Comparer les artefacts inter-plateformes et leur contenu extrait. |

## Bugs corrigés ou en validation

| ID | Introduit | Symptôme | Cause | Fichiers | Test | Statut | Correction | Validation |
|---|---|---|---|---|---|---|---|---|
| MP-2026-004 | 3.2.x | Le rail d’actions d’une carte pouvait dupliquer ou déplacer les contrôles natifs lors du rendu Thunderbird. | L’injection initiale mélangeait contrôles MailPin et nœuds natifs de la ligne. | `extension/api/pinInbox/implementation.js`, `extension/styles/pin.css` | gardes 3.2.5/3.2.6/3.2.8 et smoke réel | CORRIGÉ | 3.2.8 | Thunderbird 153.0.1 avec messages synthétiques : rail structurel validé, étoile native conservée et bouton MailPin indépendant. |
| MP-2026-005 | 3.2.x | Enregistrer/Annuler pouvaient perdre leur comportement dans l’onglet Options. | Association formulaire et chemins de clic n’étaient pas suffisamment explicites pour l’intégration Thunderbird. | `extension/options/options.html`, `extension/options/options.js` | gardes 3.2.5/3.2.6/3.2.8 | CORRIGÉ | 3.2.10 | Form events et click handlers explicites avec readback de persistance ; validation Thunderbird conservée. |
| MP-2026-006 | 3.2.x | Des fins de ligne Windows pouvaient contaminer des noms de chemins transmis aux sous-processus Git. | Flux texte non borné pour des chemins Git. | `scripts/deep_audit.py` | garde 3.2.5 et CI Windows | CORRIGÉ | 3.2.10 | Utilisation de flux binaires NUL-delimited ; contrôles Windows passés. |
| MP-2026-007 | 3.2.x | Le registre de réglages pouvait diverger entre défauts, normalisation et persistance Options. | Défauts et migration étaient dupliqués sur plusieurs surfaces. | `extension/api/pinInbox/modules/settings.js`, `extension/options/options.js` | garde 3.2.8 | CORRIGÉ | 3.2.10 | Registre partagé immuable, normalisation et readback de persistance validés. |
| MP-2026-008 | 3.2.x | L’initialisation Options pouvait rester suspendue sans état terminal lorsqu’une API optionnelle ne répondait pas. | Absence de timeout/état d’erreur terminal cohérent. | `extension/options/options.js`, `extension/options/options-bootstrap.js` | garde 3.2.9 et scénario DOM | CORRIGÉ | 3.2.10 | Timeouts, retry, diagnostic et états terminalement observables validés. |
| MP-2026-058 | 1.7.2 | Plusieurs groupes de réglages restaient trop proches et le bouton Annuler était peu lisible en thème sombre ; les corrections 1.7.2 vivaient dans une feuille CSS ajoutée par-dessus le style canonique. | Le rythme vertical ne couvrait pas toutes les structures imbriquées et le save dock héritait d’un contraste inadapté ; `interaction-stability.css` était chargé dynamiquement. | `extension/styles/workspace.css`, `extension/styles/theme.js`, `tests/test_organic_workspace_ui.py` | contrats UI, QA, smoke Thunderbird réel, release | CORRIGÉ | 1.7.3 | Candidate exacte `a247dc53e3b707335b04ae00b227acad52ddb8b5` : QA `32028928653` PASS, smoke Thunderbird `32028928636` PASS ; squash `814e07adc82f0a1b19051c83fbb0fec6a22836b0`, workflow Release `32031451673` PASS et `v1.7.3` publiée. |
| MP-2026-056 | 1.7.1 | Navigation Options, statistiques, save dock, notifications et cartes Agenda pouvaient sauter ou se chevaucher. | Composition et suivi de navigation insuffisamment stables. | Dashboard/Options/styles | `tests/test_organic_workspace_ui.py`, QA, smoke | CORRIGÉ | 1.7.2 | QA et smoke réels de la candidate 1.7.2 PASS avant publication. |
| MP-2026-055 | 1.7.1 | `npm run ci` échouait depuis l’archive reviewer sans `.git`. | `security_guard.py` dépendait inconditionnellement de `git ls-files`. | garde sécurité/build reviewer | tests reviewer hors Git | CORRIGÉ | 1.7.1 | Fallback borné `.mailpin-source-files.json` validé hors Git. |

## Procédure

1. Reproduire et documenter le symptôme.
2. Corriger la cause et ajouter une garde ciblée.
3. Relancer d’abord le contrôle en échec puis uniquement les validations invalidées.
4. Exécuter `npm run ci` au jalon final lorsque nécessaire.
5. Garder `À VALIDER` tant qu’une preuve réelle requise manque.
