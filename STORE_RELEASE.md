# Préparation MailPin 1.7.6

## État

- **Version source :** 1.7.6 — candidate
- **Dernière release publique :** 1.7.5
- **Dernière publication :** `v1.7.5`, commit `2384ee52df95a711424dfeb817ef114888634ed0`
- **Nom public/localisé :** `MailPin — Email Follow-up & Productivity` — 40 caractères
- **ID permanent :** `ussmarines.mailpin@addons.thunderbird.net`
- **Compatibilité :** Thunderbird 153.0 à 154.*
- **Fiche ATN :** https://addons.thunderbird.net/en-US/thunderbird/addon/mailpin/

## Portée 1.7.6

La 1.7.6 corrige un défaut de cold start de Thunderbird : des épingles déjà persistées n’étaient rendues dans la boîte mail qu’après une action MailPin telle que l’ouverture du Dashboard. Le background Manifest V3 s’enregistre désormais sur `runtime.onStartup` et initialise les onglets mail existants via le chemin `setup` idempotent déjà utilisé.

Le banc Thunderbird persistant ne réactive plus artificiellement l’onglet mail et exige désormais que les épingles apparaissent après le second processus Thunderbird sans Dashboard ni interaction utilisateur.

Aucune permission WebExtension, migration, schéma, stockage, dépendance runtime, connexion réseau, télémétrie, publicité, CDN ou code distant n’est ajouté. `PinCompatibility` reste inchangé.

## Preuves déjà acquises sur le correctif runtime

- PR #64 head `26fc0ac9b4d35009f125f543eefc5de9338bef71` : QA `32639780333` — PASS ;
- même head : smoke réel Thunderbird 154.0 `32639780313` — PASS ;
- cold start réel : background `APP_STARTUP`/running, 50 références SQLite persistées préservées, cartes attendues rendues, panneau/toggle uniques, zéro timeout ou exception MailPin ;
- merge sur `main` : `fa6782f8ecfaf259d9b8e54a08e5cf361172c669`.

Ces preuves démontrent le correctif runtime mais ne remplacent pas les gates frais de la candidate versionnée 1.7.6, car le manifeste et les métadonnées de version ont changé.

## Artefacts attendus

- `MailPin_v1.7.6.xpi` ;
- `MailPin_GitHub_Repository_v1.7.6.zip` ;
- `SHA256SUMS.txt`.

## Gates 1.7.6

- [x] cause racine et correctif runtime démontrés sur Thunderbird 154.0 ;
- [x] correctif fusionné dans `main` ;
- [ ] QA Linux/Windows sur la candidate 1.7.6 exacte ;
- [ ] build reproductible et structure XPI ;
- [ ] smoke Thunderbird 154.0 sur la candidate 1.7.6 exacte ;
- [ ] merge de la candidate versionnée vers `main` ;
- [ ] `npm run ci` depuis une extraction neuve de l’archive source sans `.git` ;
- [ ] tag/release `v1.7.6` et artefacts publiés ;
- [ ] vérification des empreintes publiques.

La soumission/revue Add-ons for Thunderbird est une étape distincte de la publication GitHub. Codex Security n’est pas utilisé.
