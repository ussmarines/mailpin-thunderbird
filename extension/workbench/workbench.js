"use strict";
const api = globalThis.messenger || globalThis.browser;
const native = globalThis.MailPinNative;
const $ = id => document.getElementById(id);
const t = key => api.i18n.getMessage(key) || key;
let incoming = null;
let generation = 0;
const downloads = new Map();
document.documentElement.lang = api.i18n.getUILanguage().split("-")[0];
for (const element of document.querySelectorAll("[data-i18n]")) element.textContent = t(element.dataset.i18n);
async function run(task) {
  $("status").textContent = t("nativeBusy");
  try { const result = await task(); $("result").textContent = JSON.stringify(result, null, 2); $("status").textContent = t("nativeDone"); }
  catch (error) { $("status").textContent = `${t("nativeFailed")} ${String(error.message).slice(0, 300)}`; }
}
$("import-file").addEventListener("change", async () => {
  const currentGeneration = ++generation;
  incoming = null;
  $("merge").disabled = $("replace").disabled = true;
  await run(async () => {
    const file = $("import-file").files[0];
    if (!file || file.size > 10 * 1024 * 1024) throw new Error(t("nativeInvalidFile"));
    const parsed = JSON.parse(await file.text());
    const preview = await native.previewImport(parsed);
    if (generation !== currentGeneration) return {cancelled: true};
    $("preview").textContent = JSON.stringify(preview, null, 2);
    if (preview.valid) { incoming = parsed; $("merge").disabled = $("replace").disabled = false; }
    return preview;
  });
});
for (const strategy of ["merge", "replace"]) $(strategy).addEventListener("click", () => run(async () => {
  if (!incoming) throw new Error(t("nativeInvalidFile"));
  if (strategy === "replace" && !window.confirm(t("nativeConfirmReplace"))) return {cancelled: true};
  const result = await native.restoreConfiguration(incoming, strategy);
  incoming = null; $("merge").disabled = $("replace").disabled = true;
  return result;
}));
$("export").addEventListener("click", () => run(async () => {
  const data = await native.exportConfiguration();
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: "application/json"}));
  const link = document.createElement("a"); link.href = url; link.download = "MailPin_2.2.0_backup.json";
  document.body.append(link); link.click(); link.remove();
  downloads.set(url, setTimeout(() => { URL.revokeObjectURL(url); downloads.delete(url); }, 30000));
  return {downloadRequested: true};
}));
$("diagnostics").addEventListener("click", () => run(() => native.exportDiagnosticBundle()));
$("repair").addEventListener("click", () => run(() => native.repairReferences()));
$("simulate").addEventListener("click", () => run(() => native.simulateRules({trigger: "messageAdded"})));
$("run-rules").addEventListener("click", () => run(async () => {
  if (!window.confirm(t("nativeConfirmRules"))) return {cancelled: true};
  return native.runRules({trigger: "messageAdded"});
}));
window.addEventListener("pagehide", () => {
  for (const [url, timer] of downloads) { clearTimeout(timer); URL.revokeObjectURL(url); }
  downloads.clear();
}, {once: true});
