---
id: extension-identity
title: Identite technique canonique de l extension
category: decision
status: active
tags: [identity, release, compatibility]
created: "2026-08-08T22:20:04"
updated: "2026-08-08T22:20:04"
---

<!-- compiled_truth -->
## Décision

L'identifiant technique, sensible à la casse, est `pin-mails@MailPerch.local`.

## Raison

Il a été fixé avant publication afin de séparer l'identité produit MailPerch des anciennes builds locales et de stabiliser les installations futures.

## Conséquences

Toute modification future est une migration coordonnée : manifeste, métadonnées de publication, état projet, documentation et tests listés par la procédure canonique doivent évoluer ensemble.

Source canonique : `docs/IDENTITY_MIGRATION_REQUIRED.md` ; corroboré par `extension/manifest.json` et `docs/PROJECT_STATE.json`.


## Timeline

- time: 2026-08-08T22:20:04
  kind: decision
  summary: "Created this page: Identite technique canonique de l extension"
  source: MailPerch canonical documentation
  affects: [extension-identity]

- time: 2026-08-08T22:20:04
  kind: decision
  summary: Seeded targeted durable MailPerch decision
  source: MailPerch canonical documentation
  affects: [extension-identity]
