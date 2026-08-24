# Audit de sécurité MailPerch 1.1.0

Date : 4 août 2026
Base examinée : sources 1.1.0 dérivées de `main` au commit de référence `a1e26bee9400279109b447cc80b90b24913b8bca`, complétées localement par les fonctions de productivité 1.1.0.

## Conclusion

MailPerch 1.1.0 étend les fonctions locales de suivi sans élargir les permissions WebExtension ni introduire de connexion réseau, de télémétrie, de secret, de code distant ou de dépendance d’exécution. Le manifeste reste en MV3, la permission déclarée reste `menus` et la CSP conserve `connect-src 'none'`.

Les nouvelles surfaces — capture rapide, veille, vues Aujourd’hui/Revue, rappels interactifs, actions groupées, simulation de règles, raccourcis et fusion d’éléments associés — utilisent l’API Experiment existante. Le dashboard et les paramètres restent non privilégiés ; les entrées sont revalidées et bornées dans l’Experiment avant toute écriture.

Les contrôles automatisés n’ont pas identifié de secret, primitive d’exécution dynamique, injection HTML active, appel réseau ou nouvelle permission. Ce résultat ne constitue pas une garantie absolue : l’Experiment accède aux API internes de Thunderbird et les parcours graphiques doivent encore être validés dans un profil réel sur la matrice annoncée.

## Périmètre examiné

- manifeste, permissions, CSP et commandes ;
- menus de capture rapide et sélection du message courant ;
- état de veille, réveil, déclenchement et acquittement des rappels ;
- vues Aujourd’hui et Revue quotidiennes/hebdomadaires ;
- actions groupées et limites de sélection ;
- simulation des brouillons de règles sans écriture ;
- personnalisation, export et restauration des raccourcis ;
- détection et fusion des conversations associées ;
- pages Paramètres/Dashboard vers le schéma et l’implémentation Experiment ;
- imports, stockage SQLite, sauvegardes, migrations et désinstallation ;
- scripts de build, GitHub Actions, reproductibilité et contenu des archives.

## Nouvelles protections 1.1.0

### Capture rapide

- presets fermés et normalisés : épinglage simple, aujourd’hui, demain, attente et suivi sans réponse ;
- aucune instruction libre interprétée comme code ou action privilégiée ;
- réinitialisation explicite des états incompatibles pour éviter les anciens rappels ou suivis résiduels.

### Veille et rappels

- dates bornées et normalisées ;
- distinction entre déclenchement (`reminderFiredAt`) et acquittement (`reminderAcknowledgedAt`) ;
- centre interactif limité à ouvrir, terminer, reporter ou acquitter ;
- aucun envoi, déplacement ou effacement automatique de message ;
- conservation correcte des rappels récurrents jusqu’à une action utilisateur.

### Actions groupées

- sélection limitée à 500 références dans le schéma et l’implémentation ;
- actions autorisées par allowlist et options normalisées ;
- opérations sensibles toujours exécutées par la couche privilégiée existante.

### Règles

- simulation du brouillon visible avant enregistrement ;
- chemin de simulation sans écriture ;
- règles et résultats bornés ;
- aucune activation implicite à la suite d’un aperçu ou d’un import.

### Fusion des éléments associés

- fusion bornée à 50 références ;
- identité forte commune obligatoire dans le même compte : fil Gmail, Message-ID racine, `threadId` Thunderbird ou clé dérivée de ces identités ;
- l’objet seul ne constitue jamais une preuve ;
- confirmation utilisateur dans le dashboard et nouvelle validation dans l’Experiment ;
- refus lorsque plusieurs éléments Agenda distincts sont liés ;
- historique et pile d’annulation ;
- aucune fusion automatique.

### Raccourcis

- utilisation de l’API Thunderbird `commands` ;
- aucune interprétation de script ou commande système ;
- dictionnaire borné, exporté et restauré avec compatibilité des anciennes sauvegardes.

## Garanties vérifiées automatiquement

| Contrôle | Résultat |
|---|---|
| Permissions WebExtension | `menus` uniquement |
| Réseau | aucune API réseau et `connect-src 'none'` |
| Code distant | absent |
| Exécution dynamique | absence de `eval` et `Function` |
| Injection HTML | absence de `innerHTML`, `outerHTML` et `insertAdjacentHTML` |
| Dépendances | aucune dépendance npm/Python de build ou d’exécution |
| Secrets | scan local réussi avec `npm run check` |
| API Experiment | schéma, limites et validations privilégiées |
| Fusion | identité forte, confirmation, limite 50, conflits Agenda refusés |
| Actions groupées | allowlist et limite 500 |
| Packaging | XPI et archive source générés par le build reproductible |

## Chaîne d’approvisionnement

- aucune dépendance tierce téléchargée pendant le build ou les tests ;
- actions GitHub épinglées à des SHA immuables ;
- identifiants du checkout non persistés ;
- fichiers de build sélectionnés explicitement ;
- aucun secret requis par l’extension ou inclus dans le manifeste.

## Risques résiduels

- incompatibilité future d’une API interne utilisée par l’Experiment ;
- erreur visible uniquement dans une session Thunderbird graphique ou une liste virtualisée réelle ;
- différence de comportement selon le fournisseur IMAP ou Agenda ;
- absence d’identité forte empêchant volontairement la fusion de certains doublons légitimes ;
- raccourci refusé ou déjà réservé par le système, Thunderbird ou une autre extension ;
- attaquant ayant déjà le contrôle du système, du profil ou de la boîte à outils privilégiée ;
- sauvegarde exportée manuellement puis partagée par l’utilisateur.

## Validation manuelle encore requise

Avant une soumission ATN :

- installer le XPI 1.1.0 dans un profil propre ;
- exécuter la matrice de `docs/MANUAL_TEST_PLAN.md` ;
- vérifier les dix commandes personnalisables sur Windows, Linux et macOS ;
- vérifier la liste virtualisée, les thèmes clair/sombre et le zoom 200 % ;
- tester suivi sans réponse, veille, rappels récurrents et fusion avec de vrais comptes ;
- tester la création et la conservation des liens Agenda selon les fournisseurs annoncés ;
- joindre l’archive source et `release/BUILD_INSTRUCTIONS.md` aux reviewers.

## Limite de l’audit

Cet audit couvre les sources et contrôles disponibles dans l’environnement de build. Il ne prétend pas remplacer une revue indépendante, les tests graphiques Thunderbird réels ou la validation des reviewers Mozilla/Thunderbird.
