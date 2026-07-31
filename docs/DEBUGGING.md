# Débogage Thunderbird

## Profil de test

Utiliser un profil dédié. Ne pas tester les suppressions et règles avec une boîte de production sans sauvegarde.

## Console

Activer **Outils de développement → Boîte à outils du navigateur**. Rechercher les préfixes :

- `MailPerch` ;
- `pinInbox` ;
- erreurs `about:3pane`, `Sqlite` ou `calendar`.

## Dashboard non stylé

Vérifier :

1. l’onglet a une URL `moz-extension://…/dashboard/dashboard.html` ;
2. `dashboard.css` et `dashboard.js` ne sont pas bloqués ;
3. `pinInbox.onDashboardRequested` est reçu par le background ;
4. aucune ouverture directe via `contentTab` depuis l’Experiment.

## Clic droit

- inspecter `.pin-mails-context-menu` dans le document `about:3pane` ;
- vérifier `hidden`, `left`, `top` et `z-index` ;
- essayer `Shift+F10` sur une carte focalisée ;
- confirmer que l’événement `contextmenu` est capturé en phase capture sur le document `about:3pane`, puis limité aux cartes du panneau.

## Drag-and-drop

Après chaque drag, aucun élément ne doit conserver :

- `data-drop-target` ;
- `data-drop-before` ;
- `data-drop-after` ;
- `data-dragging`.

## Base

Le bouton d’intégrité des paramètres exécute les contrôles SQLite. Avant toute manipulation manuelle, fermer Thunderbird et copier le profil de test.

## Erreur « Unexpected properties »

Thunderbird valide les objets transmis à une API Experiment à partir de `schema.json`. Un paramètre déclaré comme simple `type: object` sans propriétés n’accepte aucune clé applicative.

Vérifier :

1. que chaque paramètre objet utilise un `$ref` déclaré dans `types` ;
2. que toutes les clés envoyées par `options.js` et `dashboard.js` sont listées ;
3. que `python3 tests/test_api_schema_contract.py` réussit ;
4. qu’aucun nouveau paramètre objet nu n’est ajouté.

## Diagnostic de mise en page

1. Vérifier `uiPreset` dans les options et `density` dans le panneau : ils ne doivent pas agir sur la même surface.
2. Inspecter `pin-mails-density` sur `document.documentElement` de `about:3pane`.
3. L’attribut historique `pin-mails-ui-preset` doit être absent de `about:3pane`.
4. Vérifier le rail `.tree-button-more`, `.button-star`, `.pin-mails-independent-button`.
5. Pour les paramètres, exécuter `tests/test_ui_polish_3_2_3.py`.

## CI Windows

`deep_audit.py` normalise `\r` et `\n` dans les sorties `git ls-files` et `git check-ignore`.
Un échec mentionnant `dist/.gitkeep\r` indique que cette normalisation a régressé.
