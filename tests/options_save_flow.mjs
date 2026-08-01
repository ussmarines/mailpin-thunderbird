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
  applyConfiguration = config => { configuration = {...config, settings: {...config.settings}}; setDirty(false); setConfigurationReady(true); };
  reload = async () => { calls.push(["reload"]); configuration = {...persisted, settings: {...persisted.settings}}; };
  globalThis.__optionsHarness = {
    bind: installCriticalSettingsActions,
    ready() { configuration = {...persisted, settings: {...persisted.settings}}; setConfigurationReady(true); },
    status() { return document.getElementById("status-message").textContent; },
    setDirty,
    failSave() { messenger.pinInbox.setConfiguration = async () => { throw new Error("échec API"); }; }
  };`;
vm.runInNewContext(source, context, {filename: "options.js"});
context.__optionsHarness.bind();
context.__optionsHarness.ready();

context.__optionsHarness.setDirty(true);
await get("save-all-floating").activate();
assert.equal(calls.filter(([name]) => name === "set").length, 1);
assert.ok(calls.filter(([name]) => name === "get").length >= 1);
assert.equal(context.__optionsHarness.status(), "Paramètres enregistrés.");

context.__optionsHarness.setDirty(true);
await get("discard-changes").activate();
assert.ok(calls.some(([name]) => name === "reload"));
assert.equal(context.__optionsHarness.status(), "Modifications annulées.");

context.__optionsHarness.setDirty(true);
context.__optionsHarness.failSave();
await get("save-all-floating").activate();
assert.match(context.__optionsHarness.status(), /Erreur : échec API/);
console.log("Options save/cancel integration harness: OK");
