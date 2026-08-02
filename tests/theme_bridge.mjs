#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../extension/styles/theme.js", import.meta.url), "utf8");
const settle = () => new Promise(resolve => setImmediate(resolve));

function harness({darkPreference = false, currentTheme = null} = {}) {
  let mediaListener = null;
  let themeListener = null;
  const root = {dataset: {}, style: {}};
  const media = {
    matches: darkPreference,
    addEventListener(type, listener) { if (type === "change") mediaListener = listener; }
  };
  const theme = currentTheme === null ? undefined : {
    getCurrent: async () => currentTheme,
    onUpdated: {addListener(listener) { themeListener = listener; }}
  };
  const context = vm.createContext({
    document: {documentElement: root},
    matchMedia: query => {
      assert.equal(query, "(prefers-color-scheme: dark)");
      return media;
    },
    messenger: theme ? {theme} : {},
    browser: undefined,
    globalThis: null,
    String, Number, Math, Object, Array, RegExp, Promise, setImmediate
  });
  context.globalThis = context;
  vm.runInContext(source, context, {filename: "theme.js"});
  return {root, media, getMediaListener: () => mediaListener, getThemeListener: () => themeListener};
}

{
  const test = harness({darkPreference: false, currentTheme: {colors: {toolbar: "#1f1f1f"}}});
  await settle();
  assert.equal(test.root.dataset.mpTheme, "dark");
  assert.equal(test.root.style.colorScheme, "dark");
  test.getThemeListener()({theme: {colors: {toolbar: "#ffffff"}}});
  assert.equal(test.root.dataset.mpTheme, "light");
}

{
  const test = harness({darkPreference: true});
  await settle();
  assert.equal(test.root.dataset.mpTheme, "dark");
  test.media.matches = false;
  await test.getMediaListener()();
  assert.equal(test.root.dataset.mpTheme, "light");
}

console.log("Thunderbird theme bridge: OK");
