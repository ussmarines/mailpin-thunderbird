# Registre des bugs MailPerch

> Source unique pour les bugs connus. Tout bug reproduit doit être ajouté ici
> avant ou pendant sa correction. Codex et les contributeurs doivent lire ce
> fichier après `PROJECT_MEMORY.md`.

Dernière mise à jour : **2026-07-31**
Version de travail : **3.2.7**

## Règles de suivi

Statuts autorisés : `OUVERT`, `EN COURS`, `BLOQUÉ`, `À VALIDER`, `CORRIGÉ`.

Chaque entrée doit contenir :

- un identifiant stable `MP-YYYY-NNN` ;
- la première version concernée ;
- le symptôme utilisateur ;
- la cause confirmée ou, à défaut, `À déterminer` ;
- les fichiers concernés ;
- le test de non-régression ;
- le statut et la version de correction.

Un bug ne passe à `CORRIGÉ` qu’après validation automatisée. Quand le défaut dépend
réellement de l’interface Thunderbird, la validation manuelle reste explicitement
indiquée dans la colonne **Validation réelle**.

## Bugs ouverts

Les défauts MP-2026-004 et MP-2026-005 ont été rouverts après validation réelle
de la build 3.2.5. La build 3.2.7 contient une seconde correction ciblée ; ils
restent en statut `À VALIDER` tant que Thunderbird 153 ne les confirme pas.

## Bugs corrigés ou en validation

| ID | Première version | Symptôme | Cause confirmée | Fichiers principaux | Test de non-régression | Statut | Correction | Validation réelle |
|---|---:|---|---|---|---|---|---:|---|
| MP-2026-001 | 3.2.0 | Le tableau de bord affiche `$(...) is null`. | La vue `list` ciblait une section DOM inexistante au lieu de `items`. | `extension/dashboard/dashboard.js` | `tests/test_dashboard_dom_contract.py` | CORRIGÉ | 3.2.1 | Validé par l’utilisateur. |
| MP-2026-002 | 3.1.2 | Clic droit et bouton `…` inopérants sur les épingles. | Menu HTML et propagation d’événements incompatibles avec la fenêtre privilégiée. | `extension/api/pinInbox/implementation.js` | `tests/test_native_card_menu.py` | CORRIGÉ | 3.1.5 | Validé par l’utilisateur. |
| MP-2026-003 | 3.1.2 | Le sélecteur du dossier de sauvegarde ne s’ouvre pas. | Le sélecteur natif recevait la fenêtre au lieu de son `BrowsingContext`. | `extension/api/pinInbox/implementation.js` | `tests/test_calendar_and_card_actions.py` | CORRIGÉ | 3.1.3 | Validé par l’utilisateur. |
| MP-2026-004 | 3.2.4 | Deux symboles d’étoile/punaise apparaissent ou se chevauchent dans les cartes de messages. | Le bouton indépendant héritait des classes génériques d’icône Thunderbird et le CSS MailPerch repositionnait encore `.button-star` hors de son conteneur natif. | `extension/api/pinInbox/implementation.js`, `extension/styles/pin.css` | `tests/test_regressions_3_2_5.py`, `tests/test_regressions_3_2_6.py` | À VALIDER | 3.2.7 | Tester le défilement rapide dans Thunderbird 153 : une étoile native, une punaise MailPerch et un bouton `…` par ligne. |
| MP-2026-005 | 3.2.4 | Les boutons Enregistrer et Annuler des paramètres sont inopérants dans l’onglet Options. | Les contrôles visibles restaient hors du formulaire et dépendaient de l’association HTML `form=`, chemin non fiable dans cet onglet Thunderbird ; aucun gestionnaire direct ne garantissait le clic. | `extension/options/options.html`, `extension/options/options.js` | `tests/test_regressions_3_2_5.py`, `tests/test_regressions_3_2_6.py` | À VALIDER | 3.2.7 | Tester modifier → Enregistrer puis modifier → Annuler, avec confirmation visible et persistance après réouverture. |
| MP-2026-006 | 3.2.2 | La CI Windows signale `dist/.gitkeep\r` comme fichier suivi et ignoré. | Le flux texte vers `git check-ignore --stdin` était converti en CRLF sous Windows. | `scripts/deep_audit.py` | `tests/test_regressions_3_2_5.py`, `tests/test_cross_platform_ci.py` | CORRIGÉ | 3.2.5 | La CI Windows doit confirmer après push. |

## Modèle pour une nouvelle entrée

```text
| MP-YYYY-NNN | version | symptôme | cause ou À déterminer | fichiers | test | OUVERT | — | scénario à exécuter |
```

## Procédure

1. Reproduire et noter la version Thunderbird, l’OS, le thème et la vue.
2. Ajouter l’entrée avec le statut `OUVERT` ou `EN COURS`.
3. Ajouter un test qui échoue avant le correctif lorsque cela est possible.
4. Corriger la plus petite frontière responsable.
5. Exécuter `npm run ci`.
6. Passer à `À VALIDER` si une interaction Thunderbird réelle reste nécessaire.
7. Passer à `CORRIGÉ` après confirmation et conserver l’entrée dans l’historique.

## Note de validation 3.2.7

- `MP-2026-004` : rail natif étoile/punaise/menu sans reparentage de l’étoile — **À VALIDER** dans Thunderbird.
- `MP-2026-005` : sauvegarde auditée de bout en bout avec relecture et flush SQLite — **À VALIDER** dans Thunderbird.
