# Checklist Add-ons for Thunderbird — MailPin 1.7.12

Dernière release GitHub publique : **1.7.12**. La version source 1.7.12 est publiée sur GitHub, non soumise à ATN.

- [x] Identité publique et Manifest V3 inchangés ; permission `menus` uniquement.
- [x] version source 1.7.12 synchronisée, sans nouvelle dépendance runtime.
- [x] Contrôles QA, smoke réel Thunderbird 159.0, CodeQL et XPI/source sur cible GitHub exacte (voir `../VALIDATION_REPORT_1.7.12.md`).
- [x] XPI, archive reviewer et `SHA256SUMS.txt` présents sur la release GitHub v1.7.12 ; empreintes déclarées par GitHub contrôlées. Re-téléchargement et comparaison des octets non exécutés.
- [ ] Soumission et approbation humaine ATN (hors périmètre de la release GitHub).

Preuve Thunderbird 159 : smoke Linux sur cible publiée `968832d1f2db39a227e16c0f079d3ba06f669359` (40755718258) PASS. Les autres fournisseurs/macOS restent non vérifiés.
