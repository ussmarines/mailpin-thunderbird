"use strict";

const $ = selector => document.querySelector(selector);
const t = (key, substitutions) => messenger.i18n.getMessage(key, substitutions) || key;
const send = (type, payload = {}) => messenger.runtime.sendMessage({type, ...payload});

function localizeDocument() {
  document.documentElement.lang = messenger.i18n.getUILanguage().split("-")[0] || "en";
  document.title = t("optionsTitle");
  document.querySelectorAll("[data-i18n]").forEach(node => {
    node.textContent = t(node.dataset.i18n);
  });
}

function setError(error) {
  $("#status").textContent = t("errorPrefix", String(error?.message || error));
}

async function load() {
  const data = await send("mailpin:list");
  $("#notifications").checked = data.settings.notifications !== false;
  $("#openMessageIn").value = data.settings.openMessageIn || "tab";
  $("#defaultView").value = data.settings.defaultView || "active";
}

localizeDocument();

$("#save").addEventListener("click", async () => {
  try {
    await send("mailpin:settings", {
      settings: {
        notifications: $("#notifications").checked,
        openMessageIn: $("#openMessageIn").value,
        defaultView: $("#defaultView").value
      }
    });
    $("#status").textContent = t("saved");
    setTimeout(() => {
      $("#status").textContent = "";
    }, 2000);
  } catch (error) {
    setError(error);
  }
});

$("#export").addEventListener("click", async () => {
  try {
    const state = await send("mailpin:export");
    const blob = new Blob([JSON.stringify(state, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mailpin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    setError(error);
  }
});

$("#import").addEventListener("change", async event => {
  try {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) throw new Error(t("fileTooLarge"));
    const state = JSON.parse(await file.text());
    if (state?.schemaVersion !== 2) throw new Error(t("backupRequired"));
    await send("mailpin:import", {state});
    $("#status").textContent = t("importDone");
    await load();
  } catch (error) {
    setError(error);
  } finally {
    event.target.value = "";
  }
});

load().catch(setError);
