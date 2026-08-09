from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / "extension"
impl = (EXT / "api/pinInbox/implementation.js").read_text(encoding="utf-8")
css = (EXT / "styles/pin.css").read_text(encoding="utf-8")
background = (EXT / "background.js").read_text(encoding="utf-8")
dashboard_html = (EXT / "dashboard/dashboard.html").read_text(encoding="utf-8")
dashboard_css = (EXT / "dashboard/dashboard.css").read_text(encoding="utf-8")
dashboard_js = (EXT / "dashboard/dashboard.js").read_text(encoding="utf-8")
options_html = (EXT / "options/options.html").read_text(encoding="utf-8")
options_css = (EXT / "options/options.css").read_text(encoding="utf-8")
options_js = (EXT / "options/options.js").read_text(encoding="utf-8")
settings_js = (EXT / "api/pinInbox/modules/settings.js").read_text(encoding="utf-8")
tokens = (EXT / "styles/tokens.css").read_text(encoding="utf-8")

# The three user-facing surfaces share one compact product design language.
# The font stack must remain fully local and must not depend on an optional
# system installation of a third-party typeface.
assert '--mp-font-family: system-ui,' in tokens
assert '--mp-font-family: Inter,' not in tokens
assert "--mp-control-height-standard: 36px;" in tokens
assert "--mp-page-max-width: 1440px;" in tokens
assert "min-height: 16rem" not in dashboard_css
assert "min-height: 17rem" not in options_css
assert ".dashboard-header::after { display: none; }" in dashboard_css
assert ".page-header::after { display: none; }" in options_css
assert "font-family: var(--mp-font-family);" in css
assert "background: linear-gradient(105deg" not in css

# Dashboard must be opened from the WebExtension background, not from chrome UI.
assert "onDashboardRequested" in impl
assert "contentTab" not in impl
assert "_dashboardRequestPending" in impl
assert "onDashboardRequested.addListener(openDashboard)" in background
assert 'messenger.tabs.create({' in background
assert 'href="./dashboard.css"' in dashboard_html
assert 'src="./dashboard.js"' in dashboard_html
assert "fatal-error" in dashboard_html and "data-loading" in dashboard_css
assert "getDashboardData" in dashboard_js
assert 'id="status"' in dashboard_html and "aria-atomic=\"true\"" in dashboard_html
assert "position: fixed" in dashboard_css and ".status.success" in dashboard_css
assert "setButtonBusy" in dashboard_js and "ACTION_MESSAGES" in dashboard_js
assert "event.composedPath" in dashboard_js

# Settings feedback must remain visible at the user's current scroll position.
assert 'id="save-dock"' in options_html
assert 'id="save-all-floating"' in options_html
assert 'class="status-toast"' in options_html
assert 'id="status-close"' in options_html
assert ".status-toast" in options_css and "position: fixed" in options_css
assert ".save-dock" in options_css and "position: fixed" in options_css
assert "function setDirty" in options_js
assert "function withBusy" in options_js
assert "preserveEdits" in options_js
assert "beforeunload" in options_js
assert 'setStatus(msg("settingsSaved"), "success")' in options_js

# Pinned cards use Thunderbird's native popup layer and capture right-click early.
assert 'about3Pane.addEventListener("contextmenu", onPanelContextMenu, true)' in impl
assert 'list.addEventListener("contextmenu"' in impl
assert 'onPanelRightPointerDown' not in impl
assert "event.composedPath()" in impl
assert "event.stopImmediatePropagation()" in impl
assert 'event.key === "ContextMenu"' in impl
assert 'event.shiftKey && event.key === "F10"' in impl
assert 'document.createXULElement("menupopup")' in impl
assert 'contextMenu.openPopup(trigger, "after_end"' in impl
assert 'contextMenu.openPopupAtScreen(screenX, screenY, true, triggerEvent)' in impl
assert 'contextMenu.addEventListener("command"' in impl
assert "contextMenu?.remove()" in impl
assert ".pin-mails-context-menu" not in css
assert "openContextMenuForCard" in impl
assert "runCardAction" in impl

# Reading a card is an active state, not a persistent bulk selection.
click_start = impl.index('list.addEventListener("click"')
click_end = impl.index('list.addEventListener("keydown"', click_start)
click_handler = impl[click_start:click_end]
assert "selectedPanelKeys.clear();" in click_handler
assert "selectPanelMessage(ref, hdr, card);" in click_handler
assert "selectedPanelKeys.add(key);\n        selectionAnchorKey = key;\n        selectPanelMessage" not in click_handler
assert 'card.toggleAttribute("data-active", active)' in impl
assert ".pin-mails-card[data-active]" in css
assert ".pin-mails-card[data-selected]" in css
assert ".pin-mails-card[data-selected] .pin-mails-card-actions" not in css

# Hidden quick actions must never intercept card clicks.
assert ".pin-mails-card-actions" in css
assert "visibility: hidden" in css
assert "pointer-events: none" in css
assert ".pin-mails-card:hover .pin-mails-card-actions" in css
assert ".pin-mails-card[data-active] .pin-mails-card-actions" in css
assert "pointer-events: auto" in css
assert 'createQuickButton("more", this._t("moreActions", "Plus d’actions")' in impl
assert ".pin-mails-card-more" in css

# Pin colours and hover states must be driven by account variables, not white.
assert "color: var(--pin-account-color);" in css
assert "background-color: var(--pin-row-account-color, var(--pin-mails-accent));" in css
assert "tr[data-pin-mails-pinned] .pin-mails-independent-button::before" in css
assert "#threadTree tr:is(:hover, :focus-within) .pin-mails-independent-button" in css
assert ".pin-mails-card-pin:hover::before" in css
assert ".pin-mails-quick-button.pin-mails-card-pin" in css
assert "place-items: center" in css
assert 'light-dark(color-mix(in srgb, var(--pin-account-color)' not in css

# Group creation uses an extension-owned accessible dialog, never native prompt().
assert "createGroupDialog" in impl
assert "openGroupAssignmentDialog" in impl
assert ".pin-mails-group-dialog" in css
assert "prompt(" not in impl
for icon_name in ("pin-filled.svg", "pin-regular.svg", "pin-regular-light.svg"):
    icon = (EXT / "icons" / icon_name).read_text(encoding="utf-8")
    assert 'transform="translate(0 -0.375)"' in icon
assert 'fill="#fff"' in (EXT / "icons" / "pin-regular-light.svg").read_text(encoding="utf-8")
manifest = (EXT / "manifest.json").read_text(encoding="utf-8")
assert '"theme_icons"' in manifest
assert '"light": "icons/pin-regular-light.svg"' in manifest
assert '"dark": "icons/pin-regular.svg"' in manifest

# Drag feedback is always scoped and cleared.
assert "clearDropTargets" in impl and "clearDropFeedback" in impl
assert "onViewportChange" in impl
assert "#pin-mails-panel [data-drop-target]" in css
assert "\n[data-drop-target]" not in css

# Header no longer exposes unexplained one-character labels.
assert 'headerAction("pin-mails-action-conversation"' in impl
assert 'headerAction("pin-mails-action-dashboard"' in impl
assert 'headerAction("pin-mails-action-add-group"' in impl
assert 'createNode("button", "pin-mails-header-action", "C")' not in impl


# Narrow thread panes must not turn the search control's horizontal flex basis
# into a large vertical spacer. Empty reminder centers must stay invisible.
responsive_start = css.index("@container threadPane (max-width: 390px)")
responsive_end = css.index("/* 2.0", responsive_start)
responsive_block = css[responsive_start:responsive_end]
assert ".pin-mails-search-wrap { flex: 0 0 auto; min-inline-size: 0; }" in responsive_block
responsive_select_start = css.index(
    "@container threadPane (max-width: 390px)", css.index("/* 3.2.0")
)
responsive_select_end = css.index(".pin-mails-no-reply-chip", responsive_select_start)
responsive_select_block = css[responsive_select_start:responsive_select_end]
assert "flex: 0 0 auto;" in responsive_select_block
assert "inline-size: 100%;" in responsive_select_block
assert "block-size: 30px;" in responsive_select_block
assert "max-inline-size: none;" in responsive_select_block
assert ".pin-mails-search-wrap { flex: 1 1 180px; min-inline-size: 96px; }" in css
assert "flex: 0 1 150px;" in css
assert 'url("../icons/pin-filled.svg")' in css
assert 'url("../icons/pin.svg")' not in css
assert 'url("../icons/conversation.svg")' not in css
assert "max-block-size: min(65vh, var(--pin-mails-max-height));" in css
assert "selectedAccounts" in impl
assert "matchesPanelScope(this._settings, ref, folder.URI)" in impl
assert "selectedAccountKeys" in settings_js and "function matchesPanelScope" in settings_js
assert 'this._t("scopeSelectedAccounts", "Comptes sélectionnés")' in impl
assert 'this._t("selectedAccounts", "Comptes sélectionnés")' not in impl
assert "_dashboardRequestPending = true;" in impl

# Dashboard user-visible counts must be normalized before rendering, and the
# main dashboard deliberately omits the raw technical dump.
assert "function displayCount(value)" in dashboard_js
assert "displayCount(plan.actionable)" in dashboard_js
assert 'id="technical"' not in dashboard_html
assert 'id="header-support"' in dashboard_html
assert "support-panel" in dashboard_html

# Options keep only the PayPal support action and expose the explicit account
# scope without reintroducing the ambiguous current-account mode.
assert 'id="support-author"' not in options_html
assert 'id="support-repository"' not in options_html
assert 'id="header-support"' in options_html
assert 'value="selectedAccounts"' in options_html
assert 'value="currentAccount"' not in options_html
assert "reorderSettingsFamilies" in options_js
assert ".pin-mails-reminder-center[hidden]" in css
hidden_rule = css[css.index(".pin-mails-reminder-center[hidden]"):]
assert "display: none !important;" in hidden_rule

print("UI regression guards: OK")
