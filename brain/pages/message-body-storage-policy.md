---
id: message-body-storage-policy
title: Interdiction de stocker les corps de messages
category: decision
status: active
tags: [privacy, storage, security]
created: "2026-08-08T22:20:04"
updated: "2026-08-08T22:20:04"
---

<!-- compiled_truth -->
## Décision

MailPerch ne stocke jamais le corps des messages ni le contenu des pièces jointes.

## Raison

Le produit conserve uniquement les données nécessaires à ses épingles et suivis locaux, sans dupliquer des contenus de messagerie sensibles.

## Conséquences

Toute fonctionnalité nouvelle conserve cette frontière, y compris les imports, diagnostics, règles et données Agenda.

Sources : `AGENTS.md`, `PROJECT_MEMORY.md`.


## Timeline

- time: 2026-08-08T22:20:04
  kind: decision
  summary: "Created this page: Interdiction de stocker les corps de messages"
  source: MailPerch canonical documentation
  affects: [message-body-storage-policy]

- time: 2026-08-08T22:20:04
  kind: decision
  summary: Seeded targeted durable MailPerch decision
  source: MailPerch canonical documentation
  affects: [message-body-storage-policy]
