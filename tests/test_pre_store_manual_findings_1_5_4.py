#!/usr/bin/env python3
"""Regression guards for the manual pre-store findings fixed in 1.5.4."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXT = ROOT / "extension"

identity = (EXT / "api/pinInbox/modules/identity.js").read_text(encoding="utf-8")
bulk = (EXT / "api/pinInbox/modules/bulk.js").read_text(encoding="utf-8")
impl = (EXT / "api/pinInbox/implementation.js").read_text(encoding="utf-8")
schema = (EXT / "api/pinInbox/schema.json").read_text(encoding="utf-8")
pin_css = (EXT / "styles/pin.css").read_text(encoding="utf-8")
options_html = (EXT / "options/options.html").read_text(encoding="utf-8")
options_css = (EXT / "options/options.css").read_text(encoding="utf-8")
dashboard_html = (EXT / "dashboard/dashboard.html").read_text(encoding="utf-8")
dashboard_css = (EXT / "dashboard/dashboard.css").read_text(encoding="utf-8")
dashboard_js = (EXT / "dashboard/dashboard.js").read_text(encoding="utf-8")

# Every generic pin entry point must resolve the same canonical target. The
# explicit conversation command stays separate and opt-in.
assert "function genericTrackingMode(settings" in identity
assert "PIN_MODULES.PinIdentity?.genericTrackingMode(this._settings)" in impl
assert impl.count("_genericTrackingMode()") >= 3
assert '_setHeadersPinned(headers, newState, folder.URI, newState ? "Épinglage" : "Désépinglage", trackingMode)' in impl
assert "PIN_MODULES.PinIdentity?.pinKeyPlan(trackingMode, messageKey, conversationKey)" in impl
assert "Object.assign(target, clone(opposite), identity, {updatedAt: Date.now()});" in impl
assert "this._removeReferenceByKey(oppositeKey, {deleteCalendar: !removedTarget});" in impl
assert "_toggleConversationSelectedByTab" in impl

# The panel responds to its own splitter-controlled inline size. Its existing
# container queries are otherwise inert in Thunderbird.
assert "container: threadPane / inline-size;" in pin_css
assert "@container threadPane (max-width: 600px)" in pin_css
assert "@container threadPane (max-width: 390px)" in pin_css

# The custom-rules heading/action region must not use a relational two-column
# selector that can crush the explanatory copy at French/English zoom levels.
assert 'class="subsection-header subsection-header-with-actions"' in options_html
assert ".subsection-header:has(+ #rule-simulation)" not in options_css
assert ".subsection-header-with-actions" in options_css

# Dashboard status controls represent the current state, not a one-way action,
# and waiting workflow suppresses the redundant response-direction badge.
assert 'item.responseState === "waitingForThem" && item.workflowStatus !== "waiting"' in dashboard_js
assert 'responseState === "waitingForThem" && ref.workflowStatus !== "waiting"' in impl
assert 'const waitingAction = item.workflowStatus === "waiting" ? "active" : "waiting";' in dashboard_js
assert 'waitingButton.setAttribute("aria-pressed", String(item.workflowStatus === "waiting"));' in dashboard_js

# Calendar creation includes local event/task timing, validates it inline, and
# forwards bounded schedule options through the privileged API.
for element_id in (
    "calendar-event-schedule", "calendar-event-start-date", "calendar-event-start-time",
    "calendar-event-end-date", "calendar-event-end-time", "calendar-task-schedule",
    "calendar-task-due-date", "calendar-task-due-time", "calendar-error",
):
    assert f'id="{element_id}"' in dashboard_html, element_id
assert "function validateCalendarSchedule()" in dashboard_js
assert "function calendarScheduleOptions()" in dashboard_js
assert "box-sizing: border-box" in dashboard_css
assert "max-block-size: calc(100dvh - 2rem)" in dashboard_css
for field in ("startAt", "endAt", "dueAt"):
    assert f"result.{field}" in bulk, field
    assert f'"{field}"' in schema, field
assert "_normalizeCalendarSchedule" in impl

# New Calendar work starts with an event, while an existing linked item keeps
# its actual type. A task with no writable compatible destination has a clear
# localized state instead of an empty selector or a privileged create call.
assert 'item?.calendarItemId ? (item.calendarItemType === "task" ? "task" : "event") : "event"' in dashboard_js
assert 'id="calendar-target-field"' in dashboard_html
assert 'id="calendar-availability"' in dashboard_html
assert 'field.hidden = noCompatibleCalendar;' in dashboard_js
assert 'availability.hidden = !noCompatibleCalendar;' in dashboard_js
assert 'calendarNoCompatibleTask' in dashboard_js
assert 'if (!compatible.length) message = t(type === "event" ? "calendarNoCompatibleEvent" : "calendarNoCompatibleTask");' in impl
assert '...(compatible.length ? [label] : [])' in impl
assert 'if (!compatible.length) throw new ExtensionError' not in impl

# No-reply tracking is configured per item with presets, custom local time,
# result preview, and explicit stop/change controls.
for element_id in ("no-reply-dialog", "no-reply-preset", "no-reply-custom", "no-reply-preview", "no-reply-stop"):
    assert f'id="{element_id}"' in dashboard_html, element_id
assert "function openNoReplyDialog" in dashboard_js
assert "function noReplyDueAt" in dashboard_js
assert 'if (action === "trackNoReply" || action === "cancelNoReply")' in dashboard_js

# Workflow transitions are applied by one reference-level state machine. Saving
# the panel editor must not let the legacy completed boolean overwrite a chosen
# waiting/planned status, and leaving no-reply mode must clear its private state.
assert "_applyWorkflowStatusToReference(ref, target" in impl
assert "_clearNoReplyState(ref)" in impl
assert 'const requestedWorkflow = ["active","waiting","planned","completed"].includes(patch.workflowStatus)' in impl
assert 'const target = patch.completed === true ? "completed" : requestedWorkflow || "active";' in impl

# The privileged panel exposes the same per-item timing capabilities as the
# Dashboard instead of silently applying backend defaults from its menu/editor.
assert "const chooseNoReplySchedule = ref =>" in impl
assert "const selection = await chooseNoReplySchedule(ref);" in impl
assert 'this._setNoReplyTracking([key], {enabled:true,at:selection.at});' in impl
assert "const chooseCalendarForType = (itemType, selectedId = \"\", ref = null) =>" in impl
for class_name in ("pin-mails-calendar-schedule", "pin-mails-calendar-start", "pin-mails-calendar-end", "pin-mails-calendar-due"):
    assert class_name in impl, class_name
assert "selection.options" in impl

print("Pre-store manual findings 1.5.4 regression guards: OK")
