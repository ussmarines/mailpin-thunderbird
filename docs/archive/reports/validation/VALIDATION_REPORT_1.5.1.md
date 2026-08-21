# Rapport de validation — MailPerch 1.5.1

> Statut : **VALIDATION TECHNIQUE PRÉ-PUBLICATION OK**. La publication reste conditionnée aux checks de PR, au squash sur `main`, au tag `v1.5.1` et au workflow Release.

## Changements validés

- correction de la portée `checklistItems` / `renderChecklist` dans l’éditeur de carte ;
- extraction des opérations Messages restantes vers `PinCompatibility.messages` ;
- propagation de `server.isSecure` et `offlineSupportLevel` dans les métadonnées de diagnostic ;
- migration Settings basée sur `PinSettings.SCHEMA_VERSION` : Settings 8, Data 7, SQLite physique 5 ;
- smoke GitHub rattaché à `main` ;
- compatibilité déclarée resserrée à Thunderbird `153.0`–`153.*` après essais réels 128/140/153 ;
- correction du banc Thunderbird qui comparait à tort le compteur total de portée au nombre de cartes filtrées par la recherche ;
- documentation, README, checklist ATN, rapports et métadonnées 1.5.1 resynchronisés.

Aucune nouvelle permission WebExtension, dépendance runtime, connexion réseau du produit, télémétrie, publicité ou code distant n’a été ajouté.

## Audits exhaustifs

Deux passes indépendantes sur l’intégralité de l’arbre suivi ont été réalisées pendant cette préparation. La passe finale sur l’arbre nettoyé a contrôlé **228 fichiers suivis deux fois**, avec **0 erreur et 0 avertissement**. Les contrats manifest/API, schémas, appels Thunderbird, ressources, assets, liens, workflows permanents, packaging et documents ont été recroisés.

Les éléments inchangés dont la dernière preuve restait valide n’ont pas été relancés après chaque commit documentaire ou suppression de workflow temporaire ; les contrôles complets ont été réservés aux jalons finaux conformément aux règles du dépôt.

## Tests réellement exécutés

### Tests ciblés des corrections

Ont notamment réussi :

- `python tests/test_calendar_and_card_actions.py` ;
- `python tests/test_thunderbird_compatibility_boundary.py` ;
- `node tests/thunderbird_compatibility_contract.mjs` ;
- `node tests/productivity_1_2_model_tests.mjs` ;
- `python tests/test_productivity_1_2_features.py` ;
- `node tests/settings_defaults.mjs` ;
- `python tests/test_thunderbird_test_bench.py` ;
- compilation Python du banc et `git diff --check` lors de la correction du harness.

### QA complète du dépôt

La QA permanente GitHub Actions a été relancée sur l’arbre nettoyé au commit `494e157d01d04d360c851583ca026439756f381b`, run **31427496745** :

- **Security guard regression** : succès ;
- **Full verification (Linux)** : succès, incluant `npm run ci`, vérification du layout XPI et génération des artefacts ;
- **Source and model checks (Windows)** : succès, incluant `npm run check && npm test`.

Une exécution de build utilisée pour la preuve runtime a produit :

- `MailPerch_v1.5.1.xpi` — SHA-256 `d5de5d4061659ffe014ac27cf888eba72cf0a98329a659dcd03ea1183ab2b327` ;
- `MailPerch_GitHub_Repository_v1.5.1.zip` — SHA-256 `ee76b7fa91eca14cd0eca4bffbc7a652e142fa37aebcd16b45cbaf0082dd5609`.

Les artefacts de release seront reconstruits sur le SHA fusionné par le workflow Release ; ces empreintes servent donc de preuve du build de branche, pas de substitution aux checksums de la release finale.

## Thunderbird réel

### Smoke 153

Le smoke réel sur Thunderbird **153.0.1 ESR** a validé le bootstrap, le background MV3, l’injection unique du panneau et du bouton Quick Filter, l’ouverture du Dashboard, le cleanup après désinstallation et la réinstallation propre.

Les essais sur 128/140 ont montré que le panneau peut s’injecter après activation, mais que le pont MV3 Experiment → background utilisé pour ouvrir le Dashboard n’y est pas fiable. Plusieurs variantes ont été testées, y compris le modèle persistant `ExtensionAPIPersistent`/`EventEmitter`. La release ne revendique donc plus ces versions : le manifeste 1.5.1 déclare Thunderbird `153.0`–`153.*`.

### Banc fonctionnel et charge 50 → 2000

La première tentative finale a révélé un défaut du **harness**, pas du produit : `.pin-mails-count` représente volontairement le total de la portée, tandis que la recherche filtre uniquement les cartes rendues. Le banc attendait à tort que ce compteur devienne le nombre de résultats filtrés.

Le harness a été corrigé sans assouplir la validation : il contrôle désormais séparément le total de portée, l’appartenance des cartes au résultat recherché, le nombre exact de cartes après pagination et l’absence de doublons.

Preuve runtime finale : GitHub Actions run **31426885156**, Thunderbird **153.0.1 ESR**, geckodriver **0.37.1**.

- cas ciblé 50 épingles : **succès** ;
- 50 : **succès** ;
- 100 : **succès** ;
- 500 : **succès** ;
- 1000 : **succès** ;
- 2000 : **succès** ;
- timeouts : **0** ;
- exceptions JavaScript : **0** ;
- pagination complète vérifiée à 500, 1000 et 2000 ;
- positions début/milieu/fin présentes ;
- à 50 épingles, l’éditeur notes/checklist/priorité/échéance/statut/suivi est exercé sans reproduire l’exception `checklistItems` ;
- cycle cleanup/réinstallation propre validé sur le scénario fonctionnel.

Artefact de preuve : ID **9077569989**, SHA-256 de l’archive d’artefact `55f0593c8c385f5336f664fd6f6fcf1c0a14d3bc992621b8fba0f732a0c82dac`.

## Limites restantes

Ces limites ne sont pas des tests rouges de la release :

- les onglets internes Dashboard/Options ne sont pas exposés comme handles de contenu Marionette ; leur ouverture réelle est observée, leurs scénarios DOM restent couverts séparément ;
- les commandes synthétiques non fiables de `menuitem` XUL ne remplacent pas toutes les interactions manuelles ;
- les fournisseurs mail et calendriers réseau réels ne sont pas simulés par le banc hors ligne ;
- la persistance automatisée multi-processus avec une extension installée temporairement reste limitée par le cycle de vie du profil de test ;
- les captures clair/sombre restent une preuve visuelle à inspecter humainement pour contraste/clipping ;
- aucune compatibilité n’est revendiquée en dehors de Thunderbird `153.0`–`153.*`.

Aucun de ces points n’annule les validations automatiques et runtime réellement obtenues pour le périmètre déclaré de 1.5.1.
