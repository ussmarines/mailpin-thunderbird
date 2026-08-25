from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

workspace = (ROOT / "extension/styles/workspace.css").read_text(encoding="utf-8")
options = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
dashboard = (ROOT / "extension/dashboard/dashboard.html").read_text(encoding="utf-8")
memory = (ROOT / "PROJECT_MEMORY.md").read_text(encoding="utf-8")
state = json.loads((ROOT / "docs/PROJECT_STATE.json").read_text(encoding="utf-8"))
deep_audit = (ROOT / "scripts/deep_audit.py").read_text(encoding="utf-8")

# Keep these UI polish contracts intentionally static and inexpensive.
for selector in (
    ".pin-mails-options-shell",
    ".pin-mails-dashboard-shell",
):
    assert selector in workspace, selector

for token in (
    "options-navigation",
    "options-feedback",
):
    assert token in options, token

for token in (
    "dashboard-navigation",
    "dashboard-content",
):
    assert token in dashboard, token

# Deep-audit must remain safe for tracked names that are ignored by local tooling.
assert '["git", "check-ignore", "--no-index", "-z", "--stdin"]' in deep_audit
assert 'input=b"\\0".join(tracked_names) + b"\\0"' in deep_audit
assert 'relative != "dist/.gitkeep"' in deep_audit

# The one-scan Codex memory must remain complete and machine-checkable.
for token in (
    "Invariants non négociables",
    "Où modifier quoi",
    "Carte complète des fichiers",
    "Commandes obligatoires",
    "Définition de terminé",
):
    assert token in memory, token
for path in state["entrypoints"].values():
    target = ROOT / path
    assert target.exists(), path
    assert target.is_file() or target.is_dir(), path
    assert path in memory, path

print("MailPin 3.2.8 UI polish and project-memory guards: OK")
