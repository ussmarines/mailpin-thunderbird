# Notes pour les reviewers ATN — MailPin 1.7.2

## Statut de soumission

- **Release GitHub publique actuelle :** 1.7.1.
- **Candidate source :** 1.7.2.
- **Soumission ATN :** en préparation, non revendiquée comme terminée.
- **Version :** 1.7.2

La 1.7.2 corrige uniquement des comportements UI/navigation observés dans le Dashboard et les Paramètres. Elle ne modifie ni permissions, schémas, stockage, logique métier, identité, dépendances runtime ni politique réseau.

## Identité

- **Nom :** MailPin — Email Follow-up & Productivity for Thunderbird
- **Nom court :** MailPin
- **Version :** 1.7.2
- **ID :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 153.*
- **Langues :** français et anglais

## Correctifs 1.7.2

- contrôle « Plus de statistiques » stable et clairement actionnable ;
- navigation Options synchronisée avec la section réellement visible ;
- barre Enregistrer/Annuler et notifications maintenues dans le viewport ;
- espacement renforcé entre groupes de réglages ;
- cartes Agenda robustes aux noms longs et badges de capacités ;
- action d’enregistrement des raccourcis clarifiée ;
- contrats Organic Workspace ajoutés pour empêcher ces régressions.

## Fonction principale

MailPin ajoute un panneau local de messages épinglés au-dessus de la liste native, avec portée par boîte courante, comptes Thunderbird sélectionnés ou tous les comptes, suivis, échéances, rappels, notes, sous-tâches, vues enregistrées, groupes, règles, Agenda et tableau de bord. La liste native des messages et ses compteurs ne sont pas remplacés.

## Permission et API privilégiée

La permission WebExtension déclarée est uniquement `menus`. L’Experiment `pinInbox` reste nécessaire pour l’intégration `about:3pane`, la résolution des messages, le stockage SQLite local, les notifications de dossiers, Agenda, Tags et le cycle de vie. Aucun de ces contrats privilégiés n’est élargi par la 1.7.2.

## Réseau, données et code

- aucun appel réseau runtime et `connect-src 'none'` ;
- aucune télémétrie, publicité ou collecte distante ;
- aucun code distant, `eval`, fonction générée ou HTML injecté ;
- aucun corps complet de message ni contenu de pièce jointe copié ;
- aucune dépendance d’exécution ou de build tierce ;
- code source lisible, non minifié et build reproductible.

Voir `PRIVACY.md`, `SECURITY.md`, `SECURITY_AUDIT_1.7.2.md` et `release/BUILD_INSTRUCTIONS.md`.

## Preuves avant versionnement

Le runtime de correction a été validé sur le head exact de la PR #47 : QA Linux/Windows `32024824818` PASS et smoke Thunderbird réel `32024824756` PASS. La candidate versionnée 1.7.2 doit repasser ces gates avant publication ; ces nouveaux numéros de run seront consignés après leur exécution.

## Scénario de test rapide 1.7.2

1. Installer le XPI exact de la candidate dans un profil Thunderbird propre.
2. Ouvrir le Dashboard et tester « Plus de statistiques » plusieurs fois ; le contrôle ne doit pas sauter.
3. Ouvrir Options et parcourir plusieurs sections longues ; le rail doit toujours refléter la section affichée.
4. Modifier un réglage en milieu/bas de page ; Enregistrer/Annuler et le feedback doivent rester visibles.
5. Vérifier Rappels, Règles, Centre de santé et Sauvegarde à 100/125/200 % sans blocs collés ni overflow horizontal.
6. Vérifier des calendriers aux noms longs : badge et nom ne doivent jamais se chevaucher.
7. Vérifier la section Raccourci clavier et son action Enregistrer.
8. Épingler/désépingler un message et confirmer que l’état lu/non lu et les compteurs natifs restent inchangés.
9. Créer un événement Agenda compatible et contrôler la persistance après redémarrage.
10. Refaire les contrôles principaux en clair/sombre et fenêtre réduite.

## Validation automatisée

Avant publication, `npm run ci`, la QA Linux/Windows, la garde sécurité/identité, le build reproductible et le smoke Thunderbird réel doivent tous être PASS sur la candidate 1.7.2 exacte. L’archive source reviewer doit également réussir `npm run ci` après extraction sans `.git`.

## Validation manuelle à renseigner avant soumission

| Thunderbird | Système | Type de compte | Thème | Résultat |
|---|---|---|---|---|
| À compléter | À compléter | IMAP/POP/local | clair/sombre | À compléter |

Aucune recette visuelle humaine non exécutée n’est présentée comme PASS.
