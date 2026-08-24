from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest

MODULE_PATH = Path(__file__).resolve().parents[2] / ".github" / "scripts" / "security_guard.py"
SPEC = importlib.util.spec_from_file_location("security_guard", MODULE_PATH)
assert SPEC and SPEC.loader
security_guard = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = security_guard
SPEC.loader.exec_module(security_guard)

Finding = security_guard.Finding
CATEGORY = security_guard.APPROVED_HISTORY_CATEGORY

class ApprovedHistoryTests(unittest.TestCase):
    def write_manifest(self, directory: Path, entries: list[dict[str, str]]) -> Path:
        path = directory / "approved.json"
        path.write_text(
            json.dumps({"schema_version": 1, "findings": entries}),
            encoding="utf-8",
        )
        return path

    def test_exact_historical_finding_is_approved(self) -> None:
        finding = Finding(
            "git-history",
            "blob:0123456789ab:docs/example.md:7",
            CATEGORY,
        )
        active, matched, stale = security_guard.partition_findings([finding], {finding})
        self.assertEqual(active, [])
        self.assertEqual(matched, [finding])
        self.assertEqual(stale, [])

    def test_current_tree_finding_cannot_be_approved(self) -> None:
        historical = Finding(
            "git-history",
            "blob:0123456789ab:docs/example.md:7",
            CATEGORY,
        )
        current = Finding(
            "tracked-tree",
            "docs/example.md:7",
            "forbidden personal identifier",
        )
        active, matched, stale = security_guard.partition_findings([current], {historical})
        self.assertEqual(active, [current])
        self.assertEqual(matched, [])
        self.assertEqual(stale, [historical])

    def test_unknown_historical_finding_remains_blocking(self) -> None:
        approved = Finding(
            "git-history",
            "blob:0123456789ab:docs/example.md:7",
            CATEGORY,
        )
        unknown = Finding(
            "git-history",
            "blob:abcdef012345:docs/example.md:8",
            CATEGORY,
        )
        active, matched, stale = security_guard.partition_findings([approved, unknown], {approved})
        self.assertEqual(active, [unknown])
        self.assertEqual(matched, [approved])
        self.assertEqual(stale, [])

    def test_stale_approval_is_reported(self) -> None:
        approved = Finding(
            "git-history",
            "blob:0123456789ab:docs/example.md:7",
            CATEGORY,
        )
        active, matched, stale = security_guard.partition_findings([], {approved})
        self.assertEqual(active, [])
        self.assertEqual(matched, [])
        self.assertEqual(stale, [approved])

    def test_duplicate_approval_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            entry = {
                "location": "blob:0123456789ab:docs/example.md:7",
                "category": CATEGORY,
            }
            path = self.write_manifest(directory, [entry, entry])
            with self.assertRaisesRegex(ValueError, "duplicate"):
                security_guard.load_approved_history(path)

    def test_non_blob_approval_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            path = self.write_manifest(directory, [{
                "location": "commit:0123456789ab",
                "category": CATEGORY,
            }])
            with self.assertRaisesRegex(ValueError, "exact historical blob line"):
                security_guard.load_approved_history(path)

if __name__ == "__main__":
    unittest.main()
