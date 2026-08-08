---
id: pincompatibility-boundary
title: Frontiere PinCompatibility
category: decision
status: active
tags: [thunderbird, architecture, security]
created: "2026-08-08T22:19:21"
updated: "2026-08-08T22:19:21"
---

<!-- compiled_truth -->
## Décision

Les opérations Messages, Tags et Agenda dépendantes de Thunderbird passent par `PinCompatibility` et ses adaptateurs injectables. La logique métier ne réintroduit pas d'appel direct aux services internes.

## Raison

La frontière rend les dépendances privilégiées visibles, testables avec des faux services et localisables lors d'une évolution Thunderbird. L'orchestrateur conserve provisoirement le DOM `about:3pane`, dont l'extraction conjointe serait risquée.

## Conséquences

Toute nouvelle capacité native définit le plus petit contrat d'adaptateur, ses dépendances explicites, une garde de frontière et un test de contrat ; un comportement dépendant du runtime requiert aussi une preuve Thunderbird réelle.

Sources : `docs/THUNDERBIRD_COMPATIBILITY.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY_BOUNDARY.md`.


## Timeline

- time: 2026-08-08T22:19:21
  kind: decision
  summary: "Created this page: Frontiere PinCompatibility"
  source: MailPerch canonical documentation
  affects: [pincompatibility-boundary]

- time: 2026-08-08T22:19:21
  kind: decision
  summary: Seeded targeted durable MailPerch decision
  source: MailPerch canonical documentation
  affects: [pincompatibility-boundary]
