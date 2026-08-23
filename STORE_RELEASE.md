# Publication MailPin 1.7.6

## État

- **Version source :** 1.7.6 — publiée
- **Dernière release publique :** 1.7.6
- **Dernière publication :** `v1.7.6`, commit `522042df08c2eb7a18a13cbb83631943e54abf2c`
- **Nom public/localisé :** `MailPin — Email Follow-up & Productivity` — 40 caractères
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité publiée :** Thunderbird 153.0 à 154.*
- **Fiche ATN :** https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Portée 1.7.6

La 1.7.6 corrige un défaut de cold start : des épingles déjà persistées n’étaient rendues dans la boîte mail qu’après une action MailPin telle que l’ouverture du Dashboard. Le background Manifest V3 s’enregistre désormais sur `runtime.onStartup` et initialise les onglets mail existants via le chemin `setup` idempotent déjà utilisé.

Le banc Thunderbird persistant ne réactive plus artificiellement l’onglet mail et vérifie le rendu automatique après redémarrage sans Dashboard ni interaction utilisateur.

Aucune permission WebExtension, migration, schéma, stockage, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant n’est ajouté. `PinCompatibility` reste inchangé.

## Artefacts publiés

- `MailPin_v1.7.6.xpi`
- `MailPin_GitHub_Repository_v1.7.6.zip`
- `SHA256SUMS.txt`

## Preuves

- correctif runtime PR #64 head `26fc0ac9b4d35009f125f543eefc5de9338bef71` : QA `32639780333` — PASS ; smoke réel Thunderbird 154.0 `32639780313` — PASS ;
- candidate versionnée exacte `c502175041c85e3cb6e37666a0784f7df0a9e367` : QA `32640198347` — PASS ; smoke réel Thunderbird 154.0 `32640198339` — PASS ;
- release `v1.7.6` observée via son tag, ciblant `522042df08c2eb7a18a13cbb83631943e54abf2c` ;
- le publisher one-shot est conçu pour exécuter `npm run ci`, reconstruire depuis une archive source fraîche sans `.git` et exiger un XPI SHA-identique avant `gh release create` ; l’existence du tag démontre que le flux a atteint l’étape de publication ;
- le connecteur actuel ne permet pas de télécharger indépendamment les assets de release : aucune empreinte publique non observée n’est enregistrée ici.

## Gates GitHub / ATN

- [x] cause racine et correctif runtime démontrés sur Thunderbird 154.0 ;
- [x] QA Linux/Windows sur la candidate 1.7.6 exacte ;
- [x] garde sécurité/identité ;
- [x] build et structure XPI sur la candidate ;
- [x] smoke Thunderbird 154.0 réel sur la candidate 1.7.6 exacte ;
- [x] merge de la candidate versionnée vers `main` ;
- [x] tag/release `v1.7.6` créé ;
- [ ] vérification indépendante par téléchargement des trois assets publics et de leurs empreintes, non accessible depuis le connecteur actuel ;
- [ ] éventuelle soumission ATN 1.7.6 et revue humaine.

Codex Security n’a pas été utilisé.
