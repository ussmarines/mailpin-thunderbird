from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path):
    return (ROOT / path).read_text(encoding="utf-8")


def test_organic_workspace_shell_is_loaded_and_structural():
    dashboard_html = text("extension/dashboard/dashboard.html")
    options_html = text("extension/options/options.html")
    dashboard_js = text("extension/dashboard/dashboard.js")
    options_js = text("extension/options/options.js")

    assert '../styles/workspace.css' in dashboard_html
    assert '../styles/workspace.css' in options_html
    assert 'class="workspace-frame"' in dashboard_html
    assert 'class="workspace-rail"' in dashboard_html
    assert 'id="workspace-inspector"' in dashboard_html
    assert 'id="context-toggle"' in dashboard_html
    assert "function installOrganicDashboardInteractions()" in dashboard_js
    assert "installOrganicDashboardInteractions();" in dashboard_js
    assert "enhanceOrganicDashboard" not in dashboard_js
    assert 'class="settings-organic-frame"' in options_html
    assert 'class="settings-organic-stage"' in options_html
    assert 'class="save-dock header-save-dock"' in options_html
    assert 'form="settings-form"' in options_html
    assert "enhanceOrganicSettingsWorkspace" not in options_js


def test_organic_design_avoids_generic_effects_and_remote_assets():
    workspace = text("extension/styles/workspace.css").lower()
    tokens = text("extension/styles/tokens.css").lower()
    combined = workspace + "\n" + tokens

    assert "linear-gradient" not in combined
    assert "radial-gradient" not in combined
    assert "backdrop-filter" not in combined
    assert "@import url(http" not in combined
    assert "http://" not in workspace and "https://" not in workspace
    assert "--mp-font-family-display" in tokens
    assert "--mp-ease-organic" in tokens
    assert "prefers-reduced-motion" in workspace
    assert "forced-colors" in workspace


def test_panel_and_spec_follow_organic_workspace_contract():
    panel = text("extension/styles/pin.css")
    spec = text("docs/UI_SPEC.md")

    assert "Organic Workspace companion panel" in panel
    assert "@container threadPane" in panel
    assert "MailPin Organic Workspace" in spec
    assert "Typographie Fluent 2" not in spec
    assert "pas de dégradé" in spec.lower() or "dégradés" in spec.lower()
    assert "zoom 200 %" in spec


def test_organic_workspace_v2_video_driven_contracts():
    workspace_css = text("extension/styles/workspace.css")
    dashboard_html = text("extension/dashboard/dashboard.html")
    options_html = text("extension/options/options.html")
    dashboard_js = text("extension/dashboard/dashboard.js")
    options_js = text("extension/options/options.js")

    assert 'container-type: inline-size' in workspace_css
    assert 'workspace-frame[data-inspector-open="true"]' in workspace_css
    assert '.stats-primary' in workspace_css and '.stats-secondary' in workspace_css
    assert '.item-more-menu' in workspace_css
    assert 'grid-template-columns: repeat(4, minmax(272px, 1fr))' in workspace_css
    assert '.rule-builder-card' in workspace_css
    assert '.rule-builder-section' in workspace_css
    assert '.case-editor-card' in workspace_css
    assert ".header-save-dock" in workspace_css
    assert ".item-more-menu { position: static" in workspace_css
    assert ".stats-secondary { position: static" in workspace_css
    assert "Canonical workspace stylesheet" in workspace_css
    assert "Organic Workspace V2 — responsive composition" not in workspace_css
    assert 'class="save-dock header-save-dock"' in options_html
    assert 'id="save-all-floating" type="submit" form="settings-form"' in options_html
    assert 'id="discard-changes" type="reset" form="settings-form"' in options_html
    assert 'for (const family of ["Essentiel", "Automatisation", "Organisation", "Avancé"])' in options_js
    assert 'node("div", "settings-family-heading")' not in options_js
    assert dashboard_html.count("<main") == 1
    assert "dashboard-layout" not in dashboard_html
    assert "settings-layout" not in options_html
    assert 'id="status"' in dashboard_html and 'class="workspace-stage"' in dashboard_html
    assert 'node("details", "item-more")' in dashboard_js
    assert 'id="context-toggle"' in dashboard_html
    assert 'node("article","rule-row rule-builder-card")' in options_js
    assert 'node("article","group-row case-editor-row case-editor-card")' in options_js
    assert 'const optionState = calendar.taskCompatible && calendar.eventCompatible' in options_js
    assert '`${calendar.name} · ${optionState}`' in options_js


def test_field_review_stability_is_part_of_canonical_workspace():
    theme = text("extension/styles/theme.js")
    workspace = text("extension/styles/workspace.css")
    bootstrap = text("extension/options/options-bootstrap.js")
    navigation = text("extension/options/options-navigation-stability.js")

    assert not (ROOT / "extension/styles/interaction-stability.css").exists()
    assert "interaction-stability.css" not in theme
    assert 'const scriptSource = String(document.currentScript?.src || "")' not in theme
    assert 'loadClassicScript("./options-navigation-stability.js")' in bootstrap

    # Dashboard stability is part of the canonical workspace stylesheet: the
    # disclosure remains full-width before and after expansion.
    assert '.workspace-stage .stats-grid { display: grid; grid-template-columns: minmax(0, 1fr)' in workspace
    assert '.stats-more[open] { grid-column: auto; width: 100%; }' in workspace
    assert '.stats-more > summary::after' in workspace

    # Save/discard and status are viewport-local in the canonical stylesheet.
    # The secondary action uses semantic foreground/background tokens so the
    # Cancel label remains readable in light and dark themes.
    assert '.settings-organic-stage .header-save-dock { position: fixed;' in workspace
    assert 'background: var(--mp-workspace-surface-strong); color: var(--mp-text);' in workspace
    assert '.header-save-dock .save-dock-actions .secondary' in workspace
    assert 'background: var(--mp-workspace-surface); color: var(--mp-text);' in workspace
    assert 'body.mp-organic-settings[data-dirty] .settings-organic-stage > #status' in workspace

    # Major settings groups have canonical vertical rhythm both at section
    # level and inside organization blocks, including Calendar and health.
    assert '.settings-section > :is(.setting-grid, .toggle-grid' in workspace
    assert '.organization-block > :is(.setting-grid, .toggle-grid' in workspace
    assert 'margin-top: var(--mp-space-8)' in workspace
    assert '.settings-organic-stage .calendar-capability { grid-template-columns: minmax(0, 1fr)' in workspace
    assert '.settings-organic-stage #save-shortcut' in workspace

    # Navigation remains deterministic for long sections.
    assert 'event.stopImmediatePropagation()' in navigation
    assert 'section.scrollIntoView({behavior: "auto", block: "start"})' in navigation
    assert 'new MutationObserver' in navigation
    assert 'window.addEventListener("scroll", scheduleSync' in navigation
    assert 'link.setAttribute("aria-current", "location")' in navigation


def test_qol_palette_defaults_and_low_friction_creation_contract():
    import re

    implementation = text("extension/api/pinInbox/implementation.js")
    options_js = text("extension/options/options.js")
    spec = text("docs/UI_SPEC.md")

    def palette(source, name):
        match = re.search(rf"const {name} = Object\.freeze\(\[(.*?)\]\);", source, re.S)
        assert match, name
        return re.findall(r"#[0-9a-fA-F]{6}", match.group(1))

    runtime_palette = [value.lower() for value in palette(implementation, "DEFAULT_COLORS")]
    options_palette = [value.lower() for value in palette(options_js, "ENTITY_DEFAULT_COLORS")]
    assert runtime_palette == options_palette
    assert len(runtime_palette) == 8
    assert len(set(runtime_palette)) == len(runtime_palette)
    assert runtime_palette[0] == "#4e7569"
    assert "#0f6cbd" not in runtime_palette
    assert "#6264a7" not in runtime_palette

    assert "function nextDefaultColor(items = [], startIndex = 0)" in implementation
    assert "stored === getLegacyDefaultColor(accountKey)" in implementation
    assert "nextDefaultColor(this._data.groups)" in implementation
    assert "nextDefaultColor([...(this._data.groups || []), ...values])" in implementation
    assert "function nextEntityColor(items = [], startIndex = 0)" in options_js
    assert 'color: nextEntityColor([...groups, ...cases])' in options_js
    assert 'focusCreatedEntity("groups-list")' in options_js
    assert 'focusCreatedEntity("cases-list")' in options_js
    assert 'focusCreatedEntity("templates-list")' in options_js
    assert 'focusCreatedEntity("rules-list")' in options_js

    # Deadline and calendar are optional until the Agenda action itself
    # validates the values it needs.
    assert 'control.required = true' not in options_js
    assert 'due.type="datetime-local";due.required=true' not in options_js
    assert 'if (!item.dueAt) throw new Error(msg("dynamicCalendarDueRequired"));' in options_js
    assert 'if (!calendar.value) {' in options_js

    assert 'color.setAttribute("aria-label", `${msg("dynamicColor")} · ${primaryLabel}`)' in options_js
    assert "## Quality of Life" in spec


if __name__ == "__main__":
    test_organic_workspace_shell_is_loaded_and_structural()
    test_organic_design_avoids_generic_effects_and_remote_assets()
    test_panel_and_spec_follow_organic_workspace_contract()
    test_organic_workspace_v2_video_driven_contracts()
    test_field_review_stability_is_part_of_canonical_workspace()
    test_qol_palette_defaults_and_low_friction_creation_contract()
    print("Organic Workspace UI contracts: OK")
