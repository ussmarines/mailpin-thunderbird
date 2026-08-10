# Checklist de publication Add-ons for Thunderbird — 1.5.2

Les cases cochées sont vérifiées automatiquement ou directement dans les sources. Les cases non cochées nécessitent une action humaine, un fournisseur externe ou l’accès au portail ATN.

## Identité et fiche

- [x] nom, sous-titres FR/EN, auteur et icônes synchronisés ;
- [x] identifiant permanent défini ;
- [x] version 1.5.2 synchronisée dans le manifeste, le package, la documentation et les livrables ;
- [x] licence et mentions de marque explicites ;
- [ ] recherche juridique finale de disponibilité de la marque ;
- [ ] support et politique de confidentialité vérifiés sur le portail avant soumission.

## Compatibilité

- [x] Manifest V3 et clés de manifeste contrôlés ;
- [x] plage déclarée Thunderbird 153.0 à 153.* ;
- [x] thèmes clair/sombre : clipping, overflow, alignement et contraste texte de base automatisés ;
- [x] test réel Thunderbird 153.0.1 ESR frais sur l’arbre 1.5.2 ;
- [x] matrice fonctionnelle/charge 50/100/500/1000/2000 sur Thunderbird 153.0.1 ESR ;
- [ ] matrice Windows/Linux/macOS Thunderbird réelle complète ;
- [ ] Gmail/Microsoft/IMAP et calendriers réseau réels.

## Review et build

- [x] code lisible, non minifié, non transpilé et non obfusqué ;
- [x] instructions de build reproductible ;
- [x] archive source complète sans profil ni secret ;
- [x] inventaire des bibliothèques tierces : aucune ;
- [x] actions GitHub épinglées par SHA ;
- [ ] téléversement du XPI et de l’archive source sur ATN.

## Confidentialité et sécurité

- [x] données locales, permissions minimales (`menus`), CSP sans réseau et scans standards contrôlés ;
- [x] aucune permission, dépendance runtime, télémétrie ou code distant ajouté en 1.5.2 ;
- [x] audit sécurité exhaustif 1.5.1 réutilisé pour les frontières inchangées ; delta 1.5.2 documenté séparément ;
- [ ] validation avec fournisseurs mail/calendrier externes réels ;
- [ ] validation visuelle humaine à zoom 200 %, contraste OS élevé et lecteurs d’écran.

## Validation 1.5.2 spécifique

- [x] Dashboard et Options exercés dans les vrais onglets Thunderbird ;
- [x] éditeur de carte exercé via commande XUL native ;
- [x] persistance A+C sur le même profil entre deux processus et réveil MV3 naturel ;
- [x] géométrie/contraste clair et sombre contrôlés automatiquement ;
- [x] substitutions paramétrées du Dashboard corrigées et gardées ;
- [x] `npm run ci`, smoke réel et banc 50–2000 exécutés sur la version cible.

## Livrables

- [x] XPI 1.5.2 et archive source produits par le build de validation ;
- [x] SHA-256 générés par le build ;
- [x] CHANGELOG et déclarations de version préparés ;
- [ ] publication GitHub v1.5.2 ;
- [ ] soumission et validation par les reviewers ATN.
