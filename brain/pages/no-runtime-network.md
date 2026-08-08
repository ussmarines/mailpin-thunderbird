---
id: no-runtime-network
title: Aucun reseau au runtime
category: decision
status: active
tags: [security, runtime, privacy]
created: "2026-08-08T22:19:43"
updated: "2026-08-08T22:19:44"
---

<!-- compiled_truth -->
## Décision

MailPerch reste local : aucun réseau, télémétrie, publicité, code distant, CDN ni dépendance runtime chargée par Thunderbird.

## Raison

Les données de messagerie et les décisions utilisateur restent dans le profil ; réduire les dépendances externes limite la surface de confidentialité et de chaîne d'approvisionnement.

## Conséquences

Une intégration distante exige une décision explicite. Les téléchargements du banc Thunderbird sont test-only, vérifiés et ne sont pas des dépendances du XPI.

Sources : `AGENTS.md`, `docs/SECURITY_BOUNDARY.md`, `docs/PROJECT_STATE.json`.


## Timeline

- time: 2026-08-08T22:19:43
  kind: decision
  summary: "Created this page: Aucun reseau au runtime"
  source: MailPerch canonical documentation
  affects: [no-runtime-network]

- time: 2026-08-08T22:19:44
  kind: decision
  summary: Seeded targeted durable MailPerch decision
  source: MailPerch canonical documentation
  affects: [no-runtime-network]
