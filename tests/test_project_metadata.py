from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "extension/manifest.json").read_text(encoding="utf-8"))
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
state = json.loads((ROOT / "docs/PROJECT_STATE.json").read_text(encoding="utf-8"))
html = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
js = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
readmes = [(ROOT / name).read_text(encoding="utf-8") for name in ("README.md", "README.en.md")]
locales = {locale: json.loads((ROOT / f"extension/_locales/{locale}/messages.json").read_text(encoding="utf-8")) for locale in ("fr", "en")}

author_url = "https://github.com/ussmarines"
repository_url = "https://github.com/ussmarines/mailpin-thunderbird"
paypal_url = "https://paypal.me/ussmarinesdot"

assert manifest["author"] == "ussmarines"
assert manifest["developer"] == {"name": "ussmarines", "url": author_url}
assert manifest["homepage_url"] == repository_url
assert manifest["browser_specific_settings"]["gecko"]["id"] == "ussmarines.mailpin@addons.thunderbird.net"
assert manifest["permissions"] == ["menus"]
assert "paypal.me" not in json.dumps(manifest)
assert "github.com" not in json.dumps(manifest["content_security_policy"])
assert "connect-src 'none'" in manifest["content_security_policy"]["extension_pages"]
assert "form-action 'none'" in manifest["content_security_policy"]["extension_pages"]

assert package["author"] == "ussmarines"
assert package["homepage"] == repository_url
assert package["repository"]["url"] == f"git+{repository_url}.git"
assert package["funding"] == {"type": "paypal", "url": paypal_url}

assert f'id="support-paypal"' in html and f'href="{paypal_url}"' in html
assert 'id="support-author"' not in html
assert 'id="support-repository"' not in html
assert html.count('data-support-link') == 2
assert 'target="_blank"' in html and 'rel="noopener noreferrer"' in html
for visible_french_string in (
    "Soutenir MailPin",
    "Vous appréciez MailPin ? Vous pouvez contribuer à la poursuite de son développement en faisant un don.",
    "Soutenir le projet via PayPal",
):
    assert visible_french_string not in html, visible_french_string
assert "function openExternalSupportLink(event)" in js
assert "event.preventDefault();" in js and "messenger.tabs.create({url: link.href})" in js
for key in ("supportTitle", "supportProject", "supportOpenFailed"):
    assert all(locales[locale][key]["message"].strip() for locale in locales), key

source_version = str(package["version"])
public_version = str(state["latestPublicVersion"])
assert manifest["version"] == source_version == state["extensionVersion"]
if state["releaseStatus"] == "candidate":
    assert source_version != public_version
    expected_source_badge = f"candidate-v{source_version}"
elif state["releaseStatus"] == "published":
    assert source_version == public_version
    expected_source_badge = f"release-v{source_version}"
else:
    expected_source_badge = f"candidate-v{source_version}"
for readme in readmes:
    assert "actions/workflows/ci.yml/badge.svg?branch=main" in readme
    assert expected_source_badge in readme
    assert f"release-v{public_version}" in readme
    assert "Source--Available%201.1" in readme
    for url in (author_url, repository_url, paypal_url, "PRIVACY.md", "SECURITY.md", "SUPPORT.md", "LICENSE"):
        assert url in readme, url
    assert "C:\\" not in readme

# Active release documents must agree on both source and latest-public versions.
active_release_docs = {
    "PROJECT_MEMORY.md": (f"Version source : **{source_version}**", f"Dernière release publique : **{public_version}**"),
    "docs/BUG_TRACKER.md": (f"Version source : **{source_version}**", f"Dernière release publique : **{public_version}**"),
    "docs/KNOWN_LIMITATIONS.md": (f"Source {source_version}", f"release publique {public_version}"),
    "release/BUILD_INSTRUCTIONS.md": (f"MailPin {source_version}", f"release GitHub **{public_version}** est publiée"),
}
for relative, tokens in active_release_docs.items():
    text = (ROOT / relative).read_text(encoding="utf-8")
    for token in tokens:
        assert token in text, (relative, token)

print("Project metadata, support links and synchronized READMEs: OK")
# Current non-persistent product surfaces must use MailPin naming. Historical
# compatibility keys in storage/tags are intentionally excluded from this guard.
dashboard_js = (ROOT / "extension/dashboard/dashboard.js").read_text(encoding="utf-8")
options_js = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
implementation_js = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
assert "text/x-mailpin-key" in dashboard_js
assert "text/x-mailperch-key" not in dashboard_js
assert "mailpin-diagnostic-" in dashboard_js and "mailperch-diagnostic-" not in dashboard_js
assert "mailpin-diagnostic-" in options_js and "mailperch-diagnostic-" not in options_js
assert 'format: "mailpin-diagnostic-bundle"' in implementation_js
assert 'format: "mailperch-diagnostic-bundle"' not in implementation_js
