# Historique de la sécurité

## 2026-08-08 — Isolation de la frontière Thunderbird et banc runtime

- déplacement des appels Messages, Tags et Agenda extraits vers des adaptateurs injectables dédiés derrière `PinCompatibility` ;
- ajout d’une garde empêchant la logique orchestratrice de réintroduire les accès directs déjà isolés ;
- conservation de l’atomicité des collisions de tags, des ACL Agenda, des bornes de résolution et du nettoyage des listeners/observateurs ;
- ajout de tests de contrat avec faux services, sans nouvelle surface dans le XPI ;
- ajout d’un smoke de test sur binaire Thunderbird/geckodriver téléchargés et vérifiés par SHA-256 dans GitHub Actions ;
- aucune nouvelle permission WebExtension, dépendance runtime, migration de stockage, connexion réseau du produit ou donnée persistante.

## 2026-08-07 — Correctif CodeQL des noms d’hôte fournisseurs

- correction des deux alertes High `js/incomplete-url-substring-sanitization` détectées dans `extension/api/pinInbox/modules/providers.js` ;
- suppression des tests `host.includes("live.com")` et `host.includes("me.com")`, ainsi que des autres détections de fournisseur par sous-chaîne arbitraire ;
- remplacement par une liste fermée de domaines reconnus avec correspondance exacte ou sous-domaine à frontière `.` ;
- ajout de tests de non-régression pour les domaines trompeurs et conservation des hôtes légitimes Gmail, Microsoft 365, Yahoo et iCloud ;
- aucune permission, dépendance, connexion réseau, donnée persistante ou surface privilégiée supplémentaire.

## 2026-08-04 — Suite manuelle indépendante

- conversion des scans secrets en déclenchement manuel pour préserver les minutes GitHub Actions ;
- ajout de Gitleaks 8.30.1, Opengrep 1.22.0 et Trivy 0.70.0 avec téléchargements vérifiés ;
- ajout de zizmor 1.26.1 exécuté avec `--offline` ; la version 1.27.0 affectée par une fuite possible de credentials dans les logs est exclue ;
- analyse de l’identité privée dans l’arbre courant, les métadonnées et les blobs de l’historique Git sans révéler les valeurs ;
- génération de rapports JSON expurgés accessibles aux futurs travaux ChatGPT et Codex ;
- ajout d’un installateur Windows partagé et d’un lanceur local ;
- conservation des rapports GitHub pendant 30 jours et exclusion des rapports locaux de Git.

Aucune fonctionnalité produit, donnée utilisateur, version, balise, release ou valeur de l’identifiant canonique `ussmarines.mailpin@addons.thunderbird.net` n’est modifiée par cette intégration.
