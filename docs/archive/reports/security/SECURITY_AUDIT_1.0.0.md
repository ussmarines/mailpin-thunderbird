# Audit de sécurité MailPerch 1.0.0

Date : 2 août 2026
Base examinée : sources de la release 1.0.0 dérivées de `main` au commit `f7497870423683f1bb1622111634a2513c304aa6`.

## Conclusion

La surface d’attaque de MailPerch est limitée à une MailExtension locale et à l’API Experiment privilégiée `pinInbox`. La release ne déclare que la permission WebExtension `menus`, bloque les connexions réseau par CSP, n’embarque aucun code distant ni dépendance tierce et ne copie pas le corps complet des messages ou le contenu des pièces jointes.

Les contrôles statiques et de modèles n’ont identifié aucun secret, mécanisme d’administration caché, primitive d’exécution dynamique, injection HTML active ou appel réseau. Ils ne permettent toutefois pas de promettre une sécurité absolue : l’Experiment dispose d’un accès privilégié aux API internes de Thunderbird et doit être validé manuellement dans les versions annoncées.

## Périmètre examiné

- pages Paramètres et Dashboard vers le schéma et l’implémentation Experiment ;
- métadonnées de messages vers le DOM, les règles et le journal local ;
- imports JSON vers validation, migration, restauration et SQLite ;
- réglages vers fichiers, Agenda, actions groupées et automatisations ;
- arrêt, mise à jour, désinstallation et réinstallation ;
- manifeste, permissions, CSP, ressources locales, GitHub Actions et build reproductible.

## Garanties vérifiées automatiquement

| Contrôle | Résultat |
|---|---|
| Permissions WebExtension | `menus` uniquement |
| Réseau | aucune API réseau et `connect-src 'none'` |
| Code distant | absent |
| Exécution dynamique | absence de `eval` et `Function` |
| Injection HTML | absence de `innerHTML`, `outerHTML` et `insertAdjacentHTML` |
| Dépendances | aucune dépendance npm/Python de build ou d’exécution |
| Secrets | scan local réussi |
| GitHub Actions | actions épinglées par SHA, checkout sans identifiants persistés |
| Données | validation des entrées, imports rendus inertes, diagnostics expurgés |
| SQLite | transactions, écritures sérialisées, WAL et récupération atomique |
| Packaging | sélection des fichiers suivis, XPI et source reproductibles |

## Protections principales

- validation récursive des objets reçus par l’Experiment ;
- rejet des cycles, clés dangereuses, objets non simples et structures excessives ;
- allowlists pour les identifiants SQL dynamiques ;
- import en mode sûr avec automatismes et liens Agenda désactivés ;
- sélection native obligatoire pour le chemin de sauvegarde ;
- confirmations UX et validation privilégiée pour les actions destructives ;
- règles limitées en débit et protégées contre les boucles ;
- fermeture du stockage avant purge de désinstallation ;
- suppression limitée aux fichiers MailPerch vérifiables ;
- aucune donnée utilisateur dans les journaux ou diagnostics exportés sans expurgation.

## Risques résiduels

- incompatibilité future d’une API interne utilisée par l’Experiment ;
- erreur visible uniquement dans une session Thunderbird graphique ;
- attaquant ayant déjà le contrôle du système, du profil ou de la boîte à outils privilégiée ;
- sauvegarde exportée manuellement puis partagée par l’utilisateur ;
- comportements spécifiques à un fournisseur Agenda ou à un type de compte non reproduits par les tests de modèles.

## Validation requise avant soumission ATN

- exécuter `npm run ci` sur la source finale ;
- installer le XPI dans un profil propre ;
- tester la matrice de `docs/MANUAL_TEST_PLAN.md` ;
- vérifier les thèmes, le zoom 200 %, les comptes et l’Agenda sur les versions Thunderbird annoncées ;
- joindre l’archive source et les instructions de build aux reviewers.
