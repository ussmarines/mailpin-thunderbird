# MAILPERCH — RÈGLES DE PILOTAGE IA

Version de référence : 2026-08-12
Révision modèles Codex : GPT-5.6 Luna / Terra / Sol
Projet : `ussmarines/mailpin-thunderbird`

> **Compatibilité projet :** le fichier conserve son nom historique `MAILPERCH_AI_RULES.md` afin de ne pas casser les paramètres ChatGPT/Codex existants ; son contenu gouverne désormais MailPin.

## 1. Objet de ce fichier

Ce fichier est la source de gouvernance pour ChatGPT, Codex et tout agent IA travaillant sur MailPin.

Il complète les règles déjà présentes dans le dépôt sans les remplacer. Il sert surtout à :
- limiter la consommation de tokens ;
- éviter les relectures et contrôles inutiles ;
- imposer une validation différentielle ;
- sécuriser les opérations Git ;
- cadrer strictement les outils de sécurité ;
- préserver les invariants techniques et produit déjà définis.

Les informations dynamiques (branche courante, HEAD, dernière release, état du working tree, PR en cours) doivent toujours être vérifiées dans Git/GitHub au moment du travail. Ne jamais les déduire d'une ancienne conversation ou d'un ancien handoff.

---

# 2. Ordre de priorité

En cas de contradiction, appliquer dans cet ordre :

1. instruction explicite de l'utilisateur dans la conversation courante ;
2. état Git/GitHub réellement observé ;
3. `AGENTS.md` le plus proche de la zone modifiée ;
4. `docs/IDENTITY_MIGRATION_REQUIRED.md` pour l'identité de l'extension ;
5. `PROJECT_MEMORY.md` pour les invariants et l'architecture ;
6. `docs/CODEX_HANDOFF.md` uniquement s'il correspond encore à la branche / tâche active ;
7. documentation spécialisée strictement nécessaire à la zone modifiée ;
8. ancienne documentation et historique.

Ne jamais charger toute la documentation par défaut.

---

# 3. Lecture minimale obligatoire

Avant une modification :

1. relever l'état Git exact ;
2. identifier le diff ou la zone réellement concernée ;
3. lire `AGENTS.md` ;
4. lire uniquement les documents spécialisés nécessaires ;
5. ouvrir uniquement les fichiers modifiés et leurs dépendances directes utiles.

Ne pas relire un fichier inchangé uniquement "par sécurité" si son dernier contrôle reste valide et que rien de dépendant n'a changé.

Utiliser les chemins et références de fichiers plutôt que recopier de gros blocs de code dans les prompts.

---

# 4. Principe fondamental : validation différentielle

## 4.1 Ne pas recontrôler ce qui n'a pas changé

Un élément déjà contrôlé ne doit pas être contrôlé à nouveau si, depuis ce contrôle :

- son contenu n'a pas changé ;
- ses dépendances directes pertinentes n'ont pas changé ;
- sa configuration de build/test n'a pas changé ;
- son environnement d'exécution pertinent n'a pas changé ;
- aucun nouveau signal ne remet en cause le contrôle précédent.

Un contrôle déjà vert sur le même commit / même arbre et dans le même environnement peut être réutilisé comme preuve.

## 4.2 Ce qui invalide un contrôle précédent

Relancer le contrôle pertinent si au moins un de ces points change :

- fichier testé ;
- appelant ou dépendance susceptible d'altérer son comportement ;
- manifeste, schéma, configuration ou permission ;
- version Thunderbird ciblée ;
- workflow CI ou script de build associé ;
- dépendance runtime/dev pertinente ;
- modèle de données ou migration ;
- frontière de sécurité liée ;
- bug ou résultat nouveau démontrant que l'hypothèse précédente était incomplète.

## 4.3 Ordre de validation

Après une modification :

1. contrôles statiques ou tests les plus ciblés ;
2. test de la fonction / module touché ;
3. tests de contrat ou intégration directement dépendants ;
4. smoke réel seulement si la surface le justifie ;
5. suite complète une seule fois au jalon final si nécessaire.

Après une correction d'un test échoué, relancer d'abord le test échoué et ses dépendances directes. Ne pas relancer immédiatement toute la suite.

Une suite complète ne doit pas être relancée en boucle sans nouveau changement.

---

# 5. Économie de tokens et de contexte

Toutes les opérations IA doivent minimiser le contexte consommé.

## Règles

- Commencer par le diff, pas par une relecture globale du dépôt.
- Ne jamais demander un audit complet si une analyse ciblée suffit.
- Ne pas réinjecter dans un prompt les informations déjà disponibles dans les fichiers source du projet.
- Préférer : objectif + périmètre + contraintes + critères de sortie.
- Ne pas recopier l'historique des conversations dans les prompts.
- Ne pas ouvrir des fichiers non liés "au cas où".
- Ne pas générer de longs rapports intermédiaires sans utilité.
- Ne pas répéter les mêmes explications entre deux prompts.
- Ne pas lancer plusieurs agents pour le même contrôle si un seul suffit.
- Ne pas lancer de recherche Web si la réponse est déjà dans le dépôt et qu'aucune donnée actuelle externe n'est nécessaire.
- Réutiliser les résultats de tests encore valides.
- Grouper les opérations de lecture similaires.
- Réserver les passes exhaustives aux jalons importants : préparation PR, merge, release ou investigation complexe justifiée.

## Prompt économique

Un prompt Codex doit idéalement contenir seulement :

- dépôt / branche ou état Git à utiliser ;
- objectif précis ;
- fichiers ou zone concernés si connus ;
- contraintes critiques ;
- tests ciblés attendus ;
- actions interdites ;
- format de restitution.

Les détails permanents doivent être lus depuis ce fichier, `AGENTS.md` et les documents du dépôt, pas répétés dans chaque prompt.

## 5.1 Modèle GPT et puissance à indiquer pour chaque prompt Codex

Chaque fois que ChatGPT fournit à l'utilisateur un prompt destiné à Codex, il doit afficher **avant le bloc du prompt** une recommandation courte sous cette forme :

```text
Modèle recommandé : <GPT-5.6 Luna | GPT-5.6 Terra | GPT-5.6 Sol>
Puissance : <Low | Medium | High | XHigh>
```

Ces deux lignes sont destinées à l'utilisateur et ne doivent pas être recopiées inutilement dans le prompt Codex.

### Famille de modèles de référence

À la date de référence de cette règle, la famille Codex à utiliser est **GPT-5.6** :

- **GPT-5.6 Luna** : modèle le plus rapide et le plus économique ; à privilégier pour les tâches simples, mécaniques, très ciblées ou principalement en lecture.
- **GPT-5.6 Terra** : modèle équilibré pour le travail quotidien ; **choix par défaut pour la majorité des tâches de développement MailPin**.
- **GPT-5.6 Sol** : modèle phare et le plus capable ; à réserver aux tâches difficiles, longues, transversales ou à fort enjeu technique.

Ne pas recommander une génération antérieure par défaut lorsqu'un modèle GPT-5.6 adapté est disponible.

Les modèles disponibles évoluent. Si les noms, capacités ou niveaux d'effort disponibles ont pu changer, vérifier les informations officielles OpenAI avant de produire la recommandation.

### Choix du modèle

Toujours choisir **le modèle le moins coûteux suffisamment fiable pour la tâche** :

| Type de tâche | Modèle recommandé par défaut |
|---|---|
| Lecture ciblée, état Git, diff, documentation, changement mécanique trivial | **GPT-5.6 Luna** |
| Petite correction localisée avec logique simple | **GPT-5.6 Luna** ou **Terra** selon l'ambiguïté |
| Développement standard, bug ciblé, tests, intégration ordinaire | **GPT-5.6 Terra** |
| Modification multi-fichiers ou refactor modéré | **GPT-5.6 Terra** |
| Bug difficile, architecture, frontière Thunderbird, stockage/migration, CI/release sensible | **GPT-5.6 Sol** |
| Investigation complexe avec plusieurs hypothèses ou échecs persistants | **GPT-5.6 Sol** |

Règles supplémentaires :

- **Terra est le modèle de développement par défaut** lorsqu'aucun motif clair ne justifie Luna ou Sol.
- Utiliser Luna dès qu'une tâche est assez simple et déterministe pour ne pas bénéficier sensiblement de Terra.
- Utiliser Sol uniquement lorsque la complexité, le risque ou la longueur du raisonnement le justifie.
- Ne jamais choisir Sol simplement "par sécurité".
- Une tâche de documentation ou Git simple ne justifie normalement pas Sol.
- Si une tâche complexe peut être découpée proprement, préférer plusieurs étapes Luna/Terra ciblées à une passe globale Sol inutilement coûteuse.

### Choix de la puissance

Toujours choisir **la puissance la plus faible suffisante** pour limiter temps, tokens et coût :

- **Low** : lecture, documentation, commande Git simple, recherche ciblée, changement mécanique, petit diff ou test direct sans ambiguïté.
- **Medium** : implémentation standard, correction de bug ciblée, modification de quelques fichiers, tests et intégration ordinaires.
- **High** : bug difficile, refactor multi-modules, modification de frontière Thunderbird, stockage/migration, CI/release sensible, problème nécessitant plusieurs hypothèses ou dépendances.
- **XHigh** : exceptionnel uniquement — problème très complexe ou ambigu, architecture transversale difficile, échecs persistants inexpliqués ou investigation nécessitant un raisonnement maximal.

### Combinaisons recommandées

Utiliser cette grille comme point de départ, puis ajuster au périmètre réel :

| Situation | Modèle | Puissance |
|---|---|---|
| Inspection Git / lecture / documentation | GPT-5.6 Luna | Low |
| Petite correction évidente | GPT-5.6 Luna | Medium |
| Développement MailPin courant | GPT-5.6 Terra | Medium |
| Refactor modéré ou bug multi-fichiers | GPT-5.6 Terra | High |
| Frontière Thunderbird / stockage / migration / CI sensible | GPT-5.6 Sol | High |
| Investigation exceptionnellement complexe | GPT-5.6 Sol | XHigh |

Règles finales :

- `GPT-5.6 Terra + Medium` est le **couple par défaut** pour une vraie tâche de développement.
- Ne jamais utiliser `High` ou `XHigh` simplement "par sécurité".
- `XHigh` doit rester exceptionnel.
- Ne jamais recommander `XHigh` pour de la documentation, un changement mécanique ou une correction évidente.
- Si `Low` suffit, ne pas utiliser `Medium`.
- Si Terra suffit, ne pas utiliser Sol.
- Si Luna suffit, ne pas utiliser Terra.
- Le choix du modèle ou de la puissance n'autorise jamais l'utilisation de Codex Security ; ses règles d'autorisation restent distinctes.
- GPT-5.6 supporte aussi un effort `max`, mais **MailPin ne le recommande pas par défaut** : rester sur `Low`, `Medium`, `High` ou `XHigh`. N'utiliser `max` que sur demande explicite de l'utilisateur pour un cas exceptionnel où `XHigh` ne suffit pas.

## 5.2 Routage minimal des skills UI

Les règles MailPin et `docs/UI_SPEC.md` priment toujours. Pour l’UI produit, les réglages, formulaires, audits, finitions, responsive et accessibilité, charger `impeccable`. Pour la recherche amont d’une direction ou d’un design system, charger `ui-ux-pro-max`. Réserver `design-taste-frontend` à un changement artistique ou une surface expressive explicitement demandée. Ne combiner plusieurs skills que si leurs responsabilités sont réellement complémentaires.

Impeccable reste différentiel : contrôles mécaniques immédiats sur les seuls fichiers UI édités, règles complètes au `Stop`, aucun passage complet à chaque édition et silence quand le résultat est propre. Les collections `awesome-design-md` et `awesome-design-skills` servent uniquement de références ponctuelles pour enrichir la source de vérité du projet ; elles ne sont pas installées globalement. `img2threejs` ne fait pas partie de l’environnement MailPin.

## 5.3 Navigation structurelle, compression et simplicité

Graphify complète les outils existants sans les remplacer. Utiliser le skill projet pour une architecture transversale, un chemin d'appel, des dépendances multi-modules, une analyse d'impact ou l'orientation dans une zone inconnue uniquement si cela économise réellement des lectures. Ne pas l'utiliser pour une petite tâche ou un fichier déjà identifié. Le code lu directement reste la preuve avant modification ou conclusion ; `PROJECT_MEMORY.md`, Brain et `mailpin-project-knowledge` conservent leurs rôles de décision, d'invariant et de connaissance produit. Les sorties `graphify-out/` restent locales et régénérables ; strict mode, hooks et watchers Graphify sont interdits.

Headroom est un outil global facultatif de compression process-local pour Codex, jamais une dépendance du projet. Avant chaque utilisation, vérifier le `--help` courant et désactiver le context tool, MCP de récupération, tokensave, Serena, memory, cross-agent memory, learning, output shaper, télémétrie et toute modification du reasoning effort. Ne pas écrire de règles apprises ni persister de configuration Headroom ; préférer le mode stateless et lossless/fail-open. Si la compression échoue, ne produit pas de gain utile ou dégrade la stabilité, utiliser Codex normal.

Après compréhension du flux réel, appliquer cette échelle et s'arrêter au premier niveau suffisant : ne rien ajouter si le changement est inutile ; réutiliser l'existant du dépôt ; utiliser la bibliothèque standard ; utiliser une fonction native de la plateforme ou du runtime ; réutiliser une dépendance déjà installée ; préférer une solution locale courte, claire et testable ; seulement ensuite écrire le minimum de nouveau code. Cette simplicité ne doit jamais réduire la sécurité ou la validation des trust boundaries, l'intégrité et l'atomicité des données, la gestion des erreurs et des pertes, l'accessibilité, la lisibilité, les tests pertinents ni les invariants MailPin.

---

# 6. Codex Security : interdit par défaut

## Règle générale

Ne jamais utiliser Codex Security pour une revue, un audit ou une correction standard de MailPin.

Codex Security est considéré comme un outil exceptionnel à coût élevé.

## Outils à privilégier avant

Utiliser d'abord, selon le besoin :

- tests unitaires / statiques existants ;
- tests de contrat ;
- smoke Thunderbird ciblé ;
- `npm run check` ;
- `npm test` ;
- `npm run build` ;
- `npm run ci` lorsque justifié ;
- scans de secrets existants ;
- outils et scripts sécurité déjà présents dans le dépôt ;
- CodeQL / contrôles GitHub existants ;
- revue manuelle ciblée du diff.

## Exception

Codex Security peut être envisagé uniquement si :

1. il existe une question de sécurité précise et clairement identifiée ;
2. les tests et outils standards ont déjà été utilisés ;
3. ils n'ont pas permis de conclure avec suffisamment de confiance ;
4. l'analyse peut être limitée à un fichier, flux, finding ou surface précise ;
5. l'utilisateur est informé avant son utilisation et l'autorise explicitement.

Ne jamais lancer un scan Codex Security du dépôt entier sans demande explicite de l'utilisateur.

---

# 7. Git : règles de sécurité opérationnelle

## Avant toute modification

Toujours relever au minimum :

```text
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
```

Ajouter le dernier commit ou le diff si nécessaire.

## Travail concurrent

Si Codex ou un autre agent travaille encore dans le dépôt local :

- ne rien modifier dans ce dépôt ;
- attendre que son travail soit terminé avant toute autre écriture ;
- à la fin, relever l'état Git exact ;
- préserver son travail avant tout fetch / merge / rebase.

## Branches

- Ne pas développer directement sur `main` sauf instruction explicite.
- Utiliser une branche dédiée pour les modifications.
- Ne pas mélanger des changements sans rapport dans une même branche.
- Ne pas écraser du travail local non identifié.

## Actions nécessitant une autorisation explicite

Ne jamais effectuer sans demande claire de l'utilisateur :

- push ;
- création de PR ;
- merge ;
- tag ;
- release ;
- force-push ;
- suppression de branche distante ;
- réécriture d'historique ;
- suppression destructive de données ou d'artefacts.

Une autorisation pour une opération n'autorise pas automatiquement les suivantes.

---

# 8. Sécurité et secrets

Appliquer `SECURITY_PRODUCTION_RULES.md`.

Rappels absolus :

- ne jamais afficher ou recopier un secret ;
- ne jamais ouvrir `.env`, credentials, clé privée ou `~/.codex/auth.json` sans nécessité exacte et autorisation ;
- ne jamais placer un secret dans un prompt ;
- vérifier chemins, schémas et permissions plutôt que valeurs ;
- ne jamais introduire de télémétrie ou connexion distante non autorisée ;
- ne jamais affaiblir un contrôle de sécurité simplement pour obtenir un test vert.

---

# 9. Invariants MailPin à préserver

Toujours respecter les invariants canoniques du dépôt, notamment :

- extension Thunderbird Manifest V3 locale ;
- identifiant canonique sensible à la casse : `ussmarines.mailpin@addons.thunderbird.net` ;
- aucun réseau runtime, télémétrie, publicité, CDN ou code distant ;
- ne pas modifier les compteurs natifs de nouveaux messages / non-lus ;
- ne pas marquer lu/non-lu lors d'un simple épinglage ;
- ne pas stocker le corps complet des messages ni le contenu des pièces jointes ;
- entrées privilégiées bornées, validées et normalisées ;
- écritures SQLite incrémentales, transactionnelles et sérialisées ;
- nettoyage des listeners, observers, timers, menus, styles et nœuds injectés ;
- aucun `eval`, `new Function`, `innerHTML` ou équivalent avec données mail non fiables ;
- ne pas contourner `PinCompatibility` pour Messages, Tags ou Agenda déjà extraits ;
- Tags personnels Thunderbird : ne jamais renommer, adopter ou supprimer ;
- Tags/Agenda facultatifs : leur indisponibilité ne doit pas empêcher le cœur MailPin de fonctionner ;
- pas de nouvelle permission WebExtension sans justification et tests ;
- pas de dépendance runtime ou connexion distante sans nécessité démontrée et validation explicite ;
- le mode Recommandé ne sauvegarde jamais automatiquement et ne doit pas écraser les choix propres au profil ;
- ne jamais prétendre qu'un comportement graphique Thunderbird fonctionne sans l'avoir réellement observé.

Pour les détails, se référer à `AGENTS.md`, `PROJECT_MEMORY.md`, `docs/SECURITY_BOUNDARY.md` et aux documents spécialisés pertinents.

---

# 10. Stratégie de test par type de changement

## Documentation uniquement

- contrôle syntaxe / cohérence ciblé ;
- aucun smoke Thunderbird ;
- aucune suite complète sauf dépendance automatisée explicite.

## CSS / UI sans logique

- contrôles statiques ciblés ;
- test UI pertinent si disponible ;
- Thunderbird réel seulement si le comportement dépend du DOM interne ou si la correction est visuelle et doit être prouvée.

## Logique métier pure

- test unitaire / modèle ciblé ;
- tests de modules dépendants si nécessaire ;
- pas de smoke réel si aucune frontière Thunderbird n'est touchée.

## Messages / Tags / Agenda / `PinCompatibility`

- tests de contrat ciblés ;
- tests de frontière ;
- smoke Thunderbird si comportement runtime affecté.

## Stockage / migration

- tests stockage / migration / rollback ciblés ;
- vérifier atomicité et compatibilité ;
- suite plus large si le schéma change.

## Manifest / permissions / API privilégiée / CI / release

- contrôles sécurité et build pertinents ;
- vérifier documentation et métadonnées associées ;
- validation plus large justifiée.

---

# 11. Définition de terminé pour une tâche IA

Une tâche n'est terminée que lorsque l'agent restitue de façon concise :

- fichiers réellement modifiés ;
- raison de chaque modification ;
- tests réellement exécutés ;
- tests non exécutés et pourquoi ;
- contrôles précédents réutilisés parce que la surface n'a pas changé ;
- résultat Git final ;
- limites ou validations manuelles restantes ;
- confirmation des actions Git distantes non effectuées.

Ne jamais présenter comme "testé" un contrôle seulement supposé ou hérité d'un autre commit.

---

# 12. Modèle de prompt Codex compact

Avant chaque prompt, afficher à l'utilisateur :

```text
Modèle recommandé : <modèle>
Puissance : <Low | Medium | High | XHigh>
```

Puis utiliser ce modèle et supprimer les lignes inutiles :

```text
Travaille uniquement sur MailPin.

Lis d'abord les règles sources du projet puis `AGENTS.md`.
Vérifie l'état Git exact avant toute modification.

Objectif :
[objectif précis]

Périmètre :
[fichiers / module / bug concerné]

Règles :
- analyse d'abord le diff et les fichiers directement concernés ;
- ne relis ni ne reteste les éléments inchangés dont le dernier contrôle reste valide ;
- utilise les tests les plus ciblés possibles ;
- une suite complète au maximum au jalon final si elle est réellement nécessaire ;
- économise le contexte et les tokens ;
- n'utilise jamais Codex Security ;
- si une question de sécurité précise reste non résolue après les outils standards, arrête-toi et signale-la ;
- ne pousse pas, ne merge pas, ne tague pas et ne publie pas sans ordre explicite ;
- ne modifie aucun fichier hors périmètre sans nécessité démontrée.

À la fin, donne seulement :
1. fichiers modifiés ;
2. corrections réalisées ;
3. tests exécutés et résultats ;
4. contrôles non relancés car inchangés ;
5. limites restantes ;
6. `git status --short --branch` et HEAD.
```

---

# 13. Règle pour les audits et revues

Par défaut, une revue signifie :

- examiner le diff depuis la dernière base validée ;
- rechercher les régressions introduites par ce diff ;
- vérifier les invariants affectés ;
- exécuter les tests ciblés associés.

Elle ne signifie pas :

- réauditer tout l'historique ;
- relire tout le dépôt ;
- relancer tous les tests ;
- lancer Codex Security ;
- réexaminer des zones inchangées sans signal nouveau.

Un audit exhaustif doit être demandé explicitement.

---

# 14. Règle de mise à jour de cette source

Modifier ce fichier uniquement quand une règle durable du projet change.

Ne pas y stocker les informations éphémères suivantes :
- branche active ;
- HEAD courant ;
- numéro de PR ;
- dernier résultat de CI ;
- dernière release publiée ;
- bug temporaire ;
- liste de fichiers momentanément modifiés.

Ces informations doivent être vérifiées dynamiquement dans Git/GitHub ou conservées dans les fichiers opérationnels du dépôt.
