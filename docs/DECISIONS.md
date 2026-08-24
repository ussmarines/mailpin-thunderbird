# Décisions techniques

## D001 — ID produit canonique avant première publication

`ussmarines.mailpin@addons.thunderbird.net` remplace les identifiants utilisés uniquement dans des builds locales antérieures. MailPin n’ayant jamais été publié avant cette décision, aucune continuité publique n’était à préserver ; cet ID propre au produit devient néanmoins immuable dès la première signature ou publication. Une installation locale antérieure doit passer par export, réinstallation et import contrôlé selon `docs/IDENTITY_MIGRATION_REQUIRED.md`.

## D002 — Dashboard ouvert par le background

L’Experiment émet un événement ; le background utilise `tabs.create`. Cela évite de charger une page d’extension avec un principal privilégié incorrect.

## D003 — Menu contextuel Thunderbird natif

Les cartes utilisent un `menupopup` dans le `popupset` de la fenêtre Thunderbird. Le bouton « Plus d’actions » ouvre le popup sur son ancre et le clic droit l’ouvre aux coordonnées écran. Aucun overlay HTML positionné manuellement n’est conservé.

## D004 — Aucun badge dans l’arbre des dossiers

Les nombres de l’arbre Thunderbird sont réservés aux états natifs. Les compteurs d’épingles restent dans le panneau et le dashboard.

## D005 — Build sans dépendance

Le build repose uniquement sur Python et Node pour faciliter la revue, réduire la chaîne d’approvisionnement et produire des archives déterministes.

## D006 — Licence source-disponible restrictive

Le propriétaire ne souhaite ni vente ni redistribution publique du code. Le projet n’est donc pas présenté comme open source. Une revue juridique est requise avant publication publique.

## D007 — MailPin comme identité publique

Le nom public canonique est **MailPin** et le nom complet du store est **MailPin — Email Follow-up & Productivity**. Les anciens noms faisant référence à Outlook sont retirés des surfaces publiques. Les identifiants techniques `pin-mails-*` restent conservés jusqu’à une migration dédiée afin de préserver les données et les mises à niveau.

## 2026-07-31 — séparation des densités

`uiPreset` ne concerne que la page Paramètres. `density` ne concerne que les cartes épinglées.
Aucun réglage MailPin ne redimensionne les lignes natives Thunderbird.

## 2026-07-31 — mémoire projet unique

`PROJECT_MEMORY.md` est le point d’entrée obligatoire pour Codex. Les documents spécialisés
restent la source détaillée, mais ne doivent pas recopier l’intégralité du contexte.

## 2026-07-31 — rail d’actions natif

Dans la vue Cartes Thunderbird, étoile, punaise et menu utilisent un rail centré verticalement.
La hauteur virtuelle native reste inchangée.

## 2026-07-31 — aucune notion d’administrateur client

MailPin est une extension locale mono-utilisateur. Aucun `admin`, `isAdmin`, rôle caché, jeton maître ou permission simulée dans le DOM n’est ajouté. Toute autorisation réelle est définie par le manifeste, le schéma de l’API Experiment et les contrôles privilégiés. Le propriétaire du profil Thunderbird reste un acteur de confiance.

## 2026-07-31 — imports traités comme hostiles

Une restauration ne réactive jamais automatiquement les règles, relances, synchronisations bidirectionnelles, suppressions Agenda, chemins de sauvegarde ou liens environnementaux. Le mode sûr est activé et l’utilisateur doit revoir puis réactiver explicitement les automatismes.

## 2026-07-31 — chemin de sauvegarde uniquement natif

Le chemin de sauvegarde n’est jamais accepté depuis `setConfiguration` ni depuis un import. Seul `nsIFilePicker` dans l’Experiment peut le modifier.

## 2026-07-31 — purge à la désinstallation

Les API Experiment ne pouvant pas utiliser les événements statiques `uninstall`, MailPin s’abonne au cycle cœur `Management` pendant son activité. `onUninstalling` marque la désinstallation avant l’arrêt et `onOperationCancelled` annule ce marquage si nécessaire ; l’événement cœur `uninstall`, attendu par Gecko, ferme SQLite puis purge les données de profil et préférences. Une mise à jour retire l’ancien écouteur sans purge. Les exports téléchargés manuellement sont hors périmètre. Dans un dossier externe, seules les enveloppes MailPin munies d’un checksum local vérifiable sont candidates à la suppression.

Une sentinelle primitive est en plus enregistrée dans `ExtensionStorage`, effacé par Gecko à la désinstallation. Son absence est contrôlée avant toute ouverture de la base. Pour éviter une perte de données lors du premier déploiement 3.2.4, une vraie mise à jour depuis une installation plus ancienne conserve une seule fois les données préexistantes et initialise la sentinelle ; une installation neuve ou une réinstallation purge les résidus.
## 2026-07-31 — chaîne CI immuable et autonome

Les contrôles HTML/CSS reposent sur la bibliothèque standard Python. Les workflows ne téléchargent aucun helper Python, les actions GitHub sont épinglées à des commits immuables, `persist-credentials` est désactivé et Dependabot propose les mises à jour. Cette décision réduit la chaîne d’approvisionnement sans rendre les vérifications dépendantes d’un lockfile externe.


## Les étoiles natives restent intactes en mode indépendant

MailPin ne déplace, ne masque et ne relabellise aucun contrôle étoile lorsque `pinMode = independent`. Les transformations de l’étoile sont autorisées uniquement en mode `nativeStar`, avec instantané et restauration exacte du parent et des attributs natifs.

## Les actions globales des paramètres utilisent le formulaire natif

Les commandes Enregistrer/Annuler vivent dans l’en-tête sticky, hors du formulaire visuel, et ciblent explicitement `settings-form` avec `type=submit` et `type=reset`. Le JavaScript conserve aussi des handlers directs sur les contrôles visibles car l’onglet Options embarqué ne garantit pas toujours la délégation native cross-form ; le dirty state et le verrouillage `saveInFlight` restent les sources de vérité.

## Le suivi des bugs est permanent

`docs/BUG_TRACKER.md` est la source unique des bugs reproduits. Un correctif graphique reste `À VALIDER` tant qu’il n’a pas été confirmé dans Thunderbird réel. La CI valide la structure du registre sans effacer son historique.

## 2026-08-04 — productivité 1.1.0 sans nouvelle permission

Les fonctions Aujourd’hui, Revue, veille, rappels interactifs, capture rapide, actions groupées et raccourcis réutilisent l’API Experiment existante et la permission `menus`. Aucune permission réseau, de message supplémentaire ou dépendance d’exécution n’est ajoutée. Les projections quotidiennes et hebdomadaires sont calculées depuis les métadonnées locales au lieu de créer une seconde base de tâches.

## 2026-08-04 — fusion uniquement sur identité forte

MailPin peut proposer le regroupement d’épingles uniquement lorsqu’elles partagent, dans le même compte, un fil Gmail, un Message-ID racine, un `threadId` Thunderbird ou une clé de conversation dérivée de ces identités. L’objet seul est interdit comme preuve. La fusion reste manuelle, confirmée, bornée à 50 éléments, annulable et refusée en cas de liens Agenda distincts.

## 2026-08-04 — état explicite des rappels interactifs

Un rappel possède un horodatage de déclenchement et un horodatage d’acquittement distincts. Cette séparation permet de conserver un rappel récurrent visible jusqu’à une action utilisateur, de reporter sans dupliquer et d’ignorer sans supprimer l’épingle. Le centre de rappels n’envoie, ne déplace et ne supprime jamais de message.

## 2026-08-08 — frontière de compatibilité Thunderbird explicite

Les opérations Messages, Tags et Agenda qui dépendent des services internes Thunderbird sont regroupées derrière `PinCompatibility` et des adaptateurs injectables. La logique métier ne doit plus réintroduire ces appels directs dans l’orchestrateur. Le DOM `about:3pane` reste temporairement dans `implementation.js` afin de ne pas cumuler extraction des services et réécriture graphique risquée dans la même passe.

Une capacité Tags ou Agenda absente doit dégrader uniquement cette fonction. Les tests de contrat avec faux services complètent, mais ne remplacent pas, un test avec un vrai binaire Thunderbird.

## 2026-08-08 — mode Recommandé sans migration de préférence

La valeur persistée `guided` est conservée pour la compatibilité des profils, mais son libellé utilisateur devient **Recommandé**. Ce mode masque les sections techniques Avancé sans supprimer leurs contrôles. L’action d’application des recommandations modifie uniquement un brouillon, préserve les valeurs propres au profil et exige toujours un Enregistrer explicite.

## 2026-08-08 — smoke Thunderbird séparé de la QA obligatoire

Le smoke runtime utilise un binaire Thunderbird officiel et geckodriver vérifiés par SHA-256. Pendant sa phase d’épreuve, il reste un workflow séparé et non requis afin qu’une incompatibilité du harnais externe ne bloque pas la QA source. Il ne pourra devenir un contrôle requis qu’après plusieurs exécutions fiables et une décision explicite.

## 2026-08-13 — Organic Workspace canonique en source

Le Dashboard et Options portent leur shell final directement dans le HTML suivi. Le JavaScript ne re-parente pas l’interface pour appliquer la DA ; il ne fait que lier états et interactions. Cette règle évite les landmarks imbriqués, les doubles structures legacy et les divergences entre DOM source, tests et runtime.

Les menus secondaires, statistiques progressives et inspector doivent rester dans le flux ou recomposer le layout avant toute superposition. Les dialogs sont les seules surfaces prévues pour recouvrir volontairement le contenu principal.
