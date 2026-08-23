# Passage de relais — MailPin 1.7.6 candidate

## État

- branche : `release/startup-fix-1.7.6` ;
- version source : **1.7.6** ;
- dernière release publique : **1.7.5** ;
- Thunderbird : 153.0 à 154.* ;
- ID : `ussmarines.mailpin@addons.thunderbird.net` ;
- nom ATN : `MailPin — Email Follow-up & Productivity` — 40 caractères.

## Objectif

Publier la maintenance 1.7.6 contenant le correctif de cold start fusionné par la PR #64. Les épingles persistées doivent être rendues automatiquement après un démarrage complet de Thunderbird sans ouverture préalable du Dashboard.

## Cause et correction

Le background Manifest V3 ne s’enregistrait pas sur `runtime.onStartup` et pouvait rester arrêté au cold start. Le clic MailPin/Dashboard le réveillait, masquant la dépendance. `extension/background.js` initialise désormais les onglets mail existants depuis `runtime.onStartup` via le chemin `setup` idempotent existant. Le banc persistant ne provoque plus de réveil artificiel par activation d’onglet.

## Preuves acquises

- PR #64 head runtime `26fc0ac9b4d35009f125f543eefc5de9338bef71` ;
- QA `32639780333` — PASS ;
- smoke réel Thunderbird 154.0 `32639780313` — PASS ;
- cold start sans Dashboard : PASS ;
- merge `main` : `fa6782f8ecfaf259d9b8e54a08e5cf361172c669`.

## Gates restants

La candidate versionnée 1.7.6 doit passer QA/build et smoke Thunderbird 154.0 sur son head exact, puis être fusionnée et publiée comme `v1.7.6`. La source reviewer doit reconstruire le XPI sans `.git` avant publication.

Codex Security n’est pas requis.
