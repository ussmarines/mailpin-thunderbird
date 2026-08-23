# Passage de relais — MailPin 1.7.6 publiée

## État

- branche : `release/finalize-1.7.6` ;
- version source : **1.7.6** ;
- dernière release publique : **1.7.6** ;
- Thunderbird : 153.0 à 154.* ;
- ID : `ussmarines.mailpin@addons.thunderbird.net` ;
- nom ATN : `MailPin — Email Follow-up & Productivity` — 40 caractères.

## Résultat

La maintenance 1.7.6 est publiée sur GitHub. Elle corrige le cold start des épingles persistées : le background Manifest V3 s’enregistre sur `runtime.onStartup` et initialise les onglets mail existants sans ouverture préalable du Dashboard. Le banc persistant ne réveille plus artificiellement le background.

Candidate exacte `c502175041c85e3cb6e37666a0784f7df0a9e367` : QA `32640198347` PASS, smoke réel Thunderbird 154.0 `32640198339` PASS. Tag `v1.7.6` : cible `522042df08c2eb7a18a13cbb83631943e54abf2c`.

## Suite

La soumission Add-ons for Thunderbird 1.7.6, si souhaitée, est distincte de la release GitHub. Le téléchargement indépendant des assets publics pour en consigner les SHA-256 reste également distinct : le connecteur GitHub disponible dans cette session ne permet pas cet accès.

Codex Security n’est pas requis.
