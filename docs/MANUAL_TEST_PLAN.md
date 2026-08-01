# Plan de test manuel

Consigner version Thunderbird, OS, thème, vue, type de compte et résultat.

## Installation et migration

- installation propre ;
- mise à niveau 3.1.4 → 3.1.5 ;
- redémarrage normal et redémarrage forcé ;
- sauvegarde puis restauration.

## Panneau

- 0, 1, 10, 100 et 1 000 épingles ;
- boîte actuelle, compte et tous les comptes ;
- thèmes clair, sombre, contraste élevé ;
- vues cartes et tableau ;
- repli, recherche, tri et groupes.

## Interactions

- clic simple sans défilement natif ;
- double-clic ;
- clic droit et toutes ses commandes ;
- `Shift+F10`, touche Menu, flèches et Échap ;
- sélection multiple ;
- drag réussi et drag annulé ;
- aucune bordure pointillée résiduelle.

## Dashboard

- ouverture depuis l’en-tête, l’action et le menu ;
- CSS/JS chargés ;
- liste, Kanban, affaires, historique ;
- actions unitaires et groupées ;
- erreur simulée et bouton Réessayer.

## Données et compteurs

- compteur non lu/nouveau inchangé après épinglage ;
- message lu et non lu ;
- déplacement, copie, archive, corbeille et restauration ;
- dossier renommé ;
- deux fenêtres simultanées ;
- hors ligne puis reconnexion.

## Agenda, règles et rappels

- calendrier local et CalDAV modifiable ;
- calendrier en lecture seule ;
- création, modification, fin et suppression ;
- règle simulée puis appliquée ;
- limite et anti-boucle ;
- veille, réveil et rappel manqué.

## Validation ciblée 3.1.5

### Cartes épinglées

- clic droit sur auteur, objet, espace vide, bouton d’action et punaise : le menu natif MailPerch s’ouvre à l’emplacement du pointeur ;
- bouton « Plus d’actions » : le même menu natif s’ouvre sous le bouton ;
- vérifier que le menu reste visible en thème clair, sombre et contraste élevé, puis qu’il se ferme après une commande, Échap, un changement de dossier ou une perte de focus ;
- tester après un tri manuel et un glisser-déposer afin de confirmer que les boutons ne déclenchent jamais le déplacement de la carte ;
- exécuter ouvrir, répondre, lu/non lu, archiver, supprimer, groupe, attente, planifier, terminer, rappel et Agenda ;
- désépingler par la punaise puis par le menu ;
- vérifier le résultat visible et l’absence de double exécution ;
- tester `Shift+F10`, touche Menu, Échap et navigation clavier.

### Agenda

- vérifier la liste des calendriers dans les paramètres, le panneau, l’éditeur et le dashboard ;
- choisir un calendrier local inscriptible, créer une tâche puis un événement ;
- refaire le test avec un calendrier CalDAV inscriptible ;
- vérifier qu’un calendrier en lecture seule, désactivé, sans ACL ou incompatible reste expliqué mais non sélectionnable ;
- modifier l’échéance et le titre d’un élément déjà lié ;
- provoquer une erreur fournisseur et vérifier que le message indique le calendrier et la cause détectée.

### Paramètres

- utiliser la recherche pour retrouver une option et un bouton ;
- parcourir chaque section avec la navigation collante ;
- vérifier une explication sous chaque contrôle et chaque bouton ;
- modifier une option en bas de page : le feedback local et le toast restent visibles ;
- vérifier les états « modifications non enregistrées », Enregistrer et Annuler ;
- lancer une opération de maintenance sans perdre les modifications en cours.

## Régressions vidéo du 30 juillet 2026

- le dashboard charge sans erreur `Unexpected properties` ;
- enregistrer les paramètres ne produit aucune erreur de schéma ;
- clic droit sur chaque zone d’une carte : auteur, objet, espace vide et punaise ;
- clic simple : le message s’affiche sans conserver la bordure de sélection multiple ;
- les actions rapides disparaissent quand la souris quitte la carte ;
- `Ctrl`/`Cmd` et `Maj` conservent leur sélection multiple distincte ;
- couleur de compte visible sur les punaises du panneau et de la liste native ;
- punaise inactive visible au survol de ligne, puis retour renforcé au survol direct ;
- punaise centrée dans son bouton en vue Cartes et Tableau ;
- création et affectation d’un groupe sans dialogue natif du navigateur ;
- ouverture du dashboard juste après le démarrage de Thunderbird, sans faux message d’indisponibilité.

## Régressions de la seconde vidéo du 30 juillet 2026

- faire défiler les paramètres jusqu’en bas, lancer chaque action et vérifier le toast dans le viewport ;
- modifier une option puis lancer Vérifier SQLite : la modification non enregistrée doit rester présente ;
- vérifier le bandeau fixe Enregistrer/Annuler après toute saisie ;
- cliquer sur auteur, objet, espace vide, bouton Plus et punaise : aucune zone morte ;
- clic droit sur chaque zone de la carte : menu MailPerch visible, jamais le menu natif seul ;
- quitter la carte : les actions rapides invisibles ne doivent plus capter les clics ;
- vérifier les couleurs de compte et le centrage des punaises dans les deux thèmes ;
- exécuter chaque action du dashboard : état occupé puis succès ou erreur visible ;
- déplacer une carte Kanban et vérifier le feedback et l’absence de contour résiduel.

## Validation ciblée 3.2.0

### Vues intelligentes et performances

- vérifier Toutes, Aujourd’hui, En retard, Cette semaine, En attente, Sans réponse, Sans échéance, Non lus, Introuvables, Agenda à vérifier et Récemment terminés ;
- comparer les compteurs entre panneau et dashboard ;
- tester 100, 500, 1 000 et 2 000 épingles ;
- confirmer que le chargement progressif ne perd ni sélection ni ordre ;
- modifier une carte et vérifier que seules les cartes nécessaires sont remplacées.

### Actions groupées

- sélectionner avec Ctrl/Cmd, Maj, clavier et Tout sélectionner dans la vue ;
- tester statut, priorité, échéance, groupe, affaire, modèle, lu/non lu et suivi sans réponse ;
- tester archivage, désépinglage et suppression avec confirmation ;
- confirmer le résultat partiel et le message d’erreur lorsqu’un message n’est plus disponible.

### Suivi automatique sans réponse

- envoyer un message avec le suivi automatique activé ;
- vérifier la date de relance, la vue Sans réponse et le redémarrage ;
- recevoir une réponse dans la conversation et confirmer l’annulation ;
- tester Message-ID dupliqué, conversation déplacée et compte hors ligne.

### Santé, diagnostic et fournisseurs

- exécuter l’analyse de santé sur une base saine puis avec une référence introuvable ;
- exporter le diagnostic et confirmer l’absence de corps, pièce jointe, adresse brute et chemin privé ;
- vider le diagnostic sans modifier les épingles ;
- exécuter la matrice sur IMAP, POP, Gmail, Microsoft, dossiers locaux et chaque calendrier ;
- vérifier les réparations sûres après création automatique d’une sauvegarde.

### Restauration et migration

- prévisualiser une sauvegarde valide, ancienne, conflictuelle, trop volumineuse et malformée ;
- vérifier les stratégies Fusionner et Remplacer ;
- confirmer la sauvegarde de sécurité avant chaque écriture ;
- interrompre volontairement une restauration et vérifier le rollback ou la récupération.

### UX, accessibilité et liste générale

- utiliser la navigation groupée des paramètres, la recherche et Échap pour effacer la recherche ;
- tester les modes Guidé/Avancé et Compact/Équilibré/Très aéré ;
- vérifier zoom 125 %, 150 % et 200 %, thèmes clair/sombre/contraste élevé ;
- tester Tab, flèches, Home, End, PageUp, PageDown, Entrée, Espace, Shift+F10 et Échap ;
- confirmer que le focus revient au bouton après fermeture du menu ;
- vérifier que la ligne générale est légèrement plus haute et que la punaise 36×36 est centrée, éloignée du bord supérieur et ne chevauche aucun texte.

## Validation ciblée 3.2.1

### Tableau de bord

- ouvrir successivement Liste, Kanban, Affaires, Historique et Centre de santé ;
- confirmer l’absence d’écran d’erreur et le retour correct à la vue Liste ;
- vérifier Réessayer après une erreur provoquée volontairement dans un profil de test.

### Menu des messages généraux

- sur un message non épinglé, vérifier les libellés « Épingler ce message » et « Épingler toute la conversation liée » ;
- après épinglage, vérifier les libellés inverses sans entrée dupliquée ;
- tester une sélection multiple et confirmer l’emploi du pluriel ;
- confirmer que l’action Conversation agit sur toute la conversation et non uniquement sur le message sélectionné.

### Groupes et liste générale

- affecter une épingle à un groupe, puis cliquer sur la puce `Nom du groupe ×` ;
- vérifier aussi « Retirer du groupe » dans le menu natif de la carte ;
- contrôler l’espacement des lignes et de l’aperçu en vue Cartes ;
- recevoir un message neuf et vérifier sa bordure, son fond, sa typographie et son icône agrandie en thèmes clair, sombre et contraste élevé.

## Validation ciblée 3.2.2

### Géométrie de la liste générale

- tester la vue Cartes avec les densités Compacte, Normale et Tactile ;
- vérifier que l’expéditeur, la date, l’objet, l’indicateur nouveau/non lu, la punaise et le menu sont centrés dans leur zone ;
- confirmer qu’une marge visible reste présente sous l’objet et qu’aucun texte ne touche la bordure ;
- vérifier les dossiers de 10, 100 et plusieurs milliers de messages afin d’écarter tout décalage de virtualisation ;
- tester les messages avec pièce jointe, étiquette, étoile, conversation et texte très long.

### Paramètres

- ouvrir la page puis changer immédiatement le niveau de réglages avant la fin du chargement ;
- vérifier qu’aucune erreur `configuration is null` n’apparaît ;
- confirmer que Enregistrer et Annuler restent désactivés pendant le chargement puis deviennent disponibles ;
- simuler une indisponibilité temporaire de l’API et vérifier le message de chargement lisible.

### CI multiplateforme

- vérifier que les jobs Linux et Windows exécutent `npm run check` puis `npm test` ;
- confirmer l’absence de commande `python3` dans les scripts npm et le workflow de release.

## Validation ciblée 3.2.3

### Liste native Thunderbird

- vérifier que étoile, punaise et bouton « Plus » sont sur un rail horizontal centré ;
- confirmer des marges supérieures et inférieures identiques autour des trois boutons ;
- tester messages nouveaux, non lus, étoilés, épinglés, avec pièce jointe et étiquettes ;
- tester densités Thunderbird Compacte, Normale et Tactile sans décalage de virtualisation.

### Densités MailPerch

- modifier « Espacement des paramètres » : seule la page Options doit changer ;
- modifier « Densité des cartes » : seul le panneau Épinglés doit changer ;
- vérifier que les modes Compact, Normal et Confortable conservent auteur, objet, date et actions lisibles ;
- confirmer que la liste native ne change jamais de hauteur lors de ces modifications.

### Paramètres

- vérifier que chaque case possède son aide sous le libellé, sans chevauchement ;
- vérifier que les aides des boutons restent dans des colonnes séparées ;
- créer, déplacer, recolorer et supprimer un groupe ;
- confirmer qu’un compte ne répète pas deux fois la même adresse ;
- vérifier les libellés Agenda « Tâches », « Événements », les deux ou indisponible ;
- vérifier que le toast se ferme depuis son coin supérieur droit ;
- confirmer qu’un seul bouton Enregistrer persistant apparaît après modification ;
- tester zoom 125 %, 150 %, 200 % et largeur inférieure à 780 px.

### CI et mémoire

- exécuter les jobs Linux et Windows ;
- confirmer que `dist/.gitkeep` n’est pas signalé avec un suffixe `\r` ;
- lancer `python scripts/check_project_memory.py` ;
- vérifier que `PROJECT_MEMORY.md` indique la version, le commit de base et les chemins principaux.


## Validation ciblée 3.2.4 — sécurité, paramètres et désinstallation

### Installation propre et valeurs recommandées

- créer un profil Thunderbird neuf, installer le XPI et redémarrer complètement ;
- confirmer : mode de réglages Guidé, espacement Équilibré, densité des cartes Normale, stockage indépendant des étoiles ;
- confirmer que les règles automatiques, le suivi automatique sans réponse, la synchronisation Agenda bidirectionnelle et la suppression Agenda au désépinglage sont désactivés par défaut ;
- vérifier qu’aucun compte, calendrier, groupe, règle, affaire ou épingle d’une installation précédente n’est présent.

### Enregistrer et annuler

- modifier une case, une liste, un nombre, un groupe et une règle ;
- confirmer que le bandeau Enregistrer/Annuler apparaît et que les deux boutons sont activables ;
- cliquer Annuler et vérifier le retour exact aux valeurs persistées ;
- refaire les changements, cliquer Enregistrer, fermer l’onglet puis le rouvrir et vérifier la persistance ;
- double-cliquer rapidement Enregistrer et confirmer qu’une seule écriture est exécutée ;
- vérifier que le dossier de sauvegarde choisi n’est jamais remplacé par une valeur saisie via le DOM ou un objet JavaScript modifié.

### Imports et entrées non fiables

- importer une sauvegarde valide, puis confirmer que MailPerch passe en mode sûr et désactive les règles/automatismes importés ;
- refuser un fichier trop volumineux, trop imbriqué, cyclique, avec `__proto__`, `prototype` ou `constructor` ;
- refuser une enveloppe dont la somme de contrôle a été modifiée ;
- confirmer qu’aucun chemin de sauvegarde, lien Agenda ou état d’exécution automatique n’est restauré depuis le fichier ;
- vérifier que le diagnostic exporté ne contient ni adresse de compte brute, ni identifiant de calendrier, ni chemin local, ni corps de message.

### Désinstallation complète

- créer des épingles, groupes, règles, affaires, historique et une sauvegarde interne ;
- choisir aussi un dossier externe de sauvegarde et produire une sauvegarde MailPerch munie de son checksum local ;
- fermer les opérations en cours, supprimer MailPerch depuis le gestionnaire de modules et fermer toutes les fenêtres Thunderbird ;
- vérifier la disparition de la base `pin-mails-v2.sqlite` et de ses fichiers WAL/SHM/journal, du fichier de récupération, du dossier interne `pin-mails-backups` et des préférences `extensions.pinMails.*` ;
- dans le dossier externe, confirmer que seules les sauvegardes MailPerch vérifiables ont été supprimées et que les fichiers sans rapport sont conservés ;
- réinstaller le même XPI et confirmer un démarrage à zéro avec la configuration recommandée ;
- répéter après avoir désactivé l’extension puis redémarré Thunderbird avant sa suppression : si une purge immédiate n’a pas pu s’exécuter, la réinstallation doit quand même supprimer les résidus avant l’ouverture SQLite grâce à la sentinelle native ;
- effectuer aussi une mise à jour 3.2.3 → 3.2.4 et confirmer que la migration initiale de la sentinelle ne supprime pas les données existantes ;
- conserver les exports téléchargés manuellement : ils sont hors du stockage géré par l’extension et ne doivent pas être supprimés.

### Frontière de confiance

- confirmer qu’aucun réglage `admin`, `isAdmin`, rôle caché ou jeton maître n’existe dans le DOM, le manifeste, le schéma ou les préférences ;
- modifier le DOM des paramètres : cela ne doit jamais permettre de définir un chemin de fichier ou d’activer une capacité absente de l’API privilégiée ;
- documenter séparément les manipulations effectuées avec Browser Toolbox : le propriétaire du profil local est dans la frontière de confiance et contrôle déjà Thunderbird.

### Liste générale

- vérifier chaque message étoilé/non étoilé et épinglé/non épinglé : une seule étoile native visible ;
- changer de dossier, de thème, de densité Thunderbird et faire défiler plusieurs centaines de lignes ;
- confirmer que le nettoyage de MailPerch restaure les attributs natifs sans laisser d’icône dupliquée.


## Validation ciblée 3.2.5 — étoiles, paramètres et CI Windows

### Étoiles et punaise

- démarrer avec `Stockage des épingles = Indépendant des étoiles` ;
- vérifier une seule étoile native, une seule punaise MailPerch et un seul bouton `…` sur au moins vingt lignes virtualisées ;
- faire défiler rapidement, changer de dossier, revenir et vérifier l’absence de duplication ;
- passer en mode `nativeStar`, vérifier l’action, puis revenir en mode indépendant ;
- confirmer que l’étoile retrouve son libellé, son emplacement et son comportement Thunderbird d’origine.

### Paramètres

- modifier successivement une case, un champ numérique, une liste et un groupe ;
- cliquer Enregistrer et confirmer la disparition de la barre ainsi que la persistance après réouverture ;
- effectuer d’autres modifications, cliquer Annuler et confirmer le retour exact aux valeurs enregistrées ;
- répéter l’enregistrement avec `Ctrl+S` sous Windows/Linux ou `Cmd+S` sur macOS ;
- vérifier qu’un double clic ne lance pas deux écritures et qu’une erreur API reste visible près de l’action.

### CI Windows

- pousser la version sur une branche de test ;
- confirmer que `Source and model checks (Windows)` passe `scripts/deep_audit.py` ;
- vérifier l’absence de faux chemin `dist/.gitkeep\r` dans les logs.

Après chaque résultat, mettre à jour `docs/BUG_TRACKER.md` : `À VALIDER` vers `CORRIGÉ`, ou rouvrir l’entrée avec les nouvelles preuves.


## Validation ciblée 3.2.7 — bugs rouverts

### MP-2026-004 — étoile et punaise

1. Choisir le mode d’épinglage indépendant.
2. Afficher au moins 100 messages en vue Cartes.
3. Faire défiler rapidement vers le bas puis vers le haut afin de forcer la réutilisation des lignes.
4. Vérifier sur chaque ligne : une étoile native Thunderbird, une punaise MailPerch et un bouton `…`, sans symbole supplémentaire.
5. Épingler/désépingler plusieurs messages et confirmer que l’étoile native ne change pas.
6. Refaire le test en mode `nativeStar`, où l’étoile est volontairement remplacée par la punaise.

### MP-2026-005 — paramètres

1. Modifier un sélecteur, une case à cocher, un nombre et un champ texte.
2. Cliquer **Enregistrer** et vérifier le retour « Paramètres enregistrés ».
3. Fermer puis rouvrir l’onglet Paramètres et confirmer la persistance.
4. Modifier de nouveau une valeur, cliquer **Annuler** et confirmer le retour immédiat à la valeur enregistrée.
5. Refaire l’enregistrement avec `Ctrl+S` ou `Cmd+S`.
6. Ne passer les entrées du registre à `CORRIGÉ` qu’après réussite de ces scénarios.

## Validation ciblée 3.2.8 — recommandations, dock et géométrie

Utiliser exclusivement un profil jetable et des messages synthétiques. Commencer
sans préférence `extensions.pinMails.settings`, puis répéter avec une mise à jour
contenant au moins une clé explicitement à `false`.

### Recommandations et sauvegarde

1. Ouvrir Options et confirmer qu'un état « Chargement des recommandations » est
   remplacé directement par le formulaire normalisé, sans flash de cases toutes
   décochées.
2. Vérifier au minimum `showSearch`, `showQuickActions`, Agenda, dashboard,
   sauvegardes, santé et diagnostic actifs ; règles automatiques, nettoyage
   automatique et suppressions Agenda restent désactivés par recommandation.
3. Modifier une case, un nombre, une liste, un texte, une couleur de compte, une
   boîte, un groupe, une règle et un modèle. À chaque fois, vérifier que le dock
   apparaît immédiatement dans le viewport.
4. Au centre des boutons Enregistrer et Annuler, un clic doit être reçu ; vérifier
   aussi Tab + Entrée/Espace et `Ctrl/Cmd+S`.
5. Enregistrer, fermer l'onglet, le rouvrir, redémarrer Thunderbird puis vérifier
   les valeurs. Modifier ensuite plusieurs sections et Annuler : aucune valeur du
   brouillon ne doit subsister.
6. Revenir manuellement à chaque valeur initiale : le dock doit disparaître sans
   écriture. Provoquer si possible une erreur d'écriture dans un profil de test :
   le dock et le brouillon doivent rester, sans notification de réussite.

Dans la console du document Options sélectionné dans Browser Toolbox, ce diagnostic
ne révèle que des identifiants de contrôles et des états d'interface :

```js
(() => {
  const dock = document.querySelector("#save-dock");
  const save = document.querySelector("#save-all-floating");
  const cancel = document.querySelector("#discard-changes");
  const rect = element => {
    const box = element.getBoundingClientRect();
    return {top: box.top, bottom: box.bottom, width: box.width, height: box.height};
  };
  console.table({
    body: {ready: document.body.hasAttribute("data-configuration-ready"), dirty: document.body.hasAttribute("data-dirty")},
    dock: {hidden: dock.hidden, ariaHidden: dock.getAttribute("aria-hidden"), display: getComputedStyle(dock).display, visibility: getComputedStyle(dock).visibility, pointerEvents: getComputedStyle(dock).pointerEvents, ...rect(dock)},
    save: {disabled: save.disabled, ariaDisabled: save.getAttribute("aria-disabled"), hit: document.elementFromPoint(rect(save).width ? save.getBoundingClientRect().left + save.getBoundingClientRect().width / 2 : 0, save.getBoundingClientRect().top + save.getBoundingClientRect().height / 2)?.id},
    cancel: {disabled: cancel.disabled, ariaDisabled: cancel.getAttribute("aria-disabled")}
  });
  console.table([...document.querySelectorAll("#settings-form [data-setting-key]")].map(control => ({id: control.id || "dynamique", key: control.dataset.settingKey, type: control.dataset.settingType, dirty: control.dataset.settingDirty, save: control.dataset.settingSave, migration: control.dataset.settingMigration})));
})();
```

### Cartes Thunderbird 153

Tester vue normale/compacte, densité tactile, thème sombre et mise à l'échelle
Windows 100/125 %. Inclure premier/dernier message, lu/non lu, pièce jointe,
étoilé/non étoilé, sélectionné, survolé, épinglé/désépinglé et défilement rapide.

Dans la Browser Toolbox, relever uniquement classes et géométrie :

```js
(() => {
  const pane = Services.wm.getMostRecentWindow("mail:3pane")?.document?.getElementById("tabmail")?.currentAbout3Pane;
  const rect = element => {
    const box = element.getBoundingClientRect();
    return {top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width, height: box.height, centerY: box.top + box.height / 2};
  };
  const rows = [...pane.document.querySelectorAll('#threadTree[rows="thread-card"] tr.card-layout')];
  console.table(rows.slice(0, 30).map((row, index) => {
    const card = row.querySelector(".card-container");
    const rail = row.querySelector(".pin-mails-card-action-rail");
    const pin = row.querySelector(".pin-mails-independent-button, [data-pin-mails-native-star]");
    const star = row.querySelector(".button-star");
    const menu = row.querySelector(".tree-button-more");
    const attachment = row.querySelector(".attachment-icon");
    if (!card || !rail || !pin || !star || !menu) return {index, incomplete: true};
    const cardBox = rect(card), pinBox = rect(pin), starBox = rect(star);
    return {index, classes: row.className, properties: row.getAttribute("data-properties") || "", cardHeight: cardBox.height, pinCenterY: pinBox.centerY - cardBox.top, starCenterY: starBox.centerY - cardBox.top, centerDelta: Math.abs(pinBox.centerY - starBox.centerY), pinBottomGap: cardBox.bottom - pinBox.bottom, starBottomGap: cardBox.bottom - starBox.bottom, rail: JSON.stringify(rect(rail)), menu: JSON.stringify(rect(menu)), attachment: attachment ? JSON.stringify(rect(attachment)) : "none", pinHit: pane.document.elementFromPoint(pinBox.left + pinBox.width / 2, pinBox.centerY)?.className, starHit: pane.document.elementFromPoint(starBox.left + starBox.width / 2, starBox.centerY)?.className};
  }));
})();
```

Attendu : `centerDelta ≤ 1`, cibles entièrement dans la carte, espace inférieur
`≥ 8` quand la hauteur le permet, aucun recouvrement avec le menu ou la pièce
jointe, et une cible correcte pour `pinHit`/`starHit`. Joindre les résultats à
MP-2026-004/005/007 avant de modifier leur statut.
