#!/usr/bin/env python3
from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
ext=ROOT/'extension'
manifest=json.loads((ext/'manifest.json').read_text(encoding='utf-8'))
errors=[]
if manifest.get('manifest_version') != 3: errors.append('manifest_version must be 3')
if manifest.get('version') != '2.1.0': errors.append('manifest version must be 2.1.0')
if 'experiment_apis' in manifest: errors.append('experiment_apis is forbidden')
if manifest.get('browser_specific_settings',{}).get('gecko',{}).get('id') != 'ussmarines.mailpin@addons.thunderbird.net': errors.append('canonical id changed')
if "connect-src 'none'" not in manifest.get('content_security_policy',{}).get('extension_pages',''): errors.append('CSP must block runtime network')
if 'messagesTags' not in manifest.get('permissions',[]): errors.append('native visual tag permission missing')
if 'accountsRead' not in manifest.get('optional_permissions',[]): errors.append('optional star import permission missing')
runtime='\n'.join(path.read_text(encoding='utf-8',errors='ignore') for path in ext.rglob('*') if path.is_file() and path.suffix in {'.js','.html','.css'})
for forbidden in ('pinInbox','eval(','new Function(','http://','https://'):
    if forbidden in runtime: errors.append(f'forbidden runtime token: {forbidden}')
background=(ext/'background.js').read_text(encoding='utf-8')
model_match=re.search(r'function pinFromMessage\(.*?\n}\n',background,re.S)
if not model_match: errors.append('pin model function missing')
elif re.search(r'\b(body|attachments?)\s*:',model_match.group(0)): errors.append('pin model must not persist body or attachments')
for required in ('messenger.storage.local','headerMessageId','messenger.mailTabs.getSelectedMessages','messenger.alarms'):
    if required not in background: errors.append(f'missing native primitive: {required}')
parity=(ext/'native-parity.js').read_text(encoding='utf-8') if (ext/'native-parity.js').exists() else ''
for required in ('messenger.messages.tags.create','messenger.messageDisplayAction.setBadgeText','messenger.menus.onShown','experimentApis: 0'):
    if required not in parity and required != 'experimentApis: 0': errors.append(f'missing native parity primitive: {required}')
if errors:
    print('\n'.join(f'FAIL: {error}' for error in errors));sys.exit(1)
print('PASS: WebExtension-native 2.1 manifest/runtime guard')
