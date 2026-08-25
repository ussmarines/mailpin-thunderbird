# Publication MailPin 1.7.6

## État

- **Version source :** 1.7.6 — publiée sur GitHub
- **Dernière release publique :** 1.7.6
- **Dernière publication :** `v1.7.6`, commit `522042df08c2eb7a18a13cbb83631943e54abf2c`
- **Nom public/localisé :** `MailPin — Email Follow-up & Productivity` — 40 caractères
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité publiée :** Thunderbird 153.0 à 154.*
- **Fiche ATN :** https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/
- **ATN 1.7.5 :** rejetée le 23 août 2026 ; l’Experiment privée `pinInbox` ne correspond pas à un draft officiel publié dans `thunderbird/webext-experiments`.
- **ATN 1.7.6 :** **ne pas resoumettre en l’état**. La release GitHub conserve la même frontière privilégiée et serait exposée au même motif de rejet.

## Portée 1.7.6

La 1.7.6 corrige un défaut de cold start : des épingles déjà persistées n’étaient rendues dans la boîte mail qu’après une action MailPin telle que l’ouverture du Dashboard. Le background Manifest V3 s’enregistre désormais sur `runtime.onStartup` et initialise les onglets mail existants via le chemin `setup` idempotent déjà utilisé.

Le banc Thunderbird persistant ne réactive plus artificiellement l’onglet mail et vérifie le rendu automatique après redémarrage sans Dashboard ni interaction utilisateur.

Aucune permission WebExtension, migration, schéma, stockage, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant n’est ajouté. `PinCompatibility` reste inchangé.

## Nouvelle voie ATN / upstream

Le prochain objectif n’est pas de renommer `pinInbox`, mais d’extraire une capacité générique conforme aux principes WebExtension Thunderbird et de la discuter publiquement avant migration de MailPin.

Candidat de travail : **`MessageListAction`**, une primitive de liste de messages qui fournit uniquement :

- une action extension-owned dans une ligne du thread pane ;
- un état de présentation par message ;
- un événement de clic vers la WebExtension ;
- aucune logique de pin, workflow, stockage, calendrier, règle ou diagnostic.

Préparation présente dans :

- `docs/UPSTREAM_EXPERIMENT_STRATEGY.md` ;
- `upstream/webext-experiments/MessageListAction/README.md` ;
- `upstream/webext-experiments/MessageListAction/ISSUE_DRAFT.md` ;
- `upstream/webext-experiments/MessageListAction/PR_DRAFT.md` ;
- prototype de schema/manifest/parent implementation sous MPL-2.0.

Cette préparation n’est **pas** une acceptation upstream et ne rend pas encore MailPin 1.7.6 recevable sur ATN.

## Artefacts publiés

- `MailPin_v1.7.6.xpi`
- `MailPin_GitHub_Repository_v1.7.6.zip`
- `SHA256SUMS.txt`

## Preuves 1.7.6 GitHub

- correctif runtime PR #64 head `26fc0ac9b4d35009f125f543eefc5de9338bef71` : QA `32639780333` — PASS ; smoke réel Thunderbird 154.0 `32639780313` — PASS ;
- candidate versionnée exacte `c502175041c85e3cb6e37666a0784f7df0a9e367` : QA `32640198347` — PASS ; smoke réel Thunderbird 154.0 `32640198339` — PASS ;
- release `v1.7.6` observée via son tag, ciblant `522042df08c2eb7a18a13cbb83631943e54abf2c` ;
- le publisher one-shot est conçu pour exécuter `npm run ci`, reconstruire depuis une archive source fraîche sans `.git` et exiger un XPI SHA-identique avant `gh release create` ;
- le connecteur actuel ne permet pas de télécharger indépendamment les assets de release : aucune empreinte publique non observée n’est enregistrée ici.

## Gates GitHub / ATN

- [x] cause racine et correctif runtime 1.7.6 démontrés sur Thunderbird 154.0 ;
- [x] QA Linux/Windows sur la candidate 1.7.6 exacte ;
- [x] garde sécurité/identité ;
- [x] build et structure XPI sur la candidate ;
- [x] smoke Thunderbird 154.0 réel sur la candidate 1.7.6 exacte ;
- [x] release GitHub `v1.7.6` créée ;
- [x] rejet ATN 1.7.5 documenté comme contrainte d’architecture ;
- [x] stratégie d’extraction upstream préparée ;
- [x] brouillons issue/PR et squelette `MessageListAction` préparés ;
- [ ] discussion de design ouverte dans `thunderbird/webext-experiments` ;
- [ ] forme de l’API validée par les mainteneurs Thunderbird ;
- [ ] prototype ajusté et testé sur les versions Thunderbird retenues ;
- [ ] lint upstream `npm run lint` PASS ;
- [ ] PR upstream ouverte puis acceptée/publiée selon la politique applicable ;
- [ ] logique MailPin privilégiée séparée de la primitive générique ;
- [ ] aucune Experiment privée non couverte par une voie upstream acceptable dans la candidate ATN ;
- [ ] nouvelle version MailPin candidate ATN construite, testée et revue.

Codex Security n’a pas été utilisé pour cette préparation.
