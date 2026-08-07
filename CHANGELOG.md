# Journal des modifications

## 1.2.0 — productivité locale avancée et finition Fluent 2

- notes étendues et checklists/sous-tâches directement liées aux épingles ;
- recherche globale sur les métadonnées MailPerch, groupes, affaires, tags, notes et sous-tâches, sans indexer le corps des messages ;
- vues personnalisées enregistrables et palette de commandes/accès rapides ;
- indicateurs distincts **J’attends** / **Je dois répondre** et statistiques de suivi enrichies ;
- synchronisation facultative avec des tags Thunderbird strictement réservés à MailPerch, sans nouvelle permission WebExtension ;
- consolidation de la synchronisation bidirectionnelle Agenda ↔ MailPerch et propagation des changements de statut ;
- interface Options/dashboard affinée : pile de polices système locale, alignements et espacements revus, statistiques responsives et texte explicite d’au moins 12 px ;
- schéma logique paramètres/données 7, migrations et sauvegardes compatibles avec les versions antérieures ;
- nouvelles gardes automatisées couvrant les fonctions 1.2, la confidentialité, l’accessibilité, les limites d’entrée et l’absence d’élargissement des permissions.


## 1.1.2 — correction responsive du panneau épinglé

- suppression du grand espace vide créé lorsque les outils du panneau passent en disposition verticale ;
- masquage complet du centre de rappels vide, sans retirer les rappels interactifs actifs ;
- adaptation du sélecteur de vue intelligente aux panneaux étroits ;
- ajout d’une garde de non-régression et synchronisation des métadonnées, README et documents de publication ;
- aucun changement de permission, de stockage, de schéma ou de traitement des messages.

## 1.1.1 — confidentialité, robustesse et qualité de publication

- suppression des références personnelles et adoption de l’identité publique `ussmarines` ;
- durcissement des diagnostics, de la résolution des conversations, du packaging et des workflows ;
- localisation FR/EN complétée et validation dans Thunderbird 153.0.1 avec un profil jetable ;
- contrôles classiques de sécurité, de secrets, de reproductibilité et de compatibilité renforcés.

## 1.1.0 — suivi quotidien et productivité

- suivi automatique des réponses, mise en veille, vues Aujourd’hui et Revue ;
- rappels interactifs, actions groupées, capture rapide et aperçu des règles ;
- dix raccourcis personnalisables et fusion prudente par identité forte.

## 1.0.0 — première version publique

- panneau d’épingles, suivis, rappels, groupes, règles, Agenda, dashboard et Kanban ;
- fonctionnement local sans réseau, télémétrie, publicité ni code distant ;
- build reproductible, archive source reviewer et publication GitHub automatisée.

Les changements des anciennes builds internes `3.2.x` restent consultables dans l’historique Git et les audits archivés.
