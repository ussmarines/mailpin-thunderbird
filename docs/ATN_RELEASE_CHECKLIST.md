# Checklist de publication Add-ons for Thunderbird — 1.5.4

Les cases cochées sont vérifiées automatiquement ou directement dans les sources. Les cases non cochées nécessitent une action humaine, un fournisseur externe ou l’accès au portail ATN.

## Identité et fiche

- [x] nom, sous-titres FR/EN, auteur et icônes synchronisés ;
- [x] identifiant permanent défini ;
- [x] version 1.5.4 synchronisée dans le manifeste, le package, la documentation et les livrables ;
- [x] licence et mentions de marque explicites ;
- [ ] recherche juridique finale de disponibilité de la marque ;
- [ ] support et politique de confidentialité vérifiés sur le portail avant soumission.

## Compatibilité

- [x] Manifest V3 et clés de manifeste contrôlés ;
- [x] plage déclarée Thunderbird 153.0 à 153.* ;
- [x] thèmes clair/sombre : clipping, overflow, alignement et contraste texte de base automatisés ;
- [ ] recette utilisateur fraîche des surfaces corrigées sur l’arbre produit 1.5.4 ;
- [ ] matrice fonctionnelle/charge 50/100/500/1000/2000 fraîche sur 1.5.4 (non requise pour le retest ciblé) ;
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
- [x] aucune permission, dépendance runtime, télémétrie ou code distant ajouté en 1.5.4 ;
- [x] scan standard frais du delta 1.5.4 documenté ; Codex Security non utilisé ;
- [ ] validation avec fournisseurs mail/calendrier externes réels ;
- [ ] validation visuelle humaine à zoom 200 %, contraste OS élevé et lecteurs d’écran.

## Validation 1.5.4 spécifique

- [x] création événement/tâche Agenda observée dans le vrai Dashboard Thunderbird ; attente/relance restent à retester humainement ;
- [x] réconciliation message/conversation observée dans Thunderbird réel ;
- [ ] resize continu du splitter 800–280 px observé dans Thunderbird réel ;
- [x] géométrie ciblée Options/Dashboard/panneau contrôlée sous Chromium ;
- [x] une passe `npm run ci` tentée, puis smoke réel et banc 50 ciblé réussis ; l’arrêt CI documentaire est détaillé dans le rapport.

## Livrables

- [x] XPI 1.5.4 et archive source produits par le build de validation ;
- [x] SHA-256 générés par le build ;
- [x] CHANGELOG et déclarations de version préparés ;
- [ ] publication GitHub v1.5.4 (non autorisée pendant cette passe) ;
- [ ] soumission et validation par les reviewers ATN.
