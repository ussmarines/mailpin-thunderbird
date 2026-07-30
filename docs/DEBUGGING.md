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
- confirmer que l’événement `contextmenu` est capturé par `.pin-mails-panel-list`.

## Drag-and-drop

Après chaque drag, aucun élément ne doit conserver :

- `data-drop-target` ;
- `data-drop-before` ;
- `data-drop-after` ;
- `data-dragging`.

## Base

Le bouton d’intégrité des paramètres exécute les contrôles SQLite. Avant toute manipulation manuelle, fermer Thunderbird et copier le profil de test.
