# Politique de sécurité

## Signaler une vulnérabilité

Ne pas ouvrir publiquement une vulnérabilité exploitable tant que le dépôt est privé ou que le correctif n’est pas disponible. Envoyer au propriétaire : version, Thunderbird/OS, étapes, impact, journaux expurgés et éventuel correctif. Ne jamais joindre de messages, profil ou base utilisateur non expurgés.

## Périmètre

L’extension utilise Manifest V3 et une API Experiment privilégiée. L’Experiment est limité aux intégrations internes nécessaires : panneau `about:3pane`, résolution des messages, SQLite, notifications de dossiers et Agenda.

## Contrôles

- CSP : scripts/styles locaux, objets interdits ;
- aucune permission réseau, télémétrie, publicité ou code distant ;
- aucune dépendance d’exécution tierce ;
- DOM construit avec `textContent` ;
- import borné et normalisé ;
- SQLite en WAL, transactions, écritures incrémentales et récupération atomique ;
- sauvegardes bornées et checksum local ;
- confirmation des suppressions ;
- protections anti-boucle pour les règles ;
- mode réduit en cas d’incompatibilité ;
- nettoyage des observateurs, timers, menus et éléments injectés ;
- tests interdisant la modification des compteurs natifs.

## Contrôles locaux

```bash
npm run check
npm test
python3 scripts/scan_secrets.py
```

## Limite importante

Les contrôles statiques ne prouvent pas la sûreté de toutes les interactions privilégiées. Toute version publique doit être testée dans les versions Thunderbird annoncées et faire l’objet d’une revue humaine.
