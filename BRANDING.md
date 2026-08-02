# Identité de marque MailPerch

## Identité canonique

- **Nom du produit :** MailPerch
- **Nom complet pour le store :** MailPerch — Email Pins & Follow-up
- **Sous-titre français :** Épinglez, organisez et suivez vos e-mails dans Thunderbird.
- **English subtitle:** Pin, organize and follow up on your emails in Thunderbird.
- **Slogan anglais :** Keep important mail within reach.
- **Slogan français :** Gardez vos messages importants à portée de main.
- **Dépôt :** `ussmarines/mailperch-thunderbird`
- **Nom du paquet npm privé :** `mailperch-thunderbird`
- **Nom des builds :** `MailPerch_v<VERSION>.xpi`
- **Nom des archives source :** `MailPerch_GitHub_Repository_v<VERSION>.zip`

## Règles de nommage

1. Utiliser **MailPerch** dans l’interface, les journaux, la documentation et les captures.
2. Utiliser **MailPerch — Email Pins & Follow-up** comme nom long du module et du store.
3. Ne pas employer « Outlook » dans les surfaces publiques, les titres, les descriptions ou les métadonnées du dépôt.
4. Les traductions doivent conserver le nom MailPerch sans le traduire.
5. Le slogan peut être localisé, mais sa version anglaise canonique reste « Keep important mail within reach. »

## Identifiants techniques conservés temporairement

Les éléments suivants sont historiques et ne doivent pas être renommés sans migration explicite :

- ID de développement : `pin-mails@MailPerch.local` ;
- base locale : `pin-mails-v2.sqlite` ;
- formats d’import/export existants ;
- préfixes DOM, classes CSS, topics et clés internes `pin-mails-*` ;
- nom de l’API Experiment `pinInbox`.

Les modifier sans migration pourrait créer une seconde installation, perdre l’accès aux données existantes ou casser les sauvegardes. L’ID public définitif devra être choisi une seule fois avant la première publication ATN.

## Identité visuelle Fluent

- Les valeurs visuelles canoniques vivent dans `extension/styles/tokens.css` sous le préfixe `--mp-*`.
- La marque utilise le bleu `#0F6CBD`, le turquoise `#0E8F8F` et la pile locale `"Segoe UI Variable", "Segoe UI", system-ui, -apple-system, sans-serif`.
- `extension/icons/mailperch-icon.svg` est le symbole couleur des en-têtes et surfaces de marque ; ses PNG 16 à 128 px servent au manifeste.
- `extension/icons/mailperch-icon-mono.svg` et les icônes d’action existantes restent réservés aux contrôles internes.
- Le panneau natif conserve les surfaces et la géométrie Thunderbird ; la marque y reste limitée au symbole, aux punaises, aux focus et aux liserés.

## Métadonnées GitHub recommandées

- **Description :** MailPerch — Pin, organize and follow up on your emails in Thunderbird.
- **Topics :** `thunderbird`, `mail-extension`, `email-productivity`, `pinned-email`, `follow-up`, `kanban`

Une recherche de disponibilité de marque reste recommandée avant la publication publique.
