# Modèle de menace

## Actifs

- métadonnées des messages épinglés, notes et échéances ;
- base SQLite, préférences, récupération et sauvegardes ;
- accès privilégié aux messages, dossiers et calendriers Thunderbird ;
- intégrité des messages, compteurs natifs et historique ;
- confidentialité du profil local.

## Acteurs considérés

1. contenu de message non fiable : objet, auteur, tags et aperçu ;
2. sauvegarde JSON malformée, énorme ou construite volontairement ;
3. autre page non privilégiée tentant d’atteindre l’Experiment ;
4. action utilisateur accidentelle ou règle locale en boucle ;
5. rapprochement erroné entre des messages seulement similaires ;
6. rappel ancien, récurrent ou acquitté réapparaissant de manière incohérente ;
7. version Thunderbird devenue incompatible ;
8. fermeture, mise à jour ou désinstallation interrompant une écriture.

Le propriétaire local du profil et un logiciel ayant déjà le contrôle du système sont hors du périmètre d’isolation. Ils ne doivent toutefois trouver aucun secret, jeton maître, rôle admin caché ou exécution arbitraire dans MailPerch.

## Frontières de confiance

- message/import → page WebExtension : données non fiables ;
- page WebExtension → Experiment : données structurées mais toujours non fiables ;
- Experiment → Thunderbird/SQLite/fichiers : frontière privilégiée ;
- export téléchargé → extérieur du profil : responsabilité explicite utilisateur.

## Menaces et mesures

| Menace | Mesure principale |
|---|---|
| Injection HTML/script/style | `textContent`, CSSOM avec valeurs normalisées, CSP locale |
| Exfiltration réseau | aucune permission réseau, `connect-src 'none'`, aucun appel réseau |
| Escalade par paramètre admin | aucun rôle admin ; validation au niveau Experiment |
| Objet/API géant ou cyclique | limites de profondeur, nœuds, octets et sélections |
| Prototype pollution | rejet de `__proto__`, `prototype`, `constructor` |
| Import activant une automatisation | règles, suivi auto, Agenda bidirectionnel et listes auto désactivés |
| Chemin disque arbitraire | chemin conservé côté privilégié, sélecteur natif uniquement |
| Suppression involontaire | confirmation UI, actions fermées et pile d’annulation |
| Fusion de conversations non liées | identité forte commune obligatoire ; objet seul interdit ; confirmation utilisateur |
| Perte ou duplication de lien Agenda pendant une fusion | refus si plusieurs éléments Agenda distincts sont détectés |
| Action groupée démesurée | schéma et implémentation bornés à 500 références ; fusion bornée à 50 |
| Rappel récurrent perdu ou répété après acquittement | horodatages séparés `fired`/`acknowledged`, normalisation et tests de récurrence |
| Règle simulée modifiant les données | chemin de simulation sans écriture, résultat borné et brouillon validé |
| Corruption concurrente | transactions, WAL, révision et sérialisation |
| Règle en boucle | débit, garde temporelle, seuil d’erreurs, désactivation |
| Données persistantes après désinstallation | arrêt/flush puis purge DB, fichiers, sauvegardes et préférences ; sentinelle native absente à la réinstallation ⇒ purge avant initialisation |
| Réécriture après purge | récupération de shutdown interdite pendant désinstallation |
| Diagnostic sensible | expurgation des comptes, calendriers, chemins et contenus |
| Incompatibilité Thunderbird | plage déclarée, mode réduit, tests manuels |
| Compromission de la chaîne CI | aucune installation helper, actions épinglées par SHA, checkout sans identifiants persistés |

## Principes pour les nouvelles actions

- une proposition n’est pas une autorisation : la détection d’éléments associés ne fusionne rien seule ;
- aucune nouvelle commande n’envoie, ne supprime ou ne déplace un message automatiquement ;
- une action UI est revérifiée dans l’Experiment, même si le dashboard a déjà contrôlé sa sélection ;
- les dates de veille et rappel sont bornées et normalisées avant persistance ;
- les libellés issus des messages sont affichés comme texte, jamais interprétés comme balisage.

## Risque résiduel

L’Experiment possède un accès complet au client et dépend d’API internes. Une nouvelle faille peut apparaître avec une évolution Thunderbird ou une fonction privilégiée future. Toute extension du périmètre exige une mise à jour du présent modèle, de `docs/SECURITY_BOUNDARY.md`, des tests et du rapport de sécurité.

La similarité sémantique n’est volontairement pas utilisée pour fusionner des messages. Cette prudence réduit les faux positifs, mais peut laisser plusieurs épingles que l’utilisateur devra regrouper manuellement lorsque le fournisseur ne fournit aucune identité forte exploitable.
