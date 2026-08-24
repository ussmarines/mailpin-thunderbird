"use strict";

const t = key => messenger.i18n.getMessage(key) || key;
const detail = document.querySelector("#detail");
const bulkAction = document.querySelector("#bulk-action");
const selectAll = document.querySelector("#select-all");

function isDangerButton(button) {
  return button instanceof HTMLButtonElement && button.classList.contains("danger-button");
}

function confirmDanger(event) {
  const button = event.target.closest("button");
  if (!isDangerButton(button)) return;
  const label = button.textContent.trim() || t("unpin");
  if (window.confirm(`${label} ?`)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function selectedCheckboxes() {
  return [...document.querySelectorAll(".pin-select:checked")];
}

function syncSelectionControls() {
  const all = [...document.querySelectorAll(".pin-select")];
  const selected = selectedCheckboxes();
  if (bulkAction) bulkAction.disabled = selected.length === 0;
  if (selectAll) {
    selectAll.checked = all.length > 0 && selected.length === all.length;
    selectAll.indeterminate = selected.length > 0 && selected.length < all.length;
  }
}

function markPrimarySave() {
  if (!detail || detail.classList.contains("empty")) return;
  for (const button of detail.querySelectorAll("button")) {
    if (button.textContent.trim() === t("save")) {
      button.classList.add("primary-save");
      button.title = "Ctrl+S";
    }
  }
}

function triggerSave(event) {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;
  const save = detail?.querySelector(".primary-save");
  if (!save) return;
  event.preventDefault();
  save.click();
}

document.addEventListener("click", confirmDanger, true);
document.addEventListener("change", event => {
  if (event.target.matches(".pin-select, #select-all")) queueMicrotask(syncSelectionControls);
});
document.addEventListener("keydown", triggerSave);

const observer = new MutationObserver(() => {
  markPrimarySave();
  syncSelectionControls();
});
observer.observe(document.body, {subtree: true, childList: true});

markPrimarySave();
syncSelectionControls();
