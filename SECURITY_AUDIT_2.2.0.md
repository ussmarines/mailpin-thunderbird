# Revue standard ciblée — MailPin 2.2.0

Candidate native ; aucune invocation Codex Security. ID inchangé, aucune permission hôte, aucun Experiment packagé. RPC local vérifie sender.id, origine et whitelist de chemins, refuse méthodes d'événements internes ; données bornées/JSON, clés prototypes dangereuses refusées. Aucun HTML construit depuis le courrier, eval, réseau, corps ou pièce jointe stocké.

Écritures storage.local sérialisées, checksum, corruption fail-closed. Import checksum/preview/limites cumulées, snapshot pré-écriture, rollback avant commit ; automation importée désactivée. Propriété tags prouvée localement (pas importable), collision refusée, union message/conversation, relecture des tags personnels avant écriture. Permissions facultatives uniquement au clic correspondant.

Revue séparée a reproduit six défauts (fusion au plafond, liens Agenda affaire, doublon Gmail, union tags, post-commit rollback, racine quickCapture) ; corrigés et couverts par tests exécutés. Sources historiques privilégiées restent dans l'archive reviewer pour provenance mais hors XPI. Le linter et les téléchargements du banc sont test-only. Le fichier PRIVACY.md décrit les limites de cleanup natif sans promettre purge SQLite/uninstall des tags.

Gates exécutés et limites : VALIDATION_REPORT_2.2.0.md. Les preuves de ce document sont une revue standard/contrats, pas une certification sécurité exhaustive ou fournisseur.
