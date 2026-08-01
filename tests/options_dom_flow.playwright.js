async page => {
  const baseUrl = "http://127.0.0.1:8765";
  const optionsUrl = `${baseUrl}/extension/options/options.html`;

  await page.goto(baseUrl);
  await page.evaluate(() => localStorage.clear());
  await page.addInitScript(() => {
    const STORAGE_KEY = "mailperch-options-dom-persisted";
    const META_KEY = "mailperch-options-dom-meta";
    const clone = value => JSON.parse(JSON.stringify(value));
    const accounts = [{
      key: "account-test",
      name: "Compte synthétique",
      email: "",
      color: "#0f6cbd",
      defaultColor: "#0f6cbd",
      protocol: "none",
      provider: "test",
      inboxes: [{uri: "mailbox://synthetic/Inbox", name: "Boîte synthétique", enabled: true}]
    }];
    const initial = {
      settings: {},
      groups: [{id: "group-test", name: "Groupe synthétique", color: "#6264a7", updatedAt: 1}],
      rules: [],
      cases: [],
      templates: []
    };
    globalThis.__mailperchCalendarCreates = [];
    const readPersisted = () => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || clone(initial); }
      catch { return clone(initial); }
    };
    const writePersisted = value => localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    const readMeta = () => {
      try { return JSON.parse(localStorage.getItem(META_KEY)) || {gets: 0, setAttempts: 0, writes: 0, failSave: false}; }
      catch { return {gets: 0, setAttempts: 0, writes: 0, failSave: false}; }
    };
    const writeMeta = value => localStorage.setItem(META_KEY, JSON.stringify(value));
    const initializationMode = () => sessionStorage.getItem("mailperch-options-initialization-mode") || "normal";
    globalThis.__mailperchSetInitializationMode = mode => {
      const value = String(mode);
      sessionStorage.setItem("mailperch-options-initialization-mode", value);
      if (value === "api-absent") delete globalThis.messenger?.pinInbox;
      else if (globalThis.messenger && typeof pinInbox !== "undefined") globalThis.messenger.pinInbox = pinInbox;
    };
    const configuration = () => {
      const value = {
        ...clone(readPersisted()),
        accounts: clone(accounts),
        stats: {pinned: 0, waiting: 0, overdue: 0, history: 0},
        storage: {backend: "test", database: "synthetic.sqlite", schemaVersion: 5},
        compatibility: {mode: "test", missing: []},
        providerMatrix: {checkedAt: 0, accounts: [], providers: [], calendars: []},
        performance: {renders: 0, averageRenderMs: 0, maxRenderMs: 0}
      };
      if (initializationMode() === "normalization-throw") {
        value.settings = new Proxy({}, {
          get() { throw new TypeError("synthetic normalization failure"); }
        });
      }
      return value;
    };

    globalThis.__mailperchPointerEvents = {pointerdown: 0, pointerup: 0, click: 0};
    for (const type of Object.keys(globalThis.__mailperchPointerEvents)) {
      document.addEventListener(type, () => { globalThis.__mailperchPointerEvents[type] += 1; }, true);
    }

    const pinInbox = new Proxy({}, {
        get(_target, name) {
          if (name === "getConfiguration") {
            return async () => {
              const meta = readMeta();
              meta.gets += 1;
              writeMeta(meta);
              if (initializationMode() === "configuration-never") return new Promise(() => {});
              if (initializationMode() === "configuration-reject") throw new Error("échec de configuration synthétique");
              return configuration();
            };
          }
          if (name === "setConfiguration") {
            return async requested => {
              const meta = readMeta();
              meta.setAttempts += 1;
              writeMeta(meta);
              if (meta.failSave) throw new Error("échec API synthétique");
              writePersisted({
                settings: clone(requested.settings),
                groups: clone(requested.groups),
                rules: clone(requested.rules),
                cases: clone(requested.cases),
                templates: clone(requested.templates)
              });
              meta.writes += 1;
              writeMeta(meta);
              return configuration();
            };
          }
          if (name === "getCalendars") {
            if (initializationMode() === "calendar-never") return () => new Promise(() => {});
            return async () => [{
              id: "calendar-test",
              name: "Agenda synthétique",
              type: "memory",
              writable: true,
              taskCompatible: true,
              eventCompatible: true,
              reason: ""
            }];
          }
          if (name === "createCaseCalendarItem") {
            return async (...args) => {
              globalThis.__mailperchCalendarCreates.push(args);
              return {created: true, calendarId: args[2], itemId: "calendar-item-test", itemType: args[1]};
            };
          }
          if (name === "getBackupStatus" || name === "getHealthReport") return async () => null;
          return async () => ({});
        }
      });
    globalThis.messenger = {
      commands: {
        getAll: async () => [{name: "toggle-pin-selected", shortcut: "Alt+P"}],
        update: async () => {}
      },
      runtime: {
        getManifest: () => ({version: "3.2.10"}),
        getURL: path => path
      },
      i18n: {
        getUILanguage: () => "fr",
        getMessage: key => String(key)
      },
      tabs: {create: async () => ({})}
    };
    if (initializationMode() === "api-delayed") {
      setTimeout(() => { globalThis.messenger.pinInbox = pinInbox; }, 150);
    } else if (initializationMode() !== "api-absent") {
      globalThis.messenger.pinInbox = pinInbox;
    }
  });

  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const waitReady = async () => {
    await page.waitForSelector("body[data-configuration-ready]");
    await page.waitForFunction(() => document.querySelector("#settings-form")?.hidden === false);
  };
  const waitStartupError = async () => {
    await page.waitForFunction(() => {
      const loading = document.querySelector("#settings-loading");
      const error = document.querySelector("#settings-error");
      const form = document.querySelector("#settings-form");
      return loading?.hidden && !error?.hidden && form?.hidden &&
        document.body.dataset.initializationState === "error";
    }, null, {timeout: 12_000});
  };
  const startupState = () => page.evaluate(() => ({
    trace: globalThis.MailPerchOptionsStartup?.getTrace?.() || [],
    stage: document.body.dataset.optionsStartupStage || "",
    failureStage: document.body.dataset.optionsStartupFailureStage || "",
    diagnostic: document.querySelector("#settings-error-diagnostic")?.textContent || ""
  }));
  const dockState = () => page.evaluate(() => {
    const dock = document.querySelector("#save-dock");
    const save = document.querySelector("#save-all-floating");
    const discard = document.querySelector("#discard-changes");
    const style = getComputedStyle(dock);
    const rect = dock.getBoundingClientRect();
    const saveRect = save.getBoundingClientRect();
    const point = saveRect.width && saveRect.height
      ? document.elementFromPoint(saveRect.left + saveRect.width / 2, saveRect.top + saveRect.height / 2)
      : null;
    return {
      dirty: document.body.hasAttribute("data-dirty"),
      hidden: dock.hidden,
      ariaHidden: dock.getAttribute("aria-hidden"),
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      rect: {top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height},
      viewportHeight: innerHeight,
      saveDisabled: save.disabled,
      saveAriaDisabled: save.getAttribute("aria-disabled"),
      discardDisabled: discard.disabled,
      discardAriaDisabled: discard.getAttribute("aria-disabled"),
      saveCursor: getComputedStyle(save).cursor,
      saveHit: point === save || save.contains(point)
    };
  });
  const meta = () => page.evaluate(() => JSON.parse(localStorage.getItem("mailperch-options-dom-meta")));
  const setMeta = values => page.evaluate(values => {
    const key = "mailperch-options-dom-meta";
    const current = JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify({...current, ...values}));
  }, values);
  const setPersisted = value => page.evaluate(value => {
    localStorage.setItem("mailperch-options-dom-persisted", JSON.stringify(value));
  }, value);

  await page.goto(optionsUrl);
  assert(await page.locator("#import-file").count() === 1,
    "Localization must not remove the nested restore file input");
  await waitReady();
  const successfulStartup = await startupState();
  for (const stage of [
    "html:loaded", "bootstrap:loaded", "settings:requested", "settings:loaded",
    "main:requested", "main:evaluated", "dom:ready", "options:init:start",
    "api:namespace-present", "api:getConfiguration:start",
    "options:getConfiguration:resolved", "ui:ready"
  ]) {
    assert(successfulStartup.trace.includes(stage), `Successful startup must report ${stage}`);
  }

  const initial = await page.evaluate(() => ({
    formHidden: document.querySelector("#settings-form").hidden,
    loadingHidden: document.querySelector("#settings-loading").hidden,
    showSearch: document.querySelector("#showSearch").checked,
    showQuickActions: document.querySelector("#showQuickActions").checked,
    enableGlobalDashboard: document.querySelector("#enableGlobalDashboard").checked,
    enableAutomaticRules: document.querySelector("#enableAutomaticRules").checked,
    safeMode: document.querySelector("#safeMode").checked,
    registered: document.querySelectorAll("#settings-form [data-setting-key]").length,
    missingMetadata: [...document.querySelectorAll("#settings-form [data-setting-key]")]
      .filter(control => !control.dataset.settingType || !control.dataset.settingMigration).map(control => control.id)
  }));
  assert(!initial.formHidden && initial.loadingHidden, "The initialized form must replace the loading state");
  assert(initial.showSearch && initial.showQuickActions && initial.enableGlobalDashboard,
    "A missing settings object must display safe recommendations as active");
  assert(!initial.enableAutomaticRules && !initial.safeMode,
    "Opt-in automation and safe mode must keep their recommended values");
  assert(initial.registered >= 90 && initial.missingMetadata.length === 0,
    "Every registered DOM control must expose type and migration metadata");

  let state = await dockState();
  assert(!state.dirty && state.hidden && state.ariaHidden === "true", "The initial draft must be clean");

  // A setting card has one visual source of truth: the native checkbox. The
  // label click and keyboard activation must keep the draft and card in sync.
  const rulesToggle = page.locator("#enableAutomaticRules");
  const rulesCard = rulesToggle.locator("xpath=ancestor::label[contains(@class, 'setting-toggle')]");
  assert(await rulesCard.getAttribute("data-enabled") === "false", "Unchecked setting cards must be visibly inactive");
  await rulesToggle.focus();
  await page.keyboard.press("Space");
  assert(await rulesToggle.isChecked() && await rulesCard.getAttribute("data-enabled") === "true",
    "Keyboard checkbox activation must activate exactly the matching card");
  await rulesCard.click();
  assert(!(await rulesToggle.isChecked()) && await rulesCard.getAttribute("data-enabled") === "false",
    "Clicking a card must perform one native checkbox change and restore the inactive appearance");

  // Generated case/template/rule fields use visible labels and real bounds.
  await page.locator("#add-case").click();
  await page.locator("#add-template").click();
  await page.locator("#add-rule").click();
  const dynamicFields = page.locator(".case-editor-row input, .case-editor-row select, .template-row input, .template-row select, .rule-row input, .rule-row select");
  const missingDynamicNames = await dynamicFields.evaluateAll(nodes => nodes.filter(control => {
    const labelled = control.getAttribute("aria-label") || control.labels?.[0]?.textContent?.trim();
    return !labelled;
  }).map(control => control.outerHTML));
  assert(missingDynamicNames.length === 0, "Every generated model, rule and case field must have an accessible visible name");
  const caseAgenda = page.locator(".case-editor-row button").filter({hasText: "Agenda"});
  await caseAgenda.click();
  assert((await page.evaluate(() => globalThis.__mailperchCalendarCreates.length)) === 0,
    "A case without a due date must not call the Calendar API");
  await page.locator("#simulate-rules").click();
  const simulationGeometry = await page.evaluate(() => {
    const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const result = document.querySelector("#rule-simulation").getBoundingClientRect();
    return [...document.querySelectorAll("#simulate-rules, #simulate-rules + .button-help, #clear-rule-log, #add-rule")]
      .map(node => node.getBoundingClientRect()).some(rect => overlaps(result, rect));
  });
  assert(!simulationGeometry, "The simulation result must not overlap its button, help or actions");

  // Use a real select interaction and a real save-button click. The visible
  // click path must issue one write, read it back and persist after reload.
  await page.locator("#settingsExperience").selectOption("advanced");
  state = await dockState();
  assert(state.dirty && !state.hidden && state.ariaHidden === "false", "A real change must show the save dock");
  assert(state.display !== "none" && state.visibility === "visible" && state.opacity === "1",
    "The save dock must be visibly rendered");
  assert(state.pointerEvents === "auto" && state.rect.bottom <= state.viewportHeight && state.rect.height > 0,
    "The save dock must remain inside the viewport and pointer-accessible");
  assert(!state.saveDisabled && !state.discardDisabled && state.saveHit,
    "Save and Cancel must be enabled and hit-testable");
  assert(state.saveAriaDisabled === "false" && state.discardAriaDisabled === "false" && state.saveCursor === "pointer",
    "Interactive semantics and cursor must match the enabled controls");
  const beforeSave = await meta();
  await page.locator("#save-all-floating").click();
  await page.waitForFunction(() => document.querySelector("#save-dock").hidden);
  const afterSave = await meta();
  assert(afterSave.setAttempts - beforeSave.setAttempts === 1, "One click must invoke one save handler");
  assert(afterSave.writes - beforeSave.writes === 1, "One click must produce exactly one successful write");
  assert(afterSave.gets - beforeSave.gets >= 1, "Save must read the persisted configuration back");
  const savedFeedback = await page.evaluate(() => ({
    toast: document.querySelector("#status-message").textContent,
    local: [...document.querySelectorAll(".control-feedback[data-active='true']")].map(item => item.textContent),
    pointer: globalThis.__mailperchPointerEvents
  }));
  assert(savedFeedback.toast === "Paramètres enregistrés.", "Save must show a truthful success notification");
  assert(savedFeedback.pointer.pointerdown > 0 && savedFeedback.pointer.pointerup > 0 && savedFeedback.pointer.click > 0,
    "The test must exercise pointerdown, pointerup and click events");

  await page.reload();
  await waitReady();
  assert(await page.locator("#settingsExperience").inputValue() === "advanced",
    "The saved setting must survive page reconstruction");
  assert((await dockState()).hidden, "Reloaded persisted settings must start clean");
  const advancedSummaries = page.locator("details.advanced-group > summary");
  for (let index = 0; index < await advancedSummaries.count(); index += 1) {
    const summary = advancedSummaries.nth(index);
    if (!await summary.evaluate(node => node.parentElement.open)) await summary.click();
  }

  const mutate = async (locator, control) => {
    const tag = await locator.evaluate(node => node.tagName);
    const type = await locator.getAttribute("type") || "";
    if (type === "checkbox") {
      const checked = await locator.isChecked();
      await locator.setChecked(!checked);
      return () => locator.setChecked(checked);
    }
    if (type === "color") {
      const original = await locator.inputValue();
      const changed = original.toLowerCase() === "#123456" ? "#654321" : "#123456";
      await locator.fill(changed);
      return () => locator.fill(original);
    }
    if (tag === "SELECT") {
      const original = await locator.inputValue();
      const alternative = await locator.evaluate((node, current) =>
        [...node.options].find(option => !option.disabled && option.value !== current)?.value ?? null, original);
      assert(alternative !== null, `Select ${control.id} needs an alternative test option`);
      await locator.selectOption(alternative);
      return () => locator.selectOption(original);
    }
    if (type === "number") {
      const original = await locator.inputValue();
      const bounds = await locator.evaluate(node => ({min: Number(node.min), max: Number(node.max)}));
      const numeric = Number(original);
      const changed = numeric < bounds.max ? numeric + 1 : numeric - 1;
      await locator.fill(String(changed));
      return () => locator.fill(original);
    }
    const original = await locator.inputValue();
    await locator.fill(`${original}${original ? "\n" : ""}valeur-synthétique`);
    return () => locator.fill(original);
  };

  // Every configurable, dirty-participating DOM control is changed one at a
  // time using Playwright's actual form interactions. Returning manually to
  // the persisted value must hide the dock without writing.
  const controls = await page.evaluate(() => [...document.querySelectorAll("#settings-form [data-setting-key][data-setting-dirty='true']")]
    .map((control, index) => ({id: control.id, index, key: control.dataset.settingKey}))
    .sort((left, right) => Number(left.key === "settingsExperience") - Number(right.key === "settingsExperience")));
  const writesBeforeMatrix = (await meta()).writes;
  for (const control of controls) {
    const locator = control.id
      ? page.locator(`#${control.id}`).first()
      : page.locator("#settings-form [data-setting-key][data-setting-dirty='true']").nth(control.index);
    const restore = await mutate(locator, control);
    assert(!(await dockState()).hidden, `Changing ${control.key} must show the save dock`);
    await restore();
    await page.waitForFunction(() => document.querySelector("#save-dock").hidden);
  }
  assert((await meta()).writes === writesBeforeMatrix,
    "Manual return to every persisted value must not write");

  // Combined sections and generated entities are restored by a real Cancel
  // click without calling setConfiguration.
  await page.locator("#showSearch").uncheck();
  await page.locator("#enableAutomaticRules").check();
  await page.locator("#backupRetention").fill("12");
  await page.locator("#add-template").click();
  const templatesBeforeCancel = await page.locator("#templates-list .template-row").count();
  assert(templatesBeforeCancel > 0 && !(await dockState()).hidden,
    "Combined and dynamic edits must share the dirty state");
  const beforeCancel = await meta();
  await page.locator("#discard-changes").click();
  await page.waitForFunction(() => document.querySelector("#save-dock").hidden);
  const afterCancel = await meta();
  assert(afterCancel.writes === beforeCancel.writes && afterCancel.setAttempts === beforeCancel.setAttempts,
    "Cancel must not write");
  assert(await page.locator("#showSearch").isChecked(), "Cancel must restore static controls");
  assert(await page.locator("#templates-list .template-row").count() === 0,
    "Cancel must restore generated components");

  // A failed write keeps the draft and dock, re-enables both actions and does
  // not display a success message.
  await setMeta({failSave: true});
  await page.locator("#showSearch").uncheck();
  const beforeFailure = await meta();
  await page.locator("#save-all-floating").click();
  await page.waitForFunction(() => document.querySelector("#status-message").textContent.includes("échec API synthétique"));
  state = await dockState();
  const afterFailure = await meta();
  assert(afterFailure.setAttempts - beforeFailure.setAttempts === 1 && afterFailure.writes === beforeFailure.writes,
    "A failed save must be attempted once and must not count as a write");
  assert(state.dirty && !state.hidden && !state.saveDisabled && !state.discardDisabled,
    "A failed save must keep an actionable draft");
  assert(!(await page.locator("#status-message").textContent()).includes("Paramètres enregistrés"),
    "A failed save must never report success");
  await setMeta({failSave: false});
  await page.locator("#discard-changes").click();
  await page.waitForFunction(() => document.querySelector("#save-dock").hidden);

  // Partial, explicit-false, older and invalid configurations are rendered by
  // the production normalizer. No test-side defaults are supplied.
  await setPersisted({settings: {schemaVersion: 5, showSearch: false}, groups: [], rules: [], cases: [], templates: []});
  await page.reload();
  await waitReady();
  assert(!(await page.locator("#showSearch").isChecked()), "An explicit false from an older version must be preserved");
  assert(await page.locator("#showQuickActions").isChecked(), "A missing key must receive its recommendation");
  await setPersisted({settings: {showSearch: "false", pinMode: "invalid"}, groups: [], rules: [], cases: [], templates: []});
  await page.reload();
  await waitReady();
  assert(await page.locator("#showSearch").isChecked(), "An invalid boolean must fall back to the recommendation");
  assert(await page.locator("#pinMode").inputValue() === "independent", "An invalid enum must be normalized");

  // The actual page must leave the loader after an API promise never settles,
  // then allow a user-driven retry without reconstructing the document.
  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("configuration-never"));
  await page.reload();
  await waitStartupError();
  assert(await page.locator("#settings-error-diagnostic").textContent() === "options:init:timeout:configuration",
    "A non-settling configuration promise must produce a non-sensitive timeout diagnostic");

  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("normal"));
  await page.locator("#retry-settings-load").click();
  await waitReady();
  assert(await page.locator("#settings-error").isHidden(), "Retry must return the same document to the ready state");

  // The namespace can be absent, delayed or immediately available. Absence is
  // terminal and retryable; a delayed Experiment registration must still reach
  // the same complete startup trace.
  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("api-absent"));
  await page.reload();
  await waitStartupError();
  assert((await startupState()).diagnostic === "options:init:timeout:api-namespace",
    "A missing Experiment namespace must end with a bounded diagnostic");
  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("normal"));
  await page.locator("#retry-settings-load").click();
  await waitReady();

  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("api-delayed"));
  await page.reload();
  await waitReady();
  assert((await startupState()).trace.includes("api:namespace-present"),
    "A delayed Experiment namespace must be observed before configuration");

  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("configuration-reject"));
  await page.reload();
  await waitStartupError();
  assert((await startupState()).diagnostic === "options:init:error:Error",
    "A rejected configuration request must become a visible error");
  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("normal"));
  await page.locator("#retry-settings-load").click();
  await waitReady();

  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("normalization-throw"));
  await page.reload();
  await waitStartupError();
  assert((await startupState()).diagnostic === "options:init:error:TypeError",
    "A normalization exception must become a visible error");
  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("normal"));
  await page.locator("#retry-settings-load").click();
  await waitReady();

  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("calendar-never"));
  await page.reload();
  await waitReady();
  assert(!(await page.locator("#settings-loading").isVisible()),
    "A non-settling optional calendar request must not hold the primary form");
  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("normal"));

  // Bootstrap failures are tested against the production HTML and bootstrap.
  // Only the requested dependency response is fault-injected.
  const missingMain = route => route.fulfill({status: 404, contentType: "text/plain", body: "missing"});
  await page.route("**/options.js", missingMain);
  await page.goto(`${optionsUrl}?startup=main-absent`);
  await waitStartupError();
  let bootFailure = await startupState();
  assert(bootFailure.failureStage === "main-load" && bootFailure.trace.includes("bootstrap:loaded") &&
    !bootFailure.trace.includes("main:evaluated"),
  "A missing main module must remain diagnosable from the standalone bootstrap");
  await page.unroute("**/options.js", missingMain);
  await page.locator("#retry-settings-load").click();
  await waitReady();

  const rejectedImport = route => route.abort("failed");
  await page.route("**/options.js", rejectedImport);
  await page.goto(`${optionsUrl}?startup=import-rejected`);
  await waitStartupError();
  bootFailure = await startupState();
  assert(bootFailure.failureStage === "main-load" && bootFailure.diagnostic.startsWith("options:startup:main-load:"),
    "A rejected dynamic import must show a terminal module diagnostic");
  await page.unroute("**/options.js", rejectedImport);

  const throwingMain = route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "throw new TypeError('synthetic top-level failure');"
  });
  await page.route("**/options.js", throwingMain);
  await page.goto(`${optionsUrl}?startup=top-level-exception`);
  await waitStartupError();
  bootFailure = await startupState();
  assert(bootFailure.failureStage === "main-load" && bootFailure.diagnostic.endsWith(":TypeError"),
    "A top-level module exception must show its expurgated error type");
  await page.unroute("**/options.js", throwingMain);

  const missingSettings = route => route.abort("failed");
  await page.route("**/settings.js", missingSettings);
  await page.goto(`${optionsUrl}?startup=settings-absent`);
  await waitStartupError();
  bootFailure = await startupState();
  assert(bootFailure.failureStage === "settings-load" && bootFailure.trace.includes("settings:requested") &&
    !bootFailure.trace.includes("main:requested"),
  "A missing settings registry must fail before the main module is requested");
  await page.unroute("**/settings.js", missingSettings);
  await page.locator("#retry-settings-load").click();
  await waitReady();

  return {
    controlsExercised: controls.length,
    finalMeta: await meta(),
    startupStages: (await startupState()).trace.length,
    initialRecommended: {
      showSearch: initial.showSearch,
      showQuickActions: initial.showQuickActions,
      enableGlobalDashboard: initial.enableGlobalDashboard
    }
  };
}
