# Passage de relais Codex — MailPerch 1.5.1

## Référence

- source de vérité après publication : `main` ;
- base de la passe exhaustive : `c87a46de4141e09f2e0b29c0ec6996b2693fc2b1` (1.5.0) ;
- branche de travail : `audit/full-release-hardening-2026-08-10` jusqu’à fusion ;
- version préparée : **1.5.1** ;
- identifiant canonique : `pin-mails@MailPerch.local`.

## Objet de 1.5.1

Release corrective et de durcissement après diagnostic Thunderbird 153.0.2 :

- réparer l’éditeur de carte/checklist ;
- terminer la frontière `PinCompatibility.messages` ;
- réaligner Settings schéma 8 / Data schéma 7 ;
- fiabiliser les indicateurs `secure`/offline du diagnostic fournisseur ;
- refaire les validations code, sécurité, runtime et release sur l’arbre final ;
- resynchroniser documentation, README, checklist ATN et livrables.

Aucune fonction métier, permission WebExtension, dépendance runtime ou connexion réseau n’est ajoutée.

## Preuves exigées avant publication

1. `npm run ci` sur l’arbre final ;
2. deux inventaires exhaustifs indépendants de tous les fichiers suivis ;
3. audit sécurité standard avec garde historique, Gitleaks, Opengrep, Trivy/SBOM et zizmor ;
4. smoke Thunderbird réel sur la version cible ;
5. banc fonctionnel/charge réel quand le runtime privilégié change ;
6. CI GitHub Linux/Windows verte ;
7. build reproductible, XPI/ZIP source et SHA-256 ;
8. PR vers `main`, squash conforme au ruleset, puis tag/release sur le SHA fusionné.

Les résultats réellement obtenus sont consignés dans `SECURITY_AUDIT_1.5.1.md`, `VALIDATION_REPORT_1.5.1.md` et `docs/AI_VALIDATION_STATE.json`.
