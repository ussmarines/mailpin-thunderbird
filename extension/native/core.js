import {NativeProduct} from "./product.js";
import {NativeTags} from "./tags.js";
import {PIN_MODULES, DEFAULT_DATA, DEFAULT_SETTINGS, DEFAULT_COLORS, clone,
  normalizeSettings, normalizeData, normalizeReference, normalizeRule, normalizeGroup,
  normalizeCase, normalizeTemplate, assertStructuredInput, normalizeStableKeyList,
  boundedText, hardenImportedConfiguration, portableSettingsSnapshot, portableDataSnapshot} from "./model.js";

export const STATE_KEY = "mailpinNative220";
const OWNERSHIP_KEY = "mailpinNative220OwnedTags";
const MAX_REFS = 5000;
const MUTATIONS = new Set(["toggleSelected", "toggleDisplayed", "toggleConversationSelected",
  "performSelected", "quickCaptureSelected", "setConfiguration", "restoreConfiguration",
  "importConfiguration", "resetConfiguration", "cleanupBroken", "rescanPinned", "undoLast",
  "repairReferences", "resetInterface", "importNativeStars", "clearDiagnostics", "repairHealthIssues",
  "runProviderCompatibilityCheck", "setNoReplyTracking", "performReferenceAction", "mergeRelatedReferences",
  "snoozeReminder", "clearRuleLog", "updateReferenceDetails", "createSavedView", "updateSavedView",
  "deleteSavedView", "setWorkflowStatus", "createCase", "updateCase", "deleteCase", "createTemplate",
  "updateTemplate", "deleteTemplate", "applyTemplate", "getDashboardData", "runRules", "onMessages", "onAlarm"]);
export const METHODS = new Set([...MUTATIONS, "getConfiguration", "exportConfiguration", "getDiagnosticReport",
  "exportDiagnosticBundle", "getHealthReport", "previewImport", "getCalendars", "createCalendarItem",
  "createCaseCalendarItem", "syncCalendarLinks", "runCompatibilityCheck", "getPerformanceReport",
  "checkStorageIntegrity", "runBackup", "getBackupStatus", "chooseBackupDirectory", "simulateRules",
  "getCases", "getTemplates", "getHistory", "syncTags", "openReference", "getSelectionState", "setup"]);

function nativeSettings(value) {
  const settings = normalizeSettings(value);
  settings.enableCalendarIntegration = false;
  settings.enableBidirectionalCalendarSync = false;
  settings.calendarDeleteOnUnpin = false;
  settings.calendarCompleteOnPinComplete = false;
  settings.enableAutomaticBackups = false;
  settings.backupDirectory = "";
  settings.pinMode = "independent";
  return settings;
}
const headerId = value => String(value || "").trim().replace(/^<|>$/g, "").slice(0, 2048);
const dateMs = value => { const n = new Date(value).getTime(); return Number.isFinite(n) ? n : 0; };

export class NativeCore extends NativeProduct {
  constructor(api) {
    super();
    this.api = api;
    this.tags = new NativeTags(api);
    this.queue = Promise.resolve();
    this.resolved = new Map();
    this._diagnosticEvents = [];
    this._undoStack = [];
    this.ruleRates = new Map();
    this.ruleGuard = new Map();
    this._compatibility = {mode: "native", reduced: true, missing: ["calendar", "inline-panel"],
      storage: "storage.local", checkedAt: Date.now()};
  }
  dispatch(method, args = []) {
    if (!METHODS.has(method)) return Promise.reject(new Error("Unsupported MailPin method"));
    const run = this.queue.then(async () => {
      assertStructuredInput(args, "Native request", {maxBytes: 10 * 1024 * 1024});
      await this.load();
      const previous = clone(this._data);
      const snapshot = this.snapshot();
      let committed = false;
      try {
        const result = await this.invoke(method, args);
        if (MUTATIONS.has(method)) {
          this._data = normalizeData(this._data);
          this._data.revision++;
          await this.api.storage.local.set({[STATE_KEY]: this.envelope()});
          committed = true;
        }
        if (MUTATIONS.has(method) || method === "syncTags") {
          const sync = await this.syncTags(previous);
          if (method === "syncTags") Object.assign(result, sync);
          for (const effect of [() => this.rescheduleAlarms(), () => this.refreshActions()]) {
            try { await effect(); }
            catch { this._recordDiagnostic("warning", "Native synchronization incomplete; stored data retained"); }
          }
        }
        return clone(result === undefined ? {ok: true} : result);
      } catch (error) {
        if (!committed) {
          this._data = snapshot.data;
          this._settings = snapshot.settings;
          this._undoStack = snapshot.undo;
        }
        throw error;
      }
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
  snapshot() { return {data: clone(this._data), settings: clone(this._settings), undo: clone(this._undoStack)}; }
  envelope() {
    const payload = this.snapshot();
    return {schemaVersion: 1, ...payload, checksum: PIN_MODULES.PinStorageHelpers.checksum(payload)};
  }
  async load() {
    const stored = await this.api.storage.local.get([STATE_KEY, OWNERSHIP_KEY]);
    const value = stored[STATE_KEY];
    if (value) {
      if (value.schemaVersion !== 1 || value.checksum !== PIN_MODULES.PinStorageHelpers.checksum({data: value.data, settings: value.settings, undo: value.undo})) {
        throw new Error("MailPin native storage damaged; export/profile recovery required");
      }
      this._data = normalizeData(value.data);
      this._settings = nativeSettings(value.settings);
      this._undoStack = Array.isArray(value.undo) ? value.undo.slice(-10) : [];
    } else {
      this._data = clone(DEFAULT_DATA);
      this._settings = nativeSettings({...DEFAULT_SETTINGS, enableThunderbirdTagSync: true});
      this._undoStack = [];
    }
    // This separate registry is never imported from a backup or a page.
    this.ownedTags = stored[OWNERSHIP_KEY] || {};
    this.resolved.clear();
  }
  async collect(list, maximum = 500) {
    const result = [];
    let next = list;
    let pages = 0;
    while (next && pages++ < 50) {
      result.push(...(next.messages || []).slice(0, maximum - result.length));
      if (!next.id || result.length >= maximum) {
        if (next.id) await this.api.messages.abortList(next.id);
        break;
      }
      next = await this.api.messages.continueList(next.id);
    }
    if (next?.id && pages > 50) await this.api.messages.abortList(next.id);
    return result;
  }
  async selected(tabId, displayed = false) {
    if (!Number.isInteger(tabId)) return [];
    const list = displayed ? await this.api.messageDisplay.getDisplayedMessages(tabId)
      : await this.api.mailTabs.getSelectedMessages(tabId);
    return this.collect(list);
  }
  messageKey(message, conversation = false) {
    const account = message.folder?.accountId;
    const id = headerId(message.headerMessageId);
    if (!account || !id) throw new Error("Stable account and Message-ID required for pinning");
    // Keep imported Gmail/legacy keys and their relationships. Only reuse a
    // strong identity in this account and tracking mode, never a subject match.
    const mode = conversation ? "conversation" : "message";
    const root = headerId(message.rootMessageId) || id;
    const existing = Object.values(this._data.refs).filter(ref => ref.accountKey === account && ref.trackingMode === mode &&
      (conversation ? headerId(ref.rootMessageId) === root : headerId(ref.headerMessageId) === id));
    if (existing.length === 1) return existing[0].stableKey;
    return `${account}|${conversation ? "conv:root:" : "mid:"}${conversation ? root : id}`;
  }
  async enrich(message) {
    const headers = await this.api.messages.getHeaders(message.id);
    const references = String(headers.references?.[0] || headers["in-reply-to"]?.[0] || "").match(/<([^>]+)>/g) || [];
    return {...message, rootMessageId: headerId(references[0]) || headerId(message.headerMessageId)};
  }
  async alignReferences(messages) {
    // An imported internal account key can differ from its public account ID.
    // Resolve only matching header identities before commands, including when
    // the owner has not opened the Dashboard since import.
    const headers = new Set(messages.map(message => headerId(message.headerMessageId)));
    for (const ref of Object.values(this._data.refs)) {
      if (!headers.has(headerId(ref.headerMessageId))) continue;
      const resolved = await this.resolve(ref);
      if (resolved && messages.some(message => message.id === resolved.id)) this.updateResolved(ref, resolved);
    }
  }
  async conversationMembers(ref) {
    const seed = await this.resolve(ref);
    if (!seed || ref.trackingMode !== "conversation") return seed ? [seed] : [];
    const messages = await this.collect(await this.api.messages.query({messagesPerPage: 100}), 500);
    const members = [];
    for (const message of messages.filter(item => item.folder?.accountId === ref.accountKey)) {
      const enriched = await this.enrich(message);
      if (enriched.rootMessageId === ref.rootMessageId) members.push(enriched);
    }
    return members.length ? members : [seed];
  }
  async resolve(ref) {
    if (this.resolved.has(ref.stableKey)) return this.resolved.get(ref.stableKey);
    const id = headerId(ref.headerMessageId);
    if (!id) { this.resolved.set(ref.stableKey, null); return null; }
    // Never trust a message id from a prior Thunderbird process or a backup.
    const candidates = await this.collect(await this.api.messages.query({headerMessageId: id, messagesPerPage: 100}), 500);
    const matching = candidates.filter(message => message.folder?.accountId === ref.accountKey && headerId(message.headerMessageId) === id);
    let message = matching.find(item => item.folder.id === ref.lastFolderURI);
    if (!message && matching.length === 1) message = matching[0];
    // Legacy account keys differ from public IDs: resolve only a unique candidate,
    // never choose among ambiguous copies. Owner repairs ambiguous references.
    if (!message && !matching.length && candidates.length === 1 && ref.lastFolderURI.includes("://")) message = candidates[0];
    this.resolved.set(ref.stableKey, message || null);
    return message || null;
  }
  async hydrate() {
    this.nativeTagList = await this.api.messages.tags.list();
    for (const ref of Object.values(this._data.refs)) {
      try { const message = await this.resolve(ref); if (message) this.updateResolved(ref, message); else ref.missingSince ||= Date.now(); }
      catch { ref.missingSince ||= Date.now(); }
    }
  }
  updateResolved(ref, message) {
    Object.assign(ref, {accountKey: message.folder.accountId, lastFolderURI: message.folder.id,
      lastMessageKey: message.id, folderName: message.folder.name || ref.folderName,
      subject: boundedText(message.subject, 1000), author: boundedText(message.author, 1000),
      date: dateMs(message.date), missingSince: 0, lastSeen: Date.now()});
  }
  _ensureReference(message, _source = "", mode = "message") {
    const key = this.messageKey(message, mode === "conversation");
    if (!this._data.refs[key] && Object.keys(this._data.refs).length >= MAX_REFS) throw new Error("Maximum native pins reached");
    const ref = this._data.refs[key] || normalizeReference(key, {stableKey: key, headerMessageId: headerId(message.headerMessageId),
      rootMessageId: headerId(message.rootMessageId) || headerId(message.headerMessageId), accountKey: message.folder.accountId,
      trackingMode: mode, conversationKey: mode === "conversation" ? key : "", pinnedAt: Date.now()});
    this.updateResolved(ref, message);
    this._data.refs[key] = ref;
    if (!this._data.manualOrder.includes(key)) this._data.manualOrder.push(key);
    this.resolved.set(key, message);
    return ref;
  }
  async toggle(messages, forced, conversation = false) {
    await this.alignReferences(messages);
    const keys = messages.map(message => this.messageKey(message, conversation));
    const pinned = typeof forced === "boolean" ? forced : !keys.every(key => this._data.refs[key]);
    if (keys.length) this._pushUndo("Pin/unpin");
    for (const message of messages) {
      const key = this.messageKey(message, conversation);
      if (pinned) this._ensureReference(message, "", conversation ? "conversation" : "message");
      else this._removeReferenceByKey(key, {archiveAction: "unpin"});
      this._recordActivity(pinned ? "pin" : "unpin", key);
    }
    return {count: keys.length, pinned};
  }
  _removeReferenceByKey(key, {archiveAction = ""} = {}) {
    const ref = this._data.refs[key];
    if (!ref) return false;
    if (archiveAction) this._archiveReferenceHistory(ref, archiveAction);
    delete this._data.refs[key];
    this._data.manualOrder = this._data.manualOrder.filter(item => item !== key);
    return true;
  }
  _saveData() {} // One atomic storage.local commit at the serialized dispatch boundary.
  _refreshAllStates() {}
  _showToastAll() {}
  _syncTags() { return Promise.resolve(); } // Dispatch performs the awaited native sync.
  _syncReferenceToCalendar() { return Promise.reject(new Error("Calendar unavailable in native candidate")); }
  _deleteLinkedCaseCalendarItem() { return this._syncReferenceToCalendar(); }
  _groupForId(id) { return this._data.groups.find(item => item.id === id); }
  _getAccountColor(key) { return this._settings.accountColors[key] || DEFAULT_COLORS[0]; }
  _getPerformanceReport() { return {backend: "storage.local", samples: [], enabled: false}; }
  _pushUndo(label) {
    if (!this._settings.enableUndo) return;
    this._undoStack.push({label: boundedText(label, 100), data: clone(this._data), settings: clone(this._settings)});
    this._undoStack = this._undoStack.slice(-10);
  }
  _serializeReference(ref, activity = false) {
    const message = this.resolved.get(ref.stableKey);
    const group = this._groupForId(ref.groupId);
    const item = this._data.cases.find(value => value.id === ref.caseId);
    const unread = Boolean(message && !message.read);
    const missing = !message;
    return {...clone(ref), unread, missing, accountColor: this._getAccountColor(ref.accountKey),
      groupName: group?.name || "", caseName: item?.name || "",
      checklistStats: PIN_MODULES.PinChecklists.stats(ref.checklist),
      responseState: PIN_MODULES.PinAnalytics.responseState(ref),
      responseAgeMs: PIN_MODULES.PinAnalytics.waitingAgeMs(ref), ageMs: PIN_MODULES.PinAnalytics.ageMs(ref),
      tags: (message?.tags || []).map(key => ({key, name: this.nativeTagList?.find(tag => tag.key === key)?.tag || key})),
      smartSection: PIN_MODULES.PinSmartViews.sectionFor(ref, {unread, missing}),
      activity: activity ? this._data.activity.filter(value => value.stableKey === ref.stableKey).slice(-20) : []};
  }
  async configuration() {
    let accounts = [];
    if (await this.api.permissions.contains({permissions: ["accountsRead"]})) {
      accounts = (await this.api.accounts.list(false)).map(account => ({key: account.id, name: account.name,
        type: account.type, color: this._getAccountColor(account.id), inboxes: []}));
    }
    const refs = Object.values(this._data.refs);
    return {settings: clone(this._settings), recommendedSettings: nativeSettings(DEFAULT_SETTINGS),
      settingsSchema: PIN_MODULES.PinSettings.describe(), groups: clone(this._data.groups), cases: clone(this._data.cases),
      templates: clone(this._data.templates), rules: clone(this._data.rules), ruleLog: clone(this._data.ruleLog.slice(-100)),
      accounts, stats: {pinned: refs.length, broken: refs.filter(ref => ref.missingSince).length,
        waiting: refs.filter(ref => ref.workflowStatus === "waiting").length, completed: refs.filter(ref => ref.completedAt).length,
        history: this._data.history.length, undoAvailable: !!this._undoStack.length},
      storage: {backend: "storage.local", schemaVersion: 1}, compatibility: this._compatibility,
      providerMatrix: this._data.providerMatrix, diagnostics: PIN_MODULES.PinDiagnostics.summary(this._diagnosticEvents),
      performance: this._getPerformanceReport(), nativeCandidate: true};
  }
  preview(configuration) {
    assertStructuredInput(configuration, "Backup", {maxBytes: 10 * 1024 * 1024});
    const preview = PIN_MODULES.PinMigrations.analyze(configuration, this._data);
    const source = PIN_MODULES.PinMigrations.sourceFor(configuration);
    if (configuration?.format === "pin-mails-backup" && !PIN_MODULES.PinStorageHelpers.verifyBackupEnvelope(configuration)) preview.errors.push("checksum-mismatch");
    if (!source) { preview.valid = false; return preview; }
    if (Object.keys(source.refs || {}).length > MAX_REFS) preview.errors.push("native-reference-limit");
    const normalized = normalizeData(source);
    for (const name of ["groups", "cases", "templates", "rules", "savedViews", "history", "ruleLog", "activity"]) {
      if ((source[name]?.length || 0) > normalized[name].length) preview.errors.push(`lossy-${name}`);
    }
    if (Object.keys(source.refs || {}).length !== Object.keys(normalized.refs).length) preview.errors.push("lossy-refs");
    for (const ref of Object.values(source.refs || {})) {
      if (String(ref?.note || "").length > 4000 || (ref?.checklist?.length || 0) > 50 ||
          (ref?.checklist || []).some(item => String(item?.text || "").length > 240)) preview.errors.push("oversized-reference");
    }
    preview.errors = [...new Set(preview.errors)];
    preview.valid = preview.errors.length === 0;
    preview.warnings.push("native-sqlite-export-required", "calendar-unavailable", "automation-disabled", "ambiguous-messages-require-owner-repair");
    return preview;
  }
  async restore(configuration, strategy) {
    if (!["merge", "replace"].includes(strategy)) throw new Error("Explicit restore strategy required");
    const preview = this.preview(configuration);
    if (!preview.valid) throw new Error(`Backup refused: ${preview.errors.join(", ")}`);
    // Fail closed if the safety snapshot cannot be persisted. One atomic final write.
    await this.api.storage.local.set({mailpinNative220BeforeRestore: this.envelope()});
    const source = PIN_MODULES.PinMigrations.sourceFor(configuration);
    const settings = configuration.settings || configuration.metadata?.settings || this._settings;
    const hardened = hardenImportedConfiguration(settings, source);
    // Local due dates and no-reply metadata remain useful, without imported automation.
    for (const [key, ref] of Object.entries(hardened.data.refs)) {
      const old = normalizeReference(key, source.refs[key]);
      for (const name of ["noReplyTracking", "noReplyAt", "noReplyStartedAt", "noReplyBaselineMessageId",
        "calendarId", "calendarItemId", "calendarItemType"]) ref[name] = old[name];
    }
    for (const item of hardened.data.cases) {
      const old = normalizeCase(source.cases?.find(value => value.id === item.id));
      if (old) { item.calendarId = old.calendarId; item.calendarItemId = old.calendarItemId; }
    }
    this._pushUndo("Restore");
    const merged = strategy === "merge" ? PIN_MODULES.PinMigrations.merge(this._data, hardened.data) : hardened.data;
    const mergedPreview = this.preview({format: "thunderbird-pin-mails", version: 7, data: merged});
    if (!mergedPreview.valid) throw new Error(`Merged backup refused: ${mergedPreview.errors.join(", ")}`);
    this._data = normalizeData(merged);
    this._settings = nativeSettings(hardened.settings);
    this._data.migration = {from: preview.version, to: 7, completedAt: Date.now()};
    return {ok: true, strategy, preview, safetyBackup: "storage.local:mailpinNative220BeforeRestore"};
  }
  async syncTags(previous = this._data) {
    const persist = async registry => this.api.storage.local.set({[OWNERSHIP_KEY]: registry});
    let errors = 0;
    let synced = 0;
    try {
      if (this._settings.enableThunderbirdTagSync && Object.keys(this._data.refs).length) await this.tags.ensure(this.ownedTags, persist);
      const targets = new Map();
      for (const key of new Set([...Object.keys(previous.refs), ...Object.keys(this._data.refs)])) {
        const before = previous.refs[key];
        const ref = this._data.refs[key];
        try {
          const messages = await this.conversationMembers(ref || before);
          for (const message of messages) {
            const target = targets.get(message.id) || {message, desired: new Set()};
            for (const tag of this.tags.desired(ref, this._settings.enableThunderbirdTagSync)) target.desired.add(tag);
            targets.set(message.id, target);
          }
        } catch { errors++; this._recordDiagnostic("warning", "Native tag resolution incomplete"); }
      }
      for (const target of targets.values()) {
        try { await this.tags.updateDesired(target.message, [...target.desired], this.ownedTags); synced++; }
        catch { errors++; this._recordDiagnostic("warning", "Native tag sync incomplete"); }
      }
      if (!this._settings.enableThunderbirdTagSync) { await this.tags.removeDefinitions(this.ownedTags); await persist(this.ownedTags); }
    } catch { errors++; this._recordDiagnostic("warning", "MailPin tag collision or API unavailable"); }
    return {synced, errors};
  }
  _recordDiagnostic(type, message) {
    this._diagnosticEvents.push({time: Date.now(), type, message, details: ""});
    this._diagnosticEvents = this._diagnosticEvents.slice(-500);
  }
  async rescheduleAlarms() {
    await this.api.alarms.clearAll();
    if (!this._settings.enableReminders) return;
    let earliest = Infinity;
    for (const ref of Object.values(this._data.refs)) {
      if (ref.completedAt || ref.reminderAcknowledgedAt || ref.reminderFiredAt) continue;
      const at = ref.snoozeUntil || ref.reminderAt || ref.followUpAt || ref.noReplyAt;
      if (at > 0) earliest = Math.min(earliest, at);
    }
    if (Number.isFinite(earliest)) await this.api.alarms.create("mailpin-reminders", {when: Math.max(Date.now() + 1000, earliest)});
  }
  async refreshActions() {
    const count = Object.values(this._data.refs).filter(ref => !ref.completedAt).length;
    await this.api.action.setBadgeText({text: count ? String(Math.min(count, 999)) : ""});
    for (const tab of await this.api.tabs.query({active: true})) {
      try {
        const messages = await this.selected(tab.id, true);
        const allPinned = messages.length > 0 && messages.every(message => this._data.refs[this.messageKey(message)]);
        await this.api.messageDisplayAction.setIcon({tabId: tab.id, path: allPinned ? "icons/pin-filled.svg" : "icons/pin-regular.svg"});
        await this.api.messageDisplayAction.setTitle({tabId: tab.id, title: this.api.i18n.getMessage(allPinned ? "menuUnpinMessage" : "menuPinMessage")});
        await this.api.messageDisplayAction.setBadgeText({tabId: tab.id, text: allPinned ? "PIN" : ""});
      } catch { /* Non-message tabs expose no displayed messages. */ }
    }
  }
  async onAlarm() {
    for (const ref of Object.values(this._data.refs)) {
      const at = ref.snoozeUntil || ref.reminderAt || ref.followUpAt || ref.noReplyAt;
      if (!at || at > Date.now() || ref.completedAt || ref.reminderFiredAt || ref.reminderAcknowledgedAt) continue;
      await this.api.notifications.create(`mailpin:${ref.stableKey}`, {type: "basic", iconUrl: "icons/mailpin-icon.svg",
        title: "MailPin", message: ref.subject || this.api.i18n.getMessage("extensionName")});
      ref.reminderFiredAt = Date.now();
      ref.snoozeUntil = 0;
    }
    return {ok: true};
  }
  async action(keys, action, options = {}) {
    assertStructuredInput(options, "Action options", {maxBytes: 64 * 1024});
    const refs = normalizeStableKeyList(keys).map(key => this._data.refs[key]).filter(Boolean);
    const safeKeys = refs.map(ref => ref.stableKey);
    const opts = PIN_MODULES.PinBulk.normalizeOptions(action, options);
    if (["active", "waiting", "planned", "complete", "uncomplete"].includes(action)) return this._setWorkflowStatus(safeKeys, action === "complete" ? "completed" : action === "uncomplete" ? "active" : action, opts);
    if (action === "snooze") return this._snoozeReferences(safeKeys, opts);
    if (action === "wake") return this._wakeReferences(safeKeys);
    if (action === "dismissReminder") return this._acknowledgeReminders(safeKeys);
    if (action === "trackNoReply" || action === "cancelNoReply") return this._setNoReplyTracking(safeKeys, {...opts, enabled: action === "trackNoReply"});
    if (action === "template") return this._applyTemplate(safeKeys, opts.templateId);
    if (action === "unpin") { this._pushUndo("Unpin"); for (const key of safeKeys) this._removeReferenceByKey(key, {archiveAction: "unpin"}); return {count: refs.length}; }
    if (action === "calendar") throw new Error("Calendar unavailable in zero-Experiment candidate");
    if (["priority", "deadline", "group", "case", "setMetadata"].includes(action)) {
      const patch = action === "setMetadata" ? options : opts;
      for (const ref of refs) this._setReferenceMetadata(ref.stableKey, patch);
      return {count: refs.length};
    }
    const messages = [];
    for (const ref of refs) { const message = await this.resolve(ref); if (message) messages.push(message); }
    if (!messages.length) throw new Error("Message not found; repair the reference first");
    if (action === "open") return this.api.messageDisplay.open({messageId: messages[0].id, location: "tab", active: true});
    if (action === "reply") return this.api.compose.beginReply(messages[0].id, "replyToSender");
    if (action === "archive") { await this.api.messages.archive(messages.map(message => message.id)); return {count: messages.length}; }
    if (action === "delete") { await this.api.messages.delete(messages.map(message => message.id), {deletePermanently: false, isUserAction: true}); return {count: messages.length}; }
    if (["read", "unread", "toggleRead"].includes(action)) {
      for (const message of messages) await this.api.messages.update(message.id, {read: action === "toggleRead" ? !message.read : action === "read"});
      return {count: messages.length};
    }
    throw new Error("Unsupported action");
  }
  async rules(messages, trigger, simulate = true, rules = this._data.rules) {
    const matches = [];
    let applied = 0;
    for (const message of messages.slice(0, 500)) {
      for (const rule of PIN_MODULES.PinRules.ordered(rules)) {
        const context = {trigger, subject: message.subject, sender: message.author, tags: message.tags || [],
          accountKey: message.folder?.accountId, folderURI: message.folder?.id};
        if (rule.trigger !== trigger || !PIN_MODULES.PinRules.matches(context, rule).matched) continue;
        matches.push({ruleId: rule.id, messageId: message.id, action: rule.action});
        if (!simulate) {
          const guard = `${rule.id}:${this.messageKey(message)}:${trigger}`;
          const rate = PIN_MODULES.PinRules.rateAllowed(this.ruleRates.get(rule.id) || [], rule.maxPerMinute);
          if (!rate.allowed || Date.now() - (this.ruleGuard.get(guard) || 0) < 5000 || applied >= 100) continue;
          this.ruleGuard.set(guard, Date.now());
          this.ruleRates.set(rule.id, [...rate.timestamps, Date.now()]);
          const key = this.messageKey(message, rule.trackingMode === "conversation");
          if (rule.action === "pin") this._ensureReference(message, "", rule.trackingMode);
          else if (rule.action === "unpin") this._removeReferenceByKey(key, {archiveAction: "rule-unpin"});
          else if (rule.action === "keep") { /* Matching stop rule. */ }
          else if (rule.action === "template" && this._data.refs[key]) this._applyTemplate([key], rule.templateId);
          else if (this._data.refs[key]) await this.action([key], rule.action === "status" ? rule.workflowStatus : rule.action, rule);
          applied++;
          this._data.ruleLog.push({id: `rule-${Date.now()}-${applied}`, time: Date.now(), ruleId: rule.id, trigger, result: "applied", message: ""});
          this._data.ruleLog = this._data.ruleLog.slice(-2000);
        }
        if (rule.stopProcessing) break;
      }
    }
    return {matches, matched: matches.length, applied, scanned: Math.min(messages.length, 500), simulated: simulate};
  }
  async invoke(method, args) {
    if (method === "setup") {
      await this.syncTags();
      await this.rescheduleAlarms();
      await this.refreshActions();
      return {native: true};
    }
    if (method === "getSelectionState") {
      const messages = [];
      for (const message of await this.selected(args[0])) messages.push(await this.enrich(message));
      await this.alignReferences(messages);
      return {count: messages.length, allPinned: messages.length > 0 && messages.every(message => this._data.refs[this.messageKey(message)]),
        allConversationsPinned: messages.length > 0 && messages.every(message => this._data.refs[this.messageKey(message, true)]),
        conversationCount: messages.length, conversationEnabled: this._settings.enableConversationPins};
    }
    if (["toggleSelected", "toggleDisplayed", "toggleConversationSelected"].includes(method)) {
      const messages = [];
      for (const message of await this.selected(args[0], method === "toggleDisplayed")) messages.push(await this.enrich(message));
      return this.toggle(messages, args[1], method === "toggleConversationSelected");
    }
    if (method === "quickCaptureSelected") {
      const messages = [];
      for (const message of await this.selected(args[0])) messages.push(await this.enrich(message));
      await this.alignReferences(messages);
      for (const message of messages) {
        const ref = this._ensureReference(message);
        const preset = args[1];
        if (preset === "waiting" || preset === "noReply") this._setWorkflowStatus([ref.stableKey], "waiting");
        if (preset === "noReply") this._setNoReplyTracking([ref.stableKey]);
        if (preset === "today" || preset === "tomorrow") { const due = new Date(); due.setHours(23, 59, 0, 0); if (preset === "tomorrow") due.setDate(due.getDate() + 1); ref.dueAt = due.getTime(); ref.reminderAt = ref.dueAt; }
      }
      return {count: messages.length};
    }
    if (method === "performSelected") {
      const messages = [];
      for (const message of await this.selected(args[0])) messages.push(await this.enrich(message));
      await this.alignReferences(messages);
      const keys = [...new Set(messages.flatMap(message => [this.messageKey(message), this.messageKey(message, true)]))]
        .filter(key => this._data.refs[key]).slice(0, 500);
      return this.action(keys, args[1]);
    }
    if (method === "performReferenceAction") return this.action(...args);
    if (method === "openReference") return this.action([args[0]], "open");
    if (method === "getDashboardData") { await this.hydrate(); return this._getDashboardData(args[0] || {}); }
    if (method === "getConfiguration") return this.configuration();
    if (method === "setConfiguration") {
      const config = args[0] || {};
      this._pushUndo("Settings");
      this._settings = nativeSettings({...this._settings, ...config.settings});
      for (const [name, normalizer] of [["groups", normalizeGroup], ["rules", normalizeRule], ["cases", normalizeCase], ["templates", normalizeTemplate]]) {
        if (Array.isArray(config[name])) this._data[name] = config[name].map(normalizer).filter(Boolean);
      }
      this._data = normalizeData(this._data);
      return this.configuration();
    }
    if (method === "previewImport") return this.preview(args[0]);
    if (method === "restoreConfiguration" || method === "importConfiguration") return this.restore(args[0], args[1]);
    if (method === "exportConfiguration") return {format: "thunderbird-pin-mails", version: 7, exportedAt: new Date().toISOString(),
      settings: portableSettingsSnapshot(this._settings), data: portableDataSnapshot(this._data)};
    if (method === "runBackup") {
      const envelope = PIN_MODULES.PinStorageHelpers.backupEnvelope(portableDataSnapshot(this._data), [], {schemaVersion: 7, settings: portableSettingsSnapshot(this._settings)});
      await this.api.storage.local.set({mailpinNative220ManualBackup: envelope});
      return {ok: true, backend: "storage.local", envelope, path: ""};
    }
    if (method === "checkStorageIntegrity") return {ok: true, backend: "storage.local", checksumVerified: true};
    if (method === "getBackupStatus") return {backend: "storage.local", directory: "", stale: false, externalDownloadRequired: true};
    if (["chooseBackupDirectory", "createCalendarItem", "createCaseCalendarItem", "syncCalendarLinks"].includes(method)) throw new Error("Unavailable in native candidate; use export or local follow-up");
    if (method === "getCalendars") return [];
    if (method === "getCases") return clone(this._data.cases);
    if (method === "getTemplates") return clone(this._data.templates);
    if (method === "getHistory") return this._getHistory(args[0] || {});
    if (method === "getPerformanceReport") return this._getPerformanceReport();
    if (method === "getHealthReport" || method === "getDiagnosticReport" || method === "exportDiagnosticBundle") {
      const health = PIN_MODULES.PinHealth.build({data: this._data, settings: this._settings, compatibility: this._compatibility,
        integrity: {ok: true}, diagnostics: PIN_MODULES.PinDiagnostics.summary(this._diagnosticEvents)});
      return {...health, format: "mailpin-native-diagnostics", counts: {...health.counts, pinned: Object.keys(this._data.refs).length},
        compatibility: this._compatibility, integrity: {ok: true, backend: "storage.local"}, diagnostics: PIN_MODULES.PinDiagnostics.summary(this._diagnosticEvents),
        limitations: ["Calendar unavailable", "Inline panel replaced by tags and Space", "SQLite requires explicit export/import"]};
    }
    if (method === "runCompatibilityCheck" || method === "runProviderCompatibilityCheck") return this._compatibility;
    if (method === "syncTags") return {synced: Object.keys(this._data.refs).length, errors: 0};
    if (method === "clearDiagnostics") { const cleared = this._diagnosticEvents.length; this._diagnosticEvents = []; return {cleared}; }
    if (method === "clearRuleLog") { const cleared = this._data.ruleLog.length; this._data.ruleLog = []; return {cleared}; }
    if (method === "resetConfiguration") { this._pushUndo("Reset settings"); this._settings = nativeSettings(DEFAULT_SETTINGS); return this.configuration(); }
    if (method === "undoLast") { const undo = this._undoStack.pop(); if (undo) { this._data = normalizeData(undo.data); this._settings = nativeSettings(undo.settings); } return {undone: !!undo}; }
    if (["repairReferences", "rescanPinned", "repairHealthIssues", "cleanupBroken"].includes(method)) {
      await this.hydrate();
      let missing = 0;
      for (const ref of Object.values(this._data.refs)) if (ref.missingSince) { missing++; if (method === "cleanupBroken") this._removeReferenceByKey(ref.stableKey); }
      return {repaired: Object.keys(this._data.refs).length - missing, missing, configuration: await this.configuration()};
    }
    if (method === "resetInterface") { this._data.dashboard = clone(DEFAULT_DATA.dashboard); return this.configuration(); }
    if (method === "importNativeStars") {
      if (!await this.api.permissions.contains({permissions: ["accountsRead"]})) throw new Error("accountsRead permission required");
      const messages = await this.collect(await this.api.messages.query({flagged: true, messagesPerPage: 100}), 500);
      for (const message of messages) { this._ensureReference(await this.enrich(message)).nativeStarImported = true; if (args[0] === true) await this.api.messages.update(message.id, {flagged: false}); }
      return {imported: messages.length, bounded: true, configuration: await this.configuration()};
    }
    if (method === "simulateRules" || method === "runRules") {
      const options = args[0] || {};
      const messages = [];
      for (const ref of Object.values(this._data.refs).slice(0, 500)) { const message = await this.resolve(ref); if (message) messages.push(await this.enrich(message)); }
      return this.rules(messages, options.trigger || "messageAdded", method === "simulateRules", Array.isArray(options.rules) ? options.rules.map(normalizeRule).filter(Boolean) : this._data.rules);
    }
    if (method === "onMessages") {
      const [inputMessages, trigger] = args;
      const messages = [];
      for (const message of inputMessages.slice(0, 500)) messages.push(await this.enrich(message));
      if (this._settings.enableAutomaticRules && !this._settings.safeMode) await this.rules(messages, trigger, false);
      for (const message of messages) {
        for (const ref of Object.values(this._data.refs)) {
          if (headerId(message.headerMessageId) === headerId(ref.headerMessageId) && message.folder?.accountId === ref.accountKey) this.updateResolved(ref, message);
          if (trigger === "messageAdded" && ref.accountKey === message.folder?.accountId && ref.rootMessageId === message.rootMessageId &&
            headerId(message.headerMessageId) !== headerId(ref.noReplyBaselineMessageId || ref.headerMessageId) && dateMs(message.date) >= ref.noReplyStartedAt) {
            ref.lastReplyAt = dateMs(message.date);
            if (this._settings.noReplyCancelOnIncomingReply) PIN_MODULES.PinWorkflow.clearNoReplyState(ref);
            if (this._settings.reopenOnConversationReply && ref.completedAt) this._applyWorkflowStatusToReference(ref, "active");
          }
        }
      }
      return {ok: true};
    }
    if (method === "onAlarm") return this.onAlarm();
    if (method === "mergeRelatedReferences") {
      await this.hydrate();
      const refs = normalizeStableKeyList(args[0]).slice(0, 50).map(key => this._data.refs[key]).filter(Boolean);
      if (refs.length < 2) throw new Error("At least two references required");
      const identities = refs.map(ref => new Set(PIN_MODULES.PinRelated.identityKeys(ref)));
      if (![...identities[0]].some(id => identities.every(set => set.has(id)))) throw new Error("Strong shared conversation identity required");
      if (new Set(refs.map(ref => ref.calendarItemId).filter(Boolean)).size > 1) throw new Error("Conflicting calendar links");
      const note = [...new Set(refs.map(ref => ref.note?.trim()).filter(Boolean))].join("\n\n—\n\n");
      const checklist = refs.flatMap(ref => ref.checklist || []);
      if (note.length > 4000 || checklist.length > 50) throw new Error("Merge would truncate notes/checklists; export and reconcile first");
      const message = await this.resolve(refs[0]);
      if (!message) throw new Error("Conversation message unavailable");
      this._pushUndo("Merge conversation");
      const target = this._ensureReference(await this.enrich(message), "", "conversation");
      Object.assign(target, PIN_MODULES.PinRelated.mergeMetadata(refs));
      target.note = note;
      target.checklist = PIN_MODULES.PinChecklists.normalize(checklist);
      for (const ref of refs) if (ref.stableKey !== target.stableKey) this._removeReferenceByKey(ref.stableKey, {archiveAction: "merge-related"});
      return {count: refs.length, stableKey: target.stableKey};
    }
    const name = `_${method}`;
    if (typeof NativeProduct.prototype[name] === "function") return NativeProduct.prototype[name].apply(this, args);
    throw new Error("Unsupported native method");
  }
}
