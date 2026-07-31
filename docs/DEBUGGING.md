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

- inspecter `#pin-mails-card-context-menu`, qui doit être un `menupopup` dans le `popupset` de la fenêtre `about:3pane` ;
- vérifier son état XUL (`closed`, `showing`, `open`) et l’attribut `aria-expanded` du bouton déclencheur ;
- essayer le bouton « Plus d’actions », le clic droit, `Shift+F10`, la touche Menu et Échap ;
- confirmer que l’événement `contextmenu` est capturé en phase capture puis limité aux cartes du panneau ;
- ne pas réintroduire d’overlay HTML, de coordonnées CSS ou de `z-index` pour ce menu.

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


## Sécurité et désinstallation 3.2.4

- exécuter `python tests/test_security_hardening_3_2_4.py` puis `npm run ci` ;
- rechercher toute permission nouvelle, URL distante, sink HTML/code, rôle admin ou chemin disque fourni par une page ;
- pour un import refusé, vérifier la taille, la profondeur, les clés interdites et le checksum de l’enveloppe ;
- pour Enregistrer/Annuler, inspecter `configurationReady`, `dirty` et `saveInFlight` plutôt que de forcer les boutons dans le DOM ;
- pour une désinstallation, utiliser un profil de test, fermer les opérations, supprimer le module puis vérifier les fichiers et préférences décrits dans `docs/MANUAL_TEST_PLAN.md` ;
- ne jamais tester la purge sur un profil de production sans sauvegarde indépendante.


## Registre des bugs

Avant une nouvelle investigation, consulter `docs/BUG_TRACKER.md`. Si le défaut n’y figure pas, ajouter une entrée `OUVERT` avec version Thunderbird, OS, vue, scénario et capture. Ne supprimer aucune entrée corrigée : elle sert de garde contre les régressions.
