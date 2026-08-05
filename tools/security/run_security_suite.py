#!/usr/bin/env python3
"""Run shared scanners and keep reports local, structured and sanitized."""
from __future__ import annotations
import argparse, json, os, shutil, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path

def run(name: str, command: list[str], results: dict, cwd: Path, output: Path | None = None) -> None:
    print(f"[{name}] running...")
    handle = output.open('wb') if output else None
    try:
        completed = subprocess.run(command, cwd=cwd, stdout=handle or subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
        code = completed.returncode
    except OSError:
        code = 127
    finally:
        if handle: handle.close()
    results[name] = {"exit_code": code, "status": "passed" if code == 0 else "findings-or-error"}
    print(f"[{name}] {'OK' if code == 0 else 'inspect sanitized report'}")

def main() -> int:
    parser = argparse.ArgumentParser(); parser.add_argument('--profile', choices=('quick','full'), default='full'); parser.add_argument('--enforce', action='store_true'); args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    manifest_path = Path(os.environ['LOCALAPPDATA']) / 'ussmarines-security-tools' / 'installed-tools.json'
    if not manifest_path.is_file(): raise RuntimeError('Run tools/security/install-security-tools.ps1 first.')
    tools = json.loads(manifest_path.read_text(encoding='utf-8-sig'))['tools']
    reports = repo / 'tools' / 'security' / '.reports' / datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S'); reports.mkdir(parents=True)
    results = {}
    guard = [sys.executable, str(repo/'.github/scripts/security_guard.py'), '--report', str(reports/'identity-guard.json')]
    if args.profile == 'full': guard.append('--history')
    run('identity-guard', guard, results, repo)
    gitleaks = [tools['gitleaks']['executable'], 'git' if args.profile == 'full' else 'dir']
    if args.profile == 'full': gitleaks += ['.', '--log-opts=--all']
    else: gitleaks += ['.']
    gitleaks += ['--config',str(repo/'.gitleaks.toml'),'--redact=100','--exit-code=2','--report-format=json',f"--report-path={reports/'gitleaks.json'}"]
    run('gitleaks', gitleaks, results, repo)
    run('opengrep', [tools['opengrep']['executable'],'scan','--config',str(repo/'.security/opengrep/project-security.yml'),'--json-output',str(reports/'opengrep.json'),'--error','--exclude','node_modules','--exclude','vendor','--exclude','dist',str(repo)], results, repo)
    trivy = tools['trivy']['executable']
    run('trivy',[trivy,'filesystem','--scanners','vuln,misconfig','--severity','MEDIUM,HIGH,CRITICAL','--format','json','--output',str(reports/'trivy.json'),'--exit-code','1',str(repo)],results,repo)
    run('sbom',[trivy,'filesystem','--scanners','vuln','--format','cyclonedx','--output',str(reports/'sbom.cdx.json'),str(repo)],results,repo)
    if (repo/'package-lock.json').is_file() and shutil.which('npm.cmd'):
        run('npm-audit',['npm.cmd','audit','--omit=dev','--audit-level=moderate','--json'],results,repo,reports/'npm-audit.json')
    if (repo/'composer.lock').is_file():
        composer = shutil.which('composer.bat') or shutil.which('composer')
        if composer: run('composer-audit',[composer,'audit','--locked','--format=json'],results,repo,reports/'composer-audit.json')
    run('zizmor',[tools['zizmor']['executable'],'--offline','--format','json',str(repo)],results,repo,reports/'zizmor.json')
    failed = sum(item['exit_code'] != 0 for item in results.values())
    summary = {'schema_version':1,'generated_at_utc':datetime.now(timezone.utc).isoformat(),'profile':args.profile,'safe_output':True,'matched_values_included':False,'failed_checks':failed,'results':results}
    (reports/'summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f"Sanitized reports: {reports}")
    return 1 if args.enforce and failed else 0
if __name__ == '__main__': raise SystemExit(main())
