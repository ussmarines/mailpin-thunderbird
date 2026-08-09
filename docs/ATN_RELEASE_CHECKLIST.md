# Checklist de publication Add-ons for Thunderbird — 1.4.0

Les cases cochées sont vérifiées automatiquement ou directement dans les sources. Les cases non cochées nécessitent une action humaine ou l’accès au portail ATN.

## Identité et fiche

- [x] nom, sous-titres FR/EN, auteur et icônes synchronisés ;
- [x] identifiant permanent défini avant la première publication ;
- [x] version 1.4.0 synchronisée dans le manifeste, le package, la documentation et les livrables ;
- [x] licence et mentions de marque explicites ;
- [ ] recherche juridique finale de disponibilité de la marque ;
- [ ] support et politique de confidentialité accessibles publiquement et vérifiés avant soumission.

## Compatibilité

- [x] Manifest V3 et clés de manifeste contrôlés ;
- [x] plage déclarée Thunderbird 128.0 à 153.* ;
- [x] thèmes clair/sombre et réduction de mouvement couverts par les gardes automatisées ;
- [x] test réel Thunderbird 153.* : smoke Linux 153.0.1 ESR et validations Windows 153.0.2 ;
- [ ] test réel Thunderbird 128 ESR ;
- [ ] test réel Thunderbird 140 ESR ou branche ESR actuellement ciblée ;
- [ ] matrice Windows, Linux et macOS complète ;
- [ ] IMAP, POP, Gmail, dossiers locaux, boîte unifiée et dossiers virtuels réels.

## Review et build

- [x] code lisible, non minifié, non transpilé et non obfusqué ;
- [x] instructions de build reproductible ;
- [x] archive source complète sans profil ni secret ;
- [x] notes de test et justification de l’Experiment ;
- [x] inventaire des bibliothèques tierces : aucune ;
- [x] actions GitHub épinglées par SHA ;
- [x] Dependabot configuré uniquement pour GitHub Actions, seul écosystème dépendant ;
- [ ] téléversement du XPI et de l’archive source sur ATN.

## Confidentialité et sécurité

- [x] politique de confidentialité à jour ;
- [x] données locales et suppression documentées ;
- [x] permissions minimales (`menus` uniquement) et CSP sans réseau ;
- [x] synchronisation tags sans permission supplémentaire, avec propriété stricte clé+libellé ;
- [x] checklists/vues/recherche bornées et sans corps de message ;
- [x] scan de secrets et recherche de primitives dangereuses ;
- [x] audit des imports, actions destructives, migrations et désinstallation ;
- [x] sauvegarde/restauration couverte par les tests de modèles ;
- [ ] validation manuelle de sauvegarde/restauration dans Thunderbird ;
- [ ] validation manuelle complète de l’Agenda bidirectionnel ;
- [ ] validation réelle de la synchronisation tags, y compris désactivation et conservation des tags personnels ;
- [ ] validation visuelle Options/dashboard/panneau à zoom 200 % avec texte ≥ 12 px.

## Validation 1.4.0 spécifique

- [x] portée « Comptes sélectionnés » : vide=0, A=18, B=16, A+C=34, A+B+C=50 ;
- [x] sauvegarde Options → panneau validée manuellement ;
- [x] icônes de pin vérifiées en clair et sombre ;
- [x] banc fonctionnel réel 50/100/500/1000/2000 sans timeout, exception JS ni incohérence de comptage ;
- [x] volume conseillé 2 000 affiché comme recommandation, sans limite dure.

## Livrables

- [ ] `npm run ci` final sur l’arbre 1.4.0 ;
- [ ] XPI 1.4.0 reproductible ;
- [ ] archive source reviewer 1.4.0 ;
- [ ] `SHA256SUMS.txt` 1.4.0 ;
- [x] CHANGELOG et déclarations de version préparés ;
- [ ] installation du XPI 1.4.0 depuis un profil propre ;
- [ ] test de remplacement d’une build interne 3.2.x ;
- [ ] soumission et validation par les reviewers ATN.
