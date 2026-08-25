#!/usr/bin/env python3
"""Fail-closed structural checks for the staged Thunderbird Experiment draft."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DRAFT = ROOT / "upstream" / "webext-experiments" / "MessageListAction"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"upstream experiment check failed: {message}")


def load_json(path: Path):
    require(path.is_file(), f"missing {path.relative_to(ROOT)}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"invalid JSON in {path.relative_to(ROOT)}: {exc}") from exc


def main() -> None:
    required = [
        DRAFT / "README.md",
        DRAFT / "ISSUE_DRAFT.md",
        DRAFT / "PR_DRAFT.md",
        DRAFT / "manifest.json",
        DRAFT / "background.js",
        DRAFT / "experiments" / "MessageListAction" / "schema" / "message-list-action.json",
        DRAFT / "experiments" / "MessageListAction" / "parent" / "ext-message-list-action.js",
    ]
    for path in required:
        require(path.is_file(), f"missing {path.relative_to(ROOT)}")

    manifest = load_json(DRAFT / "manifest.json")
    schema = load_json(
        DRAFT / "experiments" / "MessageListAction" / "schema" / "message-list-action.json"
    )

    require(manifest.get("manifest_version") == 2, "sample must match current upstream MV2 layout")
    require(manifest.get("permissions") == ["messagesRead", "tabs"], "sample permissions must stay minimal")
    require(set(manifest.get("experiment_apis", {})) == {"MessageListAction"}, "unexpected Experiment API")

    require(isinstance(schema, list) and len(schema) == 1, "schema must contain one namespace")
    namespace = schema[0]
    require(namespace.get("namespace") == "MessageListAction", "unexpected schema namespace")

    function_names = {item.get("name") for item in namespace.get("functions", [])}
    require(
        function_names == {"register", "update", "unregister", "setState", "clearState", "clearAllStates"},
        "public function surface drifted",
    )
    event_names = {item.get("name") for item in namespace.get("events", [])}
    require(event_names == {"onClicked"}, "public event surface drifted")

    combined = "\n".join(path.read_text(encoding="utf-8") for path in required if path.suffix in {".js", ".json"})
    forbidden_public_terms = [
        "pinInbox",
        "pin-mails-v2.sqlite",
        "workflowStatus",
        "calendarItemId",
        "stableKey",
    ]
    schema_text = json.dumps(schema)
    for term in forbidden_public_terms:
        require(term not in schema_text, f"MailPin-specific term leaked into public schema: {term}")

    require("MPL-2.0" in (DRAFT / "README.md").read_text(encoding="utf-8"), "MPL-2.0 offer missing")
    require("Mozilla Public" in (DRAFT / "experiments" / "MessageListAction" / "parent" / "ext-message-list-action.js").read_text(encoding="utf-8"), "MPL source header missing")
    require("browser.storage" not in combined, "sample must not silently require storage permission")

    print("upstream MessageListAction staging: OK")


if __name__ == "__main__":
    main()
