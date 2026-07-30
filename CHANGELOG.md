# Journal des modifications

## 3.1.1 — corrections issues de la vidéo d’utilisation

### Corrigé

- contrat de l’API Experiment complété pour accepter les propriétés réellement envoyées par les paramètres et le tableau de bord ;
- enregistrement des paramètres, import de configuration, simulation des règles et chargement du dashboard débloqués ;
- ouverture du tableau de bord rendue tolérante au démarrage différé du background ;
- clic droit capturé au niveau du document avant le menu natif de Thunderbird ;
- support conservé pour `Shift+F10` et la touche Menu ;
- état actif d’un message séparé de la sélection multiple persistante ;
- actions rapides de nouveau limitées au survol et au focus de la carte ;
- couleurs des épingles restaurées à partir de la couleur de compte, dans le panneau comme dans la liste native ;
- zones de survol et retours visuels des punaises renforcés ;
- centrage optique des SVG de punaise corrigé ;
- création et affectation de groupes déplacées vers des dialogues intégrés, sans `prompt()` natif ;
- libellés de secours MailPerch corrigés dans les menus ;
- nettoyage de la demande différée du dashboard lors de l’arrêt de l’extension.

### Tests

- ajout d’un test du contrat des objets traversant l’API Experiment ;
- gardes de régression sur le clic droit, les états actif/sélection, les couleurs, le survol et les dialogues de groupes ;
- plan de test manuel enrichi à partir de la vidéo du 30 juillet 2026.

## 3.1.0 — passe de débogage, dashboard et dépôt

### Corrigé

- ouverture du dashboard par le background pour charger correctement CSS et JavaScript ;
- page dashboard entièrement mise en forme, avec chargement, erreurs et vues vides ;
- clic droit sur les cartes avec menu complet, navigation clavier et placement dans le viewport ;
- fermeture du menu au scroll, resize, blur et changement de dossier ;
- support `Shift+F10` et touche Menu ;
- sélection visuelle cohérente avant ouverture du menu par clavier ou bouton « Plus » ;
- suppression du contour drag-and-drop résiduel ;
- nettoyage des cibles de drop à chaque déplacement ;
- contrôles d’en-tête remplacés par des icônes explicites ;
- réduction des actions rapides visibles ;
- suppression de sauvegarde limitée aux fichiers de l’extension ;
- version dynamique dans les diagnostics et sauvegardes ;
- invalidation systématique du cache de démarrage lors d’une mise à jour/désactivation.

### Sécurité et maintenance

- CSP explicite ;
- background réécrit de façon lisible ;
- scripts de build reproductible, audit du dépôt et scan de secrets ;
- structure `extension/`, `docs/`, `scripts/`, `tests/` ;
- documentation Codex hiérarchique, rapport d’audit et checklist ATN ;
- CI corrigée pour fonctionner sans `package-lock.json` ni dépendance npm ;
- licence source-disponible restrictive.

## 3.0.0

- stockage incrémental, workflows avancés, affaires, Kanban, règles, Agenda, historique et sauvegardes.

## 2.0.0

- stockage SQLite structuré, sections intelligentes, conversations et dashboard.

## 1.x

- panneau Outlook, couleurs par compte, tri, épingles indépendantes et premières fonctions avancées.
