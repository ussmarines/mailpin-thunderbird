import fs from 'node:fs';
import assert from 'node:assert/strict';

const manifest = JSON.parse(fs.readFileSync(new URL('../extension/manifest.json', import.meta.url), 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, '2.0.1');
assert.ok(!('experiment_apis' in manifest));

for (const permission of [
  'menus',
  'messagesRead',
  'messagesUpdate',
  'messagesMove',
  'messagesDelete',
  'messagesTagsList',
  'storage',
  'alarms',
  'notifications'
]) {
  assert.ok(manifest.permissions.includes(permission), `missing permission ${permission}`);
}
assert.ok(!manifest.permissions.includes('accountsRead'));
assert.ok(!manifest.permissions.includes('compose'));
assert.equal(manifest.browser_specific_settings.gecko.id, 'ussmarines.mailpin@addons.thunderbird.net');
assert.equal(manifest.default_locale, 'en');

const background = fs.readFileSync(new URL('../extension/background.js', import.meta.url), 'utf8');
for (const token of [
  'headerMessageId',
  'messenger.storage.local',
  'messenger.alarms',
  'messenger.mailTabs.getSelectedMessages',
  'messenger.messages.query',
  'messenger.compose.beginReply'
]) {
  assert.ok(background.includes(token), `missing ${token}`);
}
assert.ok(!background.includes('pinInbox'));
assert.ok(!background.includes('onMessage.addListener(async'));

const dashboardHtml = fs.readFileSync(new URL('../extension/dashboard/dashboard.html', import.meta.url), 'utf8');
assert.ok(dashboardHtml.includes('smoke-hardening.css'));
assert.ok(dashboardHtml.includes('smoke-hardening.js'));
const hardening = fs.readFileSync(new URL('../extension/dashboard/smoke-hardening.js', import.meta.url), 'utf8');
assert.ok(hardening.includes('window.confirm'));
assert.ok(hardening.includes('syncSelectionControls'));
assert.ok(hardening.includes('Ctrl+S'));

for (const locale of ['en', 'fr']) {
  const messages = JSON.parse(fs.readFileSync(new URL(`../extension/_locales/${locale}/messages.json`, import.meta.url), 'utf8'));
  assert.ok(messages.extensionName?.message);
  assert.ok(messages.extensionDescription?.message);
}

console.log('PASS: native contract');
