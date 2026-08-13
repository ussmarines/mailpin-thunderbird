# UI, UX, and branding

## Product surfaces

The panel sits above the native message list and is collapsible with its own bounded scrolling. It shows pinned cards, smart views, search, reminders, multi-select and health without altering native folder counters. A card click displays the message in the reading pane without scrolling the native list; double-click keeps native opening behavior.

The dashboard covers list/smart/saved views, Kanban, cases, review, history, reminders, bulk actions, associated-item proposals, provider matrix and health. Options groups settings by user need and supports search plus one global Save/Cancel dock.

## Native coexistence

- Preserve native virtual row height.
- Center star, pin and More actions in a reserved action rail.
- In independent mode, leave the Thunderbird star untouched.
- Use a native Thunderbird `menupopup`, not a manually positioned HTML overlay.
- Keep `uiPreset` scoped to Options and `density` scoped to pinned cards.

## Recommended and Advanced

The stored value `guided` is presented as Recommended; `advanced` exposes all controls. Recommended hides advanced sections without deleting settings. Applying recommended values prepares a draft, preserves profile-specific choices, and never auto-saves. Save and Cancel remain explicit.

## Visual identity and accessibility

MailPin uses the local **Organic Workspace** system: content-first hierarchy, contextual rails, progressive disclosure, container-aware responsive composition and restrained functional motion. Fluent 2 is historical inspiration only and is not the canonical visual language. There is no UI runtime, bundler, CDN, remote font or remote asset. Use system UI / Segoe UI Variable / Aptos-family local font stacks, a readable body rhythm, and a 12 px minimum for explicit or inherited text.

Keep keyboard navigation, visible focus, dark/light/high-contrast themes, reduced motion, narrow widths and 200% zoom in scope. Automated DOM or Chromium checks do not prove rendering inside Thunderbird.

Sources: `docs/UI_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `extension/options/`, `extension/dashboard/`, `extension/styles/`.
