# Superpowers — politique d’utilisation MailPin

Date de référence : 2026-08-08

## Objet

`Superpowers` est installé au niveau de Codex comme plugin global. Il n’est ni vendored, ni copié, ni épinglé dans ce dépôt.

MailPin autorise son utilisation de manière sélective uniquement lorsque le gain de méthode ou de réduction du risque justifie le coût supplémentaire en contexte, outils, agents et validations.

## Priorité des règles

Pour MailPin, appliquer dans cet ordre :

1. instruction explicite de l’utilisateur ;
2. état Git/GitHub réellement observé ;
3. `AGENTS.md` applicable ;
4. `MAILPERCH_AI_RULES.md` ;
5. documents canoniques spécialisés, notamment identité et frontière de sécurité ;
6. cette politique ;
7. comportements par défaut des skills Superpowers.

Superpowers ne peut jamais contourner les invariants produit, les règles de sécurité, les restrictions Git, la validation différentielle ni l’économie de tokens du dépôt.

## Opt-in explicite

Le comportement générique de Superpowers qui pousse à invoquer un skill dès qu’il pourrait être applicable est explicitement restreint pour MailPin.

La simple présence d’un skill ne justifie pas son utilisation. Un workflow Superpowers doit apporter une valeur matérielle au problème courant.

Les tâches simples, locales ou déterministes ne nécessitent pas par défaut :

- brainstorming ;
- plan formel ;
- worktree ;
- TDD complet ;
- sous-agents ;
- reviewer séparé ;
- workflow de fin de branche.

## Quand utiliser Superpowers

| Situation | Skill(s) Superpowers envisageables |
|---|---|
| Bug difficile ou intermittent dont la cause n’est pas établie | `systematic-debugging` |
| Nouvelle feature transversale touchant plusieurs surfaces MailPin avec décisions encore ouvertes | `brainstorming`, puis éventuellement `writing-plans` |
| Logique métier, stockage ou contrat où le test-first réduit réellement le risque | `test-driven-development` |
| Diff sensible touchant plusieurs modules, l’API privilégiée, le manifeste, les permissions, le stockage ou une migration | `requesting-code-review` |
| Plan déjà validé avec plusieurs tâches réellement indépendantes et coût multi-agent justifié | `subagent-driven-development` |
| Plan à exécuter avec checkpoints utiles dans une session séparée | `executing-plans` |
| Isolation Git réellement utile | `using-git-worktrees` |

Un changement de texte, documentation, CSS isolé, correction mécanique, test local évident ou mise à jour de métadonnées ne justifie normalement pas le workflow complet.

## Validation différentielle prioritaire

`docs/AI_VALIDATION_STATE.json` et les règles de `MAILPERCH_AI_RULES.md` restent la source pour savoir quels contrôles sont encore valides.

Superpowers ne doit jamais entraîner automatiquement :

- une relecture globale du dépôt ;
- une relance de tests encore verts et non invalidés ;
- un smoke Thunderbird sans surface runtime concernée ;
- une suite complète après chaque petite correction ;
- plusieurs revues équivalentes « pour être sûr ».

Après un changement, commencer par le plus petit contrôle qui prouve le comportement affecté. Élargir uniquement lorsqu’un risque, une dépendance ou un échec le justifie.

Quand un comportement dépend réellement de Thunderbird, les exigences de preuve runtime du dépôt restent obligatoires ; un skill générique ne remplace pas l’observation ou le smoke réel requis.

## Sous-agents et coût

`subagent-driven-development` est exceptionnel pour MailPin.

S’il est justifié :

- limiter le nombre d’agents au strict nécessaire ;
- transmettre les exigences via les fichiers du dépôt plutôt que recopier l’historique ;
- utiliser la grille GPT-5.6 / puissance définie dans `MAILPERCH_AI_RULES.md` ;
- choisir le modèle le moins coûteux suffisamment fiable pour chaque rôle ;
- ne pas dupliquer les validations encore valides ;
- conserver une seule source de vérité pour le plan et l’état d’avancement.

## Git et worktrees

Superpowers ne donne aucune autorisation Git supplémentaire.

- Ne pas push, créer de PR, merge, rebase, taguer ou publier sans l’autorisation explicite exigée par le dépôt.
- `finishing-a-development-branch` ne peut pas contourner les règles Git locales.
- Un worktree n’est pas obligatoire et ne doit pas être créé pour une tâche simple.
- Ne jamais perturber un travail concurrent ou écraser un état local non identifié.

## Invariants MailPin

L’utilisation de Superpowers ne modifie aucun invariant canonique, notamment :

- aucun réseau runtime, télémétrie, publicité, CDN ou code distant dans l’extension ;
- identifiant canonique et sensible à la casse inchangé ;
- `PinCompatibility` reste la frontière imposée pour les surfaces déjà extraites ;
- les écritures SQLite restent incrémentales, transactionnelles et sérialisées ;
- les entrées privilégiées restent bornées, validées et normalisées ;
- le nettoyage des listeners, observers, timers, menus, styles et nœuds injectés reste obligatoire ;
- aucune nouvelle permission ou dépendance runtime sans justification explicite et validation adaptée.

## Sécurité

Superpowers ne modifie pas la politique Codex Security. Codex Security reste interdit par défaut et n’est envisageable que pour une question de sécurité précise, bornée, non résolue par les outils standards et après autorisation explicite de l’utilisateur.
