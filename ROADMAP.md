# Feuille de route MailPin

## État courant — source 1.7.0

Dernière release publique : **1.6.1**. La source 1.7.0 est une ligne de développement/audit et n’est pas publiée automatiquement.

### Terminé dans la ligne 1.7.0

- [x] Organic Workspace intégré sur `main` par la PR #39 ;
- [x] Dashboard / Options écrits sous forme de shells canoniques en source, sans re-parenting UI runtime ;
- [x] responsive interne, menus/statistiques in-flow, inspector contextuel, Rule Builder et Affaires recomposés ;
- [x] palette QoL MailPin et couleurs automatiques différenciées ;
- [x] test Organic Workspace réellement exécuté par `npm test` ;
- [x] audit des permissions, du réseau runtime, des entrées privilégiées, du stockage, des tests et des workflows ;
- [x] nettoyage des helpers, métadonnées et documents actifs devenus obsolètes.

### Validation encore requise avant publication 1.7.0

- [ ] recette visuelle humaine complète du XPI exact : Dashboard, Options, panneau, menus, splitter, clair/sombre, zoom 200 %, contraste élevé ;
- [ ] confirmer/corriger les derniers points UI signalés par l’utilisateur ;
- [ ] revue Codex indépendante sur le `main` audité, sans Codex Security par défaut ;
- [ ] matrice réelle Gmail / Microsoft / IMAP et calendriers réseau si ces environnements sont annoncés pour la publication ;
- [ ] décision explicite de publication GitHub/ATN, tag et release séparés.

## Fonctions futures

1. **Prochaine action** — file de traitement centrée sur ce qui demande réellement l’attention ;
2. **Timeline complète d’une conversation** — messages, rappels, notes, checklist, Agenda et changements d’état ;
3. **Follow-up récurrent** — rappels contrôlés tant qu’une réponse manque, sans envoi automatique ;
4. **Résultat du suivi** — motif de clôture structuré pour enrichir les statistiques.

## Validations longues / dette suivie

- reproductibilité binaire ZIP entre Windows et Linux : `MP-2026-018` ;
- XPCShell/Mochitest dans un checkout Thunderbird réel ;
- matrice exhaustive Windows/Linux/macOS, fournisseurs, dossiers virtuels et calendriers ;
- lecteur d’écran NVDA/Orca et audit humain contraste/zoom ;
- validation multi-plateforme désinstallation/réinstallation/sauvegardes ;
- disponibilité juridique de la marque et validation finale ATN.

L’historique détaillé des versions déjà livrées reste dans `CHANGELOG.md` et les rapports versionnés ; il n’est pas dupliqué ici.
