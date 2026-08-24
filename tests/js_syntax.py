#!/usr/bin/env python3
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
files=sorted((ROOT/'extension').rglob('*.js'))+sorted((ROOT/'tests').rglob('*.mjs'))
for path in files:
    result=subprocess.run(['node','--check',str(path)],capture_output=True,text=True)
    if result.returncode:
        print(result.stdout,result.stderr);sys.exit(result.returncode)
print(f'PASS: syntax {len(files)} JS files')
