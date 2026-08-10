# Passage de relais Codex — MailPerch 1.5.2

## Référence

- source de vérité après publication : `main` ;
- base de la passe : `e5fe966a4beff4755bd727ad4d79fb81148e3b36` (1.5.1) ;
- branche de travail : `release/1.5.2-runtime-coverage` jusqu’à fusion ;
- version préparée : **1.5.2** ;
- identifiant canonique : `pin-mails@MailPerch.local`.

## Objet de 1.5.2

- fermer les limites automatisables du banc Dashboard/Options, XUL, thèmes et persistance multi-processus ;
- corriger les substitutions localisées paramétrées découvertes par le Dashboard Thunderbird réel ;
- ajuster la densité/hauteur du panneau seulement là où la preuve runtime l’exige ;
- conserver les fournisseurs réseau réels et le jugement esthétique pixel par pixel comme limites explicites.

Aucune fonction métier, permission WebExtension, dépendance runtime, migration ou connexion réseau n’est ajoutée.

## Preuves de release

1. `npm run ci` Linux et contrôles Windows ;
2. smoke Thunderbird réel 153.0.1 ESR sur XPI 1.5.2 ;
3. banc réel 50/100/500/1000/2000 ;
4. Dashboard/Options DOM réels, commande XUL native, thèmes clair/sombre ;
5. persistance extension non temporaire + SQLite/réglages sur deux processus avec réveil MV3 naturel ;
6. build reproductible, XPI/ZIP source et SHA-256 ;
7. PR vers `main`, squash conforme au ruleset, puis tag/release sur le SHA fusionné.

Les preuves finales sont consignées dans `VALIDATION_REPORT_1.5.2.md`, `SECURITY_AUDIT_1.5.2.md` et `docs/AI_VALIDATION_STATE.json`.
