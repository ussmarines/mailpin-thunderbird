"use strict";

(() => {
  const STARTUP_WATCHDOG_MS = 20_000;
  const trace = [];
  let watchdog = null;
  let retryHandler = null;
  let retryInFlight = false;
  let interfaceReady = false;
  let terminalFailure = false;
  let lastStage = "html:loaded";

  const byId = id => document.getElementById(id);
  const cleanToken = value => String(value || "unknown")
    .replace(/[^a-z0-9:_-]/gi, "-")
    .slice(0, 80) || "unknown";

  function mark(stage) {
    lastStage = cleanToken(stage);
    if (trace.at(-1) !== lastStage) trace.push(lastStage);
    document.body.dataset.optionsStartupStage = lastStage;
  }

  function clearWatchdog() {
    if (watchdog !== null) {
      clearTimeout(watchdog);
      watchdog = null;
    }
  }

  function diagnosticFor(stage, error) {
    const name = cleanToken(error?.name || "Error");
    return `options:startup:${cleanToken(stage)}:${name}`;
  }

  function showLoading() {
    document.body.dataset.initializationState = "loading";
    document.body.removeAttribute("data-configuration-ready");
    const loading = byId("settings-loading");
    const failure = byId("settings-error");
    const form = byId("settings-form");
    if (loading) loading.hidden = false;
    if (failure) failure.hidden = true;
    if (form) {
      form.hidden = true;
      form.setAttribute("aria-busy", "true");
    }
  }

  function localizeStaticText() {
    const i18n = globalThis.messenger?.i18n;
    if (typeof i18n?.getMessage !== "function") return;
    const language = i18n.getUILanguage?.();
    if (language) document.documentElement.lang = String(language).split("-")[0];
    for (const element of document.querySelectorAll("[data-i18n]")) {
      if (element.childElementCount) continue;
      const value = i18n.getMessage(element.dataset.i18n);
      if (value) element.textContent = value;
    }
    for (const [selector, dataAttribute, targetAttribute] of [
      ["[data-i18n-placeholder]", "data-i18n-placeholder", "placeholder"],
      ["[data-i18n-title]", "data-i18n-title", "title"],
      ["[data-i18n-aria-label]", "data-i18n-aria-label", "aria-label"],
    ]) {
      for (const element of document.querySelectorAll(selector)) {
        const value = i18n.getMessage(element.getAttribute(dataAttribute));
        if (value) element.setAttribute(targetAttribute, value);
      }
    }
  }

  function fail(stage, error = null, diagnostic = "") {
    if (interfaceReady || terminalFailure) return;
    terminalFailure = true;
    clearWatchdog();
    mark("error");
    document.body.dataset.optionsStartupFailureStage = cleanToken(stage || lastStage);
    document.body.dataset.initializationState = "error";
    document.body.removeAttribute("data-configuration-ready");
    const loading = byId("settings-loading");
    const failure = byId("settings-error");
    const form = byId("settings-form");
    const code = byId("settings-error-diagnostic");
    if (loading) loading.hidden = true;
    if (failure) failure.hidden = false;
    if (form) {
      form.hidden = true;
      form.setAttribute("aria-busy", "true");
    }
    if (code) code.textContent = diagnostic || diagnosticFor(stage || lastStage, error);
  }

  function armWatchdog() {
    clearWatchdog();
    watchdog = setTimeout(() => {
      const timeout = new Error("Options startup watchdog expired.");
      timeout.name = "OptionsStartupTimeout";
      fail("watchdog", timeout, `options:startup:timeout:${cleanToken(lastStage)}`);
    }, STARTUP_WATCHDOG_MS);
  }

  function complete() {
    interfaceReady = true;
    terminalFailure = false;
    clearWatchdog();
    mark("ui:ready");
  }

  function setRetry(handler) {
    retryHandler = typeof handler === "function" ? handler : null;
  }

  async function retry() {
    if (retryInFlight) return;
    if (!retryHandler) {
      location.reload();
      return;
    }
    retryInFlight = true;
    interfaceReady = false;
    terminalFailure = false;
    showLoading();
    mark("retry:start");
    armWatchdog();
    try {
      await retryHandler();
    } catch (error) {
      fail("retry", error);
    } finally {
      retryInFlight = false;
    }
  }

  async function copyDiagnostic() {
    const diagnostic = byId("settings-error-diagnostic")?.textContent || "options:startup:error";
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable.");
      await navigator.clipboard.writeText(diagnostic);
    } catch {
      const source = byId("settings-error-diagnostic");
      const selection = window.getSelection();
      if (!source || !selection) return;
      const range = document.createRange();
      range.selectNodeContents(source);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function loadClassicScript(relativePath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(relativePath, document.baseURI).href;
      script.async = true;
      script.addEventListener("load", resolve, {once: true});
      script.addEventListener("error", () => {
        const error = new Error("Required options dependency could not be loaded.");
        error.name = "OptionsDependencyLoadError";
        reject(error);
      }, {once: true});
      document.head.append(script);
    });
  }

  const startup = Object.freeze({
    mark,
    fail,
    complete,
    setRetry,
    getTrace: () => [...trace]
  });
  Object.defineProperty(globalThis, "MailPinOptionsStartup", {
    value: startup,
    configurable: false,
    enumerable: false,
    writable: false
  });

  window.addEventListener("error", event => {
    if (interfaceReady) return;
    const error = event.error || new Error("Options resource or script error.");
    if (!event.error) error.name = "OptionsResourceError";
    const stage = lastStage === "settings:requested" ? "settings-load"
      : lastStage === "main:requested" ? "main-load"
        : "global-error";
    fail(stage, error);
  }, true);
  window.addEventListener("unhandledrejection", event => {
    if (!interfaceReady) fail("unhandled-rejection", event.reason || new Error("Unhandled startup rejection."));
  });

  byId("retry-settings-load")?.addEventListener("click", () => { void retry(); });
  byId("copy-settings-diagnostic")?.addEventListener("click", () => { void copyDiagnostic(); });

  mark("html:loaded");
  mark("bootstrap:loaded");
  localizeStaticText();
  showLoading();
  armWatchdog();

  void (async () => {
    try {
      mark("settings:requested");
      await loadClassicScript("../api/pinInbox/modules/settings.js");
      if (!globalThis.PinSettings) {
        const error = new Error("Settings registry did not initialize.");
        error.name = "OptionsSettingsRegistryError";
        throw error;
      }
      mark("settings:loaded");
      mark("main:requested");
      await import("./options.js");
      mark("main:evaluated");
      if (document.readyState === "loading") {
        await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, {once: true}));
      }
      mark("dom:ready");
      const main = globalThis.MailPinOptionsMain;
      if (typeof main?.startOptions !== "function") {
        const error = new Error("Options module has no startup entry point.");
        error.name = "OptionsEntryPointError";
        throw error;
      }
      await main.startOptions();
    } catch (error) {
      const stage = lastStage === "settings:requested" ? "settings-load"
        : lastStage === "main:requested" ? "main-load"
          : "main-start";
      fail(stage, error);
    }
  })();
})();
