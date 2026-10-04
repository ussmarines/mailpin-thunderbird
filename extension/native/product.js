// Current product methods ported selectively from 1.7.10.
import { DEFAULT_DATA, DEFAULT_SETTINGS, DEFAULT_COLORS, PIN_MODULES, clone, normalizeSettings, normalizeData, normalizeReference, normalizeRule, normalizeGroup, normalizeCase, normalizeTemplate, assertStructuredInput, normalizeStableKeyList, boundedText, clampNumber, uniqueEntityId, nextDefaultColor, portableSettingsSnapshot, portableDataSnapshot, hardenImportedConfiguration } from "./model.js";
const ExtensionError=Error, MAX_HISTORY=5000, MAX_ACTIVITY=1000, MAX_NOTE_LENGTH=4000, MAX_CASES=200, MAX_TEMPLATES=100, MAX_BULK_KEYS=500, DAY_MS=86400000;
const COLOR_RE=/^#[0-9a-f]{6}$/i;
const sanitizeSearchText=value=>String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
export class NativeProduct {
  _recordActivity(type, stableKey = "", label = "") {
    this._data.activity ??= [];
    this._data.activity.push({time: Date.now(), type: String(type), stableKey: String(stableKey || ""), label: String(label || "").slice(0, 300)});
    if (this._data.activity.length > MAX_ACTIVITY) this._data.activity.splice(0, this._data.activity.length - MAX_ACTIVITY);
  }

  _archiveReferenceHistory(ref, action = "completed", extra = {}) {
    if (!this._settings.enableHistory || !ref) return null;
    const record = PIN_MODULES.PinWorkflow?.archiveRecord(ref, action, extra) || normalizeHistory({...ref, action});
    if (!record) return null;
    this._data.history ||= [];
    this._data.history.push(record);
    if (this._data.history.length > MAX_HISTORY) this._data.history.splice(0, this._data.history.length - MAX_HISTORY);
    return record;
  }

  _getHistory(options = {}) {
    assertStructuredInput(options, "Options d’historique", {maxBytes: 64 * 1024, maxNodes: 1000});
    const search = sanitizeSearchText(options.search || "");
    const caseId = String(options.caseId || "");
    const limit = clampNumber(options.limit, 1, MAX_HISTORY, 500);
    return (this._data.history || []).filter(item => (!caseId || item.caseId === caseId) && (!search || sanitizeSearchText([item.subject,item.author,item.accountName,item.action].join(" ")).includes(search))).slice(-limit).reverse();
  }

  _updateReferenceDetails(stableKey, details = {}) {
    assertStructuredInput(details, "Détails du suivi", {maxBytes: 256 * 1024, maxNodes: 5000});
    const key = boundedText(stableKey, 8192);
    const ref = this._data.refs[key];
    if (!ref) throw new ExtensionError("Épingle introuvable.");
    this._pushUndo("Modification du suivi");
    if ("note" in details) ref.note = String(details.note || "").slice(0, MAX_NOTE_LENGTH);
    if ("checklist" in details) ref.checklist = PIN_MODULES.PinChecklists?.normalize(details.checklist) || [];
    ref.updatedAt = Date.now();
    this._recordActivity("details", key, ref.subject);
    this._saveData("reference-details");
    this._refreshAllStates(true);
    if (this._settings.enableBidirectionalCalendarSync && ref.calendarItemId) {
      this._syncReferenceToCalendar(ref).catch(error => this._recordDiagnostic("warning", "Mise à jour Agenda impossible", error));
    }
    if (this._settings.enableThunderbirdTagSync) {
      this._syncTags([key]).catch(error => this._recordDiagnostic("warning", "Synchronisation des tags impossible", error));
    }
    return this._serializeReference(ref, true);
  }

  _createSavedView(details = {}) {
    assertStructuredInput(details, "Vue enregistrée", {maxBytes: 64 * 1024, maxNodes: 1000});
    const views = this._data.savedViews || (this._data.savedViews = []);
    if (views.length >= (PIN_MODULES.PinSavedViews?.MAX_VIEWS || 30)) throw new ExtensionError("Le nombre maximal de vues enregistrées est atteint.");
    const now = Date.now();
    const normalized = PIN_MODULES.PinSavedViews?.normalize({...details, id: uniqueEntityId("view", views), createdAt: now, updatedAt: now}, views.length);
    if (!normalized) throw new ExtensionError("Donnez un nom valide à la vue.");
    this._pushUndo("Création d’une vue enregistrée");
    views.push(normalized);
    this._data.dashboard = {...(this._data.dashboard || {}), savedViewId: normalized.id};
    this._saveData("saved-view-create");
    return clone(normalized);
  }

  _updateSavedView(viewId, details = {}) {
    assertStructuredInput(details, "Vue enregistrée", {maxBytes: 64 * 1024, maxNodes: 1000});
    const index = (this._data.savedViews || []).findIndex(item => item.id === String(viewId || ""));
    if (index < 0) throw new ExtensionError("Vue enregistrée introuvable.");
    const current = this._data.savedViews[index];
    const normalized = PIN_MODULES.PinSavedViews?.normalize({...current, ...details, id: current.id, createdAt: current.createdAt, updatedAt: Date.now()}, index);
    if (!normalized) throw new ExtensionError("Donnez un nom valide à la vue.");
    this._pushUndo("Modification d’une vue enregistrée");
    this._data.savedViews[index] = normalized;
    this._saveData("saved-view-update");
    return clone(normalized);
  }

  _deleteSavedView(viewId) {
    const id = boundedText(viewId, 80);
    const index = (this._data.savedViews || []).findIndex(item => item.id === id);
    if (index < 0) return {deleted: false};
    this._pushUndo("Suppression d’une vue enregistrée");
    this._data.savedViews.splice(index, 1);
    if (this._data.dashboard?.savedViewId === id) this._data.dashboard.savedViewId = "";
    this._saveData("saved-view-delete");
    return {deleted: true};
  }

  _clearNoReplyState(ref) {
    PIN_MODULES.PinWorkflow?.clearNoReplyState(ref);
  }

  _applyWorkflowStatusToReference(ref, target, options = {}, now = Date.now()) {
    const wasCompleted = Boolean(ref.completedAt || ref.workflowStatus === "completed");
    if (target === "completed" && !wasCompleted) {
      ref.completedAt ||= now;
      this._archiveReferenceHistory(ref, options.action || "completed", options.archiveExtra || {});
    }
    PIN_MODULES.PinWorkflow?.applyStatus(ref, target, {
      ...options,
      now,
      defaultFollowUpDays: this._settings.defaultFollowUpDays || 3,
      enableRecurringFollowUps: this._settings.enableRecurringFollowUps
    });
  }

  _setWorkflowStatus(stableKeys, status, options = {}) {
    assertStructuredInput(options, "Options de workflow", {maxBytes: 64 * 1024, maxNodes: 1000});
    const allowed = new Set(["active", "waiting", "planned", "completed"]);
    const target = allowed.has(status) ? status : "active";
    const keys = normalizeStableKeyList(stableKeys);
    const refs = keys.map(key => this._data.refs[key]).filter(Boolean);
    if (!refs.length) return {count:0,status:target};
    this._pushUndo(`Statut ${target}`);
    const now = Date.now();
    for (const ref of refs) {
      this._applyWorkflowStatusToReference(ref, target, options, now);
      ref.updatedAt = now;
      if (this._settings.enableBidirectionalCalendarSync && ref.calendarItemId) this._syncReferenceToCalendar(ref).catch(error => this._recordDiagnostic("warning","Synchronisation Agenda impossible",error));
    }
    this._saveData(`workflow-${target}`); this._refreshAllStates(true);
    if (this._settings.enableThunderbirdTagSync) this._syncTags(refs.map(item => item.stableKey)).catch(error => this._recordDiagnostic("warning", "Synchronisation des tags impossible", error));
    return {count:refs.length,status:target};
  }

  _createCase(details = {}) {
    assertStructuredInput(details, "Affaire", {maxBytes: 64 * 1024, maxNodes: 1000});
    if (!this._settings.enableCases) throw new ExtensionError("Les affaires sont désactivées.");
    if ((this._data.cases || []).length >= MAX_CASES) throw new ExtensionError("Nombre maximal d’affaires atteint.");
    const values = this._data.cases || [];
    const requestedColor = COLOR_RE.test(String(details.color || ""))
      ? String(details.color).toLowerCase()
      : nextDefaultColor([...(this._data.groups || []), ...values]);
    const item = normalizeCase({...details, color: requestedColor, id: details.id || uniqueEntityId("case", values)}, values.length);
    if (!item) throw new ExtensionError("Affaire invalide.");
    if (values.some(existing => existing.id === item.id)) throw new ExtensionError("Une affaire utilise déjà cet identifiant.");
    values.push(item); this._data.caseOrder.push(item.id); this._saveData("case-create");
    return clone(item);
  }

  _updateCase(caseId, details = {}) {
    assertStructuredInput(details, "Affaire", {maxBytes: 64 * 1024, maxNodes: 1000});
    caseId = boundedText(caseId, 64);
    const index=(this._data.cases||[]).findIndex(item=>item.id===String(caseId));
    if(index<0) throw new ExtensionError("Affaire introuvable.");
    const item=normalizeCase({...this._data.cases[index],...details,id:this._data.cases[index].id,updatedAt:Date.now()},index);
    this._data.cases[index]=item; this._saveData("case-update"); this._refreshAllStates(true); return clone(item);
  }

  _deleteCase(caseId) {
    const id=boundedText(caseId, 64); const before=(this._data.cases||[]).length;
    const removedCase=(this._data.cases||[]).find(item=>item.id===id)||null;
    if (removedCase?.calendarItemId && this._settings.calendarDeleteOnUnpin) {
      this._deleteLinkedCaseCalendarItem(removedCase).catch(error=>this._recordDiagnostic("warning","Suppression Agenda de l’affaire impossible",error));
    }
    this._data.cases=(this._data.cases||[]).filter(item=>item.id!==id); this._data.caseOrder=(this._data.caseOrder||[]).filter(item=>item!==id);
    for(const ref of Object.values(this._data.refs)) if(ref.caseId===id) ref.caseId="";
    if(before!==this._data.cases.length){this._saveData("case-delete");this._refreshAllStates(true);}
    return {deleted:before!==this._data.cases.length};
  }

  _createTemplate(details = {}) {
    assertStructuredInput(details, "Modèle", {maxBytes: 64 * 1024, maxNodes: 1000});
    if (!this._settings.enableTemplates) throw new ExtensionError("Les modèles sont désactivés.");
    if ((this._data.templates || []).length >= MAX_TEMPLATES) throw new ExtensionError("Nombre maximal de modèles atteint.");
    const values = this._data.templates || [];
    const item=normalizeTemplate({...details,id:details.id||uniqueEntityId("template",values)},values.length);
    if(!item) throw new ExtensionError("Modèle invalide.");
    if(values.some(existing=>existing.id===item.id)) throw new ExtensionError("Un modèle utilise déjà cet identifiant.");
    values.push(item);this._saveData("template-create");return clone(item);
  }

  _updateTemplate(templateId, details = {}) {
    assertStructuredInput(details, "Modèle", {maxBytes: 64 * 1024, maxNodes: 1000});
    templateId = boundedText(templateId, 64);
    const index=(this._data.templates||[]).findIndex(item=>item.id===String(templateId));
    if(index<0) throw new ExtensionError("Modèle introuvable.");
    const item=normalizeTemplate({...this._data.templates[index],...details,id:this._data.templates[index].id},index);
    this._data.templates[index]=item;this._saveData("template-update");return clone(item);
  }

  _deleteTemplate(templateId) {
    const id=boundedText(templateId, 64);const before=(this._data.templates||[]).length;
    this._data.templates=(this._data.templates||[]).filter(item=>item.id!==id);
    for(const ref of Object.values(this._data.refs)) if(ref.templateId===id) ref.templateId="";
    if(before!==this._data.templates.length)this._saveData("template-delete");
    return {deleted:before!==this._data.templates.length};
  }

  _applyTemplate(stableKeys, templateId, {pushUndo=true, save=true, refresh=true} = {}) {
    templateId = boundedText(templateId, 64);
    const template=(this._data.templates||[]).find(item=>item.id===templateId);
    if(!template) throw new ExtensionError("Modèle introuvable.");
    const keys=normalizeStableKeyList(stableKeys);const refs=keys.map(key=>this._data.refs[key]).filter(Boolean);const now=Date.now();
    if (pushUndo) this._pushUndo(`Application du modèle ${template.name}`);
    for(const ref of refs){
      ref.templateId=template.id;ref.groupId=template.groupId||ref.groupId;ref.caseId=template.caseId||ref.caseId;ref.priorityLevel=template.priorityLevel;
      if(template.dueOffsetDays)ref.dueAt=now+template.dueOffsetDays*DAY_MS;
      const templateFollowUpAt=template.followUpDelayDays?now+template.followUpDelayDays*DAY_MS:0;
      this._applyWorkflowStatusToReference(ref,template.workflowStatus,{followUpAt:templateFollowUpAt,clearFollowUp:!templateFollowUpAt,clearNoReply:true,preserveFollowUp:false},now);
      ref.reminderLeadMinutes=template.reminderLeadMinutes;
      if(ref.dueAt)ref.reminderAt=Math.max(now,ref.dueAt-template.reminderLeadMinutes*60000);
      ref.recurrenceRule=template.recurrenceRule;ref.recurrenceInterval=template.recurrenceInterval;
      if(template.notePrefix&&!ref.note.startsWith(template.notePrefix))ref.note=`${template.notePrefix}${ref.note?`\n${ref.note}`:""}`.slice(0,MAX_NOTE_LENGTH);
      ref.updatedAt=now;
      if(this._settings.enableBidirectionalCalendarSync&&ref.calendarItemId)this._syncReferenceToCalendar(ref).catch(error=>this._recordDiagnostic("warning","Mise à jour Agenda après modèle impossible",error));
    }
    if (save) this._saveData("template-apply");
    if (refresh) this._refreshAllStates(true);
    if(this._settings.enableThunderbirdTagSync&&save)this._syncTags(refs.map(ref=>ref.stableKey)).catch(error=>this._recordDiagnostic("warning","Synchronisation des tags impossible",error));
    return {count:refs.length,template:clone(template)};
  }

  _setReferenceMetadata(stableKey, patch) {
    const ref=this._data.refs[stableKey];if(!ref||!patch||typeof patch!=="object")return false;
    this._pushUndo("Modification du message épinglé");const now=Date.now();
    if("note" in patch)ref.note=String(patch.note||"").slice(0,MAX_NOTE_LENGTH);
    if("checklist" in patch)ref.checklist=PIN_MODULES.PinChecklists?.normalize(patch.checklist)||[];
    if("dueAt" in patch)ref.dueAt=Math.max(0,Number(patch.dueAt)||0);
    if("reminderAt" in patch){ref.reminderAt=Math.max(0,Number(patch.reminderAt)||0);ref.reminderFiredAt=0;}
    if("priorityLevel" in patch&&["normal","high","urgent"].includes(patch.priorityLevel))ref.priorityLevel=patch.priorityLevel;
    if("groupId" in patch)ref.groupId=this._groupForId(String(patch.groupId||""))?String(patch.groupId):"";
    if("caseId" in patch)ref.caseId=(this._data.cases||[]).some(item=>item.id===String(patch.caseId||""))?String(patch.caseId):"";
    if("repeatRule" in patch&&["","daily","weekdays","weekly","monthly"].includes(patch.repeatRule))ref.repeatRule=patch.repeatRule;
    if("recurrenceRule" in patch&&["","daily","weekdays","weekly","monthly","quarterly","yearly"].includes(patch.recurrenceRule))ref.recurrenceRule=patch.recurrenceRule;
    if("recurrenceInterval" in patch)ref.recurrenceInterval=clampNumber(patch.recurrenceInterval,1,100,1);
    if("followUpAt" in patch)ref.followUpAt=Math.max(0,Number(patch.followUpAt)||0);
    if("reminderLeadMinutes" in patch)ref.reminderLeadMinutes=clampNumber(patch.reminderLeadMinutes,0,10080,0);
    if("snoozeUntil" in patch){ref.snoozeUntil=Math.max(0,Number(patch.snoozeUntil)||0);ref.reminderFiredAt=0;}
    const requestedWorkflow = ["active","waiting","planned","completed"].includes(patch.workflowStatus) ? patch.workflowStatus : "";
    if (requestedWorkflow || "completed" in patch) {
      const target = patch.completed === true ? "completed" : requestedWorkflow || "active";
      this._applyWorkflowStatusToReference(ref, target, {followUpAt:ref.followUpAt,clearFollowUp:false,action:"metadata-complete"}, now);
    }
    ref.updatedAt=now;this._recordActivity("metadata",stableKey,ref.subject);this._saveData("metadata");this._refreshAllStates(true);this._showToastAll("Informations du message mises à jour.",true);
    if(this._settings.enableBidirectionalCalendarSync&&ref.calendarItemId)this._syncReferenceToCalendar(ref).catch(error=>this._recordDiagnostic("warning","Mise à jour Agenda impossible",error));
    if(this._settings.enableThunderbirdTagSync)this._syncTags([stableKey]).catch(error=>this._recordDiagnostic("warning","Synchronisation des tags impossible",error));
    return true;
  }

  _setNoReplyTracking(stableKeys, options = {}) {
    assertStructuredInput(options, "Options de relance", {maxBytes: 64 * 1024, maxNodes: 1000});
    const keys = normalizeStableKeyList(stableKeys);
    const refs = keys.map(key => this._data.refs[key]).filter(Boolean);
    if (!refs.length) return {count:0};
    const enabled = options.enabled !== false;
    const days = clampNumber(options.days, 1, 365, this._settings.noReplyDefaultDays || 5);
    const now = Date.now();
    const requestedAt = Number(options.at);
    const dueAt = requestedAt > now
      ? Math.min(requestedAt, now + 365 * DAY_MS)
      : now + days * DAY_MS;
    this._pushUndo(enabled ? "Suivi sans réponse" : "Arrêt du suivi sans réponse");
    for (const ref of refs) {
      ref.noReplyTracking = enabled;
      ref.noReplyStartedAt = enabled ? now : 0;
      ref.noReplyAt = enabled ? dueAt : 0;
      ref.noReplyBaselineMessageId = enabled ? String(ref.headerMessageId || "") : "";
      if (enabled) {
        ref.workflowStatus = "waiting"; ref.waitingSince ||= now; ref.followUpAt = ref.noReplyAt; ref.completedAt = 0;
      } else if (options.keepWaiting !== true) {
        ref.workflowStatus = "active"; ref.waitingSince = 0; ref.followUpAt = 0;
      }
      ref.updatedAt = now;
      this._recordActivity(enabled ? "no-reply-start" : "no-reply-cancel", ref.stableKey, ref.subject);
    }
    this._saveData(enabled ? "no-reply-start" : "no-reply-cancel");
    this._refreshAllStates(true);
    if(this._settings.enableThunderbirdTagSync)this._syncTags(refs.map(ref=>ref.stableKey)).catch(error=>this._recordDiagnostic("warning","Synchronisation des tags impossible",error));
    return {count:refs.length, enabled, dueAt:enabled ? refs[0].noReplyAt : 0};
  }

  _getDashboardData(options = {}) {
    assertStructuredInput(options, "Options du tableau de bord", {maxBytes: 64 * 1024, maxNodes: 1000});
    const validFilters = new Set(["active", "all", "overdue", "today", "week", "completed", "unread", "waiting", "planned", "noReply", "snoozed", "noDue", "missing", "calendarError", "recentCompleted", "waitingForThem", "needsReply", "checklistPending"]);
    const validViews = new Set(["today", "list", "kanban", "cases", "review", "history", "health"]);
    const filter = validFilters.has(options.filter) ? options.filter : (this._data.dashboard?.filter || "active");
    const smartView = validFilters.has(options.smartView) ? options.smartView : (this._data.dashboard?.smartView || this._settings.defaultSmartView || "today");
    const savedViewId = String(options.savedViewId ?? this._data.dashboard?.savedViewId ?? "").slice(0, 80);
    const savedView = (this._data.savedViews || []).find(item => item.id === savedViewId) || null;
    const rawSearch = options.search !== undefined ? options.search : (savedView?.search ?? this._data.dashboard?.search ?? "");
    const search = sanitizeSearchText(rawSearch);
    const view = validViews.has(options.view) ? options.view : (this._data.dashboard?.view || "today");
    const reviewMode = options.reviewMode === "weekly" ? "weekly" : (options.reviewMode === "daily" ? "daily" : (this._data.dashboard?.reviewMode === "weekly" ? "weekly" : "daily"));
    const nextDashboard = {filter, smartView, search: String(rawSearch || "").slice(0, 500), view, reviewMode, savedViewId: savedView?.id || ""};
    if ((PIN_MODULES.PinStorageHelpers?.stableStringify(this._data.dashboard) || JSON.stringify(this._data.dashboard)) !==
        (PIN_MODULES.PinStorageHelpers?.stableStringify(nextDashboard) || JSON.stringify(nextDashboard))) {
      this._data.dashboard = nextDashboard;
      this._saveData("dashboard-state");
    }

    const refs = Object.values(this._data.refs);
    const now = Date.now();
    const serializedAll = refs.map(ref => this._serializeReference(ref));
    const serializedByKey = new Map(serializedAll.map(item => [item.stableKey, item]));
    const allItems = [];
    for (const item of serializedAll) {
      const ref = this._data.refs[item.stableKey];
      const context = {unread: item.unread, missing: item.missing, calendarError: Boolean(item.calendarSyncError), now};
      const activeFilter = savedView?.smartView || (options.useSmartView !== false && this._settings.enableSmartViews ? smartView : filter);
      const matches = PIN_MODULES.PinSmartViews?.matches(activeFilter, ref, {...context, responseState:item.responseState, checklistStats:item.checklistStats}) ?? (activeFilter === "all" || item.smartSection === activeFilter || item.workflowStatus === activeFilter);
      if (!matches) continue;
      const searchText = [item.subject, item.author, item.note, PIN_MODULES.PinChecklists?.searchableText(item.checklist), (item.tags || []).map(tag => tag.name || tag.key).join(" "), item.accountName, item.folderName, item.groupName, item.caseName, item.workflowStatus, item.responseState].join(" ");
      const normalizedSearchText = sanitizeSearchText(searchText);
      const searchTokens = search.split(/\s+/).filter(Boolean);
      if (searchTokens.some(token => !normalizedSearchText.includes(token))) continue;
      if (savedView && !PIN_MODULES.PinSavedViews?.matches(savedView, {...item, searchText}, {normalizeText:sanitizeSearchText, smartMatches:(viewId, candidate)=>PIN_MODULES.PinSmartViews?.matches(viewId, ref, {...context,responseState:candidate.responseState,checklistStats:candidate.checklistStats})})) continue;
      allItems.push(item);
    }
    allItems.sort((left, right) =>
      (left.snoozeUntil || left.dueAt || left.followUpAt || left.noReplyAt || Number.MAX_SAFE_INTEGER) -
      (right.snoozeUntil || right.dueAt || right.followUpAt || right.noReplyAt || Number.MAX_SAFE_INTEGER) || right.date - left.date);

    const smartCounts = PIN_MODULES.PinSmartViews?.counts(serializedAll.map(item => ({ref: item, unread: item.unread, missing: item.missing, calendarError: Boolean(item.calendarSyncError), responseState:item.responseState, checklistStats:item.checklistStats})), now) || {};
    const dailyReview = PIN_MODULES.PinReview?.build(serializedAll, {now, mode: "daily"}) || {mode: "daily", buckets: {}, counts: {}, actionable: 0, total: 0};
    const weeklyReview = PIN_MODULES.PinReview?.build(serializedAll, {now, mode: "weekly"}) || {mode: "weekly", buckets: {}, counts: {}, actionable: 0, total: 0};
    const relatedGroups = (PIN_MODULES.PinRelated?.detect(refs) || []).map(group => ({
      ...group,
      items: group.stableKeys.map(key => serializedByKey.get(key)).filter(Boolean)
    }));
    const pendingReminders = (PIN_MODULES.PinReview?.pendingReminders(serializedAll, {now}) || []).slice(0, 20);
    const diagnosticSummary = PIN_MODULES.PinDiagnostics?.summary(this._diagnosticEvents || []) || {total: (this._diagnosticEvents || []).length, counts: {}};
    const health = PIN_MODULES.PinHealth?.build({data: this._data, settings: this._settings, compatibility: this._compatibility, performance: this._getPerformanceReport(), diagnostics: diagnosticSummary}) || null;
    return {
      items: allItems,
      filter,
      smartView,
      search: String(rawSearch || ""),
      view,
      reviewMode,
      smartViews: clone(PIN_MODULES.PinSmartViews?.VIEWS || []),
      savedViews: clone(this._data.savedViews || []),
      savedViewId: savedView?.id || "",
      smartCounts,
      todayPlan: dailyReview,
      review: reviewMode === "weekly" ? weeklyReview : dailyReview,
      pendingReminders,
      relatedGroups,
      groups: clone(this._data.groups),
      cases: clone(this._data.cases || []),
      templates: clone(this._data.templates || []),
      history: this._getHistory({limit: 200, search: options.historySearch !== undefined ? options.historySearch : rawSearch}),
      ruleLog: clone((this._data.ruleLog || []).slice(-200).reverse()),
      stats: {
        total: refs.length,
        active: refs.filter(ref => (ref.workflowStatus || "active") === "active" && !ref.completedAt).length,
        waiting: refs.filter(ref => ref.workflowStatus === "waiting").length,
        planned: refs.filter(ref => ref.workflowStatus === "planned").length,
        completed: refs.filter(ref => ref.completedAt || ref.workflowStatus === "completed").length,
        overdue: refs.filter(ref => !ref.completedAt && ((ref.dueAt && ref.dueAt < now) || (ref.followUpAt && ref.followUpAt < now))).length,
        noReply: refs.filter(ref => ref.noReplyTracking).length,
        snoozed: refs.filter(ref => Number(ref.snoozeUntil || 0) > now && !ref.completedAt).length,
        missing: refs.filter(ref => ref.missingSince).length,
        ...(PIN_MODULES.PinAnalytics?.build(refs, this._data.history || [], now, value => PIN_MODULES.PinChecklists?.stats(value) || {pending:0}) || {})
      },
      activity: clone((this._data.activity || []).slice(-100).reverse()),
      compatibility: clone(this._compatibility),
      providerMatrix: clone(this._data.providerMatrix || DEFAULT_DATA.providerMatrix),
      performance: this._getPerformanceReport(),
      health,
      diagnostics: diagnosticSummary,
      revision: this._data.revision || 0,
      counterRegressionEvents: clone(this._counterRegressionEvents || [])
    };
  }

  _snoozeReferences(stableKeys, options = {}) {
    assertStructuredInput(options, "Options de mise en veille", {maxBytes: 64 * 1024, maxNodes: 1000});
    const keys = normalizeStableKeyList(stableKeys).slice(0, MAX_BULK_KEYS);
    const refs = keys.map(key => this._data.refs[key]).filter(Boolean);
    if (!refs.length) return {count: 0, snoozed: false};
    const now = Date.now();
    const duration = clampNumber(options.durationMs, 60_000, 30 * DAY_MS, 3_600_000);
    const requestedUntil = Number(options.until) || 0;
    const until = requestedUntil > now ? Math.min(requestedUntil, now + 30 * DAY_MS) : now + duration;
    this._pushUndo("Mise en veille");
    for (const ref of refs) {
      ref.snoozeUntil = until;
      ref.reminderFiredAt = 0;
      ref.reminderAcknowledgedAt = 0;
      ref.updatedAt = now;
      this._recordActivity("snooze", ref.stableKey, new Date(until).toISOString());
    }
    this._saveData("snooze");
    this._refreshAllStates(true);
    this._showToastAll(`${refs.length} message(s) mis en veille.`, true);
    return {count: refs.length, snoozed: true, until};
  }

  _wakeReferences(stableKeys) {
    const keys = normalizeStableKeyList(stableKeys).slice(0, MAX_BULK_KEYS);
    const refs = keys.map(key => this._data.refs[key]).filter(Boolean);
    if (!refs.length) return {count: 0, woken: false};
    const now = Date.now();
    this._pushUndo("Réveil des messages");
    for (const ref of refs) {
      ref.snoozeUntil = 0;
      ref.reminderFiredAt = 0;
      ref.reminderAcknowledgedAt = 0;
      ref.updatedAt = now;
      this._recordActivity("wake", ref.stableKey, ref.subject);
    }
    this._saveData("wake");
    this._refreshAllStates(true);
    this._showToastAll(`${refs.length} message(s) réveillé(s).`, true);
    return {count: refs.length, woken: true};
  }

  _acknowledgeReminders(stableKeys) {
    const keys = normalizeStableKeyList(stableKeys).slice(0, MAX_BULK_KEYS);
    const refs = keys.map(key => this._data.refs[key]).filter(Boolean);
    if (!refs.length) return {count: 0};
    const now = Date.now();
    for (const ref of refs) {
      ref.reminderAcknowledgedAt = now;
      ref.updatedAt = now;
      this._recordActivity("reminder-acknowledged", ref.stableKey, ref.subject);
    }
    this._saveData("reminder-acknowledged");
    this._refreshAllStates(true);
    return {count: refs.length, acknowledged: true};
  }

  _snoozeReminder(stableKey, durationMs) {
    const result = this._snoozeReferences([boundedText(stableKey, 8192)], {durationMs});
    return {snoozed: Boolean(result.count), until: result.until || 0, count: result.count || 0};
  }


}
