"use strict";

const $ = selector => document.querySelector(selector);
const t = (key, substitutions) => messenger.i18n.getMessage(key, substitutions) || key;
const send = (type, payload = {}) => messenger.runtime.sendMessage({type, ...payload});
const listEl = $("#pin-list");
const detailEl = $("#detail");
const statusEl = $("#status");

let model = {pins: [], settings: {}, savedViews: [], history: []};
let currentView = "active";
let defaultViewApplied = false;
let selectedId = null;
let selectedIds = new Set();
let nativeTags = [];

function localizeDocument() {
  document.documentElement.lang = messenger.i18n.getUILanguage().split("-")[0] || "en";
  document.querySelectorAll("[data-i18n]").forEach(node => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(node => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
}

function button(text, handler, className = "") {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = text;
  element.className = className;
  element.addEventListener("click", handler);
  return element;
}

function input(type, value = "") {
  const element = document.createElement("input");
  element.type = type;
  if (type !== "checkbox") element.value = value ?? "";
  return element;
}

function field(label, control, wide = false) {
  const wrap = document.createElement("label");
  wrap.className = `field${wide ? " wide" : ""}`;
  const title = document.createElement("span");
  title.textContent = label;
  wrap.append(title, control);
  return wrap;
}

function badge(text, danger = false) {
  const element = document.createElement("span");
  element.className = `badge${danger ? " danger" : ""}`;
  element.textContent = text;
  return element;
}

function showError(error) {
  statusEl.textContent = t("errorPrefix", String(error?.message || error));
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toDateString() === new Date().toDateString();
}

function isOverdue(pin) {
  return Boolean(pin.dueAt && pin.status !== "completed" && new Date(pin.dueAt).getTime() < Date.now() && !isToday(pin.dueAt));
}

function matchesView(pin) {
  if (currentView === "all") return true;
  if (currentView === "today") return isToday(pin.dueAt) && pin.status !== "completed";
  if (currentView === "overdue") return isOverdue(pin);
  if (currentView === "noReply") return pin.waitingForReply && pin.status !== "completed";
  if (["active", "planned", "waiting", "completed"].includes(currentView)) return pin.status === currentView;
  return true;
}

function searchable(pin) {
  return [
    pin.subject,
    pin.author,
    pin.note,
    pin.project,
    ...(pin.labels || []),
    ...(pin.nativeTags || []),
    ...(pin.checklist || []).map(item => item.text)
  ].join(" ").toLocaleLowerCase();
}

function visiblePins() {
  const query = $("#search").value.trim().toLocaleLowerCase();
  const pins = model.pins.filter(pin => matchesView(pin) && (!query || searchable(pin).includes(query)));
  const sort = $("#sort").value;
  return pins.sort((a, b) => {
    if (sort === "due") return (a.dueAt || "9999").localeCompare(b.dueAt || "9999");
    if (sort === "date") return String(b.date || "").localeCompare(String(a.date || ""));
    if (sort === "priority") {
      const weight = {high: 0, normal: 1, low: 2};
      return (weight[a.priority] ?? 1) - (weight[b.priority] ?? 1);
    }
    if (sort === "subject") return String(a.subject || "").localeCompare(String(b.subject || ""));
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
}

function counts() {
  const all = model.pins;
  const values = {
    all: all.length,
    active: all.filter(pin => pin.status === "active").length,
    today: all.filter(pin => isToday(pin.dueAt) && pin.status !== "completed").length,
    overdue: all.filter(isOverdue).length,
    planned: all.filter(pin => pin.status === "planned").length,
    waiting: all.filter(pin => pin.status === "waiting").length,
    noReply: all.filter(pin => pin.waitingForReply && pin.status !== "completed").length,
    completed: all.filter(pin => pin.status === "completed").length
  };
  for (const [key, value] of Object.entries(values)) {
    const node = document.querySelector(`#count-${key}`);
    if (node) node.textContent = String(value);
  }
  return values;
}

function syncViewButtons() {
  document.querySelectorAll(".view").forEach(element => {
    element.classList.toggle("active", element.dataset.view === currentView);
  });
}

function statusLabel(status) {
  return t({
    active: "statusActive",
    planned: "statusPlanned",
    waiting: "statusWaiting",
    completed: "statusCompleted"
  }[status] || "statusActive");
}

function priorityLabel(priority) {
  return t({
    low: "priorityLow",
    normal: "priorityNormal",
    high: "priorityHighValue"
  }[priority] || "priorityNormal");
}

function renderList() {
  counts();
  if (currentView === "planner") return renderPlanner();
  if (currentView === "stats") return renderStats();

  detailEl.hidden = false;
  listEl.replaceChildren();
  const pins = visiblePins();
  if (!pins.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("emptyView");
    listEl.append(empty);
    return;
  }

  const template = $("#pin-template");
  for (const pin of pins) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.id = pin.id;
    if (pin.id === selectedId) card.classList.add("selected");
    card.querySelector(".pin-title").textContent = pin.subject || t("noSubject");
    const date = new Date(pin.date);
    card.querySelector(".pin-meta").textContent = `${pin.author || t("unknownSender")} · ${Number.isFinite(date.getTime()) ? date.toLocaleString() : ""}`;

    const badges = card.querySelector(".pin-badges");
    badges.append(badge(statusLabel(pin.status)));
    if (pin.priority === "high") badges.append(badge(t("priorityHigh")));
    if (pin.dueAt) badges.append(badge(t("dueBadge", new Date(pin.dueAt).toLocaleString()), isOverdue(pin)));
    if (pin.waitingForReply) badges.append(badge(t("waitingReply")));
    if (pin.project) badges.append(badge(pin.project));
    if (pin.missing) badges.append(badge(t("missingMessage"), true));

    const checkbox = card.querySelector(".pin-select");
    checkbox.checked = selectedIds.has(pin.id);
    checkbox.addEventListener("click", event => {
      event.stopPropagation();
      if (checkbox.checked) selectedIds.add(pin.id);
      else selectedIds.delete(pin.id);
    });

    card.querySelector(".pin-open").addEventListener("click", event => {
      event.stopPropagation();
      send("mailpin:open", {id: pin.id}).catch(showError);
    });

    const select = () => {
      selectedId = pin.id;
      renderList();
      renderDetail();
    };
    card.addEventListener("click", select);
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") select();
    });
    listEl.append(card);
  }
}

function renderTagEditor(pin) {
  const wrap = document.createElement("div");
  wrap.className = "tag-list";
  const selected = new Set(pin.nativeTags || []);
  if (!nativeTags.length) {
    const text = document.createElement("span");
    text.className = "muted";
    text.textContent = t("noNativeTags");
    wrap.append(text);
  }
  for (const tag of nativeTags) {
    const label = document.createElement("label");
    label.className = "tag-option";
    const checkbox = input("checkbox");
    checkbox.value = tag.key;
    checkbox.checked = selected.has(tag.key);
    const text = document.createElement("span");
    text.textContent = tag.tag || tag.key;
    label.append(checkbox, text);
    wrap.append(label);
  }
  return wrap;
}

function checklistFromText(text) {
  return String(text).split(/\r?\n/).slice(0, 100).map((line, index) => ({
    id: `task-${index}`,
    text: line.replace(/^\s*\[[ x]\]\s*/i, "").trim(),
    done: /^\s*\[x\]/i.test(line)
  })).filter(item => item.text);
}

function selectWithOptions(values, selected, labeler) {
  const select = document.createElement("select");
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = labeler(value);
    option.selected = selected === value;
    select.append(option);
  }
  return select;
}

function renderDetail() {
  const pin = model.pins.find(item => item.id === selectedId);
  detailEl.replaceChildren();
  detailEl.classList.toggle("empty", !pin);
  if (!pin) {
    const paragraph = document.createElement("p");
    paragraph.textContent = t("selectFollowup");
    detailEl.append(paragraph);
    return;
  }

  const title = document.createElement("h2");
  title.textContent = pin.subject || t("noSubject");
  const meta = document.createElement("p");
  meta.className = "muted";
  meta.textContent = `${pin.author || ""} · ${new Date(pin.date).toLocaleString()}`;

  const actions = document.createElement("div");
  actions.className = "detail-actions";
  actions.append(
    button(t("open"), () => send("mailpin:open", {id: pin.id}).catch(showError)),
    button(t("reply"), () => send("mailpin:action", {id: pin.id, action: "reply"}).catch(showError)),
    button(t("replyAll"), () => send("mailpin:action", {id: pin.id, action: "replyAll"}).catch(showError)),
    button(t("archive"), () => send("mailpin:action", {id: pin.id, action: "archive"}).then(refresh).catch(showError)),
    button(t("trash"), () => send("mailpin:action", {id: pin.id, action: "trash"}).then(refresh).catch(showError), "danger-button"),
    button(t("unpin"), () => send("mailpin:unpin", {ids: [pin.id]}).then(() => {
      selectedId = null;
      return refresh();
    }).catch(showError), "danger-button")
  );

  const grid = document.createElement("div");
  grid.className = "detail-grid";
  const status = selectWithOptions(["active", "planned", "waiting", "completed"], pin.status, statusLabel);
  const priority = selectWithOptions(["low", "normal", "high"], pin.priority, priorityLabel);
  const dueValue = pin.dueAt
    ? new Date(new Date(pin.dueAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : "";
  const due = input("datetime-local", dueValue);
  const project = input("text", pin.project || "");
  const labels = input("text", (pin.labels || []).join(", "));
  const waiting = input("checkbox");
  waiting.checked = Boolean(pin.waitingForReply);
  const note = document.createElement("textarea");
  note.value = pin.note || "";
  const tasks = document.createElement("textarea");
  tasks.value = (pin.checklist || []).map(item => `${item.done ? "[x]" : "[ ]"} ${item.text}`).join("\n");
  const tags = renderTagEditor(pin);

  grid.append(
    field(t("status"), status),
    field(t("priority"), priority),
    field(t("dueDate"), due),
    field(t("project"), project),
    field(t("mailpinLabels"), labels),
    field(t("waitForReply"), waiting),
    field(t("note"), note, true),
    field(t("checklist"), tasks, true),
    field(t("thunderbirdTags"), tags, true)
  );

  const save = button(t("save"), async () => {
    const selectedTags = [...tags.querySelectorAll("input[type=checkbox]:checked")].map(element => element.value);
    await send("mailpin:update", {
      id: pin.id,
      patch: {
        status: status.value,
        priority: priority.value,
        dueAt: due.value ? new Date(due.value).toISOString() : null,
        project: project.value,
        labels: labels.value.split(",").map(value => value.trim()).filter(Boolean),
        waitingForReply: waiting.checked,
        note: note.value,
        checklist: checklistFromText(tasks.value)
      }
    });
    await send("mailpin:setNativeTags", {id: pin.id, tags: selectedTags});
    await refresh();
  });

  detailEl.append(title, meta, actions, grid, save);
}

function renderPlanner() {
  listEl.replaceChildren();
  detailEl.hidden = true;
  const container = document.createElement("div");
  container.className = "planner";
  const grouped = new Map();
  const pins = model.pins
    .filter(item => item.status !== "completed")
    .sort((a, b) => (a.dueAt || "9999").localeCompare(b.dueAt || "9999"));

  for (const pin of pins) {
    const key = pin.dueAt ? new Date(pin.dueAt).toLocaleDateString() : t("noDueDate");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(pin);
  }

  for (const [day, groupedPins] of grouped) {
    const section = document.createElement("section");
    section.className = "planner-day";
    const heading = document.createElement("h2");
    heading.textContent = day;
    section.append(heading);
    for (const pin of groupedPins) {
      section.append(button(`${pin.subject || t("noSubject")} — ${statusLabel(pin.status)}`, () => {
        currentView = "all";
        selectedId = pin.id;
        syncViewButtons();
        renderList();
        renderDetail();
      }));
    }
    container.append(section);
  }
  listEl.append(container);
}

function renderStats() {
  listEl.replaceChildren();
  detailEl.hidden = true;
  const values = counts();
  const grid = document.createElement("div");
  grid.className = "stats-grid";
  const items = [
    [t("statTotal"), values.all],
    [t("viewActive"), values.active],
    [t("viewToday"), values.today],
    [t("viewOverdue"), values.overdue],
    [t("viewWaiting"), values.waiting],
    [t("viewNoReply"), values.noReply],
    [t("viewCompleted"), values.completed],
    [t("statCompletionRate"), values.all ? `${Math.round(values.completed / values.all * 100)}%` : "0%"]
  ];
  for (const [name, value] of items) {
    const card = document.createElement("div");
    card.className = "stat";
    const strong = document.createElement("strong");
    strong.textContent = String(value);
    const label = document.createElement("span");
    label.textContent = name;
    card.append(strong, label);
    grid.append(card);
  }
  listEl.append(grid);
}

async function refresh() {
  statusEl.textContent = t("refreshing");
  model = await send("mailpin:list");
  if (!defaultViewApplied) {
    const allowed = new Set(["all", "active", "today", "overdue", "planned", "waiting", "noReply", "completed", "planner", "stats"]);
    currentView = allowed.has(model.settings?.defaultView) ? model.settings.defaultView : "active";
    defaultViewApplied = true;
    syncViewButtons();
  }
  statusEl.textContent = t("followupCount", String(model.pins.length));
  selectedIds = new Set([...selectedIds].filter(id => model.pins.some(pin => pin.id === id)));
  if (selectedId && !model.pins.some(pin => pin.id === selectedId)) selectedId = null;
  renderList();
  renderDetail();
}

localizeDocument();
document.querySelectorAll(".view").forEach(element => element.addEventListener("click", () => {
  currentView = element.dataset.view;
  selectedId = null;
  syncViewButtons();
  renderList();
  renderDetail();
}));
$("#search").addEventListener("input", renderList);
$("#sort").addEventListener("change", renderList);
$("#refresh").addEventListener("click", () => refresh().catch(showError));
$("#settings").addEventListener("click", () => messenger.runtime.openOptionsPage());
$("#select-all").addEventListener("change", event => {
  const ids = visiblePins().map(pin => pin.id);
  if (event.target.checked) ids.forEach(id => selectedIds.add(id));
  else ids.forEach(id => selectedIds.delete(id));
  renderList();
});
$("#bulk-action").addEventListener("change", async event => {
  const action = event.target.value;
  event.target.value = "";
  if (!action || !selectedIds.size) return;
  const ids = [...selectedIds];
  try {
    if (action === "unpin") await send("mailpin:unpin", {ids});
    else await send("mailpin:updateMany", {ids, patch: {status: action}});
    selectedIds.clear();
    await refresh();
  } catch (error) {
    showError(error);
  }
});

Promise.all([
  send("mailpin:nativeTags").catch(() => []),
  refresh()
]).then(([tags]) => {
  nativeTags = Array.isArray(tags) ? tags : [];
  if (selectedId) renderDetail();
}).catch(showError);
