---
name: mailpin-project-knowledge
description: Project knowledge for the MailPin Thunderbird extension. Use when a task requires current context about MailPin architecture, the privileged Experiment and Thunderbird compatibility layer, pin and workflow features, local data model, Options/dashboard/panel UI, Fluent 2 branding, security boundaries, testing evidence, or release constraints. Do not use for generic Git work, isolated edits fully explained by the touched files, or procedures governed by AGENTS.md, MAILPERCH_AI_RULES.md, Superpowers, or another dedicated skill.
---

# MailPin Project Knowledge

Use this skill to locate current product and architecture facts. It does not replace the repository's governance or live implementation.

## Authority

Apply this order when sources disagree:

1. Current user instruction and observed Git/GitHub state.
2. Current code, manifest, tests, schemas, and `docs/PROJECT_STATE.json`.
3. `MAILPERCH_AI_RULES.md`, `AGENTS.md`, and canonical specialized documents for their authoritative rules.
4. `PROJECT_MEMORY.md` and current architecture/functional documentation.
5. Historical reports, handoffs, archived audits, and changelogs only when history is explicitly needed.

The first three layers remain authoritative; never restate their agent instructions as secondary knowledge. Superpowers supplies optional method, not MailPin facts.

## Load only what is needed

- System boundaries and module ownership: [architecture.md](chapters/architecture.md)
- Thunderbird Messages/Tags/Agenda adapters and lifecycle: [thunderbird-integration.md](chapters/thunderbird-integration.md)
- Pins, workflows, local storage and feature model: [data-model-and-features.md](chapters/data-model-and-features.md)
- Panel, Options, dashboard, accessibility and visual identity: [ui-ux-and-branding.md](chapters/ui-ux-and-branding.md)
- Privileged trust boundary, privacy and cleanup: [security-model.md](chapters/security-model.md)
- Evidence levels, known limits and release knowledge: [testing-and-release.md](chapters/testing-and-release.md)
- Terms: [glossary.md](glossary.md)
- Reusable architecture patterns: [patterns.md](patterns.md)
- Fast routing and decision rules: [cheatsheet.md](cheatsheet.md)

Read one chapter first and add another only for a cross-boundary task. Before changing or quoting an exact version, limit, schema or file path, verify the cited source in the current checkout.

## Maintenance

Fold a changed source into only the affected chapter. Do not regenerate the full skill for an unrelated code change. Remove stale branch or validation claims rather than presenting them as current. Keep archived 3.x audits and old handoffs out of current guidance unless a historical question requires them.
