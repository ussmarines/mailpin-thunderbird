# Audit de sécurité MailPerch 3.2.4

Base examinée : `main` au commit
`3e8852d4ffcd05c3235000489452ffef6dc752b0`.

## Conclusion

La version 3.2.4 réduit la surface d’attaque à une WebExtension locale sans
réseau et à un Experiment privilégié dont les entrées sont bornées et
normalisées. Aucun secret, mécanisme d’administration, code distant, télémétrie
ou permission réseau n’est nécessaire.

Une sécurité absolue ne peut pas être promise : l’Experiment dispose par nature
d’un accès privilégié à Thunderbird et le propriétaire local du profil conserve
le contrôle de sa propre application. Le correctif ferme les chemins plausibles
provenant des messages, sauvegardes JSON, pages d’extension et cycles de vie.


## Méthode et couverture

L’audit a suivi les flux depuis les sources non fiables jusqu’aux opérations privilégiées :

- pages Paramètres et Dashboard → schéma Experiment → implémentation privilégiée ;
- métadonnées de messages → rendu DOM, règles et journal local ;
- fichiers JSON → prévisualisation, migration, fusion/remplacement et SQLite ;
- réglages → chemins de fichiers, Agenda, actions groupées et automatisations ;
- cycle Thunderbird → arrêt, mise à jour, désinstallation et réinstallation ;
- dépôt → scripts de contrôle, build reproductible et workflows GitHub Actions.

La passe finale couvre **108 fichiers source et plus de 20 000 lignes**. Elle combine inventaire, revue source-to-sink, recherche de primitives dangereuses, scan de secrets, tests de contrats, modèles JavaScript/SQLite et double construction reproductible. Elle ne remplace pas un test d’intrusion dans une session Thunderbird graphique réelle.

## Résultats de sécurité

| Niveau initial | Chemin examiné | État 3.2.4 |
|---|---|---|
| Élevé | objet/import non borné → Experiment privilégié | fermé par validation récursive, limites et schéma |
| Élevé | import → activation silencieuse de règles/Agenda/actions destructrices | fermé : import rendu inerte, mode sûr et confirmations rétablies |
| Élevé | réglage de page → chemin arbitraire de sauvegarde | fermé : chemin conservé côté privilégié, sélecteur natif uniquement |
| Moyen | désinstallation → données SQLite/préférences/récupération persistantes | fermé par fermeture attendue, purge et sentinelle de réinstallation |
| Moyen | identifiant SQL dynamique → requête construite | fermé par allowlists exactes de tables/colonnes |
| Moyen | diagnostic/export → données propres au profil | fermé par anonymisation et snapshots portables |
| Moyen | CI → dépendances téléchargées/tags d’action mobiles | fermé par stdlib et actions épinglées par SHA |
| Faible | double enregistrement, état paramètres et étoiles dupliquées | corrigé et couvert par gardes de régression |

### Résultats négatifs importants

Aucun chemin n’a été trouvé pour :

- exécuter du code depuis un objet, un message ou une sauvegarde ;
- charger une ressource distante ou exfiltrer par le réseau ;
- injecter du HTML actif dans les pages ou `about:3pane` ;
- obtenir un rôle administrateur, un jeton maître ou une permission cachée ;
- embarquer un secret, une clé privée ou un fichier d’environnement ;
- contourner le sélecteur natif pour écrire dans un chemin choisi par une page ;
- ajouter une dépendance npm ou Python à l’exécution.

Le propriétaire du profil peut naturellement modifier sa propre extension via la Boîte à outils privilégiée. Ce contrôle local total n’est pas une escalade MailPerch et ne peut pas être neutralisé par un faux mécanisme `admin` côté client.

## Correctifs appliqués

### Entrées privilégiées

- validation récursive des objets traversant les principales méthodes API ;
- rejet des cycles, objets non simples, clés dangereuses et structures trop grandes ;
- sélection groupée limitée à 500 références et clés bornées ;
- contraintes correspondantes ajoutées au schéma Experiment ;
- données fournisseurs/calendriers normalisées avant stockage.

### Imports et restaurations

Une sauvegarde importée ne peut plus réactiver silencieusement :

- les règles automatiques ;
- le suivi automatique sans réponse ;
- le passage automatique en attente ;
- la synchronisation Agenda bidirectionnelle ;
- la suppression Agenda au désépinglage ;
- les listes d’épinglage automatique ;
- les workflows automatiques d’archivage, réponse, récurrence et nettoyage ;
- la complétion Agenda automatique ;
- les suivis « sans réponse » déjà actifs dans les références importées ;
- un calendrier ou dossier de sauvegarde propre à un autre environnement.

Le mode sûr est activé après import et les liens Agenda sont retirés. Le checksum
détecte la corruption accidentelle ; il ne constitue pas une signature
d’authenticité, raison pour laquelle tout import reste traité comme non fiable.

### Fichiers et chemins

- le chemin de sauvegarde ne peut être modifié que par le sélecteur natif ;
- une page d’extension ou l’inspecteur ne peut pas injecter un chemin via
  `setConfiguration` ;
- les noms de sauvegarde sont générés et nettoyés ;
- la purge externe ne supprime que les enveloppes MailPerch dont le checksum local est vérifiable ; un simple nom de fichier ne suffit pas.

### Désinstallation

- écoute du cycle cœur Gecko plutôt qu’un événement statique Experiment non pris en charge ;
- signal précoce via AddonManager `onUninstalling`, annulation gérée par `onOperationCancelled`, puis purge attendue par l’événement cœur `uninstall` ;
- fermeture SQLite attendue avant suppression ;
- écriture de récupération interdite pendant la désinstallation ;
- suppression de la base, `-wal`, `-shm`, `-journal`, récupération et préférences ;
- suppression des sauvegardes internes et uniquement des sauvegardes MailPerch vérifiables
  dans un dossier externe ;
- sentinelle d’installation stockée dans la zone `storage.local` que Gecko efface nativement à la désinstallation : une réinstallation purge les éventuels résidus avant de charger SQLite ;
- migration prudente de la première version avec sentinelle : une mise à jour 3.2.3 → 3.2.4 conserve les données existantes, alors qu’une installation réellement nouvelle repart des valeurs recommandées.

### Confidentialité et injection

- CSP : ressources locales seulement, aucun réseau, objet, formulaire externe,
  framing ou URI `data:` ;
- absence de `eval`, `Function`, `innerHTML`, XHR, WebSocket ou `fetch` ;
- diagnostic fournisseur anonymisé ;
- exports débarrassés des chemins locaux, calendriers préférés et matrices fournisseurs propres au profil ;
- couleurs et données DOM normalisées ;
- aucun corps de message ni contenu de pièce jointe stocké.

### Chaîne de construction et CI

- les contrôles de dépôt utilisent uniquement la bibliothèque standard Python ;
- suppression des installations réseau `beautifulsoup4` et `tinycss2` pendant la CI ;
- toutes les GitHub Actions sont épinglées à un commit immuable, avec leur version lisible en commentaire ;
- les identifiants Git du checkout ne sont pas persistés dans le dépôt de travail ;
- durée de conservation des artefacts limitée et fichiers cachés exclus ;
- Dependabot surveille les actions GitHub épinglées ;
- le package ne contient aucune dépendance npm d’exécution ou de développement.

### Fiabilité liée à la sécurité

- correction de l’état `configurationReady` qui empêchait Enregistrer/Annuler ;
- verrou anti-double-enregistrement ;
- une seule étoile native conservée dans les cartes virtualisées ;
- rapports techniques historiques et journaux de CI retirés du dépôt ; les décisions durables restent dans `CHANGELOG.md`, `PROJECT_MEMORY.md` et `docs/DECISIONS.md`.

## Contrôles automatisés

- inventaire, syntaxe, liens et ressources ;
- cohérence des versions et de la mémoire Codex ;
- scan de secrets renforcé sans exemption générique « example » ;
- contrat API, CSP, permissions et limites d’entrée ;
- absence de rôle administrateur client ;
- cycle de désinstallation, sentinelle de réinstallation et valeurs recommandées ;
- modèles JavaScript, SQLite et build reproductible.

## Risques résiduels

- évolution incompatible d’une API interne Thunderbird ;
- erreur non reproductible uniquement visible dans une session graphique ;
- attaquant ayant déjà le contrôle du profil, du système ou de la Boîte à outils
  privilégiée ;
- sauvegarde exportée manuellement et conservée hors du profil.

Ces risques exigent une validation manuelle sur les versions Thunderbird ciblées
et une nouvelle revue pour toute permission ou méthode privilégiée ajoutée.
