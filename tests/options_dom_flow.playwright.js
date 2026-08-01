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
      sessionStorage.setItem("mailperch-options-initialization-mode", String(mode));
    };
    const configuration = () => ({
      ...clone(readPersisted()),
      accounts: clone(accounts),
      stats: {pinned: 0, waiting: 0, overdue: 0, history: 0},
      storage: {backend: "test", database: "synthetic.sqlite", schemaVersion: 5},
      compatibility: {mode: "test", missing: []},
      providerMatrix: {checkedAt: 0, accounts: [], providers: [], calendars: []},
      performance: {renders: 0, averageRenderMs: 0, maxRenderMs: 0}
    });

    globalThis.__mailperchPointerEvents = {pointerdown: 0, pointerup: 0, click: 0};
    for (const type of Object.keys(globalThis.__mailperchPointerEvents)) {
      document.addEventListener(type, () => { globalThis.__mailperchPointerEvents[type] += 1; }, true);
    }

    globalThis.messenger = {
      pinInbox: new Proxy({}, {
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
          if (name === "getBackupStatus" || name === "getHealthReport") return async () => null;
          return async () => ({});
        }
      }),
      commands: {
        getAll: async () => [{name: "toggle-pin-selected", shortcut: "Alt+P"}],
        update: async () => {}
      },
      runtime: {
        getManifest: () => ({version: "3.2.9"}),
        getURL: path => path
      },
      i18n: {
        getUILanguage: () => "fr",
        getMessage: () => ""
      },
      tabs: {create: async () => ({})}
    };
  });

  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const waitReady = async () => {
    await page.waitForSelector("body[data-configuration-ready]");
    await page.waitForFunction(() => document.querySelector("#settings-form")?.hidden === false);
  };
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
  await waitReady();

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
  await page.waitForFunction(() => {
    const loading = document.querySelector("#settings-loading");
    const error = document.querySelector("#settings-error");
    const form = document.querySelector("#settings-form");
    return loading?.hidden && !error?.hidden && form?.hidden &&
      document.body.dataset.initializationState === "error";
  }, null, {timeout: 35_000});
  assert(await page.locator("#settings-error-diagnostic").textContent() === "options:init:timeout:configuration",
    "A non-settling configuration promise must produce a non-sensitive timeout diagnostic");

  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("normal"));
  await page.locator("#retry-settings-load").click();
  await waitReady();
  assert(await page.locator("#settings-error").isHidden(), "Retry must return the same document to the ready state");

  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("calendar-never"));
  await page.reload();
  await waitReady();
  assert(!(await page.locator("#settings-loading").isVisible()),
    "A non-settling optional calendar request must not hold the primary form");
  await page.evaluate(() => globalThis.__mailperchSetInitializationMode("normal"));

  return {
    controlsExercised: controls.length,
    finalMeta: await meta(),
    initialRecommended: {
      showSearch: initial.showSearch,
      showQuickActions: initial.showQuickActions,
      enableGlobalDashboard: initial.enableGlobalDashboard
    }
  };
}
