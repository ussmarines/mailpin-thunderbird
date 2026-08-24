import fs from 'node:fs';
import assert from 'node:assert/strict';

const parity = fs.readFileSync(new URL('../extension/native-parity.js', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../extension/dashboard/parity-dashboard.js', import.meta.url), 'utf8');
const workbench = fs.readFileSync(new URL('../extension/workbench/workbench.js', import.meta.url), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('../extension/manifest.json', import.meta.url), 'utf8'));

for (const token of [
  'messenger.messages.tags.create',
  'messenger.messages.update',
  'messenger.messageDisplayAction.setBadgeText',
  'messenger.messageDisplayAction.setIcon',
  'messenger.menus.onShown',
  'messenger.storage.onChanged'
]) {
  assert.ok(parity.includes(token), `missing parity primitive ${token}`);
}

for (const token of [
  'parity:snooze1h',
  'parity:snooze1d',
  'parity:rules',
  'parity:template:',
  'parity:case:',
  'savedViews'
]) {
  assert.ok(dashboard.includes(token), `missing dashboard parity feature ${token}`);
}

for (const token of [
  'templates',
  'cases',
  'rules',
  'mailpin:parity:diagnostics',
  'accountsRead',
  'flagged: true',
  'mailpin:unpin'
]) {
  assert.ok(workbench.includes(token), `missing workbench feature ${token}`);
}

assert.ok(manifest.permissions.includes('messagesTags'));
assert.ok(manifest.optional_permissions.includes('accountsRead'));
assert.ok(!('experiment_apis' in manifest));
assert.ok(!parity.includes('pinInbox'));
assert.ok(!dashboard.includes('pinInbox'));
assert.ok(!workbench.includes('pinInbox'));
assert.ok(!/https?:\/\//.test(parity));
assert.ok(!/https?:\/\//.test(dashboard));
assert.ok(!/https?:\/\//.test(workbench));
assert.ok(!/\.(read|new)\s*=/.test(parity), 'parity code must not change read/new state');
const syncBlock = parity.match(/async function syncAllVisualTags\(\) \{[\s\S]*?\n\}/)?.[0] || '';
assert.ok(syncBlock.includes('for (const pin of pins) await syncPin(pin, parity)'), 'visual tag sync must visit pins even when feedback is disabled');
assert.ok(!syncBlock.includes('if (!parity.visualTagsEnabled) return'), 'disabling visual feedback must clean owned tags instead of returning early');

console.log('PASS: native parity contract');
