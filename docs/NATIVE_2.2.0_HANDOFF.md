# MailPin 2.2.0 native — candidate, zéro-Experiment

Branche dédiée `codex/native-2.2.0-zero-experiment`, base `origin/main` `4d38862c55ea4c7fc3e4c440fbfed80e3aa197e3` (1.7.10). Identifiant inchangé : `ussmarines.mailpin@addons.thunderbird.net`. Aucune publication 2.2.0, merge, release, tag ou soumission ATN autorisée.

Le XPI utilise seulement les API officielles MV3 : messages, tags, mailTabs, messageDisplay, menus, commands, spaces, storage.local, alarms et notifications. Les pages Organic Workspace et les modèles métier 1.7.10 sont conservés. Les fichiers `extension/api/` et `extension/styles/pin.css` sont historiques, exclus par `scripts/build.py`. Les contrôles statiques historiques dépendant de l'Experiment ne constituent pas des gates de cette architecture ; leur remplacement est le contrat natif, les modèles purs et le smoke natif réel.

## Migration et retour arrière

1. Avec 1.7.10 encore active, exporter les données depuis Options (format `thunderbird-pin-mails`, version 7, ou enveloppe backup à checksum). Conserver le JSON et une copie du profil Thunderbird fermé. Ne pas désinstaller l'ancienne version avant cette sauvegarde : son ancien cleanup peut supprimer ses données.
2. Installer la candidate comme mise à niveau du même ID. Le natif démarre avec `mailpinNative220`, un espace distinct. Il ne lit, ne migre, n'écrase et ne purge ni SQLite ni les préférences historiques. Un premier Dashboard vide n'est pas une perte des anciennes épingles.
3. Dans Workbench, sélectionner le JSON (10 Mio maximum), lire le preview puis choisir explicitement Fusionner ou Remplacer. Les collections invalides, troncatures aux limites, checksum faux et fusion dépassant les limites sont refusés. Les conflits de même ID suivent `updatedAt`, comme indiqué par le preview ; choisir Remplacer pour restaurer exactement la sauvegarde.
4. Avant toute écriture de restauration, une enveloppe de sécurité complète est stockée dans `mailpinNative220BeforeRestore`. Une erreur de quota avant commit conserve l'état courant ; les erreurs de tags/alarmes après commit sont des diagnostics de synchronisation, jamais un faux rollback. Undo et l'export utilisateur permettent de revenir à l'état précédent. Ne supprimer aucune copie avant vérification propriétaire.
5. Les notes, checklists, groupes, affaires, modèles, vues, workflows, échéances, historique et liens Agenda sont conservés dans le contrat de données. L'automatisation et la synchronisation de tags importées sont désactivées, le mode sûr est activé. Revoir les règles avant réactivation. Les liens Agenda sont inertes : aucune opération calendrier n'est exécutée.
6. Le retour à 1.7.10 réutilise son stockage historique conservé et la copie du profil. Les modifications natives post-migration ne sont pas rétro-écrites dans SQLite : exporter aussi le natif avant tout retour arrière. Aucun essai de migration n'est fait sur le profil propriétaire par le banc.

## Parité et limites explicites

| 1.7.10 → 2.2.0 | État |
|---|---|
| Notes, checklists, workflows, snooze, échéances, rappels locaux, recherche, vues, Kanban, affaires, groupes, modèles, statistiques, activité, historique, undo | Conservés via modèles purs et backend natif |
| Panneau/bouton au-dessus de la liste interne | Remplacés par tags possédés, menu, action de message, raccourcis et Space MailPin ; aucun panneau inline revendiqué |
| Conversation, suivi sans réponse | Racine des en-têtes References/In-Reply-To ; parcours local borné à 500 messages et 50 pages, compte public identifié ; couverture fournisseurs à valider par propriétaire |
| SQLite et sauvegarde automatique vers dossier | Remplacés par enveloppe locale atomique et export/import JSON manuel ; pas d'accès fichier arbitraire ni reprise automatique SQLite |
| Agenda et synchronisation bidirectionnelle | Reportés : pas d'API officielle calendar MV3 ; liens existants conservés sans exécution |
| Règles | Simulation/manuelles et événements réception, lecture, déplacement disponibles ; archive/réponse/suppression/calendrier comme triggers automatiques reportés |
| Anciennes options d'intégration de panneau, import préférences serveur/URI, auto-pin expéditeurs/tags, auto-cleanup/rétention et automatismes fournisseurs | Valeurs préservées lorsque portables, contrôles indisponibles neutralisés ; aucun effet implicite revendiqué |
| Fournisseurs, diagnostics avancés et métriques de performance internes | État réduit explicite ; pas de certification fournisseur, pas de faux benchmark SQLite |

Limites : 5 000 épingles ; groupes 40, règles 200, affaires 200, modèles 100 ; notes 4 000 caractères ; checklist 50 éléments de 240 caractères ; bornes historiques/vues selon les modèles 1.7.10. Les identités Gmail importées résolues gardent leur clé et métadonnées. Copies de même Message-ID ambiguës restent manquantes et nécessitent réparation propriétaire ; aucun rapprochement par objet.

Les tags sont possédés uniquement si clé réservée + définition exacte + registre de création local concordent. Une collision refuse le sync ; jamais d'adoption, renommage ou suppression de tag personnel. L'union des épingles message/conversation est calculée par message. L'uninstall natif supprime les pages/listeners/Space avec le runtime WebExtension ; il ne peut pas exécuter de nettoyage privilégié à la désinstallation : désactiver le sync avant désinstallation pour retirer les tags possédés. Les exports restent sous contrôle utilisateur ; le stockage WebExtension suit le cycle Thunderbird et doit être sauvegardé.

## Permissions

Requises : `menus`, `accountsRead` (identité publique et dossiers), `messagesRead` (métadonnées/en-têtes et résolution), `messagesUpdate` (tags ; lu/non-lu seulement sur action explicite), `messagesTagsList`, `messagesTags` (propriété des définitions), `storage`, `alarms`, `notifications`. Optionnelles, demandées lors du clic correspondant : `messagesMove` (archiver), `messagesDelete` (supprimer), `compose` (répondre). Aucune permission hôte/réseau, Experiment, calendrier, fichier ou nativeMessaging.

## Seul gate propriétaire restant après les preuves automatiques

`MANUAL_OWNER_TEST_REQUIRED` : sauvegarde/export réel 1.7.10 puis import sur une copie du profil ; couverture IMAP/Gmail/Microsoft, copies/déplacements et conversations ; rendu table/cards des tags natifs, thème FR/EN, clavier/a11y et confort Organic Workspace ; notifications système/snooze après veille et relances sans réponse ; actions facultatives composer/archiver/supprimer avec permission explicite ; retour arrière sur copie du profil. L'Agenda/inline et les automatismes reportés ne sont pas promis par ce prototype.

Preuves exécutées, SHA du XPI et résultats : `VALIDATION_REPORT_2.2.0.md`. Matrice complète et sources : `docs/NATIVE_2.2.0_MATRIX.md`.
