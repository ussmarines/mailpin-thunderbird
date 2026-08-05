# Audit de sécurité classique MailPerch 1.1.1

Date : 5 août 2026
Méthode : lecture directe, recherches ciblées, tests du dépôt, validation du
manifeste, Gitleaks, OpenGrep/Semgrep-compatible, Trivy, Zizmor, SBOM et inspection
des archives. Aucun service d’analyse de sécurité Codex n’a été utilisé.

## Frontières examinées

- pages WebExtension, background et messages vers l’Experiment ;
- schéma `pinInbox`, listes d’actions et normalisation des objets clonables ;
- DOM interne de `about:3pane`, métadonnées de courrier et URLs ;
- imports, restauration, fichiers choisis, sauvegardes et purge ;
- SQLite, migrations, transactions, sérialisation et récupération ;
- règles automatiques, Agenda, actions groupées et désinstallation ;
- manifeste, CSP, réseau, dépendances, workflows et packaging.

## Invariants vérifiés

- permission WebExtension publique limitée à `menus` ;
- CSP locale avec `connect-src 'none'`, sans télémétrie, CDN ni code distant ;
- absence de `eval`, `new Function`, `innerHTML`, `outerHTML` et HTML construit à
  partir de métadonnées de courrier ;
- entrées privilégiées bornées, normalisées et filtrées contre les clés
  dangereuses ;
- requêtes SQLite paramétrées, écritures incrémentales, transactionnelles et
  sérialisées ;
- aucun corps de message ni contenu de pièce jointe persisté ;
- nettoyage des écouteurs, timers, styles, menus et nœuds injectés ;
- confirmation des opérations destructives et liste fermée d’actions ;
- aucune dépendance npm/Python embarquée et actions GitHub épinglées à des SHA.

## Corrections de sécurité

1. **Identité de conversation forte.** Un objet normalisé n’est plus une preuve de
   conversation. Les fusions exigent un identifiant Thunderbird/Gmail fort ; la
   clé locale de repli inclut dossier, clé, date, taille et objet, sans rendre ce
   repli admissible à une fusion automatique.
2. **Diagnostics et journaux expurgés.** Les chemins absolus, URL avec credentials,
   adresses, clés API synthétiques, JWT et détails libres d’exception sont retirés.
   Les journaux privilégiés ne conservent que le nom sûr de l’erreur.
3. **Packaging fermé.** Le build reviewer n’accepte plus une liste locale de
   fichiers additionnels non suivis ; l’archive repose sur l’inventaire Git.
4. **Supply chain.** Gitleaks conserve l’ensemble de ses règles par défaut ; son
   unique faux positif historique exige simultanément la règle, le chemin et la
   ligne de déclaration exacte, sans allowlist de fichier. Les règles OpenGrep
   sont valides, Zizmor est téléchargé avec une empreinte officielle vérifiée,
   Dependabot dispose d’un délai explicite et le workflow release ne modifie plus
   les branches.
5. **Confidentialité du dépôt.** Le garde détecte les identifiants interdits par
   empreinte sans conserver leur valeur en clair dans le code ou les journaux.
6. **Localisation de la frontière privilégiée.** Les textes visibles de
   `about:3pane`, de son menu natif, de l’éditeur, des rappels et des raisons
   Agenda passent par un catalogue FR/EN fermé. Les notifications n’exposent plus
   de titre français dans un Thunderbird anglais.

## Secrets et faux positifs

Les scans classiques de la branche, des archives et des releases existantes n’ont
identifié aucun secret réel. Un marqueur de clé privée présent dans le code du
scanner constituait un faux positif reproductible ; le littéral courant a été
séparé. Pour l’historique, l’exception conjonctive ne vise que la déclaration
exacte des marqueurs dans le fichier du garde et ne masque aucune autre ligne.

Les fichiers de credentials et configurations privées ne sont ni ouverts ni
recopiés dans les rapports. Toute détection future d’un secret réel bloque la
release et impose sa révocation hors dépôt.

Le profil classique rapide en mode strict passe les six contrôles : identité de
l’arbre courant, Gitleaks, OpenGrep, Trivy, SBOM CycloneDX et Zizmor. Le profil
complet passe les cinq contrôles de sécurité et de supply chain ; son seul échec
attendu est le garde de confidentialité historique, qui retrouve 189 occurrences
dans l’historique Git et aucune dans l’arbre courant. Les rapports sont expurgés et
confirment qu’aucune valeur correspondante n’est incluse. Le profil complet strict
doit être rejoué après la réécriture ciblée.

## Paramètres GitHub

Le dépôt supprime automatiquement les branches fusionnées, limite les Actions aux
actions GitHub autorisées, exige l’épinglage SHA, conserve les permissions de
workflow en lecture et active les alertes de vulnérabilités. La plateforme a refusé
Secret Scanning, Push Protection et la configuration CodeQL par défaut pour ce
dépôt privé ; ces indisponibilités ne sont pas présentées comme activées.

La protection de `main` est configurée seulement après la réécriture de
confidentialité afin de ne jamais contourner une règle existante. Si le plan GitHub
la refuse, les étapes manuelles et l’erreur exacte seront consignées.

## Risques résiduels

- l’API Experiment dépend d’API internes Thunderbird et nécessite une validation
  réelle à chaque plage de versions ;
- le propriétaire du profil ou Browser Toolbox contrôle déjà le processus local ;
- les fournisseurs IMAP/POP/Gmail/Microsoft, dossiers virtuels et Agenda ne peuvent
  être prouvés par les seuls modèles ;
- la réécriture Git retire les données des références accessibles, mais les caches
  et anciennes URLs d’objets GitHub peuvent nécessiter l’expiration ou l’assistance
  de GitHub.

Le résultat final des commandes, artefacts et empreintes est consigné dans
`VALIDATION_REPORT_1.1.1.md` après leur exécution depuis un état propre.
