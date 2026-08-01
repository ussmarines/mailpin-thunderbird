from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OPTIONS = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
IMPL = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
LOCALES = {
    locale: json.loads((ROOT / f"extension/_locales/{locale}/messages.json").read_text(encoding="utf-8"))
    for locale in ("fr", "en")
}

KEYS = {
    "dynamicRecommended", "dynamicRecommendedDisabled", "dynamicMoveUp", "dynamicMoveDown",
    "dynamicSelectedCalendar", "dynamicChooseCalendar", "dynamicTitle", "dynamicColor",
    "dynamicStatus", "dynamicName", "dynamicCaseTitleHelp", "dynamicCaseDueHelp",
    "dynamicCalendarSync", "dynamicCalendarTitleRequired", "dynamicCalendarDueRequired",
    "dynamicNoEventCalendar", "dynamicNoTaskCalendar", "dynamicCalendarBusy",
    "dynamicCaseCreated", "dynamicCaseSynchronized", "dynamicTemplateNameHelp",
    "dynamicTemplateDeadlineHelp", "dynamicFollowUp", "dynamicTemplateFollowUpHelp",
    "dynamicLead", "dynamicTemplateLeadHelp", "dynamicRecurrence", "dynamicInterval",
    "dynamicTemplateIntervalHelp", "dynamicNotePrefix", "dynamicRuleEnabled",
    "dynamicRuleEnabledHelp", "dynamicRuleNameHelp", "dynamicRulePriorityHelp",
    "dynamicTrigger", "dynamicAction", "dynamicTarget", "dynamicSenderContains",
    "dynamicSubjectContains", "dynamicTagKey", "dynamicAccount", "dynamicFolderHelp",
    "dynamicGroupTarget", "dynamicCaseTarget", "dynamicTemplateTarget", "dynamicStatusTarget",
    "dynamicRuleLimit", "dynamicRuleLimitHelp", "dynamicNewCase", "dynamicNewTemplate",
    "dynamicNewRule", "dynamicSimulationSummary", "dynamicSimulationBusy", "dynamicSimulationNoMatch",
    "calendarWriteAllowed", "calendarStateUnknown", "calendarWriteRefused", "calendarUnknown",
    "calendarWriteFailed", "caseCalendarTitleRequired", "caseCalendarDueRequired",
    "caseCalendarSelectionRequired",
}

for locale, messages in LOCALES.items():
    missing = KEYS - messages.keys()
    assert not missing, f"{locale}: missing dynamic keys {sorted(missing)}"
    assert all(messages[key]["message"].strip() for key in KEYS), locale

for key in KEYS - {"calendarWriteAllowed", "calendarStateUnknown", "calendarWriteRefused", "calendarUnknown", "calendarWriteFailed", "caseCalendarTitleRequired", "caseCalendarDueRequired", "caseCalendarSelectionRequired"}:
    assert f'"{key}"' in OPTIONS, key

for source in (
    "Recommandé", "Monter cet élément", "Descendre cet élément", "Choisir un calendrier compatible",
    "Nom visible de l’affaire", "Nombre maximal d’actions par minute", "Simulation des règles",
):
    assert source not in OPTIONS, source

assert "function entityField(labelKey, control, helpKey" in OPTIONS
assert "aria-describedby" in OPTIONS
assert "this._t(\"calendarWriteFailed\"" in IMPL
print(f"Dynamic Options localization: {len(KEYS)} FR/EN keys, accessible fields: OK")
