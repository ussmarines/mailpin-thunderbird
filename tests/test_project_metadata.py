from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "extension/manifest.json").read_text(encoding="utf-8"))
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
html = (ROOT / "extension/options/options.html").read_text(encoding="utf-8")
js = (ROOT / "extension/options/options.js").read_text(encoding="utf-8")
readmes = [(ROOT / name).read_text(encoding="utf-8") for name in ("README.md", "README.en.md")]
locales = {locale: json.loads((ROOT / f"extension/_locales/{locale}/messages.json").read_text(encoding="utf-8")) for locale in ("fr", "en")}

author_url = "https://github.com/ussmarines"
repository_url = "https://github.com/ussmarines/mailperch-thunderbird"
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

version_badges = (f"release-v{package['version']}", f"candidate-v{package['version']}")
for readme in readmes:
    assert "actions/workflows/ci.yml/badge.svg?branch=main" in readme
    assert any(badge in readme for badge in version_badges)
    assert "Source--Available%201.1" in readme
    for url in (author_url, repository_url, paypal_url, "PRIVACY.md", "SECURITY.md", "LICENSE"):
        assert url in readme, url
    assert "C:\\" not in readme

print("Project metadata, support links and synchronized READMEs: OK")
