# Candidate native 2.2.0 — audit avant implémentation

Base observée : `origin/main` `4d38862c55ea4c7fc3e4c440fbfed80e3aa197e3`, version 1.7.10. Donneurs en lecture seule : PR #71 `990f5298`, PR #72 `4a0d02b8` (2.1.1). Aucun cherry-pick/merge/revert.

Le registre AI_VALIDATION_STATE conserve des preuves 1.7.6 obsolètes pour ce chantier. Les preuves 1.7.10 du handoff ne démontrent pas l'architecture native : manifeste, stockage, background, frontière Thunderbird et smoke seront invalidés. Les modèles purs inchangés restent réutilisables ; le jalon final exécutera la suite applicable une fois.

| Fonction 1.7.10 / surface actuelle | Donneur 2.1.1 | API officielle / action 2.2.0 | Preuve à obtenir |
|---|---|---|---|
| Pin/unpin message : Experiment, SQLite | background natif, storage.local | messages + mailTabs + messageDisplay ; porter identité forte et écriture sérialisée | contrat + smoke |
| Conversation : parcours dossiers privilégié | absent | Référence de conversation conservée ; root Message-ID via messages.query ; limites de couverture explicites | contrat, propriétaire IMAP |
| Panneau et bouton dans liste : DOM about:3pane | tags MailPin | Remplacer par tags possédés, action native et Space ; aucun DOM interne | garde + smoke |
| Menus, actions, commandes | déjà natifs | Conserver les commandes 1.7.10, état pin/unpin dynamique | smoke |
| Dashboard / Workbench | dashboard simplifié et workbench | Garder Organic Workspace 1.7.10 ; Space officiel ; Workbench dédié aux limites/migration | pages + smoke |
| Notes / sous-tâches | présents, bornes différentes | Garder modèles 1.7.10 et bornes 4000 / 50 × 240 | modèles + contrat backend |
| Actif / attente / planifié / terminé | présents | Garder PinWorkflow et récurrence locale | modèles + contrat |
| Snooze / rappels | snooze dans dashboard, alarms | alarms + notifications, acquittement/fired distincts | contrat + smoke |
| Pas de réponse | booléen manuel | Garder échéances/timestamps ; détection entrante via onNewMailReceived ; aucun corps stocké | contrat + owner fournisseur |
| Recherche globale | métadonnées simplifiées | Garder recherche locale, notes/checklists/groupes/affaires/tags | modèle + backend |
| Vues enregistrées | tableaux peu validés | Garder PinSavedViews et son filtrage | contrat |
| Groupes / affaires / modèles | présents | Garder normalisation et CRUD 1.7.10 | contrat |
| Règles manuelles / automatiques | uniquement manuelles | PinRules ; simulation explicite + événements natifs bornés, automation importée désactivée | contrat anti-boucle |
| Statistiques / activité / historique | historique réduit | Garder PinAnalytics / Review, historique borné | modèles + contrat |
| Import/export/backup/restore | remplacement direct dangereux | Export 1.7.10 format 7 ou backup ; preview, checksum, merge/replace explicite, sauvegarde pré-écriture et rollback | migration + corruption + quota |
| Diagnostic / intégrité | natif sommaire | Health / diagnostics expurgés, contrôle enveloppe storage.local ; aucun faux SQLite PASS | contrat |
| Tags / feedback | clés enregistrées insuffisamment vérifiées | Propriété : clé réservée ET définition exacte ET registre créé localement ; collisions refusées, tags personnels préservés | collisions + smoke |
| Import étoiles | accountsRead optionnel | accountsRead requis pour identité native ; import manuel, query flagged bornée, aucun clear implicite | contrat + owner |
| Agenda | absent | Aucun namespace calendar officiel dans catalogue MV3 ; Experiment partagé calendar existe mais exclu du XPI zéro-Experiment. Neutraliser création/sync et conserver métadonnées exportées | limitation visible |
| Options / FR-EN / thèmes / a11y | UI simplifiée | Garder UI/registre/thèmes 1.7.10 ; limites natives visibles, contrôles impossibles désactivés | contrats UI + smoke |
| Migration SQLite 1.7.10 | import natif seulement | Aucun accès automatique SQLite ; clé native distincte, ne jamais lire/effacer SQLite ou préférences ; sauvegarde avant mise à niveau indispensable | contrat + guide propriétaire |

Sources actuelles consultées le 2026-10-04 : Context7 `/websites/webextension-api_thunderbird_net_en` et `/thunderbird/webext-annotated-schemas`, [messages](https://webextension-api.thunderbird.net/en/mv3/messages.html), [tags](https://webextension-api.thunderbird.net/en/mv3/messages.tags.html), [spaces](https://webextension-api.thunderbird.net/en/mv3/spaces.html), [Experiments](https://developer.thunderbird.net/add-ons/mailextensions/experiments), [catalogue partagé](https://github.com/thunderbird/webext-experiments). La documentation stable affichée est 156.0.1 ; le binaire 157.0.1 est la preuve finale de compatibilité exigée.

Architecture retenue : récupérer sélectivement les patterns natifs du donneur ; garder les modèles/UI actuels ; RPC local explicite vers un backend natif ; aucun pinInbox runtime requis ni privilège privé. Les sources Experiment historiques restent suivies mais exclues du XPI. Validation et limites finales seront consignées dans NATIVE_2.2.0_HANDOFF.md.

## Résultat de l'implémentation

Les contrats backend/client, modèles purs, garde paquet/provenance/locales, rebuild reviewer, linter officiel courant et smoke réel 157.0.1 sont PASS locaux. Voir `VALIDATION_REPORT_2.2.0.md` pour SHA, commandes et limites exactes ; ne pas attribuer un PASS automatique à une cellule propriétaire/fournisseur/Agenda. Les liens Agenda des références et des affaires sont conservés comme métadonnées inertes. Les collisions tags, quota/corruption, dépassement de fusion et ambiguïtés d'identité échouent sans perte silencieuse.
