---
slug: architecture
title: System architecture
role: system architecture
updated: "2026-08-08T22:18:19"
---

# System architecture

## Architecture canonique

→ `docs/ARCHITECTURE.md`
→ `docs/THUNDERBIRD_COMPATIBILITY.md`

Principes durables :

- la logique métier reste séparée des API internes Thunderbird ;
- `PinCompatibility` est la frontière Messages, Tags et Agenda ;
- le DOM `about:3pane` reste dans l'orchestrateur jusqu'à une extraction progressive validée au runtime.

Décisions associées : [[pincompatibility-boundary]], [[sqlite-write-model]], [[thunderbird-personal-tags-ownership]].
