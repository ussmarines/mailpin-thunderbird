# Feuille de route

## État courant — 1.5.1

- [x] refonte visuelle 1.5.0 publiée ;
- [x] correction de l’éditeur de carte/checklist préparée pour 1.5.1 ;
- [x] opérations Messages restantes ramenées derrière `PinCompatibility.messages` ;
- [x] diagnostic fournisseur et schéma Settings réalignés ;
- [ ] publication GitHub 1.5.1 après double audit, CI, sécurité et banc Thunderbird frais.

## 1.3.0 — consolidation Thunderbird et interface

Branche historique fusionnée : `refactor/thunderbird-integration-and-ux`
Base historique : `main` / `385815f546968acf721c8cd8486ff48f55f78a32`

### Intégration Thunderbird

- [x] isoler les opérations Messages derrière un adaptateur injecté ;
- [x] isoler la gestion des tags et leur propriété stricte ;
- [x] isoler Agenda, ACL, capacités et observateurs ;
- [x] fournir une façade `PinCompatibility` ;
- [x] ajouter des contrats avec faux services Thunderbird ;
- [x] ajouter une garde empêchant le métier de réintroduire les accès natifs extraits ;
- [x] garder le DOM `about:3pane` dans l’orchestrateur pour éviter un refactoring graphique massif simultané ;
- [x] exécuter et stabiliser le smoke runtime sur Thunderbird 153.0.1 ESR Linux avec profil local synthétique, installation/cleanup/réinstallation validés ;
- [ ] après revue Codex, tester la future release sur le poste utilisateur et ses comptes réels.

### Options plus simples

- [x] organiser les réglages en **Essentiel / Organisation / Automatisation / Avancé** ;
- [x] présenter le mode `guided` comme **Recommandé** sans modifier la valeur persistée ;
- [x] masquer les sections techniques avancées en Recommandé sans supprimer les fonctions ;
- [x] ajouter une action de brouillon recommandé qui ne sauvegarde jamais automatiquement ;
- [x] préserver les choix propres au profil lors de l’application du brouillon ;
- [x] conserver recherche, Enregistrer, Annuler et le mode Avancé ;
- [x] couvrir la taxonomie et le comportement par une garde dédiée FR/EN.
- [x] valider dans un navigateur réel la bijection registre/HTML, le brouillon, Enregistrer/Annuler et les reprises d’initialisation.

### Qualité et banc de test

- [x] ajouter un workflow de smoke Thunderbird séparé de la QA obligatoire pendant sa phase d’épreuve ;
- [x] vérifier les téléchargements de test Thunderbird/geckodriver par SHA-256 ;
- [x] installer, désinstaller et réinstaller le XPI dans le scénario runtime ;
- [x] conserver les logs/résultats/captures comme artefacts ;
- [x] documenter les niveaux de preuve et la voie officielle comm-central `mach` ;
- [x] confirmer que Fluent 2 reste local et sans dépendance npm runtime tant qu’aucun bundle de composants n’est justifié ;
- [ ] promouvoir éventuellement le smoke en contrôle requis uniquement après plusieurs exécutions fiables.

### Documentation et revue

- [x] documenter la frontière Thunderbird et le banc runtime ;
- [x] remettre la mémoire projet, l’état machine, l’architecture, la sécurité et le handoff au niveau de la branche ;
- [x] exécuter la passe finale `npm run ci` et l’audit du diff ;
- [x] synchroniser la branche GitHub et obtenir QA/smoke verts ; CodeQL reste le gate de PR ;
- [x] faire relire/corriger la branche par Codex avec Thunderbird, Fluent 2, Playwright, Context7 et Security Diff Scan ;
- [x] préparer la release 1.3.0 ; PR, CodeQL, fusion et publication constituent les derniers gates GitHub.

## Validation de la 1.2.1 stable

- [x] release 1.2.1 publiée avec QA et CodeQL verts ;
- [x] correctif des détections fournisseurs `live.com` / `me.com` validé par CodeQL ;
- [x] test réel utilisateur de la 1.2.1 effectué le 8 août 2026 sans anomalie signalée sur la passe demandée ;
- [ ] la matrice exhaustive Windows/Linux/macOS, extrêmes 128/153, zoom 200 % et chaque fournisseur annoncé reste une exigence distincte avant une éventuelle soumission ATN.

## 1.2.0 / 1.2.1 — socle fonctionnel actuel

- [x] notes étendues et checklists/sous-tâches ;
- [x] recherche globale sur métadonnées, sans corps de message ;
- [x] synchronisation facultative de tags MailPerch ;
- [x] synchronisation Agenda bidirectionnelle ;
- [x] palette de commandes et vues enregistrées ;
- [x] états **J’attends / Je dois répondre** ;
- [x] statistiques de suivi enrichies ;
- [x] Fluent 2, plancher typographique 12 px et responsive ;
- [x] schémas paramètres/données 7, migrations, sauvegardes et documentation sécurité ;
- [x] durcissement 1.2.1 de la classification locale des fournisseurs.

## Après consolidation — prochaine version fonctionnelle

Ces fonctions sont volontairement hors de la branche actuelle et seront développées après la nouvelle release de consolidation et sa validation réelle :

1. **Prochaine action** — file de traitement centrée sur ce qui demande réellement l’attention ;
2. **Timeline complète d’une conversation** — chronologie messages, rappels, notes, checklist, Agenda et changements d’état ;
3. **Follow-up récurrent** — génération contrôlée de rappels tant qu’une réponse manque, sans envoi automatique ;
4. **Résultat du suivi** — motif de clôture structuré pour enrichir les statistiques.

## Dette et validations longues

- reproductibilité binaire ZIP réellement identique entre Windows et Linux (`MP-2026-018`) ;
- tests XPCShell/Mochitest dans un checkout Thunderbird réel ;
- matrice manuelle IMAP, POP, Gmail, Microsoft, boîte unifiée, dossiers virtuels et calendriers ;
- mesure avec 100, 500 et 2 000 épingles ;
- audit lecteur d’écran NVDA/Orca ;
- validation de désinstallation/réinstallation et sauvegardes sur plusieurs plateformes ;
- captures, notes reviewers, politique de support et procédure de retour arrière avant ATN.

## Publication ATN

Avant une soumission :

- fournir le code source lisible et les instructions de build reproductible ;
- joindre la matrice de compatibilité réelle et les hashes SHA-256 ;
- confirmer la conformité des marques, de la licence et des données personnelles ;
- tester la version stable courante dans Thunderbird réel ;
- traiter les retours reviewers sans élargissement opportuniste du périmètre.

Les anciennes étapes internes `3.2.x` restent consultables dans l’historique Git et les audits archivés ; elles ne constituent plus la feuille de route active.
