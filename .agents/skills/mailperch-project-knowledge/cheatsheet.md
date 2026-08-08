# MailPerch knowledge cheatsheet

| If the task concerns...         | Read first                            | Verify in current code/state            |
| ------------------------------- | ------------------------------------- | --------------------------------------- |
| Module ownership                | `chapters/architecture.md`            | manifest and owning entrypoint          |
| Messages, Tags, Agenda          | `chapters/thunderbird-integration.md` | compatibility adapter and contract test |
| Pins, workflow, search, storage | `chapters/data-model-and-features.md` | relevant pure/storage module            |
| Panel, Options, dashboard       | `chapters/ui-ux-and-branding.md`      | real DOM/CSS and UI tests               |
| Input, privacy, uninstall       | `chapters/security-model.md`          | schema, Experiment and lifecycle code   |
| Test evidence or release        | `chapters/testing-and-release.md`     | validation state and live Git/GitHub    |

Decision rules:

- If business code needs a Thunderbird internal, add it through the narrow adapter boundary.
- If Tags or Agenda are absent, degrade locally; do not disable core MailPerch.
- If two items share only a subject, do not merge them.
- If Recommended values are applied, keep them as an unsaved draft.
- If an interface offers an operation, still revalidate it in the Experiment.
- If a claim says “works in Thunderbird,” require runtime or manual Thunderbird evidence.
- If only one source changed, fold it into one chapter; do not regenerate the skill.
- If the touched code explains an isolated task, do not load this skill.
