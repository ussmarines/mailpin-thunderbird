# Banc de test Thunderbird

## But

MailPerch possède plusieurs niveaux de tests. Aucun niveau ne doit être présenté comme une preuve qu’un autre niveau a réussi.

```text
Tests statiques / modèles
          │
          ▼
Contrats de compatibilité avec faux services
          │
          ▼
Smoke runtime sur binaire Thunderbird officiel
          │
          ▼
Tests comm-central xpcshell / Mochitest
          │
          ▼
Validation manuelle avec profils et fournisseurs réels
```

Le smoke runtime ajouté dans cette branche vise un contrôle rapide de l’intégration réelle. Il ne remplace ni la matrice manuelle, ni les suites de tests internes de Thunderbird.

## 1. Tests locaux du dépôt

```bash
npm run check
npm test
npm run build
npm run ci
```

Les contrats spécifiques de la nouvelle frontière sont :

```bash
python tests/test_thunderbird_compatibility_boundary.py
node tests/thunderbird_compatibility_contract.mjs
python tests/test_thunderbird_test_bench.py
```

Ils ne nécessitent pas Thunderbird.

## 2. Smoke runtime GitHub Actions

Workflow : `.github/workflows/thunderbird-smoke.yml`

Script : `tests/thunderbird/real_smoke.py`

Le workflow est volontairement séparé de la QA obligatoire pendant sa phase d’épreuve. Il peut être lancé manuellement et s’exécute sur les PR lorsque les surfaces runtime concernées changent.

Thunderbird documente officiellement `mach`/xpcshell/Mochitest pour ses propres tests. En revanche, la documentation geckodriver est centrée sur Gecko/Firefox et ne garantit pas explicitement ce scénario Thunderbird ; le smoke externe reste donc un contrôle d’intégration complémentaire. En cas d’incompatibilité structurelle future, on conserve les contrats et on utilise la voie officielle comm-central plutôt que de masquer l’échec.

### Chaîne de confiance

Le job :

1. construit l’XPI depuis le checkout ;
2. télécharge Thunderbird `153.0.1esr` depuis l’archive officielle Mozilla ;
3. vérifie l’archive avec le `SHA256SUMS` officiel Mozilla ;
4. télécharge geckodriver `0.37.1` depuis la release Mozilla officielle ;
5. vérifie le SHA-256 de l’asset fourni par GitHub ;
6. lance Thunderbird sous Xvfb dans un profil WebDriver jetable ;
7. crée uniquement dans ce profil un compte **Local Folders** et un dossier synthétique `MailPerch Smoke`, sans compte réseau ni identifiant utilisateur ;
8. sélectionne ce dossier dans `about:3pane` et attend la vue native (`threadTree`, `gViewWrapper`, Quick Filter) ;
9. installe temporairement le XPI par l’extension WebDriver Mozilla ;
10. passe au contexte privilégié et contrôle l’état runtime, le background MV3 et les injections ;
11. désinstalle puis contrôle le nettoyage ;
12. réinstalle et contrôle une nouvelle injection propre ;
13. conserve logs, résultat JSON et captures comme artefacts ;
14. clique le bouton Dashboard injecté et exige l’ouverture d’un unique onglet Dashboard, sans erreur runtime.

Aucun de ces téléchargements n’est une dépendance d’exécution de MailPerch. Ils existent uniquement dans l’environnement de test.

### Ce que le smoke valide

Lorsque le job réussit réellement, il démontre au minimum sur la version épinglée :

- lancement du binaire Thunderbird ;
- création d’une vue courrier locale synthétique sans réseau ;
- chargement du XPI et ID exact `pin-mails@MailPerch.local` ;
- extension active et background MV3 arrivé à `Startup: Complete` ;
- présence d’un `about:3pane` prêt ;
- une seule injection `#pin-mails-panel` ;
- une seule injection `#pin-mails-qfb-toggle` ;
- retrait des injections après désinstallation ;
- réinstallation propre sans duplication ;
- activation du bouton Dashboard du panneau et ouverture unique du Dashboard.

### Ce qu’il ne valide pas

Il ne prouve pas à lui seul :

- la totalité de la plage Thunderbird 128–153 ;
- Windows ou macOS ;
- IMAP/POP/Gmail/Microsoft réels ;
- les dossiers virtuels réels ;
- Agenda CalDAV/Google/etc. ;
- les réponses réellement reçues/envoyées ;
- le rendu au zoom 200 % ;
- les performances avec des milliers de messages ;
- l’accessibilité avec NVDA/Orca.

Ces points restent dans `docs/MANUAL_TEST_PLAN.md`.

## 3. Banc fonctionnel et montée en charge

Workflow manuel dédié : `.github/workflows/thunderbird-functional-bench.yml`

Script : `tests/thunderbird/functional_bench.py`

Ce banc reste volontairement hors du smoke PR. Il construit l’XPI inchangé, crée dans chaque profil WebDriver jetable des messages et métadonnées locales variés, puis laisse le démarrage normal de MailPerch migrer ces données vers son stockage structuré. Aucun compte utilisateur, credential ou serveur mail n’est utilisé ; Thunderbird est forcé hors ligne et les éventuels comptes POP supplémentaires pointent vers le domaine réservé `.invalid` sans relever le courrier.

La matrice fixe couvre `50`, `100`, `500`, `1000` et `2000` épingles. Le scénario fonctionnel du Panneau et l’ouverture réelle du Dashboard s’exécutent sur le plus petit volume ; chaque volume contrôle le compte final, la recherche complète, les portées, le rendu, et, à partir de 500, le chargement de toute la pagination avec absence de doublons et actions sur le premier, le milieu et le dernier élément. `artifacts/thunderbird-bench/results.json` conserve les durées de création, rendu/interactions du panneau, recherche, filtre et ouverture du Dashboard, ainsi que les exceptions, timeouts et comptes observés. Les captures `thunderbird-light.png` et `thunderbird-dark.png` restent des preuves à inspecter humainement pour le contraste et le clipping.

Après publication de la branche, lancer **Thunderbird functional and scale bench** depuis `workflow_dispatch`. Avec des binaires locaux compatibles, la commande équivalente est :

```bash
python tests/thunderbird/functional_bench.py \
  --binary /chemin/vers/thunderbird \
  --xpi dist/MailPerch_v1.4.0.xpi \
  --geckodriver /chemin/vers/geckodriver \
  --output-dir artifacts/thunderbird-bench \
  --volumes 50,100,500,1000,2000 \
  --timeout 180
```

Les onglets internes Dashboard et Options de Thunderbird ne sont pas exposés comme handles de contenu Marionette : le banc externe prouve leur ouverture, pas leurs scénarios DOM internes, qui restent couverts séparément par les tests de page et la validation manuelle. De même, Thunderbird ignore les commandes synthétiques non fiables des `menuitem` XUL ; les mutations via l’éditeur de carte restent manuelles. Les intégrations Agenda distantes, la réception POP/IMAP réelle et l’inspection visuelle automatisée ne sont pas simulées. Un calendrier local n’est utilisé que si Thunderbird en expose déjà un compatible et inscriptible.

La validation ciblée `--scope-validation-only` reste séparée de la matrice 50–2000. Pour chacun des cas vide, A, B, A+C et A+B+C, elle crée trois comptes synthétiques dont les identifiants canoniques Thunderbird sont `account1`, `account2`, `account3` (`account.key`) et dont les serveurs natifs distincts sont `server1`, `server2`, `server3` (`incomingServer.key`). Les épingles, `selectedAccountKeys` et le filtre utilisent uniquement les `account.key`. Dès la première session, le banc vérifie le compte rendu, des épingles représentatives de chaque compte inclus, l’absence explicite des comptes exclus et l’absence de doublons. Il persiste ensuite `panelScope` et `selectedAccountKeys` dans la préférence production, ferme la première session, puis démarre un nouveau processus Thunderbird avec exactement le même chemin `-profile`. Avant de réinstaller temporairement le même XPI, il exige que comptes, dossiers, messages, préférence, sentinelle d’installation et lignes SQLite soient encore présents. Il n’utilise ni le DOM de l’onglet Options, non exposé comme contexte WebDriver fiable, ni `addon.userDisabled`, non fiable pour une extension temporaire.

Limite observée le 9 août 2026 avec Thunderbird 153.0.2 sous Windows et geckodriver 0.37.1 : le second processus a bien rouvert le chemin de profil exact, retrouvé les comptes synthétiques et rouvert leur dossier actif, mais le stockage structuré SQLite n’était plus disponible avant la réinstallation du XPI temporaire. Le scénario s’arrête donc explicitement avant toute assertion de portée et classe la preuve automatisée comme limitée par le harness. Il ne copie aucun fichier interne et ne modifie pas le cycle de vie production pour contourner cette suppression ; la clôture complète doit passer par une installation non temporaire dans le profil Thunderbird de test ou par la validation manuelle ciblée.

Pour préparer cette validation manuelle sans automatiser l’onglet Options, utiliser `--prepare-manual-scope-validation`. Le mode crée un profil jetable hors ligne, avec deux dossiers par compte et exactement A = `account1` = 18 épingles, B = `account2` = 16, C = `account3` = 16 (total 50) ; les noms visibles restent A = `server1`, B = `server2`, C = `server3`, et le premier dossier contient 9 épingles. `selectedAccountKeys` est vide dans ce nouveau profil. Il installe l’XPI temporaire, laisse Thunderbird ouvert, affiche le chemin du profil et la checklist dans le terminal, puis conserve le profil après fermeture de Thunderbird. Le chemin imprimé peut être supprimé uniquement après validation terminée et Thunderbird fermé.

```bash
python tests/thunderbird/functional_bench.py \
  --binary /chemin/vers/thunderbird \
  --xpi dist/MailPerch_v1.4.0.xpi \
  --geckodriver /chemin/vers/geckodriver \
  --output-dir artifacts/thunderbird-manual-scope \
  --prepare-manual-scope-validation \
  --timeout 180
```

```bash
python tests/thunderbird/functional_bench.py \
  --binary /chemin/vers/thunderbird \
  --xpi dist/MailPerch_v1.4.0.xpi \
  --geckodriver /chemin/vers/geckodriver \
  --output-dir artifacts/thunderbird-multi-account \
  --scope-validation-only \
  --timeout 180
```

## 4. Tests officiels dans un checkout Thunderbird

Thunderbird documente l’exécution de tests d’extensions dans un checkout `comm-central` construit. Deux familles sont particulièrement adaptées à MailPerch :

```bash
./mach xpcshell-test comm/mail/components/extensions/test/xpcshell
./mach mochitest mail/components/extensions/test/browser
```

Sur Windows, utiliser la forme `./mach` ou la commande recommandée par l’environnement Mozilla Developer Shell du checkout.

Cette voie est la plus adaptée pour tester des interfaces internes et des helpers Thunderbird au plus près du code source, mais elle exige un checkout/build Thunderbird complet ; ce n’est donc pas un prérequis pour développer MailPerch au quotidien.

Références officielles :

- Thunderbird Developer Docs — Running Tests : https://developer.thunderbird.net/thunderbird-development/testing/running-tests
- Thunderbird Developer Docs — Adding Tests : https://developer.thunderbird.net/thunderbird-development/testing/adding-tests
- Thunderbird Developer Docs — Experiments : https://developer.thunderbird.net/add-ons/mailextensions/experiments
- Mozilla geckodriver : https://github.com/mozilla/geckodriver

## 5. Exécution manuelle du smoke

Après avoir construit l’XPI et installé un binaire Thunderbird + geckodriver compatibles :

Sous Windows x64, l’installation utilisateur validée est `C:\Users\ussma\AppData\Local\Programs\geckodriver\0.37.1`; son dossier doit être présent dans le `PATH` utilisateur. Diagnostiquer avec `Get-Command geckodriver` puis `geckodriver --version`. Depuis geckodriver 0.37.1, les sessions pilotant l’interface privilégiée nécessitent `--allow-system-access`; `tests/thunderbird/real_smoke.py` le fournit déjà au service du driver.

```bash
python tests/thunderbird/real_smoke.py \
  --binary /chemin/vers/thunderbird \
  --xpi dist/MailPerch_v1.4.0.xpi \
  --geckodriver /chemin/vers/geckodriver \
  --output-dir artifacts/thunderbird-smoke \
  --timeout 45
```

Sur Linux sans écran, lancer la même commande sous `xvfb-run -a`.

Le script utilise uniquement la bibliothèque standard Python ; Selenium n’est pas requis.

## 6. Interprétation d’un échec

Un échec du smoke doit être classé avant correction :

- **download/checksum** : chaîne de test ou archive distante ;
- **session WebDriver** : compatibilité geckodriver/Thunderbird ;
- **préparation vue locale** : profil synthétique ou évolution `about:3pane` ;
- **installation XPI / Startup** : manifeste, background ou Experiment ;
- **panneau absent/dupliqué** : intégration MailPerch ;
- **cleanup** : cycle de vie/désinstallation ;
- **timeout** : conserver `result.json`, état MV3, logs et captures avant toute hypothèse.

Ne jamais assouplir une assertion pour rendre le job vert sans expliquer la cause. Si geckodriver cesse de permettre ce type de contrôle, le banc doit échouer clairement et la voie `mach` doit devenir la preuve runtime principale.

## État de preuve de la branche

Le 9 août 2026, la PR #24 a repassé avec succès le workflow sur le binaire officiel **Thunderbird 153.0.1 ESR** sous Linux avec geckodriver 0.37.1. Le cycle a confirmé vue locale prête, XPI actif, background `Startup: Complete`, injection unique, ouverture unique du Dashboard, nettoyage après désinstallation puis réinstallation propre.

La passe fonctionnelle Windows du 9 août 2026 sur Thunderbird 153.0.2/geckodriver 0.37.1 a validé les volumes 50/100/500/1000/2000 et la sélection multi-comptes dans la première session. La sauvegarde Options → panneau et les icônes clair/sombre ont ensuite été confirmées manuellement. La persistance automatisée entre processus avec une extension temporaire reste la limite du harness décrite plus haut.

Ces preuves ne remplacent pas les tests utilisateur avec fournisseurs réels ni la matrice multi-versions/multi-OS.
