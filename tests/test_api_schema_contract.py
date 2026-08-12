from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "extension/api/pinInbox/schema.json"
schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))[0]

types = {entry["id"]: entry for entry in schema.get("types", [])}
functions = {entry["name"]: entry for entry in schema.get("functions", [])}

# A bare object parameter is interpreted as an object with no accepted keys by
# Thunderbird's schema validator. Every object crossing the Experiment API must
# therefore reference a declared shape or explicitly define its properties.
for function in functions.values():
    for parameter in function.get("parameters", []):
        if parameter.get("type") == "object":
            assert (
                "properties" in parameter
                or "additionalProperties" in parameter
                or "$ref" in parameter
            ), f"{function['name']}.{parameter['name']} is a bare object schema"
        if "$ref" in parameter:
            assert parameter["$ref"] in types, (
                function["name"], parameter["name"], parameter["$ref"]
            )


def declared_properties(function_name: str, parameter_name: str) -> set[str]:
    function = functions[function_name]
    parameter = next(
        item for item in function["parameters"] if item["name"] == parameter_name
    )
    shape = types[parameter["$ref"]] if "$ref" in parameter else parameter
    return set(shape.get("properties", {}))


expectations = {
    ("getDashboardData", "options"): {"filter", "search", "view", "historySearch"},
    ("setConfiguration", "configuration"): {
        "settings", "groups", "rules", "cases", "templates"
    },
    ("importConfiguration", "configuration"): {
        "format", "version", "exportedAt", "shortcut", "settings", "groups",
        "rules", "cases", "templates", "data"
    },
    ("simulateRules", "options"): {"trigger", "limit", "accountKey", "folderURI"},
    ("performReferenceAction", "options"): {
        "calendarId", "groupId", "caseId", "templateId", "note", "dueAt", "startAt", "endAt",
        "reminderAt", "priorityLevel", "workflowStatus", "completed",
        "repeatRule", "recurrenceRule", "recurrenceInterval", "followUpAt",
        "reminderLeadMinutes", "snoozeUntil", "clearFollowUp", "action"
    },
    ("setWorkflowStatus", "options"): {"action", "followUpAt", "clearFollowUp"},
}

for key, expected in expectations.items():
    actual = declared_properties(*key)
    assert expected <= actual, f"{key}: missing {sorted(expected - actual)}"

print("Experiment API schema contract: OK")
