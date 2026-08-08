---
slug: flow
title: Key flows
role: key flows
updated: "2026-08-08T22:18:19"
---

# Key flows

## Flux à préserver

```mermaid
flowchart LR
  UI[UI MailPerch] --> Business[Modules métier]
  Business --> Compatibility[PinCompatibility]
  Compatibility --> Thunderbird[API internes Thunderbird]
```

Les valeurs du mode Recommandé restent un brouillon jusqu'à l'enregistrement explicite : [[recommended-mode-explicit-save]].
