"use strict";

let configuration = null;
let groups = [];
let rules = [];
let cases = [];
let templates = [];
let dirty = false;
let statusTimer = null;
let lastStatusControl = null;

const accountControls = new Map();
const inboxControls = new Map();
const $ = id => document.getElementById(id);
const BOOLEAN_IDS=[
  "allowPinOutsideInbox","enableConversationPins","safeMode","showSmartSections","hideCompleted","autoRemoveCompleted","groupByAccount","groupByCustomGroup","showSearch","showCounters","rememberCollapsed","showAccountColor","showAttachments","showTags","showPriority","smartDates","showFolder","showNotes","showDeadlines","showGroups","showQuickActions","enableDragFromInbox","enableMultiSelect","enableUndo","confirmDelete","animateChanges","enableReminders","enableAdvancedReminders","enableAutomaticRules","enableRuleSimulation","autoUnpinOnArchive","autoCompleteOnArchive","autoUnpinOnDelete","autoUnpinOnRead","autoUnpinOnReply","keepPinOnMove","moveToWaitingOnReply","enableCalendarIntegration","enableBidirectionalCalendarSync","calendarCompleteOnPinComplete","calendarDeleteOnUnpin","enableGlobalDashboard","enablePerformanceMetrics","autoCleanup","enableWaitingWorkflow","reopenOnConversationReply","enableRecurringFollowUps","enableHistory","enableCases","enableKanban","enableTemplates","enableAutomaticBackups","backupBeforeMigration","backupIncludeHistory","enableConcurrentWriteProtection","enableCounterRegressionGuard"
];
const SELECT_IDS=["pinMode","defaultPinTarget","compatibilityMode","panelScope","sortMode","density","missedReminderPolicy","calendarItemType"];
const NUMBER_IDS=["cardLines","panelMaxHeight","panelPageSize","completedRetentionDays","undoTimeoutMs","reminderLeadMinutes","cleanupGraceDays","defaultFollowUpDays","ruleErrorDisableThreshold","ruleDefaultMaxPerMinute","backupIntervalHours","backupRetention"];

const CONTROL_HELP = {
  pinMode: "Le mode indépendant conserve les épingles dans le stockage local MailPerch sans modifier les étoiles Thunderbird.",
  defaultPinTarget: "Détermine si une nouvelle épingle suit uniquement le message sélectionné ou toute sa conversation.",
  compatibilityMode: "Automatique adapte l’intégration à votre version de Thunderbird. Le mode réduit désactive les fonctions DOM les plus sensibles.",
  enableCounterRegressionGuard: "Vérifie que MailPerch ne modifie pas les compteurs natifs de messages lus, non lus ou nouveaux.",
  enableConcurrentWriteProtection: "Sérialise les écritures locales lorsque plusieurs fenêtres Thunderbird utilisent MailPerch en même temps.",
  safeMode: "Masque les fonctions avancées susceptibles de dépendre davantage de l’interface interne de Thunderbird.",
  showQuickActions: "Affiche les boutons Répondre, Attente, Terminer et Modifier sur les cartes épinglées.",
  enableMultiSelect: "Autorise Ctrl/Cmd, Maj et les actions groupées dans le panneau des épingles.",
  confirmDelete: "Demande une confirmation avant toute suppression de message déclenchée depuis MailPerch.",
  enableCalendarIntegration: "Autorise la création locale de tâches et d’événements dans les calendriers Thunderbird compatibles.",
  enableBidirectionalCalendarSync: "Répercute les échéances et états terminés entre l’épingle et l’élément Agenda lié.",
  calendarCompleteOnPinComplete: "Marque la tâche Agenda terminée lorsque l’épingle correspondante est terminée.",
  calendarDeleteOnUnpin: "Supprime l’élément Agenda lié lors du désépinglage. Cette option peut être destructive.",
  calendarItemType: "Type proposé par défaut. Le calendrier reste sélectionnable au moment de chaque création.",
  preferredCalendarId: "Calendrier présélectionné. Laissez vide pour choisir le calendrier au moment de créer la tâche ou l’événement.",
  enableAutomaticBackups: "Crée périodiquement des sauvegardes locales de la configuration et des références MailPerch.",
  backupDirectory: "Dossier local utilisé pour les sauvegardes automatiques et manuelles.",
  enableGlobalDashboard: "Active l’onglet global regroupant les épingles de tous les comptes.",
  enablePerformanceMetrics: "Mesure uniquement les durées de rendu locales, sans télémétrie ni envoi réseau.",
  shortcut: "Raccourci Thunderbird utilisé pour épingler ou désépingler la sélection courante."
};

const BUTTON_HELP = {
  "import-stars": "Copie les étoiles Thunderbird existantes vers les épingles MailPerch. Les messages ne sont ni déplacés ni marqués comme lus.",
  "simulate-rules": "Analyse les règles sans modifier les messages ni les épingles.",
  "clear-rule-log": "Efface seulement le journal local des règles, pas les messages ni les règles.",
  "add-rule": "Ajoute une règle locale désactivable avant son enregistrement.",
  "add-group": "Ajoute un groupe local pour organiser les cartes épinglées.",
  "add-case": "Ajoute une affaire locale pouvant regrouper plusieurs messages.",
  "add-template": "Ajoute un modèle de suivi réutilisable.",
  "sync-calendar": "Relit et synchronise les liens Agenda existants. Aucun nouvel élément n’est créé sans action explicite.",
  "choose-backup": "Choisit le dossier local des sauvegardes et enregistre immédiatement ce chemin.",
  "run-backup": "Crée immédiatement une sauvegarde locale dans le dossier configuré.",
  "integrity-check": "Vérifie la cohérence SQLite sans supprimer ni réparer automatiquement les données.",
  "compat-check": "Contrôle la disponibilité des fonctions Thunderbird utilisées par MailPerch.",
  dashboard: "Ouvre le tableau de bord global dans un nouvel onglet Thunderbird.",
  undo: "Annule la dernière action MailPerch encore disponible dans l’historique local.",
  repair: "Tente de retrouver les messages déplacés ou renommés sans modifier les compteurs Thunderbird.",
  rescan: "Rescanne les références épinglées pour mettre à jour leur état local.",
  cleanup: "Retire les références définitivement introuvables après le délai de sécurité configuré.",
  "reset-interface": "Réinitialise uniquement la disposition et les préférences visuelles de l’interface.",
  diagnostic: "Exporte un rapport technique local expurgé du corps des messages et des pièces jointes.",
  export: "Télécharge une sauvegarde JSON locale de la configuration MailPerch.",
  "save-shortcut": "Enregistre uniquement le raccourci Thunderbird indiqué.",
  "save-all": "Enregistre tous les champs, groupes, règles, affaires et modèles actuellement modifiés.",
  reset: "Réinitialise les réglages, groupes, affaires, modèles et règles. Les épingles sont conservées."
};

function genericControlHelp(control) {
  if (control.type === "checkbox") return "Active ou désactive cette fonction après l’enregistrement des paramètres.";
  if (control.tagName === "SELECT") return "Choisissez le comportement utilisé par MailPerch, puis enregistrez les paramètres.";
  if (control.type === "number") return "Définit une limite ou une durée locale appliquée après l’enregistrement.";
  if (control.tagName === "TEXTAREA") return "Une valeur par ligne. Les données restent stockées localement dans MailPerch.";
  return "Cette valeur est appliquée après l’enregistrement des paramètres.";
}

function slugify(value) {
  return String(value || "section")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function setLocalStatus(control, message, type = "") {
  if (!(control instanceof HTMLElement) || !message) return;
  const anchor = control.closest(".button-help-wrap, label, .file-button") || control;
  const section = control.closest("section") || control.closest("footer");
  if (!section) return;
  for (const old of section.querySelectorAll(".control-feedback[data-active='true']")) {
    old.dataset.active = "false";
  }
  let feedback = anchor.parentElement?.querySelector(`:scope > .control-feedback[data-for="${control.id || control.name || "control"}"]`);
  if (!feedback) {
    feedback = node("small", "control-feedback");
    feedback.dataset.for = control.id || control.name || "control";
    anchor.after(feedback);
  }
  feedback.textContent = String(message);
  feedback.className = `control-feedback ${type}`.trim();
  feedback.dataset.active = "true";
  feedback.setAttribute("role", type === "error" ? "alert" : "status");
}

function enhanceSettingsPage() {
  const nav = $("settings-nav");
  nav.replaceChildren();
  const sections = [...document.querySelectorAll("#settings-form > section")];
  sections.forEach((section, index) => {
    const heading = section.querySelector("h2");
    if (!heading) return;
    section.id ||= `settings-${slugify(heading.textContent)}-${index + 1}`;
    section.dataset.searchText = section.textContent.toLowerCase();
    const link = node("a", "settings-nav-link", heading.textContent.trim());
    link.href = `#${section.id}`;
    link.dataset.sectionId = section.id;
    nav.appendChild(link);
  });

  for (const label of document.querySelectorAll("#settings-form section label")) {
    const control = label.querySelector("input:not([type='file']), select, textarea");
    if (!control || label.querySelector(":scope > .control-help")) continue;
    const help = node("small", "control-help", CONTROL_HELP[control.id] || genericControlHelp(control));
    const helpId = `help-${control.id || Math.random().toString(36).slice(2)}`;
    help.id = helpId;
    control.setAttribute("aria-describedby", [control.getAttribute("aria-describedby"), helpId].filter(Boolean).join(" "));
    label.appendChild(help);
  }

  for (const button of document.querySelectorAll("#settings-form section button, #settings-form footer button")) {
    if (!button.id || button.closest(".save-dock") || button.closest(".button-help-wrap")) continue;
    const wrapper = node("span", "button-help-wrap");
    button.before(wrapper);
    wrapper.appendChild(button);
    const help = node("small", "button-help", BUTTON_HELP[button.id] || "Exécute cette action localement et affiche son résultat sous ce bouton et dans une notification visible.");
    wrapper.appendChild(help);
  }

  const search = $("settings-search");
  const applySearch = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const section of sections) {
      const match = !query || section.textContent.toLowerCase().includes(query);
      section.hidden = !match;
      const link = nav.querySelector(`[data-section-id="${section.id}"]`);
      if (link) link.hidden = !match;
      if (match) visible++;
    }
    $("settings-search-summary").textContent = query
      ? `${visible} section(s) contenant « ${search.value.trim()} ».`
      : `${sections.length} sections disponibles.`;
  };
  search.addEventListener("input", applySearch);
  applySearch();
}
function setDirty(value = true) {
  dirty = Boolean(value);
  document.body.toggleAttribute("data-dirty", dirty);
  const dock = $("save-dock");
  if (dock) dock.hidden = !dirty;
  if ($("save-dock-message")) {
    $("save-dock-message").textContent = dirty
      ? "Modifications non enregistrées — elles ne seront appliquées qu’après Enregistrer."
      : "Paramètres enregistrés.";
  }
}

function clearStatus() {
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  const host = $("status");
  if (!host) return;
  host.hidden = true;
  host.className = "status-toast";
  $("status-message").textContent = "";
}

function setStatus(message, type = "", {persistent = false, control = null} = {}) {
  const host = $("status");
  if (!host) return;
  const activeControl = control instanceof HTMLElement ? control : lastStatusControl;
  if (message && activeControl) setLocalStatus(activeControl, message, type);
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  $("status-message").textContent = String(message || "");
  host.className = `status-toast ${type}`.trim();
  host.hidden = !message;
  if (message && !persistent && type !== "busy") {
    statusTimer = setTimeout(clearStatus, type === "error" ? 12000 : 7000);
  }
}

function node(tag, className, value) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (value !== undefined) item.textContent = value;
  return item;
}

function lines(value) {
  return String(value || "").split(/\r?\n/).map(v => v.trim()).filter(Boolean);
}

async function getShortcut() {
  try {
    return (await messenger.commands.getAll()).find(c => c.name === "toggle-pin-selected")?.shortcut || "";
  } catch {
    return "Alt+P";
  }
}

async function withBusy(control, message, task) {
  const button = control instanceof HTMLElement ? control : null;
  const wasDisabled = button?.disabled;
  if (button) {
    lastStatusControl = button;
    button.disabled = true;
    button.dataset.busy = "true";
    button.setAttribute("aria-busy", "true");
  }
  setStatus(message, "busy", {persistent: true, control: button});
  try {
    return await task();
  } finally {
    if (button) {
      button.disabled = Boolean(wasDisabled);
      delete button.dataset.busy;
      button.removeAttribute("aria-busy");
    }
  }
}

function select(options, value, label) {
  const el = document.createElement("select");
  el.setAttribute("aria-label", label);
  for (const [id, text] of options) {
    const option = node("option", "", text);
    option.value = id;
    el.append(option);
  }
  el.value = value;
  return el;
}

function removeButton(callback) {
  const button = node("button", "danger compact", "Supprimer");
  button.type = "button";
  button.addEventListener("click", () => {
    callback();
    setDirty();
  });
  return button;
}

function moveButtons(list, index, render) {
  const up = node("button", "secondary compact", "↑");
  const down = node("button", "secondary compact", "↓");
  up.type = down.type = "button";
  up.disabled = index === 0;
  down.disabled = index >= list.length - 1;
  up.setAttribute("aria-label", "Monter");
  down.setAttribute("aria-label", "Descendre");
  up.addEventListener("click", () => {
    if (!index) return;
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
    render();
    setDirty();
  });
  down.addEventListener("click", () => {
    if (index >= list.length - 1) return;
    [list[index + 1], list[index]] = [list[index], list[index + 1]];
    render();
    setDirty();
  });
  return [up, down];
}

function renderGroups(){const host=$("groups-list");host.replaceChildren();if(!groups.length)host.append(node("p","hint","Aucun groupe personnalisé."));groups.forEach((group,index)=>{const row=node("article","group-row");row.style.setProperty("--group-color",group.color);const name=document.createElement("input");name.value=group.name;name.maxLength=80;const color=document.createElement("input");color.type="color";color.value=group.color;name.addEventListener("input",()=>group.name=name.value.slice(0,80));color.addEventListener("input",()=>{group.color=color.value;row.style.setProperty("--group-color",color.value);});const[up,down]=moveButtons(groups,index,()=>{renderGroups();renderRules();renderTemplates();});row.append(node("span","group-drag","⋮⋮"),name,color,up,down,removeButton(()=>{groups.splice(index,1);renderGroups();renderRules();renderTemplates();}));host.append(row);});renderWaitingGroups();}
function renderWaitingGroups(selected=configuration?.settings?.waitingGroupId||""){const el=$("waitingGroupId");el.replaceChildren();const none=node("option","","Aucun");none.value="";el.append(none);for(const group of groups){const option=node("option","",group.name);option.value=group.id;el.append(option);}el.value=groups.some(g=>g.id===selected)?selected:"";}
function renderCases(){
  const host=$("cases-list");host.replaceChildren();
  if(!cases.length)host.append(node("p","hint","Aucune affaire."));
  cases.forEach((item,index)=>{
    const row=node("article","group-row");row.style.setProperty("--group-color",item.color);
    const name=document.createElement("input");name.value=item.name;name.maxLength=120;
    const color=document.createElement("input");color.type="color";color.value=item.color;
    const status=select([["active","À traiter"],["waiting","En attente"],["planned","Planifié"],["completed","Terminé"]],item.status||"active","Statut");
    const due=document.createElement("input");due.type="datetime-local";due.value=item.dueAt?new Date(item.dueAt-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):"";
    const note=document.createElement("input");note.value=item.note||"";note.placeholder="Note globale";
    const sync=()=>Object.assign(item,{name:name.value.slice(0,120),color:color.value,status:status.value,dueAt:due.value?new Date(due.value).getTime():0,note:note.value.slice(0,4000),updatedAt:Date.now()});
    for(const control of[name,color,status,due,note])control.addEventListener("input",sync);
    const agenda = node("button", "secondary compact", item.calendarItemId ? "Synchroniser Agenda" : "Créer dans Agenda");
    agenda.type = "button";
    agenda.addEventListener("click", async event => {
      try {
        const result = await withBusy(event.currentTarget, "Synchronisation de l’affaire avec l’Agenda…", async () => {
          sync();
          await messenger.pinInbox.updateCase(item.id, item);
          return messenger.pinInbox.createCaseCalendarItem(
            item.id,
            "task",
            configuration.settings.preferredCalendarId || ""
          );
        });
        item.calendarItemId = result.itemId || item.calendarItemId || "";
        item.calendarId = result.calendarId || item.calendarId || "";
        renderCases();
        setStatus(
          result.updated ? "Affaire synchronisée avec l’Agenda." : "Tâche Agenda créée pour l’affaire.",
          "success"
        );
      } catch (error) {
        setStatus(`Agenda impossible : ${error.message || error}`, "error");
      }
    });
    const[up,down]=moveButtons(cases,index,renderCases);
    row.append(name,color,status,due,note,agenda,up,down,removeButton(()=>{cases.splice(index,1);renderCases();renderRules();renderTemplates();}));host.append(row);
  });
}
function renderTemplates(){
  const host=$("templates-list");host.replaceChildren();
  if(!templates.length)host.append(node("p","hint","Aucun modèle."));
  templates.forEach((item,index)=>{
    const row=node("article","rule-row template-row");
    const name=document.createElement("input");name.value=item.name;name.placeholder="Nom du modèle";
    const group=select([["","Aucun groupe"],...groups.map(g=>[g.id,g.name])],item.groupId||"","Groupe");
    const caseSelect=select([["","Aucune affaire"],...cases.map(c=>[c.id,c.name])],item.caseId||"","Affaire");
    const priority=select([["normal","Normale"],["high","Haute"],["urgent","Urgente"]],item.priorityLevel||"normal","Priorité");
    const status=select([["active","À traiter"],["waiting","En attente"],["planned","Planifié"]],item.workflowStatus||"active","Statut");
    const due=document.createElement("input");due.type="number";due.min="0";due.max="3650";due.value=item.dueOffsetDays||0;due.title="Échéance dans N jours";due.placeholder="Échéance J+";
    const follow=document.createElement("input");follow.type="number";follow.min="0";follow.max="365";follow.value=item.followUpDelayDays||0;follow.title="Relance dans N jours";follow.placeholder="Relance J+";
    const lead=document.createElement("input");lead.type="number";lead.min="0";lead.max="10080";lead.value=item.reminderLeadMinutes||0;lead.title="Rappel anticipé en minutes";lead.placeholder="Anticipation min";
    const recurrence=select([["","Aucune"],["daily","Quotidienne"],["weekdays","Jours ouvrés"],["weekly","Hebdomadaire"],["monthly","Mensuelle"],["quarterly","Trimestrielle"],["yearly","Annuelle"]],item.recurrenceRule||"","Récurrence");
    const interval=document.createElement("input");interval.type="number";interval.min="1";interval.max="100";interval.value=item.recurrenceInterval||1;interval.title="Intervalle de récurrence";
    const note=document.createElement("input");note.value=item.notePrefix||"";note.placeholder="Préfixe de note";note.maxLength=500;
    const sync=()=>Object.assign(item,{name:name.value.slice(0,120),groupId:group.value,caseId:caseSelect.value,priorityLevel:priority.value,workflowStatus:status.value,dueOffsetDays:Number(due.value)||0,followUpDelayDays:Number(follow.value)||0,reminderLeadMinutes:Number(lead.value)||0,recurrenceRule:recurrence.value,recurrenceInterval:Number(interval.value)||1,notePrefix:note.value.slice(0,500)});
    for(const control of[name,group,caseSelect,priority,status,due,follow,lead,recurrence,interval,note])control.addEventListener("input",sync);
    const[up,down]=moveButtons(templates,index,renderTemplates);
    row.append(name,group,caseSelect,priority,status,due,follow,lead,recurrence,interval,note,up,down,removeButton(()=>{templates.splice(index,1);renderTemplates();renderRules();}));
    host.append(row);
  });
}
function renderAccounts(accounts){const host=$("accounts-list");host.replaceChildren();accountControls.clear();inboxControls.clear();for(const account of accounts){const card=node("article","account-card");card.style.setProperty("--account-color",account.color);const header=node("div","account-header"),title=node("div","account-title");title.append(node("div","account-name",account.name),node("div","account-email",account.email||account.key));const color=document.createElement("input");color.type="color";color.value=account.color;color.addEventListener("input",()=>card.style.setProperty("--account-color",color.value));accountControls.set(account.key,color);const reset=node("button","secondary","Défaut");reset.type="button";reset.addEventListener("click",()=>{color.value=account.defaultColor;card.style.setProperty("--account-color",account.defaultColor);});header.append(title,color,reset);card.append(header);const inboxes=node("div","inbox-list");for(const inbox of account.inboxes){const label=document.createElement("label"),input=document.createElement("input");input.type="checkbox";input.checked=inbox.enabled;label.append(input,document.createTextNode(`Panneau dans « ${inbox.name} »`));inboxes.append(label);inboxControls.set(inbox.uri,input);}card.append(inboxes);host.append(card);}}
function renderRules(){
  const host=$("rules-list");host.replaceChildren();
  if(!rules.length)host.append(node("p","hint","Aucune règle personnalisée."));
  const accountOptions=[["","Tous les comptes"],...(configuration?.accounts||[]).map(account=>[account.key,account.name||account.email||account.key])];
  rules.forEach((rule,index)=>{
    const row=node("article","rule-row");
    const enabled=document.createElement("input");enabled.type="checkbox";enabled.checked=rule.enabled!==false;enabled.title="Activer la règle";
    const name=document.createElement("input");name.value=rule.name||`Règle ${index+1}`;name.placeholder="Nom";
    const priority=document.createElement("input");priority.type="number";priority.min="1";priority.max="10000";priority.value=rule.priority||((index+1)*100);priority.title="Priorité d’exécution";
    const trigger=select([["messageAdded","Nouveau message"],["read","Lecture"],["archive","Archivage"],["reply","Réponse"],["move","Déplacement"],["delete","Suppression"],["complete","Terminé"],["calendar","Agenda"]],rule.trigger||"messageAdded","Déclencheur");
    const action=select([["pin","Épingler"],["unpin","Désépingler"],["complete","Terminer"],["group","Groupe"],["case","Affaire"],["status","Statut"],["template","Modèle"],["keep","Conserver"]],rule.action||"pin","Action");
    const target=select([["message","Message"],["conversation","Conversation"]],rule.trackingMode||"message","Cible");
    const sender=document.createElement("input");sender.value=rule.senderContains||"";sender.placeholder="Expéditeur contient";sender.title="Filtre sur l’expéditeur";
    const subject=document.createElement("input");subject.value=rule.subjectContains||"";subject.placeholder="Objet contient";subject.title="Filtre sur l’objet";
    const tag=document.createElement("input");tag.value=rule.tagKey||"";tag.placeholder="Clé d’étiquette";tag.title="Clé interne d’une étiquette Thunderbird";
    const account=select(accountOptions,rule.accountKey||"","Compte");
    const folder=document.createElement("input");folder.value=rule.folderURI||"";folder.placeholder="URI du dossier (facultatif)";folder.title="Limiter à un dossier exact";
    const group=select([["","Aucun groupe"],...groups.map(g=>[g.id,g.name])],rule.groupId||"","Groupe cible");
    const caseSelect=select([["","Aucune affaire"],...cases.map(c=>[c.id,c.name])],rule.caseId||"","Affaire cible");
    const template=select([["","Aucun modèle"],...templates.map(t=>[t.id,t.name])],rule.templateId||"","Modèle cible");
    const status=select([["active","À traiter"],["waiting","En attente"],["planned","Planifié"],["completed","Terminé"]],rule.workflowStatus||"active","Statut cible");
    const stopLabel=node("label","compact-check");const stop=document.createElement("input");stop.type="checkbox";stop.checked=rule.stopProcessing!==false;stopLabel.append(stop,document.createTextNode("Arrêter"));
    const rate=document.createElement("input");rate.type="number";rate.min="1";rate.max="1000";rate.value=rule.maxPerMinute||60;rate.title="Nombre maximal d’actions par minute";
    const sync=()=>Object.assign(rule,{
      enabled:enabled.checked,name:name.value.slice(0,100),priority:Number(priority.value)||100,
      trigger:trigger.value,action:action.value,trackingMode:target.value,
      senderContains:sender.value,subjectContains:subject.value,tagKey:tag.value,
      accountKey:account.value,folderURI:folder.value,groupId:group.value,caseId:caseSelect.value,
      templateId:template.value,workflowStatus:status.value,stopProcessing:stop.checked,
      maxPerMinute:Number(rate.value)||60
    });
    for(const control of[enabled,name,priority,trigger,action,target,sender,subject,tag,account,folder,group,caseSelect,template,status,stop,rate])control.addEventListener("input",sync);
    const [up,down]=moveButtons(rules,index,renderRules);
    row.append(enabled,name,priority,trigger,action,target,sender,subject,tag,account,folder,group,caseSelect,template,status,stopLabel,rate,up,down,removeButton(()=>{rules.splice(index,1);renderRules();}));
    host.append(row);
  });
}
async function renderCalendars(selected) {
  const el = $("preferredCalendarId");
  const info = $("calendar-info");
  el.replaceChildren();
  info?.replaceChildren();
  const ask = node("option", "", "Demander lors de la création");
  ask.value = "";
  el.append(ask);
  try {
    const calendars = await messenger.pinInbox.getCalendars();
    for (const calendar of calendars) {
      const option = node(
        "option",
        "",
        `${calendar.name} — tâches ${calendar.taskCompatible ? "✓" : "✕"} · événements ${calendar.eventCompatible ? "✓" : "✕"}${calendar.reason ? ` · ${calendar.reason}` : ""}`
      );
      option.value = calendar.id;
      option.disabled = !calendar.taskCompatible && !calendar.eventCompatible;
      el.append(option);
      if (info) {
        const card = node("div", `calendar-capability ${calendar.writable ? "writable" : "blocked"}`);
        const title = node("strong", "", calendar.name);
        const state = node("span", "calendar-capability-state", calendar.writable ? "Inscriptible" : "Non inscriptible");
        const details = node(
          "small",
          "",
          `Fournisseur : ${calendar.type || "inconnu"} · Tâches : ${calendar.taskSupported ? "prises en charge" : "non prises en charge"} · Événements : ${calendar.eventSupported ? "pris en charge" : "non pris en charge"}${calendar.reason ? ` · ${calendar.reason}` : ""}`
        );
        card.append(title, state, details);
        info.appendChild(card);
      }
    }
    if (info && !calendars.length) {
      info.appendChild(node("p", "hint", "Aucun calendrier Thunderbird n’est disponible ou l’intégration Agenda est désactivée."));
    }
  } catch (error) {
    console.warn("MailPerch : calendriers indisponibles", error);
    setStatus("Les calendriers Thunderbird ne sont pas disponibles.", "error", {control: el});
    info?.appendChild(node("p", "hint", "La liste des calendriers n’a pas pu être chargée."));
  }
  el.value = [...el.options].some(option => option.value === selected && !option.disabled) ? selected : "";
}

function updateRuntimeSummary(config, backup = null) {
  if (!config) return;
  const stats = config.stats || {};
  $("stats").textContent =
    `${stats.pinned || 0} épingle(s) · ${stats.waiting || 0} en attente · ` +
    `${stats.overdue || 0} en retard · ${stats.history || 0} historique`;
  $("storage-info").textContent =
    `Stockage : ${config.storage?.backend || "inconnu"} · ` +
    `${config.storage?.database || ""} · schéma ${config.storage?.schemaVersion || ""}`;
  $("compat-info").textContent =
    `Compatibilité : ${config.compatibility?.mode || "inconnue"}` +
    `${config.compatibility?.missing?.length ? ` · ${config.compatibility.missing.join(", ")}` : ""}`;
  const perf = config.performance || {};
  $("performance-info").textContent =
    `Rendu : ${perf.renders || 0} · moyenne ${perf.averageRenderMs || 0} ms · ` +
    `max ${perf.maxRenderMs || 0} ms`;
  if (backup) {
    $("backup-info").textContent =
      `Dossier : ${backup.directory || "non défini"} · dernière sauvegarde : ` +
      `${backup.lastBackupAt ? new Date(backup.lastBackupAt).toLocaleString() : "aucune"}`;
  }
}

function applyConfiguration(config) {
  configuration = config;
  const settings = config.settings;
  for (const id of SELECT_IDS) if ($(id)) $(id).value = settings[id];
  for (const id of NUMBER_IDS) if ($(id)) $(id).value = String(settings[id] ?? 0);
  for (const id of BOOLEAN_IDS) if ($(id)) $(id).checked = Boolean(settings[id]);
  $("autoPinSenders").value = (settings.autoPinSenders || []).join("\n");
  $("autoPinTags").value = (settings.autoPinTags || []).join("\n");
  $("backupDirectory").value = settings.backupDirectory || "";
  $("shortcut").value = config.shortcut || "Alt+P";
  groups = (config.groups || []).map(item => ({...item}));
  rules = (config.rules || []).map(item => ({...item}));
  cases = (config.cases || []).map(item => ({...item}));
  templates = (config.templates || []).map(item => ({...item}));
  renderGroups();
  renderCases();
  renderTemplates();
  renderRules();
  renderAccounts(config.accounts || []);
  renderWaitingGroups(settings.waitingGroupId);
  renderCalendars(settings.preferredCalendarId);
  updateRuntimeSummary(config);
  setDirty(false);
}

function collectSettings() {
  const accountColors = {};
  const inboxEnabled = {};
  for (const [key, input] of accountControls) accountColors[key] = input.value;
  for (const [uri, input] of inboxControls) inboxEnabled[uri] = input.checked;
  const result = {...configuration.settings, accountColors, inboxEnabled};
  for (const id of SELECT_IDS) result[id] = $(id).value;
  for (const id of NUMBER_IDS) result[id] = Number($(id).value);
  for (const id of BOOLEAN_IDS) result[id] = $(id).checked;
  result.showFolderBadge = false;
  result.waitingGroupId = $("waitingGroupId").value;
  result.preferredCalendarId = $("preferredCalendarId").value;
  result.backupDirectory = $("backupDirectory").value;
  result.autoPinSenders = lines($("autoPinSenders").value);
  result.autoPinTags = lines($("autoPinTags").value);
  return result;
}

async function reload({preserveEdits = false} = {}) {
  const [config, shortcut, backup] = await Promise.all([
    messenger.pinInbox.getConfiguration(),
    getShortcut(),
    messenger.pinInbox.getBackupStatus().catch(() => null)
  ]);
  config.shortcut = shortcut;
  if (preserveEdits && configuration) {
    configuration = {
      ...configuration,
      stats: config.stats,
      storage: config.storage,
      compatibility: config.compatibility,
      performance: config.performance
    };
    updateRuntimeSummary(config, backup);
  } else {
    applyConfiguration(config);
    updateRuntimeSummary(config, backup);
  }
  return config;
}

async function saveAll(event) {
  event.preventDefault();
  const submitter = event.submitter || $("save-all");
  try {
    const config = await withBusy(submitter, "Enregistrement des paramètres…", async () => {
      const saved = await messenger.pinInbox.setConfiguration({
        settings: collectSettings(),
        groups,
        rules,
        cases,
        templates
      });
      saved.shortcut = await getShortcut();
      return saved;
    });
    applyConfiguration(config);
    setStatus("Paramètres enregistrés.", "success");
  } catch (error) {
    setStatus(`Erreur : ${error.message || error}`, "error");
  }
}

async function saveShortcut(event) {
  try {
    await withBusy(event?.currentTarget || $("save-shortcut"), "Enregistrement du raccourci…", async () => {
      await messenger.commands.update({
        name: "toggle-pin-selected",
        shortcut: $("shortcut").value.trim()
      });
      $("shortcut").value = await getShortcut();
    });
    setStatus("Raccourci enregistré.", "success");
  } catch (error) {
    setStatus(`Raccourci refusé : ${error.message || error}`, "error");
  }
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function run(action, message, {
  control = null,
  busyMessage = "Opération en cours…",
  reloadAfter = true
} = {}) {
  try {
    const result = await withBusy(control, busyMessage, action);
    if (reloadAfter) await reload({preserveEdits: dirty});
    setStatus(typeof message === "function" ? message(result) : message, "success");
    return result;
  } catch (error) {
    setStatus(`Opération impossible : ${error.message || error}`, "error");
    return null;
  }
}

async function importFile(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    setStatus("Fichier trop volumineux.", "error");
    return;
  }
  try {
    const parsed = JSON.parse(await file.text());
    await withBusy(null, "Import de la sauvegarde…", async () => {
      await messenger.pinInbox.importConfiguration(parsed);
      if (typeof parsed.shortcut === "string") {
        try {
          await messenger.commands.update({
            name: "toggle-pin-selected",
            shortcut: parsed.shortcut
          });
        } catch (error) {
          console.warn("MailPerch : raccourci importé non appliqué", error);
        }
      }
      await reload();
    });
    setStatus("Sauvegarde importée.", "success");
  } catch (error) {
    setStatus(`Import impossible : ${error.message || error}`, "error");
  }
}

function localize() {
  document.documentElement.lang = (messenger.i18n.getUILanguage?.() || "fr").split("-")[0];
  for (const element of document.querySelectorAll("[data-i18n]")) {
    const value = messenger.i18n.getMessage(element.dataset.i18n);
    if (value) element.textContent = value;
  }
}

function renderBrandVersion() {
  const version = messenger.runtime.getManifest().version;
  $("app-version").textContent = version ? `v${version}` : "";
}

window.addEventListener("DOMContentLoaded", async () => {
  localize();
  renderBrandVersion();
  enhanceSettingsPage();

  const form = $("settings-form");
  form.addEventListener("submit", saveAll);
  form.addEventListener("input", event => {
    if (event.target.id === "shortcut" || event.target.id === "import-file") return;
    setDirty();
  });
  form.addEventListener("change", event => {
    if (event.target.id === "shortcut" || event.target.id === "import-file") return;
    setDirty();
  });

  $("status-close").addEventListener("click", clearStatus);
  $("save-shortcut").addEventListener("click", saveShortcut);
  $("discard-changes").addEventListener("click", async event => {
    await withBusy(event.currentTarget, "Restauration des paramètres enregistrés…", () => reload());
    setStatus("Modifications annulées.", "success");
  });

  $("add-group").addEventListener("click", () => {
    groups.push({
      id: `group-${Date.now().toString(36)}`,
      name: "Nouveau groupe",
      color: "#6264a7"
    });
    renderGroups();
    renderRules();
    renderTemplates();
    setDirty();
  });

  $("add-case").addEventListener("click", () => {
    cases.push({
      id: `case-${Date.now().toString(36)}`,
      name: "Nouvelle affaire",
      color: "#0f6cbd",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    renderCases();
    renderRules();
    renderTemplates();
    setDirty();
  });

  $("add-template").addEventListener("click", () => {
    templates.push({
      id: `template-${Date.now().toString(36)}`,
      name: "Nouveau modèle",
      priorityLevel: "normal",
      workflowStatus: "active",
      recurrenceInterval: 1
    });
    renderTemplates();
    renderRules();
    setDirty();
  });

  $("add-rule").addEventListener("click", () => {
    rules.push({
      id: `rule-${Date.now().toString(36)}`,
      name: "Nouvelle règle",
      enabled: true,
      priority: (rules.length + 1) * 100,
      trigger: "messageAdded",
      action: "pin",
      trackingMode: "message",
      stopProcessing: true,
      maxPerMinute: 60
    });
    renderRules();
    setDirty();
  });

  $("simulate-rules").addEventListener("click", async event => {
    const result = await run(
      () => messenger.pinInbox.simulateRules({trigger: "messageAdded", limit: 1000}),
      value => `${value.matches.length} correspondance(s) sur ${value.scanned} message(s).`,
      {
        control: event.currentTarget,
        busyMessage: "Simulation des règles…",
        reloadAfter: false
      }
    );
    if (result) {
      $("rule-simulation").textContent =
        result.matches.slice(0, 20)
          .map(item => `${item.ruleName} → ${item.action} · ${item.subject}`)
          .join("\n") || "Aucune correspondance.";
    }
  });

  const bindRun = (id, action, message, busyMessage, options = {}) => {
    $(id).addEventListener("click", event => run(action, message, {
      control: event.currentTarget,
      busyMessage,
      ...options
    }));
  };

  bindRun(
    "clear-rule-log",
    () => messenger.pinInbox.clearRuleLog(),
    result => `${result.cleared} entrée(s) supprimée(s).`,
    "Suppression du journal des règles…"
  );
  bindRun(
    "import-stars",
    () => messenger.pinInbox.importNativeStars($("clear-stars-after-import").checked),
    result => `${result.imported} étoile(s) importée(s).`,
    "Import des étoiles Thunderbird…"
  );
  bindRun("undo", () => messenger.pinInbox.undoLast(), result => result.message, "Annulation de la dernière action…");
  bindRun(
    "repair",
    () => messenger.pinInbox.repairReferences(),
    result => `${result.repaired} réparée(s), ${result.missing} introuvable(s).`,
    "Réparation des références…"
  );
  bindRun("rescan", () => messenger.pinInbox.rescanPinned(), "Rescan terminé.", "Analyse des messages épinglés…");
  bindRun("cleanup", () => messenger.pinInbox.cleanupBroken(), "Nettoyage terminé.", "Nettoyage des références introuvables…");
  bindRun(
    "reset-interface",
    () => messenger.pinInbox.resetInterface(),
    "Interface réinitialisée.",
    "Réinitialisation de l’interface…"
  );
  bindRun(
    "compat-check",
    () => messenger.pinInbox.runCompatibilityCheck(),
    "Vérification terminée.",
    "Vérification de la compatibilité Thunderbird…"
  );
  bindRun(
    "sync-calendar",
    () => messenger.pinInbox.syncCalendarLinks(),
    result => `${result.synced || 0} élément(s) synchronisé(s).`,
    "Synchronisation avec l’Agenda…"
  );
  bindRun(
    "run-backup",
    () => messenger.pinInbox.runBackup("manual"),
    result => `Sauvegarde créée : ${result.path}`,
    "Création de la sauvegarde locale…"
  );

  $("integrity-check").addEventListener("click", async event => {
    const result = await run(
      () => messenger.pinInbox.checkStorageIntegrity(),
      value => value.ok ? "Base SQLite intègre." : "Anomalie SQLite détectée.",
      {
        control: event.currentTarget,
        busyMessage: "Vérification de la base SQLite…"
      }
    );
    if (result) $("integrity-info").textContent = JSON.stringify(result, null, 2);
  });

  $("choose-backup").addEventListener("click", async event => {
    try {
      const result = await withBusy(
        event.currentTarget,
        "Sélection du dossier de sauvegarde…",
        () => messenger.pinInbox.chooseBackupDirectory()
      );
      if (!result.selected) {
        setStatus("Sélection du dossier annulée.", "success");
        return;
      }
      $("backupDirectory").value = result.path;
      configuration.settings.backupDirectory = result.path;
      const backup = await messenger.pinInbox.getBackupStatus().catch(() => null);
      updateRuntimeSummary(configuration, backup);
      setStatus("Dossier de sauvegarde enregistré.", "success");
    } catch (error) {
      setStatus(`Sélection impossible : ${error.message || error}`, "error");
    }
  });

  $("dashboard").addEventListener("click", async event => {
    try {
      await withBusy(event.currentTarget, "Ouverture du tableau de bord…", () =>
        messenger.tabs.create({url: messenger.runtime.getURL("dashboard/dashboard.html")})
      );
      setStatus("Tableau de bord ouvert dans un nouvel onglet.", "success");
    } catch (error) {
      setStatus(`Ouverture impossible : ${error.message || error}`, "error");
    }
  });

  $("diagnostic").addEventListener("click", async event => {
    try {
      const report = await withBusy(
        event.currentTarget,
        "Préparation du diagnostic…",
        () => messenger.pinInbox.getDiagnosticReport()
      );
      downloadJson(
        `mailperch-diagnostic-${new Date().toISOString().slice(0, 10)}.json`,
        report
      );
      setStatus("Diagnostic exporté.", "success");
    } catch (error) {
      setStatus(`Export impossible : ${error.message || error}`, "error");
    }
  });

  $("export").addEventListener("click", async event => {
    try {
      const data = await withBusy(event.currentTarget, "Préparation de la sauvegarde…", async () => {
        const value = await messenger.pinInbox.exportConfiguration();
        value.shortcut = await getShortcut();
        return value;
      });
      downloadJson(`mailperch-${new Date().toISOString().slice(0, 10)}.json`, data);
      setStatus("Sauvegarde exportée.", "success");
    } catch (error) {
      setStatus(`Export impossible : ${error.message || error}`, "error");
    }
  });

  $("import-file").addEventListener("change", importFile);

  $("reset").addEventListener("click", async event => {
    if (!confirm("Réinitialiser les réglages, groupes, affaires, modèles et règles ? Les épingles sont conservées.")) {
      return;
    }
    const result = await run(
      () => messenger.pinInbox.resetConfiguration(),
      "Réglages réinitialisés.",
      {
        control: event.currentTarget,
        busyMessage: "Réinitialisation des réglages…"
      }
    );
    if (result) setDirty(false);
  });

  window.addEventListener("beforeunload", event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  try {
    await withBusy(null, "Chargement des paramètres…", () => reload());
    clearStatus();
  } catch (error) {
    setStatus(`Chargement impossible : ${error.message || error}`, "error", {persistent: true});
  }
});
