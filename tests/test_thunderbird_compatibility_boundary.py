from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPLEMENTATION = (ROOT / "extension/api/pinInbox/implementation.js").read_text(encoding="utf-8")
MODULES = ROOT / "extension/api/pinInbox/modules"

required_modules = {
    "thunderbird-messages.js": "PinThunderbirdMessages",
    "thunderbird-tags.js": "PinThunderbirdTags",
    "thunderbird-calendar.js": "PinThunderbirdCalendar",
    "compatibility.js": "PinCompatibility",
}
for filename, symbol in required_modules.items():
    content = (MODULES / filename).read_text(encoding="utf-8")
    assert symbol in content, f"{filename} must expose {symbol}"
    assert f'"{filename}"' in IMPLEMENTATION, f"{filename} must be loaded by the Experiment"

# Thunderbird services may be imported/injected at the bootstrap edge, but
# orchestration/business logic must not reach through the adapters again.
for forbidden in (
    "MailServices.accounts.",
    "MailServices.tags.",
    "MailServices.mfn.",
    "MailServices.folderLookup.",
    "MailServices.compose.",
    "MailUtils.display",
    "MailUtils.getIdentityForHeader",
    "new MessageArchiver",
    "lazy.cal.manager",
    "lazy.cal.dtz",
    "lazy.cal.acl",
    "new lazy.CalEvent",
    "new lazy.CalTodo",
):
    assert forbidden not in IMPLEMENTATION, f"Thunderbird boundary regression: {forbidden}"

assert 'resource://gre/modules/ExtensionUtils.sys.mjs' in IMPLEMENTATION
assert "var { ExtensionError } = ExtensionUtils;" in IMPLEMENTATION
assert "PinCompatibility?.create" in IMPLEMENTATION
assert "this._thunderbird?.messages" in IMPLEMENTATION
assert "this._thunderbird?.tags" in IMPLEMENTATION
assert "this._thunderbird?.calendar" in IMPLEMENTATION

print("Thunderbird compatibility boundary guards: OK")
