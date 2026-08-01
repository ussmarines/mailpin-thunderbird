from __future__ import annotations
import pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
impl = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
settings = (ROOT / "extension/api/pinInbox/modules/settings.js").read_text(encoding="utf-8")
css = (ROOT / "extension/styles/pin.css").read_text(encoding="utf-8")

start = impl.index("  _setHeadersPinned(")
end = impl.index("\n  _", start + 10)
method = impl[start:end]
for forbidden in ["markMessagesRead", "numNewMessages =", "hasNewMessages =", "setNumNewMessages"]:
    assert forbidden not in method, forbidden
assert "_captureFolderCounters" in method
assert "_scheduleCounterRegressionCheck" in method
assert "showFolderBadge: false" in settings
assert "settings.showFolderBadge = false" in settings
assert "settings.showFolderBadge = false" in impl
assert "host.appendChild(badge)" not in impl
assert 'document.querySelectorAll(".pin-mails-folder-badge")' in impl and 'old.remove()' in impl
assert ".pin-mails-folder-badge { display: none !important; }" in css
print("Folder counter guard checks: OK")
