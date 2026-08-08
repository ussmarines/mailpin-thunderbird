---
id: local-fluent-ui
title: Interface Fluent locale sans dependance runtime
category: decision
status: active
tags: [ui, dependencies, supply-chain]
created: "2026-08-08T22:19:44"
updated: "2026-08-08T22:19:44"
---

<!-- compiled_truth -->
## Décision

L'interface adopte Fluent 2 avec contrôles HTML natifs et jetons CSS locaux dans `extension/styles/tokens.css`, sans paquet npm runtime, bundler, CDN ni actif distant.

## Raison

Le build assemble directement les fichiers suivis ; le paquet évalué n'était pas importé ni livré, augmentait la chaîne de dépendances et exigeait une matrice Node incompatible.

## Conséquences

Une adoption future exige simultanément un besoin produit précis, un bundle local déterministe et auditable, l'absence d'actif distant et une compatibilité Node/Thunderbird documentée.

Sources : `docs/ARCHITECTURE.md`, `docs/SECURITY_BOUNDARY.md`, `PROJECT_MEMORY.md`.


## Timeline

- time: 2026-08-08T22:19:44
  kind: decision
  summary: "Created this page: Interface Fluent locale sans dependance runtime"
  source: MailPerch canonical documentation
  affects: [local-fluent-ui]

- time: 2026-08-08T22:19:44
  kind: decision
  summary: Seeded targeted durable MailPerch decision
  source: MailPerch canonical documentation
  affects: [local-fluent-ui]
