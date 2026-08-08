---
id: thunderbird-personal-tags-ownership
title: Propriete des tags Thunderbird personnels
category: decision
status: active
tags: [thunderbird, tags, data-integrity]
created: "2026-08-08T22:19:44"
updated: "2026-08-08T22:19:44"
---

<!-- compiled_truth -->
## Décision

MailPerch vérifie les collisions avant toute création de tag et ne renomme, n'adopte ni ne supprime jamais un tag personnel. À la désactivation, il retire seulement les mots-clés et définitions dont sa propriété est démontrée.

## Raison

Les tags Thunderbird appartiennent au profil de l'utilisateur ; une synchronisation optionnelle ne doit pas les détourner ni les détruire.

## Conséquences

Les opérations restent dans l'adaptateur Tags, groupées par dossier ; une collision désactive localement la fonction concernée plutôt que de modifier l'existant.

Sources : `docs/THUNDERBIRD_COMPATIBILITY.md`, `docs/SECURITY_BOUNDARY.md`.


## Timeline

- time: 2026-08-08T22:19:44
  kind: decision
  summary: "Created this page: Propriete des tags Thunderbird personnels"
  source: MailPerch canonical documentation
  affects: [thunderbird-personal-tags-ownership]

- time: 2026-08-08T22:19:44
  kind: decision
  summary: Seeded targeted durable MailPerch decision
  source: MailPerch canonical documentation
  affects: [thunderbird-personal-tags-ownership]
