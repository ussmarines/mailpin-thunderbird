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

Le workflow est volontairement séparé de la QA obligatoire pendant sa phase d’épreuve. Il s’exécute sur la branche de consolidation et peut aussi être lancé manuellement.

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
13. conserve logs, résultat JSON et captures comme artefacts.

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
- réinstallation propre sans duplication.

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

## 3. Tests officiels dans un checkout Thunderbird

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

## 4. Exécution manuelle du smoke

Après avoir construit l’XPI et installé un binaire Thunderbird + geckodriver compatibles :

Sous Windows x64, l’installation utilisateur validée est `C:\Users\ussma\AppData\Local\Programs\geckodriver\0.37.1`; son dossier doit être présent dans le `PATH` utilisateur. Diagnostiquer avec `Get-Command geckodriver` puis `geckodriver --version`. Depuis geckodriver 0.37.1, les sessions pilotant l’interface privilégiée nécessitent `--allow-system-access`; `tests/thunderbird/real_smoke.py` le fournit déjà au service du driver.

```bash
python tests/thunderbird/real_smoke.py \
  --binary /chemin/vers/thunderbird \
  --xpi dist/MailPerch_v1.3.0.xpi \
  --geckodriver /chemin/vers/geckodriver \
  --output-dir artifacts/thunderbird-smoke \
  --timeout 45
```

Sur Linux sans écran, lancer la même commande sous `xvfb-run -a`.

Le script utilise uniquement la bibliothèque standard Python ; Selenium n’est pas requis.

## 5. Interprétation d’un échec

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

Le 8 août 2026, le workflow GitHub a réussi sur le binaire officiel **Thunderbird 153.0.1 ESR** sous Linux avec geckodriver 0.37.1. L’artefact a confirmé le cycle complet : vue locale prête, XPI actif, background `Startup: Complete`, une injection du panneau et du bouton, nettoyage total après désinstallation, puis réinstallation propre sans duplication.

Le banc a également détecté pendant sa mise au point un vrai crash de bootstrap introduit par la consolidation : `ReferenceError: ExtensionError is not defined`. La cause était une dépendance privilégiée devenue immédiate lors de la création des adaptateurs. Le correctif importe désormais explicitement `ExtensionError` depuis `ExtensionUtils.sys.mjs`, une garde statique protège cet invariant et le smoke réel est passé après correction.

Cette preuve couvre **le démarrage et le cycle de vie de l’intégration sur ce scénario local synthétique**. Elle ne remplace pas les tests utilisateur avec comptes/fournisseurs réels ni la matrice multi-versions/multi-OS.
