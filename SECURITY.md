# Politique de sécurité

## Signaler une vulnérabilité

Ne pas ouvrir publiquement une vulnérabilité exploitable tant que le dépôt est
privé ou que le correctif n’est pas disponible. Envoyer au propriétaire :
version, Thunderbird/OS, étapes, impact, journaux expurgés et éventuel correctif.
Ne jamais joindre de messages, profil ou base utilisateur non expurgés.

## Périmètre

MailPerch est local, sans serveur et sans rôle administrateur. L’extension utilise
Manifest V3 et une API Experiment privilégiée pour `about:3pane`, les messages,
SQLite et Agenda. Voir [docs/SECURITY_BOUNDARY.md](docs/SECURITY_BOUNDARY.md).

## Contrôles obligatoires

- permissions minimales : `menus` uniquement ;
- CSP locale sans réseau, code distant, objets, framing ou formulaires externes ;
- aucune dépendance d’exécution tierce, télémétrie, publicité ou secret ;
- DOM construit avec `textContent`, sans `eval` ni injection HTML ;
- objets API et imports bornés, normalisés et protégés contre les clés dangereuses ;
- imports rendus inertes avant activation manuelle des automatismes ;
- chemin de sauvegarde modifiable uniquement via le sélecteur natif ;
- SQLite en WAL, transactions, écritures sérialisées et récupération atomique ;
- confirmation des opérations destructives depuis l’interface ;
- règles bornées, limitées en débit et protégées contre les boucles ;
- diagnostics expurgés et absence de contenu de message stocké ;
- fermeture du stockage avant purge complète lors de la désinstallation ;
- sentinelle d’installation effacée par le stockage natif Gecko afin qu’une réinstallation purge les résidus avant toute initialisation ;
- tests interdisant les compteurs natifs parallèles et les rôles admin client ;
- CI sans installation Python tierce, actions GitHub épinglées par SHA et identifiants de checkout non persistés.

## Inspecteur Thunderbird

Le propriétaire local d’un profil peut utiliser la Boîte à outils privilégiée et
appeler les commandes de sa propre extension. Un faux contrôle `admin` côté
client serait contournable et n’est donc pas utilisé. La sécurité repose sur la
validation au niveau Experiment, une liste d’actions fermée, l’absence de chemins
ou code arbitraires et des confirmations UX. Un attaquant ayant déjà le contrôle
du système ou du profil est hors du modèle de menace.

## Contrôles locaux

```bash
npm run check
npm test
npm run build
npm run ci
```

Le rapport courant est [SECURITY_AUDIT_3.2.4.md](SECURITY_AUDIT_3.2.4.md).

## Limite importante

Les contrôles statiques ne prouvent pas toutes les interactions XUL privilégiées.
Toute version publique doit être testée sur les versions Thunderbird annoncées
et relue humainement après toute modification de permission, API Experiment,
stockage, import, Agenda ou désinstallation.
