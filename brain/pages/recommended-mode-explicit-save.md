---
id: recommended-mode-explicit-save
title: Mode Recommande a sauvegarde explicite
category: decision
status: active
tags: [options, ux, data-integrity]
created: "2026-08-08T22:19:44"
updated: "2026-08-08T22:19:44"
---

<!-- compiled_truth -->
## Décision

L'application des réglages Recommandés prépare uniquement un brouillon. Elle ne sauvegarde jamais automatiquement et conserve les choix propres au profil, notamment calendrier, groupe d'attente, dossier de sauvegarde, couleurs de comptes et activation des boîtes.

## Raison

Le mode aide sans écraser une configuration déjà intentionnelle ni modifier les données sans confirmation.

## Conséquences

Seul Enregistrer confirme le résultat ; Annuler restaure la configuration. Toute évolution conserve ce cycle et ses tests bidirectionnels de contrôles.

Sources : `PROJECT_MEMORY.md`, `docs/CODEX_HANDOFF.md`, `docs/PROJECT_STATE.json`.


## Timeline

- time: 2026-08-08T22:19:44
  kind: decision
  summary: "Created this page: Mode Recommande a sauvegarde explicite"
  source: MailPerch canonical documentation
  affects: [recommended-mode-explicit-save]

- time: 2026-08-08T22:19:44
  kind: decision
  summary: Seeded targeted durable MailPerch decision
  source: MailPerch canonical documentation
  affects: [recommended-mode-explicit-save]
