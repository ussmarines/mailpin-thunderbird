# Audit fonctionnel MailPerch 3.2.8

Date : 2026-08-01. Cet audit distingue les preuves automatisées des validations
Thunderbird. `A` signifie test automatisé actuel, `P` preuve antérieure encore
applicable, `T` démarrage dans un profil Thunderbird temporaire, `M` validation
manuelle requise. Aucun `M` n'est présenté comme réussi.

## Paramètres et recommandations

La source unique est `PinSettings.DEFAULTS`. `PinSettings.normalize()` applique la
stratégie `missing-or-invalid-to-recommended; explicit-values-preserved` avant le
rendu, la comparaison et l'écriture. `SETTINGS_CONTROL_DEFINITIONS` associe à
chaque clé exposée son contrôle, type, recommandation, lecteur, écrivain,
normalisation, participation au brouillon et dépendance. Les seules clés sans
contrôle sont `schemaVersion` et `showFolderBadge`, explicitement exclues.

| Fonction | Entrée et chaîne d'exécution | Stockage | Preuve | Statut |
|---|---|---|---|---|
| Chargement | `options.html` → scripts `settings.js`, `options.js` → `DOMContentLoaded` → registre → `reload` → `getConfiguration` → `applyConfiguration` | préférences + SQLite en lecture | Playwright réel, formulaire masqué jusqu'à normalisation | A, M après redémarrage |
| Installation vide / `{}` / partielle / ancienne | `parseStored` → `normalizeSettings` → `PinSettings.normalize` → `applyConfiguration` | préférence `extensions.pinMails.settings` | `settings_defaults.mjs`, Playwright sur `{}`, partiel, schema 5, invalide | A, T pour absence de préférence, M pour rendu Thunderbird |
| Faux explicite | même chaîne, `normalizeBoolean(false, fallback)` conserve `false` | même préférence | modèle + Playwright `showSearch:false` | A |
| Guidé / Avancé | `settingsExperience` → registre → `applyUxPreferences` → attribut du document | préférence réglages | Playwright sélection, sauvegarde, rechargement | A, M Thunderbird |
| Équilibré / Compact / Confortable | `uiPreset` → registre → `applyUxPreferences` | préférence réglages | matrice des 98 contrôles modifiables | A, M visuel |
| Mouvement réduit | `reduceMotion` → registre → attribut de document | préférence réglages | matrice des contrôles | A, M visuel |
| Interrupteurs | événement natif `input/change` → `syncDirtyState` → registre booléen → instantané | préférence réglages après Enregistrer | chaque contrôle dirty modifié puis restauré un par un | A |
| Nombres | événement → lecteur borné → normalisation partagée → instantané | préférence réglages | chaque nombre + bornes du modèle | A |
| Listes et champs | événement → codecs `string`/`lines`/`preserved` → normalisation | préférence réglages | chaque select/textarea/champ configurable | A |
| Comptes et boîtes dynamiques | `renderAccounts` → contrôles `accountColors`/`inboxEnabled` enregistrés → collecte | préférence réglages | métadonnées du registre + scénario DOM synthétique sans identité réelle | A, M multi-compte |
| Groupes | Ajouter/éditer/supprimer → `groups` → instantané → `setConfiguration` | SQLite structuré | tests modèles et matrice DOM combinée | A, M Thunderbird |
| Règles | Ajouter/éditer/simuler → `rules` / `simulateRules` | SQLite + journal local | tests règles/anti-boucle existants, contrat boutons | P, M avec messages |
| Affaires | Ajouter/éditer/supprimer → `cases` → API | SQLite | tests modèles/API existants | P, M Thunderbird |
| Modèles | Ajouter/éditer/supprimer → `templates` → API | SQLite | ajout puis Annuler dans Playwright, modèles existants | A/P |
| Agenda préféré | `getCalendars` attendu avant l'instantané → select enregistré | préférence + liens SQLite | ordre asynchrone couvert par flux DOM ; capacités par tests Agenda | A/P, M fournisseur réel |
| Enregistrer | clic réel → `saveAll` une fois → collecte → `setConfiguration` → flush → réponse → `getConfiguration` → comparaison → nouvel instantané | préférence + transactions SQLite sérialisées | 1 clic, 1 tentative, 1 écriture, relecture et reconstruction | A, M redémarrage Thunderbird |
| Annuler | clic réel → `discardChanges` → `reload` → rendu statique et dynamique | aucune écriture | Playwright vérifie zéro écriture et restauration | A, M Thunderbird |
| Retour manuel | contrôle restauré → même instantané → `dirty=false` | aucune écriture | 98 contrôles testés individuellement | A |
| Erreur d'écriture | rejet API → brouillon conservé → dock et actions réactivés → erreur visible | aucune écriture confirmée | Playwright | A |
| Notification | `setStatus` + retour local près du contrôle | aucune | contenu, visibilité et absence de réussite mensongère | A, M lecteur d'écran |
| Navigation de sections | `enhanceSettingsPage` → liens/IntersectionObserver/recherche | aucune | contrat des contrôles et styles | P, M visuel |
| Réinitialisation | bouton → confirmation → `resetConfiguration` → recommandations partagées | préférence + configuration structurée ; épingles conservées | tests API/modèles | P, M Thunderbird |

Clés booléennes couvertes : comportement d'épinglage et conversations, sections et
filtres, métadonnées des cartes, actions rapides, sélection multiple et groupée,
annulation/confirmations, rappels, règles et archivage/lecture/réponse, Agenda,
dashboard, métriques, workflows, affaires/Kanban/modèles/historique, sauvegardes,
verrous et garde compteurs, suivi sans réponse, vues intelligentes, santé et
diagnostic. La liste normative complète est le tableau gelé de
`SETTINGS_CONTROL_DEFINITIONS`, vérifié contre le DOM et `PinSettings.describe()`.

## Messages et cartes Thunderbird

| Fonction | Entrée et chaîne d'exécution | Stockage | Preuve | Statut |
|---|---|---|---|---|
| Injection/reconstruction | observateur `about:3pane` → `_setupAbout3Pane` → `patchRows`/MutationObserver → `patchRow` | lecture réglages/refs | contrats statiques + fixture DOM Thunderbird 153 | A, M liste virtualisée réelle |
| Punaise visible | `patchRow` → bouton indépendant inséré avant l'étoile dans `.thread-card-icon-info` | lecture état épingle | géométrie et hit-test Playwright | A, M Thunderbird |
| Épingler/désépingler | clic réel de ligne/bouton/commande → `toggleSelected` ou `toggleDisplayed` → référence stable → mutation sérialisée → rendu | SQLite refs/order | modèles/API antérieurs ; aucun compte réel utilisé ici | P, M |
| Conversation | commande/menu → `toggleConversationSelected` → identité de conversation | SQLite refs | tests identité/modèles | P, M Gmail/IMAP |
| Étoile native indépendante | le nœud Thunderbird reste dans son parent natif ; MailPerch ne l'écrit pas | propriété native inchangée | garde statique + fixture ; capture utilisateur avant correction | A, M clic natif |
| Mode `nativeStar` | étoile annotée comme action MailPerch, sans position absolue | étoile native selon choix explicite | fixture, position calculée `relative` | A, M |
| Pièce jointe | enfant natif du rail, jamais lue ni stockée | aucune écriture de contenu | fixture avec/sans icône, absence de chevauchement | A, M |
| Menu `…` et clic droit | menu natif → gestionnaires de carte → action sélectionnée | selon action | tests menu natif antérieurs, absence de chevauchement géométrique | P/A, M |
| Normal/survol/sélection/épingle | classes et attributs natifs → même grille structurelle | lecture état | trois cartes dont sélectionnée/épinglée ; hover réel | A, M |
| Lu/non lu | attribut `data-properties` uniquement pour le rendu ; aucun changement de compteur | aucune écriture native au pin | fixture + garde compteurs | A/P, M |
| Dossier/compte | FolderDisplay/observateurs → recalcul scope → reconstruction | refs SQLite, réglages de boîtes | modèles fournisseurs/identité | P, M multi-compte |
| Nettoyage | `cleanup`/`onShutdown` retire classes, attributs, nœuds, observers et CSS | fermeture stockage au shutdown | tests cycle de vie et gardes statiques | P, M |

Le test géométrique couvre cartes normale, survolée, sélectionnée, épinglée,
désépinglée, étoilée, non étoilée, avec/sans pièce jointe, lue/non lue, première et
dernière, thème sombre, vue normale/compacte, densité tactile, zoom CSS 125 % et
mode `nativeStar`. Il vérifie rectangles, centres à ±1 px, marge basse ≥ 8 px,
absence de recouvrement et `elementFromPoint`.

## Dashboard et fonctions associées

| Fonction | Chaîne d'exécution | Stockage | Preuve réutilisable | Statut |
|---|---|---|---|---|
| Ouverture | bouton/commande/menu → background → `tabs.create(dashboard.html)` ; Experiment émet `onDashboardRequested` | aucune | contrat background/API inchangé | P, M |
| Chargement global | `dashboard.js` → `getDashboardData` → résolution refs/vues | SQLite en lecture | test contrat DOM + modèles dashboard | P, M données réelles |
| Liste/Kanban/vues intelligentes | contrôles dashboard → filtre local + fonctions smart | lecture refs/cases/history | modèles smart/dashboard | P, M visuel |
| Recherche/filtres/tri | événements DOM → état dashboard → nouveau rendu | état dashboard SQLite | tests dashboard DOM/modèles | P, M |
| Actions unitaires/groupées | sélection → `performReferenceAction` → validation bulk → stockage | transactions SQLite ; message natif selon action explicite | tests bulk/API/sécurité | P, M opérations réelles |
| Workflow/attente/planification/terminé | action → `setWorkflowStatus`/helpers workflow | refs/history SQLite | modèles workflow | P, M |
| Notes/échéances/rappels/récurrence | édition → action de référence → normalisation bornée | refs/history SQLite | modèles et garde entrées | P, M notifications |
| Affaires/modèles | appels create/update/delete/apply | cases/templates/refs SQLite | tests modèles/API | P, M |
| Agenda | create/sync → module Calendar + observers | liens/IDs locaux, Agenda Thunderbird | tests capacités et schéma | P, M calendriers réels |
| Santé/diagnostic/performance | APIs dédiées → modules bornés/expurgés | journal local borné | tests sécurité/santé/performance | P |
| Import/export/restauration/sauvegarde | preview → validation → sauvegarde préalable → fusion/remplacement | préférences, SQLite, fichiers choisis | tests intégrité/migration/sécurité | P, M sélecteur/fichiers |

La preuve antérieure du dashboard reste utilisable parce que ses fichiers DOM/JS,
le schéma API, les permissions, les schémas SQLite/données et les modules métier
concernés sont inchangés. Sa lecture de réglages passe toutefois désormais par le
normaliseur partagé ; ce point est revalidé par les tests de schéma, modèles et la
CI 3.2.8, pas par une observation graphique Thunderbird.

## Limites de preuve

Thunderbird 153.0.1 a été lancé avec un profil temporaire vide et l'extension de
développement. Le protocole WebDriver BiDi s'est connecté, mais n'a exposé aucun
`browsingContext` exploitable pour les onglets Thunderbird. Les clics sur les
cartes, comptes/dossiers, redémarrages avec persistance et mesures dans une vraie
liste virtualisée restent donc `M`. Les bugs graphiques restent `À VALIDER`.
