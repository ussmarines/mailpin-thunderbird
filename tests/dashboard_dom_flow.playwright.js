async page => {
  const baseUrl = "http://127.0.0.1:8765";
  const localeResponse = await page.request.get(`${baseUrl}/extension/_locales/en/messages.json`);
  if (!localeResponse.ok()) throw new Error(`Unable to load the English locale: ${localeResponse.status()}`);
  const messages = await localeResponse.json();
  const now = Date.now();

  await page.addInitScript(({messages, now}) => {
    const clone = value => JSON.parse(JSON.stringify(value));
    const text = (key, substitutions = []) => {
      const source = messages[key]?.message || "";
      const values = Array.isArray(substitutions) ? substitutions : [substitutions];
      return values.length
        ? source.replace(/\$(\d+)/g, (match, index) => values[Number(index) - 1] === undefined ? match : String(values[Number(index) - 1]))
        : source;
    };
    const items = [
      {
        stableKey: "synthetic-active", subject: "Quarterly planning", author: "Alex Doe",
        accountName: "Synthetic account", folderName: "Inbox", date: now - 60_000,
        workflowStatus: "active", smartSection: "today", unread: true,
        dueAt: now + 3_600_000, priorityLevel: "high", groupName: "Projects",
        caseId: "case-1", caseName: "Launch", note: "Prepare the review notes.",
        accountColor: "#0f6cbd"
      },
      {
        stableKey: "synthetic-waiting", subject: "Supplier response", author: "Taylor Doe",
        accountName: "Synthetic account", folderName: "Inbox", date: now - 3_600_000,
        workflowStatus: "waiting", smartSection: "noReply", noReplyTracking: true,
        noReplyAt: now - 60_000, trackingMode: "conversation", conversationCount: 2,
        caseId: "case-1", caseName: "Launch", accountColor: "#6264a7"
      },
      {
        stableKey: "synthetic-complete", subject: "Published notes", author: "Morgan Doe",
        accountName: "Synthetic account", folderName: "Archive", date: now - 86_400_000,
        workflowStatus: "completed", completedAt: now - 3_600_000,
        smartSection: "recentCompleted", accountColor: "#107c10"
      }
    ];
    const review = {
      mode: "daily", actionable: 2, total: 3,
      buckets: {overdue: [], today: [items[0]], noReply: [items[1]], waking: [], waiting: [items[1]], stale: [], upcoming: []}
    };
    const baseData = {
      items, filter: "all", smartView: "all", search: "", view: "today", reviewMode: "daily",
      smartViews: [], smartCounts: {all: 3, today: 1, noReply: 1, recentCompleted: 1},
      todayPlan: review, review, pendingReminders: [{...items[0], reminderFiredAt: now - 30_000}],
      relatedGroups: [{id: "related-1", subject: "Supplier response", count: 2, stableKeys: ["synthetic-active", "synthetic-waiting"], items: items.slice(0, 2)}],
      groups: [{id: "group-1", name: "Projects"}],
      cases: [{id: "case-1", name: "Launch", color: "#0f6cbd", status: "active", dueAt: now + 86_400_000}],
      templates: [{id: "template-1", name: "Standard follow-up"}],
      history: [{subject: "Published notes", author: "Morgan Doe", accountName: "Synthetic account", action: "complete", completedAt: now - 3_600_000}],
      ruleLog: [{time: now - 120_000, ruleName: "Important sender", result: "matched", subject: "Quarterly planning"}],
      stats: {total: 3, active: 1, waiting: 1, planned: 0, completed: 1, overdue: 0, noReply: 1, snoozed: 0, missing: 0},
      activity: [{time: now - 60_000, action: "pin", subject: "Quarterly planning"}],
      compatibility: {mode: "full", missing: []},
      providerMatrix: {checkedAt: now, accounts: [{accountName: "Synthetic account", provider: "generic", protocol: "imap", supportsFolders: true, offlineSupport: true}], providers: [], calendars: []},
      performance: {renders: 4, averageRenderMs: 2, maxRenderMs: 4},
      health: {score: 100, status: "healthy", issues: [], counts: {pinned: 3}},
      diagnostics: {total: 0, counts: {}}, revision: 1, counterRegressionEvents: []
    };
    globalThis.__mailperchDashboardActions = [];
    globalThis.messenger = {
      runtime: {getManifest: () => ({version: "1.1.1"}), getURL: path => path},
      i18n: {getUILanguage: () => "en", getMessage: text},
      pinInbox: new Proxy({}, {
        get(_target, name) {
          if (name === "getConfiguration") return async () => ({settings: {defaultSmartView: "all", enableBulkActions: true, confirmBulkDestructiveActions: false, noReplyDefaultDays: 5, preferredCalendarId: "calendar-1", calendarItemType: "task"}});
          if (name === "getDashboardData") return async options => ({...clone(baseData), search: options.search || "", smartView: options.smartView || "all", view: options.view || "today", reviewMode: options.reviewMode || "daily", review: {...clone(review), mode: options.reviewMode || "daily"}});
          if (name === "getCalendars") return async () => [{id: "calendar-1", name: "Synthetic calendar", writable: true, taskCompatible: true, eventCompatible: true, reason: ""}];
          if (name === "performReferenceAction") return async (keys, action, options) => { globalThis.__mailperchDashboardActions.push({keys, action, options}); return {count: keys.length}; };
          if (name === "getHealthReport") return async () => clone(baseData.health);
          if (name === "repairHealthIssues") return async () => ({repaired: 0, health: clone(baseData.health)});
          if (name === "runProviderCompatibilityCheck") return async () => clone(baseData.providerMatrix);
          if (name === "mergeRelatedReferences") return async () => ({merged: 2});
          if (name === "exportDiagnosticBundle") return async () => ({schemaVersion: 1, diagnostics: []});
          if (name === "clearDiagnostics") return async () => ({cleared: 0});
          return async () => ({});
        }
      })
    };
  }, {messages, now});

  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  await page.setViewportSize({width: 1440, height: 900});
  await page.goto(`${baseUrl}/extension/dashboard/dashboard.html`);
  await page.waitForFunction(() => !document.body.hasAttribute("data-loading"));
  assert(await page.locator("#fatal-error").isHidden(), "Dashboard must initialize without a fatal error");
  assert(await page.locator(".stat").count() === 8, "Dashboard must render all summary cards");
  assert(await page.locator("#reminder-center .reminder-item").count() === 1, "Reminder center must render its actionable item");

  const viewSections = {today: "today", list: "items", kanban: "kanban", cases: "cases", review: "review", history: "history", health: "health"};
  for (const view of Object.keys(viewSections)) {
    await page.locator(`[data-view="${view}"]`).click();
    await page.waitForFunction(sectionId => !document.getElementById(sectionId).hidden, viewSections[view]);
    assert(await page.locator(`[data-view="${view}"]`).getAttribute("aria-pressed") === "true", `${view} tab must expose its selected state`);
  }

  await page.locator('[data-view="list"]').click();
  const firstSelection = page.locator('#items .item input[type="checkbox"]').first();
  await firstSelection.check();
  assert(await page.locator("#selection-bar").isVisible(), "Selecting a card must reveal bulk actions");
  assert(await page.locator("#selection-count").textContent() === "1 message selected", "Selection count must be localized");
  await page.locator("#apply").click();
  assert(await page.locator("#status-message").textContent() === "Choose a bulk action.", "Missing bulk action must show a local error");
  await page.locator("#bulk-action").selectOption("active");
  await page.locator("#apply").click();
  await page.waitForFunction(() => globalThis.__mailperchDashboardActions.length === 1);
  assert(await page.locator("#selection-bar").isHidden(), "Successful bulk action must clear the selection");

  const frenchLeaks = await page.locator("body *:not(noscript)").evaluateAll(elements => {
    const pattern = /[éèêàùçœ]|\b(Aucun|Aucune|Choisir|Supprimer|Nom|Affaire|Groupe|Règle|Compte|Dossiers|Paramètres|Enregistrer|Annuler|Raccourci|Sauvegarde|Réparation|Vérification)\b/i;
    return elements.filter(element => {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const ownText = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join(" ");
      return pattern.test([ownText, element.getAttribute("aria-label") || "", element.getAttribute("title") || "", element.getAttribute("placeholder") || ""].join(" "));
    }).map(element => element.outerHTML.slice(0, 240));
  });
  assert(frenchLeaks.length === 0, `English dashboard must not expose French UI text: ${frenchLeaks.join(" | ")}`);

  await page.setViewportSize({width: 720, height: 900});
  const overflow = await page.evaluate(() => ({scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth}));
  assert(overflow.scrollWidth <= overflow.clientWidth + 1, `Dashboard must not overflow horizontally at 720px: ${JSON.stringify(overflow)}`);
  await page.emulateMedia({colorScheme: "dark", reducedMotion: "reduce"});
  await page.waitForFunction(() => getComputedStyle(document.documentElement).colorScheme.includes("dark"));
  assert(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme.includes("dark")), "Dark color scheme must remain supported");
  await page.setViewportSize({width: 1440, height: 900});
  await page.screenshot({path: "output/playwright/dashboard-en.png", fullPage: true});

  return {
    views: 7,
    stats: await page.locator(".stat").count(),
    cards: await page.locator(".item").count(),
    actions: await page.evaluate(() => globalThis.__mailperchDashboardActions.length),
    overflow
  };
}
