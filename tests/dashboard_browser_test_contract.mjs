import assert from "node:assert/strict";
import fs from "node:fs";

const scenario = fs.readFileSync(new URL("./dashboard_dom_flow.playwright.js", import.meta.url), "utf8");
assert.match(scenario, /^async page => \{/);
assert.match(scenario, /extension\/_locales\/en\/messages\.json/);
assert.match(scenario, /viewSections = \{today: "today", list: "items"/);
assert.match(scenario, /English dashboard must not expose French UI text/);
assert.match(scenario, /scrollWidth <= overflow\.clientWidth \+ 1/);
assert.match(scenario, /colorScheme: "dark", reducedMotion: "reduce"/);
assert.match(scenario, /output\/playwright\/dashboard-en\.png/);
console.log("Real-browser dashboard test contract: OK");
