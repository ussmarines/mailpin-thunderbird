#!/usr/bin/env node
/* Runs the production save/cancel handlers with a small extension-page DOM
 * harness, including direct button activation and an API failure. */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

class Element {
  constructor(id = "") { this.id = id; this.value = ""; this.checked = false; this.disabled = false; this.dataset = {}; this.attributes = new Map(); this.listeners = new Map(); this.className = ""; this.isConnected = true; this.textContent = ""; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  async activate() { const listener = this.listeners.get("click"); assert.ok(listener, `${this.id} needs a direct click listener`); await listener({currentTarget: this, preventDefault() {}, stopPropagation() {}}); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  toggleAttribute(name, force) { if (force) this.setAttribute(name, ""); else this.removeAttribute(name); }
  closest() { return null; }
}

const elements = new Map();
const get = id => elements.get(id) || (elements.set(id, new Element(id)), elements.get(id));
const document = {body: new Element("body"), getElementById: get, addEventListener() {}, querySelectorAll() { return []; }, createElement() { return new Element(); }};
const calls = [];
const persisted = {settings: {pinMode: "independent", cardLines: 3}, groups: [], rules: [], cases: [], templates: []};
const messenger = {pinInbox: {async setConfiguration(request) { calls.push(["set", request]); return persisted; }, async getConfiguration() { calls.push(["get"]); return persisted; }}, commands: {async getAll() { return [{name: "toggle-pin-selected", shortcut: "Alt+P"}]; }}};
const context = {console, document, messenger, persisted, calls, HTMLElement: Element, HTMLButtonElement: Element, setTimeout, clearTimeout, Promise, Map, Set, Number, String, Boolean, Object, Array, Date, Error, globalThis: null, window: {addEventListener() {}}};
context.globalThis = context;
let source = fs.readFileSync(new URL("../extension/options/options.js", import.meta.url), "utf8");
source += `
  applyConfiguration = config => { configuration = {...config, settings: {...config.settings}}; document.getElementById("pinMode").value = config.settings.pinMode; setConfigurationReady(true); rememberPersistedDraft(); setDirty(false); };
  reload = async () => { calls.push(["reload"]); applyConfiguration(persisted); };
  globalThis.__optionsHarness = {
    bind: installCriticalSettingsActions,
    ready() { applyConfiguration(persisted); },
    status() { return document.getElementById("status-message").textContent; },
    changePinMode(value) { document.getElementById("pinMode").value = value; syncDirtyState(); },
    state() { return {dirty, dockHidden: document.getElementById("save-dock").hidden, saveDisabled: document.getElementById("save-all-floating").disabled, discardDisabled: document.getElementById("discard-changes").disabled}; },
    failSave() { messenger.pinInbox.setConfiguration = async () => { throw new Error("échec API"); }; }
  };`;
vm.runInNewContext(source, context, {filename: "options.js"});
context.__optionsHarness.bind();
context.__optionsHarness.ready();

const assertState = expected => assert.equal(JSON.stringify(context.__optionsHarness.state()), JSON.stringify(expected));

context.__optionsHarness.changePinMode("nativeStar");
assertState({dirty: true, dockHidden: false, saveDisabled: false, discardDisabled: false});
await get("save-all-floating").activate();
assert.equal(calls.filter(([name]) => name === "set").length, 1);
assert.ok(calls.filter(([name]) => name === "get").length >= 1);
assert.equal(context.__optionsHarness.status(), "Paramètres enregistrés.");

context.__optionsHarness.changePinMode("nativeStar");
await get("discard-changes").activate();
assert.ok(calls.some(([name]) => name === "reload"));
assert.equal(context.__optionsHarness.status(), "Modifications annulées.");

context.__optionsHarness.changePinMode("nativeStar");
context.__optionsHarness.failSave();
await get("save-all-floating").activate();
assert.match(context.__optionsHarness.status(), /Erreur : échec API/);
assertState({dirty: true, dockHidden: false, saveDisabled: false, discardDisabled: false});

context.__optionsHarness.changePinMode("independent");
assertState({dirty: false, dockHidden: true, saveDisabled: true, discardDisabled: true});
console.log("Options save/cancel integration harness: OK");
