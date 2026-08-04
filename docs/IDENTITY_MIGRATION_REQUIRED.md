# Historique de l’identifiant MailPerch

## Statut

**Décision résolue le 4 août 2026.**

L’identifiant canonique de l’extension est désormais :

`pin-mails@MailPerch.local`

Cet identifiant est propre au projet personnel MailPerch et ne crée aucun lien avec Sibylla. Il doit rester synchronisé dans le manifeste, les métadonnées de publication, les contrôles du dépôt et les tests.

## Contexte de la décision

- MailPerch n’avait encore jamais été publié sur ATN, AMO ou un autre catalogue.
- Le projet existait uniquement dans un profil Thunderbird local et dans le dépôt Git privé.
- Un identifiant intermédiaire lié au pseudonyme GitHub avait été préparé sur la branche de sécurité, mais n’avait jamais été fusionné, signé ni publié.
- Les anciennes références nominatives ne doivent pas être réintroduites dans le code ou la documentation publique.
- Le choix final privilégie une identité exclusivement liée au nom du produit.

## Conséquence technique

Thunderbird utilise l’identifiant comme identité stable de l’extension. Une installation locale qui portait un autre identifiant peut donc être traitée comme une extension distincte. Le nouvel identifiant ne récupère pas automatiquement le stockage privé associé à l’ancienne identité.

Ce comportement est accepté parce que le projet n’a pas encore été publié. Il ne s’agit pas d’une migration distribuée à des utilisateurs externes.

## Procédure pour le profil local existant

1. Depuis l’installation actuellement utilisée, exporter une sauvegarde MailPerch et vérifier que le fichier est lisible.
2. Conserver une copie du profil Thunderbird avant toute désinstallation.
3. Désinstaller l’ancienne build locale seulement après la sauvegarde.
4. Construire puis installer la build portant `pin-mails@MailPerch.local`.
5. Importer la sauvegarde de façon contrôlée.
6. Vérifier les épingles, groupes, notes, règles, affaires, rappels, paramètres et liens Agenda.
7. Redémarrer Thunderbird et contrôler de nouveau les données et le stockage SQLite.
8. Exécuter `npm run ci` avant toute diffusion ou signature.

Ne jamais supposer qu’une installation avec un ancien identifiant sera mise à jour automatiquement.

## Fichiers qui doivent rester synchronisés

- `extension/manifest.json`
- `release/manifest-store-template.json`
- `docs/PROJECT_STATE.json`
- `PROJECT_MEMORY.md` ou son addendum d’identité prioritaire
- `docs/CODEX_HANDOFF.md`
- `AGENTS.md`
- `scripts/check_repo.py`
- `tests/static_checks.py`
- `tests/test_project_metadata.py`

Toute modification future de l’identifiant doit mettre à jour cette liste dans le même changement Git.

## Publication future

Avant la première publication :

- vérifier que l’identifiant est encore disponible auprès du catalogue ciblé ;
- conserver exactement la même casse et la même chaîne dans toutes les builds ;
- vérifier les exigences de manifeste et de déclaration de collecte de données applicables au moment de la soumission ;
- considérer l’identifiant comme immuable dès la première signature ou publication.

## Retour arrière

En cas de problème avant publication, ne pas improviser une troisième identité. Utiliser l’historique Git pour revenir au commit précédant le changement, restaurer le profil de test et documenter le résultat dans `docs/BUG_TRACKER.md` et `docs/CODEX_HANDOFF.md`.
