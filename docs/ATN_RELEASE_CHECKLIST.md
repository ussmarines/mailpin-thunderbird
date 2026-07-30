# Checklist de publication Add-ons for Thunderbird

## Identité

- [ ] nom définitif validé, sans risque de marque ;
- [ ] identifiant définitif sur un domaine durable ou format ATN ;
- [ ] auteur, support, dépôt et page de confidentialité ;
- [ ] icônes finales aux tailles nécessaires.

## Compatibilité

- [ ] versions min/max réellement testées ;
- [ ] ESR et branche mensuelle ciblées ;
- [ ] IMAP, POP, Gmail, boîte unifiée, dossiers virtuels ;
- [ ] Windows, Linux et macOS selon la cible.

## Review

- [ ] code lisible non obfusqué ;
- [ ] instructions de build reproductible ;
- [ ] source complète sans profil ni secret ;
- [ ] notes de test détaillées pour les reviewers ;
- [ ] justification de chaque usage de l’Experiment ;
- [ ] inventaire des bibliothèques tierces, même vide.

## Confidentialité et sécurité

- [ ] politique de confidentialité à jour ;
- [ ] description exacte des données locales ;
- [ ] scan de secrets ;
- [ ] aucune connexion réseau inattendue ;
- [ ] audit des actions destructives et migrations ;
- [ ] sauvegarde/restauration testées.

## Livrables

- [ ] `npm run ci` réussi ;
- [ ] XPI testé depuis un profil propre ;
- [ ] mise à niveau testée depuis la dernière version ;
- [ ] `SHA256SUMS.txt` généré ;
- [ ] CHANGELOG et version synchronisés.
