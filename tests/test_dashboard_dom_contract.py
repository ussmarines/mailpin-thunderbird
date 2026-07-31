#!/usr/bin/env python3
"""Dashboard DOM contract and 3.2.2 view regression guards."""
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "extension/dashboard/dashboard.html").read_text(encoding="utf-8")
JS = (ROOT / "extension/dashboard/dashboard.js").read_text(encoding="utf-8")

class IdParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
    def handle_starttag(self, _tag, attrs):
        for name, value in attrs:
            if name == "id" and value:
                self.ids.add(value)

parser = IdParser()
parser.feed(HTML)
referenced = set(re.findall(r'\$\("([^"]+)"\)', JS))
missing = sorted(referenced - parser.ids)
assert not missing, f"dashboard.js references missing dashboard.html ids: {missing}"
assert 'const VIEW_SECTION_IDS = Object.freeze({' in JS
for token in ['list: "items"', 'kanban: "kanban"', 'cases: "cases"', 'history: "history"', 'health: "health"']:
    assert token in JS, token
assert '$(id).hidden = id !== next' not in JS
assert 'if (!section) throw new Error(`Section du tableau de bord introuvable : ${sectionId}`)' in JS
print(f"Dashboard DOM contract: {len(referenced)} referenced ids, OK")
