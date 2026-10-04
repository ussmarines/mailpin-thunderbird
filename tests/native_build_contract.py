from pathlib import Path
import hashlib
import importlib.util
import json
import posixpath
import re
import tempfile
import zipfile
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("build", ROOT / "scripts/build.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)
with tempfile.TemporaryDirectory() as folder:
    first, second = Path(folder) / "first.xpi", Path(folder) / "second.xpi"
    build.create_xpi(first); build.create_xpi(second)
    assert first.read_bytes() == second.read_bytes()
    with zipfile.ZipFile(first) as archive:
        names = set(archive.namelist())
        manifest = json.loads(archive.read("manifest.json"))
        assert manifest["version"] == "2.2.0" and "experiment_apis" not in manifest
        assert not any(name.startswith("api/") or name.endswith("AGENTS.md") for name in names)
        for name in ["native/core.js", "native/client.js", "workbench/workbench.html", "options/options-bootstrap.js", "dashboard/dashboard.html"]: assert name in names
        for name in names:
            if name.endswith(".html"):
                text = archive.read(name).decode("utf-8")
                for ref in re.findall(r'(?:src|href)="([^"]+)"', text):
                    if ref.startswith(("#", "https:", "http:", "data:")): continue
                    assert posixpath.normpath(posixpath.join(posixpath.dirname(name), ref.split("?")[0])) in names, (name, ref)
    source = Path(folder) / "source.zip"; build.create_source_zip(source)
    extracted = Path(folder) / "reviewer"; extracted.mkdir()
    with zipfile.ZipFile(source) as archive: archive.extractall(extracted)
    spec = importlib.util.spec_from_file_location("reviewer_build", extracted / "scripts/build.py")
    reviewer = importlib.util.module_from_spec(spec); spec.loader.exec_module(reviewer)
    rebuilt = Path(folder) / "reviewer.xpi"; reviewer.create_xpi(rebuilt)
    assert hashlib.sha256(rebuilt.read_bytes()).digest() == hashlib.sha256(first.read_bytes()).digest()
print("PASS native XPI: zero Experiment, page dependencies, reproducible build and reviewer source roundtrip")
