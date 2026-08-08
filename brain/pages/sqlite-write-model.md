---
id: sqlite-write-model
title: Ecritures SQLite incrementales et serializees
category: decision
status: active
tags: [storage, sqlite, data-integrity]
created: "2026-08-08T22:20:04"
updated: "2026-08-08T22:20:04"
---

<!-- compiled_truth -->
## Décision

Les écritures SQLite restent incrémentales, transactionnelles et sérialisées.

## Raison

Le profil conserve des données locales évolutives ; la concurrence et les mises à jour partielles ne doivent pas corrompre l'état ni imposer une réécriture globale.

## Conséquences

Toute modification du stockage préserve ce modèle et est traitée comme une surface à haut risque, avec tests ciblés et validation proportionnée.

Sources : `AGENTS.md`, `PROJECT_MEMORY.md`, `docs/PROJECT_STATE.json`.


## Timeline

- time: 2026-08-08T22:20:04
  kind: decision
  summary: "Created this page: Ecritures SQLite incrementales et serializees"
  source: MailPerch canonical documentation
  affects: [sqlite-write-model]

- time: 2026-08-08T22:20:04
  kind: decision
  summary: Seeded targeted durable MailPerch decision
  source: MailPerch canonical documentation
  affects: [sqlite-write-model]
