# Audit de sécurité — MailPin 1.7.0 (source)

## État

Audit global de la ligne source 1.7.0. Dernière release publique : 1.6.1. Ce document décrit la source en cours de validation et ne constitue pas une publication.

## Périmètre contrôlé

- manifeste MV3, permission `menus` et CSP `connect-src 'none'` ;
- absence de réseau runtime, télémétrie, publicité, CDN et code distant ;
- API Experiment, validation/normalisation des entrées et frontières `PinCompatibility` ;
- SQLite, imports/restauration, règles, Agenda, Tags et cycle de désinstallation ;
- secrets/identité, actions GitHub épinglées, build sans dépendance tierce ;
- revue statique des helpers morts, surfaces DOM dangereuses et identifiants persistants legacy.

## Résultat de l’audit source

- `security_guard.py` : vert ;
- `scan_secrets.py` : vert ;
- `deep_audit.py` : vert après nettoyage ;
- les gardes du dépôt n’ont détecté aucun usage interdit de `eval`, `new Function`, `innerHTML`, `outerHTML` ni appel réseau runtime dans `extension/` ;
- les clés historiques `mailperch.installation`, `mailperch-*`, préférences legacy et noms de base sont conservés lorsqu’ils assurent compatibilité/migration ;
- deux helpers privilégiés devenus sans appel ont été supprimés.

## Validation sécurité standard GitHub

Le tree produit contrôlé est le HEAD propre de la PR #40 : `88ba52cd6bdb3e3c81a41e456e72042f8c84c587`. La branche éphémère `audit/security-standard-2026-08-13` part exactement de ce commit ; son seul ajout est le workflow temporaire utilisé pour exécuter les scanners.

Run GitHub Actions **31721145559** : succès en mode bloquant.

- full-history identity guard : succès ;
- Gitleaks 8.30.1 full-history avec redaction : succès ;
- Opengrep 1.22.0 avec `.security/opengrep/project-security.yml` : succès ;
- Trivy 0.70.0 sur vulnérabilités et misconfigurations MEDIUM/HIGH/CRITICAL : succès ;
- génération SBOM CycloneDX : succès ;
- Zizmor 1.26.1 offline sur les workflows GitHub Actions : succès ;
- étape d’enforcement finale : succès.

Artefact de rapports assainis : **9189352790** (`full-standard-security-31721145559`). Aucun résultat configuré n’a provoqué d’échec de l’enforcement.

Codex Security n’a pas été utilisé.

## Limites

Cette passe est un audit statique et de configuration standard du dépôt. Elle ne remplace pas une recette humaine exhaustive, un pentest externe, ni la matrice réelle de fournisseurs Gmail/Microsoft/IMAP/CalDAV.
