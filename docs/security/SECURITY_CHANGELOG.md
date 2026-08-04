# Historique de la sécurité

## 2026-08-04 — Suite manuelle indépendante

- conversion des scans secrets en déclenchement manuel pour préserver les minutes GitHub Actions ;
- ajout de Gitleaks 8.30.1, Opengrep 1.22.0 et Trivy 0.70.0 avec téléchargements vérifiés ;
- ajout de zizmor 1.26.1 exécuté avec `--offline` ; la version 1.27.0 affectée par une fuite possible de credentials dans les logs est exclue ;
- analyse de l’identité privée dans l’arbre courant, les métadonnées et les blobs de l’historique Git sans révéler les valeurs ;
- génération de rapports JSON expurgés accessibles aux futurs travaux ChatGPT et Codex ;
- ajout d’un installateur Windows partagé et d’un lanceur local ;
- conservation des rapports GitHub pendant 30 jours et exclusion des rapports locaux de Git.

Aucune fonctionnalité produit, donnée utilisateur, version, balise, release ou valeur de l’identifiant canonique `pin-mails@MailPerch.local` n’est modifiée par cette intégration.
