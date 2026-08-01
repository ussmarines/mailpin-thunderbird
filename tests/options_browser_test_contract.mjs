#!/usr/bin/env node
/* Guards the scope of the real Playwright options test without replacing its
 * browser execution with a synthetic DOM implementation. */
import assert from "node:assert/strict";
import fs from "node:fs";

const scenario = fs.readFileSync(new URL("./options_dom_flow.playwright.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../extension/options/options.html", import.meta.url), "utf8");

for (const required of [
  "page.goto(optionsUrl)",
  "page.locator(\"#save-all-floating\").click()",
  "pointerdown",
  "pointerup",
  "elementFromPoint",
  "[data-setting-key][data-setting-dirty='true']",
  "Manual return to every persisted value",
  "A failed save must keep an actionable draft",
  "An explicit false from an older version must be preserved",
  "A missing key must receive its recommendation",
  "A missing settings object must display safe recommendations as active"
]) {
  assert.ok(scenario.includes(required), `Missing real-browser assertion: ${required}`);
}

assert.ok(scenario.includes("page.reload()"), "Persistence must be tested after page reconstruction");
assert.ok(scenario.includes("#discard-changes"), "Cancel must be exercised through the visible control");
assert.ok(!scenario.includes("class Element"), "The browser scenario must not use a synthetic DOM harness");
assert.ok(html.includes("../api/pinInbox/modules/settings.js"), "Options must load the shared settings registry");

console.log("Real-browser options test contract: OK");
