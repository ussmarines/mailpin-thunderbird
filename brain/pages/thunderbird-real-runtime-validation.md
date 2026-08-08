---
id: thunderbird-real-runtime-validation
title: Validation reelle Thunderbird distincte des contrats
category: decision
status: active
tags: [testing, thunderbird, runtime]
created: "2026-08-08T22:20:04"
updated: "2026-08-08T22:20:04"
---

<!-- compiled_truth -->
## Décision

Les tests statiques et de contrat ne constituent pas une preuve graphique ou de cycle de vie Thunderbird. La validation runtime requiert une observation sur un vrai binaire, et sa portée doit être déclarée précisément.

## Raison

Les API internes et le DOM `about:3pane` varient avec Thunderbird ; les faux services déterministes vérifient des contrats mais ne reproduisent pas ces conditions.

## Conséquences

Le smoke réel actuel valide Thunderbird 153.0.1 ESR Linux, profil Local Folders synthétique, injection unique, cleanup et réinstallation. Il ne prouve ni tous les fournisseurs, ni tous les OS, ni toute la plage déclarée ; la matrice reste à étendre par observations réelles.

Sources : `docs/THUNDERBIRD_COMPATIBILITY.md`, `docs/THUNDERBIRD_TEST_BENCH.md`, `docs/AI_VALIDATION_STATE.json`.


## Timeline

- time: 2026-08-08T22:20:04
  kind: decision
  summary: "Created this page: Validation reelle Thunderbird distincte des contrats"
  source: MailPerch canonical documentation
  affects: [thunderbird-real-runtime-validation]

- time: 2026-08-08T22:20:04
  kind: decision
  summary: Seeded targeted durable MailPerch decision
  source: MailPerch canonical documentation
  affects: [thunderbird-real-runtime-validation]
