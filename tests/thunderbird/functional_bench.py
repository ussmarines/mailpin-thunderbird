#!/usr/bin/env python3
"""Functional and scale bench for MailPerch in a disposable Thunderbird profile.

The bench uses chrome-context WebDriver only to provision synthetic local mail and
inspect Thunderbird-owned windows. MailPerch itself is the unmodified built XPI:
its normal startup migrates the seeded legacy preference into the structured
SQLite store before the UI scenarios run.
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import subprocess
import tempfile
import time
from typing import Any

from real_smoke import (
    ADDON_ID,
    RUNTIME_STATE_SCRIPT,
    SmokeFailure,
    WebDriverClient,
    _free_port,
    _panel_is_cleaned,
    _panel_is_ready,
    _validate_path,
    _wait_for_state,
    _write_json,
)

SUPPORTED_VOLUMES = (50, 100, 500, 1000, 2000)


def _new_session_with_profile(
    client: WebDriverClient, binary: pathlib.Path, profile: pathlib.Path
) -> dict[str, Any]:
    """Start Thunderbird on the exact profile path instead of a WebDriver copy."""
    payload = {
        "capabilities": {
            "alwaysMatch": {
                "browserName": "firefox",
                "acceptInsecureCerts": True,
                "moz:firefoxOptions": {
                    "binary": str(binary),
                    "args": ["-profile", str(profile)],
                    "prefs": {
                        "app.update.auto": False,
                        "app.update.enabled": False,
                        "browser.shell.checkDefaultBrowser": False,
                        "mail.provider.enabled": False,
                        "mail.shell.checkDefaultClient": False,
                        "mailnews.start_page.enabled": False,
                        "toolkit.telemetry.enabled": False,
                    },
                },
            }
        }
    }
    response = client.request("POST", "/session", payload)
    value = (response or {}).get("value", {})
    session_id = value.get("sessionId") or (response or {}).get("sessionId")
    if not session_id:
        raise SmokeFailure(f"WebDriver session id missing: {response}")
    client.session_id = str(session_id)
    capabilities = value.get("capabilities", {})
    actual_profile = capabilities.get("moz:profile")
    if not actual_profile or os.path.normcase(os.path.realpath(actual_profile)) != os.path.normcase(
        os.path.realpath(profile)
    ):
        raise SmokeFailure(
            "GeckoDriver did not use the exact requested reusable profile: "
            f"requested={profile!s}, actual={actual_profile!r}"
        )
    return capabilities


SEED_DATASET_SCRIPT = r"""
const done = arguments[arguments.length - 1];
const volume = Number(arguments[0]);
const selectedAccountLabels = Array.isArray(arguments[1]) ? arguments[1] : ["A", "B", "C"];
const initialPanelScope = arguments[2] === "selectedAccounts" ? "selectedAccounts" : "global";
(async () => {
  const started = performance.now();
  const { MailServices } = ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs");
  const { ExtensionStorage } = ChromeUtils.importESModule("resource://gre/modules/ExtensionStorage.sys.mjs");
  const { Sqlite } = ChromeUtils.importESModule("resource://gre/modules/Sqlite.sys.mjs");
  const { classes: Cc, interfaces: Ci } = Components;
  Services.io.offline = true;
  Services.prefs.setBoolPref("network.manage-offline-status", false);
  Services.prefs.setBoolPref("offline.autoDetect", false);

  const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  const win = wm.getMostRecentWindow("mail:3pane");
  const pane = win?.document.getElementById("tabmail")?.currentAbout3Pane;
  if (!win || !pane) throw new Error("about:3pane is unavailable");
  const sleep = ms => new Promise(resolve => win.setTimeout(resolve, ms));
  try { win.document.querySelector("account-hub-container")?.modal?.close(); } catch {}

  const servers = [];
  const syntheticAccounts = [];
  for (const label of ["A", "B", "C"]) {
    try {
      const server = MailServices.accounts.createIncomingServer(
        `mailperch-bench-${label.toLowerCase()}`,
        `mailperch-bench-${label.toLowerCase()}.invalid`,
        "pop3"
      );
      const account = MailServices.accounts.createAccount();
      account.incomingServer = server;
      server.prettyName = `${label} = server${servers.length + 1}`;
      servers.push(server);
      syntheticAccounts.push(account);
    } catch (error) {
      throw new Error(`Synthetic account ${label} could not be created offline: ${error}`);
    }
  }
  if (servers.length !== 3 || servers.some(server => !server.rootFolder)) {
    throw new Error("Three offline synthetic POP accounts are required for selected-account validation");
  }

  const folders = [];
  for (let serverIndex = 0; serverIndex < servers.length; serverIndex++) {
    const root = servers[serverIndex].rootFolder;
    for (let folderIndex = 0; folderIndex < 2; folderIndex++) {
      const name = `MailPerch Bench ${serverIndex + 1}-${folderIndex + 1}`;
      let folder = null;
      try { folder = root.getChildNamed(name); } catch {}
      if (!folder) {
        root.createSubfolder(name, null);
        folder = root.getChildNamed(name);
      }
      if (folder) folders.push(folder);
    }
  }
  if (folders.length !== 6) throw new Error("Two local folders are required for each synthetic account");

  const addMessage = (folder, raw) => {
    folder.QueryInterface(Ci.nsIMsgLocalMailFolder).addMessage(raw);
  };
  const fnv = value => {
    let hash = 2166136261;
    for (const char of String(value)) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  };
  const refs = {};
  const manualOrder = [];
  const now = Date.now();
  const senders = ["Ada Lovelace", "Grace Hopper", "Margaret Hamilton", "Alan Turing", "Katherine Johnson", "Hedy Lamarr"];
  const topics = ["Quarterly review", "Launch checklist", "Customer follow-up", "Design decision", "Budget approval", "Incident review"];
  const statuses = ["active", "waiting", "planned", "completed"];
  const priorities = ["normal", "high", "urgent"];
  const accountKeys = syntheticAccounts.map(account => String(account.key || "unknown"));

  for (let index = 0; index < volume; index++) {
    const folder = folders[index % folders.length];
    const messageId = `mailperch-bench-${volume}-${index}@example.invalid`;
    const accountLabel = ["A", "B", "C"][servers.indexOf(folder.server)];
    const subject = `${topics[index % topics.length]} · Scope-${accountLabel} · Bench ${volume}-${String(index).padStart(4, "0")}${index === volume - 1 ? ` · Needle-${volume - 1}` : ""}`;
    const author = `${senders[index % senders.length]} <sender-${index % 23}@example.invalid>`;
    const dateMs = now - (index % 120) * 86_400_000 - index * 1000;
    const read = index % 3 === 0;
    const raw = [
      `From: ${author}`,
      "To: bench@example.invalid",
      `Subject: ${subject}`,
      `Message-ID: <${messageId}>`,
      `Date: ${new Date(dateMs).toUTCString()}`,
      `X-Mozilla-Status: ${read ? "0001" : "0000"}`,
      "X-Mozilla-Status2: 00000000",
      `X-Mozilla-Keys: ${index % 7 === 0 ? "mailperch-bench" : ""}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      `Synthetic MailPerch bench message ${index}. No real mailbox data.`,
      "",
    ].join("\r\n");
    addMessage(folder, raw);
    const hdr = folder.msgDatabase.getMsgHdrForMessageID(messageId);
    if (!hdr) throw new Error(`Synthetic header ${index} was not indexed`);
    const accountKey = String(syntheticAccounts[servers.indexOf(folder.server)]?.key || "unknown");
    const conversation = index % 10 === 0;
    const simpleCard = index < 4;
    const conversationKey = `${accountKey}|conv:root:${fnv(messageId.toLowerCase())}`;
    const stableKey = conversation ? conversationKey : `${accountKey}|mid:${messageId.toLowerCase()}`;
    const workflowStatus = simpleCard ? "active" : statuses[index % statuses.length];
    const completed = workflowStatus === "completed";
    refs[stableKey] = {
      stableKey,
      headerMessageId: messageId,
      accountKey,
      sourceInboxURI: String(folder.URI),
      lastFolderURI: String(folder.URI),
      lastMessageKey: Number(hdr.messageKey),
      pinnedAt: now - index * 1000,
      lastSeen: now,
      subject,
      author,
      date: Number(hdr.date) || dateMs * 1000,
      accountName: String(folder.server?.prettyName || "Local Folders"),
      folderName: String(folder.prettyName || folder.name || "Bench"),
      note: !simpleCard && index % 4 === 0 ? `Note synthétique ${index}` : "",
      checklist: !simpleCard && index % 5 === 0 ? [
        {id: `task-${index}-1`, text: `Vérifier ${index}`, completed: index % 2 === 0, createdAt: now - 1000},
        {id: `task-${index}-2`, text: `Répondre ${index}`, completed: false, createdAt: now},
      ] : [],
      dueAt: !simpleCard && volume > 50 && index % 2 === 0 ? now + ((index % 14) - 5) * 86_400_000 : 0,
      reminderAt: volume > 50 && index % 6 === 0 ? now + 30 * 86_400_000 : 0,
      priorityLevel: simpleCard ? "normal" : priorities[index % priorities.length],
      groupId: simpleCard ? "" : `bench-group-${index % 3}`,
      trackingMode: conversation ? "conversation" : "message",
      conversationKey,
      rootMessageId: messageId,
      conversationCount: conversation ? 1 : 0,
      conversationUnread: conversation && !read ? 1 : 0,
      completedAt: completed ? now - 60_000 : 0,
      workflowStatus,
      waitingSince: !simpleCard && index % 4 === 1 ? now - 2 * 86_400_000 : 0,
      followUpAt: !simpleCard && volume > 50 && index % 6 === 0 ? now + ((index % 9) - 3) * 86_400_000 : 0,
      followUpCount: index % 4,
      noReplyTracking: !simpleCard && volume > 50 && index % 8 === 0,
      noReplyAt: !simpleCard && volume > 50 && index % 8 === 0 ? now + 2 * 86_400_000 : 0,
      noReplyStartedAt: !simpleCard && volume > 50 && index % 8 === 0 ? now - 86_400_000 : 0,
      caseId: simpleCard ? "" : `bench-case-${index % 3}`,
      templateId: simpleCard ? "" : `bench-template-${index % 2}`,
      recurrenceRule: !simpleCard && index % 12 === 0 ? "weekly" : "",
      recurrenceInterval: 1,
      updatedAt: now - index,
    };
    manualOrder.push(stableKey);
  }

  // One unpinned, newest control message is used by the functional run to
  // exercise the real native-row pin button without changing the final count.
  const controlFolder = folders[0];
  const controlMessageId = `mailperch-bench-control-${volume}@example.invalid`;
  addMessage(controlFolder, [
    "From: Control <control@example.invalid>",
    "To: bench@example.invalid",
    "Subject: MailPerch Bench Control Unpinned",
    `Message-ID: <${controlMessageId}>`,
    `Date: ${new Date(now + 60_000).toUTCString()}`,
    "X-Mozilla-Status: 0000",
    "X-Mozilla-Status2: 00000000",
    "", "Synthetic unpinned control.", "",
  ].join("\r\n"));

  const groups = [0, 1, 2].map(index => ({id:`bench-group-${index}`, name:`Groupe Bench ${index + 1}`, color:["#0f6cbd", "#6264a7", "#107c10"][index], updatedAt:now}));
  const cases = [0, 1, 2].map(index => ({id:`bench-case-${index}`, name:`Affaire Bench ${index + 1}`, color:["#0f6cbd", "#ca5010", "#107c10"][index], status:statuses[index], dueAt:now + index * 86_400_000, createdAt:now, updatedAt:now}));
  const templates = [0, 1].map(index => ({id:`bench-template-${index}`, name:`Modèle Bench ${index + 1}`, groupId:`bench-group-${index}`, caseId:`bench-case-${index}`, priorityLevel:priorities[index + 1], workflowStatus:statuses[index], dueOffsetDays:index + 1, followUpDelayDays:index + 2, updatedAt:now}));
  const data = {
    schemaVersion: 7, refs, manualOrder, groups, groupOrder: groups.map(item => item.id),
    collapsedByInbox: {}, panelVisibleByInbox: {}, rules: [], cases,
    caseOrder: cases.map(item => item.id), templates,
    history: [], ruleLog: [], activity: manualOrder.slice(0, 25).map((stableKey, index) => ({time:now-index*1000,type:"pin",stableKey,label:`Activité Bench ${index}`})),
    savedViews: [{id:"bench-saved-view",name:"Vue Bench",smartView:"all",search:"Bench",groupId:"",caseId:"",priority:"",responseState:"",checklist:"",updatedAt:now}],
    dashboard: {filter:"all",smartView:"all",savedViewId:"",search:"",view:"today",reviewMode:"daily"},
    providerMatrix: {checkedAt:0,accounts:[],providers:[],calendars:[]},
    migration: {from:7,to:7,completedAt:now}, revision: 1,
  };
  const settings = {
    schemaVersion: 8, pinMode: "independent", panelScope: initialPanelScope,
    selectedAccountKeys: accountKeys.filter((key, index) => selectedAccountLabels.includes(["A", "B", "C"][index])), sortMode: "manual", density: "normal",
    cardLines: 3, panelMaxHeight: 460, panelPageSize: 100,
    panelVirtualizationThreshold: 180, showSearch: true, showCounters: true,
    showGroups: true, groupByCustomGroup: false, groupByAccount: false,
    showSmartSections: false, showNotes: true, showDeadlines: true,
    showPriority: true, showTags: true, showFolder: true,
    enableConversationPins: true, enableGlobalDashboard: true,
    enableMultiSelect: true, enableBulkActions: true, enableSmartViews: true,
    enablePerformanceMetrics: true, settingsExperience: "advanced",
    safeMode: false, hideCompleted: false, confirmBulkDestructiveActions: false,
  };
  await ExtensionStorage.set("pin-mails@MailPerch.local", {"mailperch.installation":"mailperch-installation-v1"});
  Services.prefs.setStringPref("extensions.pinMails.settings", JSON.stringify(settings));
  Services.prefs.setBoolPref("extensions.pinMails.structuredMigrated", true);

  // Preload the same on-profile schema consumed by PinStructuredStore. This
  // avoids preference-size limits at 2,000 refs and happens before the XPI is
  // installed, so there is no concurrent writer and no production test hook.
  const database = await Sqlite.openConnection({path:"pin-mails-v2.sqlite", sharedMemoryCache:false});
  try {
    await database.execute("PRAGMA journal_mode=WAL");
    await database.execute("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    await database.execute("CREATE TABLE IF NOT EXISTS refs (stable_key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at INTEGER NOT NULL)");
    await database.execute("CREATE TABLE IF NOT EXISTS groups_data (group_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL)");
    await database.execute("CREATE TABLE IF NOT EXISTS state_data (key TEXT PRIMARY KEY, payload TEXT NOT NULL)");
    await database.execute("CREATE TABLE IF NOT EXISTS undo_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL)");
    await database.execute("CREATE TABLE IF NOT EXISTS rules (rule_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL)");
    await database.execute("CREATE TABLE IF NOT EXISTS cases_data (case_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
    await database.execute("CREATE TABLE IF NOT EXISTS templates (template_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL, updated_at INTEGER NOT NULL)");
    await database.execute("CREATE TABLE IF NOT EXISTS history (history_id TEXT PRIMARY KEY, stable_key TEXT NOT NULL, payload TEXT NOT NULL, completed_at INTEGER NOT NULL)");
    await database.execute("CREATE TABLE IF NOT EXISTS rule_log (log_id TEXT PRIMARY KEY, rule_id TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL)");
    await database.execute("CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT NOT NULL, ref_key TEXT NOT NULL, label TEXT NOT NULL, created_at INTEGER NOT NULL)");
    await database.execute("CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, reason TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL)");
    await database.execute("BEGIN IMMEDIATE TRANSACTION");
    for (const ref of Object.values(refs)) {
      await database.execute(
        "INSERT INTO refs(stable_key,payload,updated_at) VALUES(:stableKey,:payload,:updatedAt)",
        {stableKey:ref.stableKey,payload:JSON.stringify(ref),updatedAt:Number(ref.updatedAt)||now}
      );
    }
    for (let index = 0; index < groups.length; index++) {
      await database.execute("INSERT INTO groups_data(group_id,payload,sort_order) VALUES(:id,:payload,:sortOrder)", {id:groups[index].id,payload:JSON.stringify(groups[index]),sortOrder:index});
    }
    for (let index = 0; index < cases.length; index++) {
      await database.execute("INSERT INTO cases_data(case_id,payload,sort_order,updated_at) VALUES(:id,:payload,:sortOrder,:updatedAt)", {id:cases[index].id,payload:JSON.stringify(cases[index]),sortOrder:index,updatedAt:now});
    }
    for (let index = 0; index < templates.length; index++) {
      await database.execute("INSERT INTO templates(template_id,payload,sort_order,updated_at) VALUES(:id,:payload,:sortOrder,:updatedAt)", {id:templates[index].id,payload:JSON.stringify(templates[index]),sortOrder:index,updatedAt:now});
    }
    for (const [key, value] of Object.entries({manualOrder,collapsedByInbox:{},panelVisibleByInbox:{},migration:data.migration,dashboard:data.dashboard,providerMatrix:data.providerMatrix,caseOrder:data.caseOrder,savedViews:data.savedViews})) {
      await database.execute("INSERT INTO state_data(key,payload) VALUES(:key,:payload)", {key,payload:JSON.stringify(value)});
    }
    for (const item of data.activity) {
      await database.execute("INSERT INTO activity(event_type,ref_key,label,created_at) VALUES(:type,:stableKey,:label,:time)", item);
    }
    for (const [key, value] of Object.entries({schemaVersion:"5",initialized:String(now),revision:"1",lastCommitAt:String(now)})) {
      await database.execute("INSERT INTO meta(key,value) VALUES(:key,:value)", {key,value});
    }
    await database.execute("COMMIT");
  } catch (error) {
    try { await database.execute("ROLLBACK"); } catch {}
    throw error;
  } finally {
    await database.close();
  }

  for (let attempt = 0; attempt < 50; attempt++) {
    try { pane.displayFolder(controlFolder); } catch {}
    if (pane.gFolder?.URI === controlFolder.URI && pane.gViewWrapper && pane.quickFilterBar) break;
    await sleep(100);
  }
  const accountSummaries = servers.map((server, index) => {
    const key = String(syntheticAccounts[index]?.key || "");
    const serverKey = String(server.key || "");
    const accountFolders = folders.filter(folder => folder.server === server);
    const accountRefs = Object.values(refs).filter(ref => ref.accountKey === key);
    return {
      label: ["A", "B", "C"][index], key, serverKey, name: String(server.prettyName),
      folderUris: accountFolders.map(folder => String(folder.URI)),
      pinnedCount: accountRefs.length,
      representativeKeys: accountRefs.slice(0, 2).map(ref => ref.stableKey),
    };
  });
  if (accountSummaries.map(account => account.key).join(",") !== "account1,account2,account3") {
    throw new Error(`Synthetic A/B/C canonical account keys are not account1/account2/account3: ${accountSummaries.map(account => account.key).join(",")}`);
  }
  if (accountSummaries.map(account => account.serverKey).join(",") !== "server1,server2,server3") {
    throw new Error(`Synthetic A/B/C incoming-server keys are not server1/server2/server3: ${accountSummaries.map(account => account.serverKey).join(",")}`);
  }
  if (accountSummaries.some(account => !account.key || account.pinnedCount < 1 || account.representativeKeys.length < 1)) {
    throw new Error("Synthetic account identifiers or account-specific pins are missing");
  }
  done({
    volume, creationMs: performance.now() - started, pinnedCount: Object.keys(refs).length,
    accountCount: accountKeys.length, folderCount: folders.length,
    accountKeys, accounts: accountSummaries, selectedAccountLabels, folderUris: folders.map(folder => String(folder.URI)),
    currentFolderUri: String(controlFolder.URI),
    currentFolderPinnedCount: Object.values(refs).filter(ref => ref.sourceInboxURI === controlFolder.URI).length,
    controlMessageId,
    firstKey: manualOrder[0], middleKey: manualOrder[Math.floor(volume / 2)], lastKey: manualOrder[volume - 1],
  });
})().catch(error => done({__mailperchSmokeError: `${error?.name || "Error"}: ${error?.message || error}\n${error?.stack || ""}`}));
"""


PANEL_BENCH_SCRIPT = r"""
const done = arguments[arguments.length - 1];
const expected = Number(arguments[0]);
const fullFunctional = Boolean(arguments[1]);
const scopeExpected = arguments[2] || {};
(async () => {
  const { classes: Cc, interfaces: Ci } = Components;
  const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  const win = wm.getMostRecentWindow("mail:3pane");
  const pane = win?.document.getElementById("tabmail")?.currentAbout3Pane;
  const doc = pane?.document;
  const panel = doc?.getElementById("pin-mails-panel");
  if (!panel) throw new Error("MailPerch panel is unavailable");
  const sleep = ms => new Promise(resolve => win.setTimeout(resolve, ms));
  const waitFor = async (test, label, timeout = 30000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) { if (test()) return; await sleep(50); }
    throw new Error(`Timeout: ${label}`);
  };
  const count = () => Number(panel.querySelector(".pin-mails-count")?.textContent || -1);
  const initialExpected = Number(scopeExpected.initial || expected);
  await waitFor(() => count() === initialExpected, `panel count ${initialExpected}`);
  const started = performance.now();
  const list = panel.querySelector(".pin-mails-panel-list");
  const cards = () => [...list.querySelectorAll(".pin-mails-card")];
  if (cards().length < 2) throw new Error("Fewer than two complete cards are visible");
  const initialCardCount = cards().length;
  const duplicateCount = cards().length - new Set(cards().map(card => card.dataset.stableKey)).size;
  if (duplicateCount) throw new Error(`Duplicate visible cards: ${duplicateCount}`);

  const searchStarted = performance.now();
  const search = panel.querySelector(".pin-mails-search");
  search.value = `Needle-${expected - 1}`;
  search.dispatchEvent(new pane.Event("input", {bubbles:true}));
  await waitFor(() => cards().length === 1 && cards()[0].textContent.includes(`Needle-${expected - 1}`), "complete search");
  const searchMs = performance.now() - searchStarted;
  search.value = "";
  search.dispatchEvent(new pane.Event("input", {bubbles:true}));
  await waitFor(() => cards().length >= 2, "clear search");

  const filterStarted = performance.now();
  const filter = panel.querySelector(".pin-mails-smart-view-select");
  filter.value = "all";
  filter.dispatchEvent(new pane.Event("change", {bubbles:true}));
  await waitFor(() => count() === expected, "all filter");
  const filterMs = performance.now() - filterStarted;

  const sort = panel.querySelector('.pin-mails-header-select[data-secondary="true"]') || panel.querySelector('.pin-mails-header-select[data-secondary]');
  sort.value = "messageDate";
  sort.dispatchEvent(new pane.Event("change", {bubbles:true}));
  await sleep(250);
  sort.value = "manual";
  sort.dispatchEvent(new pane.Event("change", {bubbles:true}));
  await sleep(250);

  const scope = panel.querySelector(".pin-mails-header-select:not([data-secondary])");
  const scopeCounts = {};
  for (const value of ["currentInbox", "selectedAccounts", "global"]) {
    scope.value = value;
    scope.dispatchEvent(new pane.Event("change", {bubbles:true}));
    await sleep(300);
    scopeCounts[value] = count();
  }
  const expectedScopes = {
    currentInbox: Number(scopeExpected.currentInbox || 0),
    selectedAccounts: Number(scopeExpected.selectedAccounts || expected),
    global: Number(scopeExpected.global || expected),
  };
  if (Object.entries(expectedScopes).some(([scopeName, countExpected]) => scopeCounts[scopeName] !== countExpected)) {
    throw new Error(`Unexpected scope counts: ${JSON.stringify(scopeCounts)}`);
  }
  scope.value = "selectedAccounts";
  scope.dispatchEvent(new pane.Event("change", {bubbles:true}));
  await waitFor(() => count() === expectedScopes.selectedAccounts, "selected-account scope");
  const selectedKeys = new Set(scopeExpected.selectedAccountKeys || []);
  if (selectedKeys.size) {
    const selectedCards = cards();
    if (selectedCards.some(card => !selectedKeys.has(String(card.dataset.stableKey || "").split("|", 1)[0]))) {
      throw new Error("A non-selected account appeared in the selected-account scope");
    }
    if (new Set(selectedCards.map(card => card.dataset.stableKey)).size !== selectedCards.length) {
      throw new Error("Duplicate cards appeared in the selected-account scope");
    }
    const searchable = scopeExpected.searchLabel || "";
    if (searchable) {
      search.value = `Scope-${searchable}`;
      search.dispatchEvent(new pane.Event("input", {bubbles:true}));
      const searchExpected = Number(scopeExpected.searchCount || 0);
      await waitFor(
        () => searchExpected === 0
          ? cards().length === 0
          : cards().length > 0 && cards().every(card => card.textContent.includes(`Scope-${searchable}`)),
        `selected-account search rendered ${searchable}`
      );
      await waitFor(
        () => count() === expectedScopes.selectedAccounts,
        "selected-account total preserved during search"
      );
      while (cards().length < searchExpected && list.querySelector(".pin-mails-load-more")) {
        list.querySelector(".pin-mails-load-more").click();
        await sleep(30);
      }
      await waitFor(() => cards().length === searchExpected, `selected-account search ${searchable}`, 60000);
      if (cards().some(card => !card.textContent.includes(`Scope-${searchable}`))) {
        throw new Error("Selected-account search returned another account");
      }
      search.value = "";
      search.dispatchEvent(new pane.Event("input", {bubbles:true}));
      await waitFor(() => count() === expectedScopes.selectedAccounts, "clear selected-account search");
    }
  }

  let loadedAll = false;
  let positionChecks = {};
  if (expected >= 500) {
    while (list.querySelector(".pin-mails-load-more")) {
      list.querySelector(".pin-mails-load-more").click();
      await sleep(30);
    }
    await waitFor(() => cards().length === expected, `all ${expected} cards loaded`, 60000);
    const keys = cards().map(card => card.dataset.stableKey);
    if (new Set(keys).size !== expected) throw new Error("Duplicate cards after pagination");
    for (const index of [0, Math.floor(expected / 2), expected - 1]) {
      const card = cards()[index];
      card.scrollIntoView({block:"center"});
      card.dispatchEvent(new pane.MouseEvent("click", {bubbles:true}));
      positionChecks[String(index)] = Boolean(card.dataset.stableKey && card.getBoundingClientRect().height > 0);
    }
    loadedAll = true;
  }

  const functional = [];
  const functionalLimitations = [];
  if (fullFunctional) {
    const collapse = panel.querySelector(".pin-mails-collapse-button");
    collapse.click(); await sleep(100); collapse.click(); await sleep(100);
    functional.push("panel-collapse-expand");
    const first = cards()[0];
    const before = {unread:pane.gFolder.getNumUnread(false), flags:Number(first._pinMessageHeader?.flags || 0)};
    first.querySelector('[data-card-action="unpin"]').click();
    await waitFor(() => count() === expected - 1, "unpin from card");
    const controlButton = doc.querySelector("#threadTree tr .pin-mails-independent-button");
    if (!controlButton) throw new Error("Synthetic control native-row pin button is unavailable");
    controlButton.click();
    await waitFor(() => count() === expected, "pin from native row");
    const after = {unread:pane.gFolder.getNumUnread(false), flags:Number(first._pinMessageHeader?.flags || 0)};
    if (before.unread !== after.unread || ((before.flags ^ after.flags) & (Ci.nsMsgMessageFlags.Read | Ci.nsMsgMessageFlags.Marked))) {
      throw new Error(`Native read/star invariant changed: ${JSON.stringify({before,after})}`);
    }
    functional.push("independent-pin-unpin-invariants");
    try { pane.threadTree.selectedIndex = 0; } catch {}
    try { pane.gDBView?.selection?.select(0); } catch {}
    const conversationButton = panel.querySelector(".pin-mails-action-conversation");
    conversationButton.click();
    await waitFor(() => count() === expected + 1, "conversation pin");
    conversationButton.click();
    await waitFor(() => count() === expected, "conversation unpin");
    functional.push("conversation-pin-unpin");
    panel.querySelector(".pin-mails-action-add-group").click(); await sleep(100);
    const groupDialog = doc.querySelector('.pin-mails-group-dialog[open]');
    if (!groupDialog) throw new Error("Create-group dialog did not open");
    groupDialog.querySelector(".pin-mails-group-dialog-name").value = "Groupe créé par le banc";
    groupDialog.querySelector("form").requestSubmit(); await sleep(200);
    functional.push("group-create");
    const menuButton = cards()[0]?.querySelector('[data-card-action="more"]');
    menuButton?.click(); await sleep(100);
    const contextMenu = doc.getElementById("pin-mails-card-context-menu");
    if (!contextMenu) throw new Error("Card action menu is unavailable");
    const editMenuItem = contextMenu.querySelector('[data-context-action="edit"]');
    if (!editMenuItem) throw new Error("Card metadata menu action is unavailable");
    editMenuItem.dispatchEvent(new pane.Event("command", {bubbles:true, composed:true}));
    functional.push("card-action-menu");
    await sleep(300);
    const editor = doc.getElementById("pin-mails-editor");
    if (!editor?.open) {
      functionalLimitations.push("Thunderbird ignored the untrusted XUL menuitem command used to open the card metadata editor.");
    } else {
      editor.querySelector(".pin-mails-editor-note").value = "Note modifiée par le banc fonctionnel";
      const checklistInput = editor.querySelector(".pin-mails-editor-checklist-input");
      checklistInput.value = "Sous-tâche ajoutée par le banc";
      editor.querySelector(".pin-mails-editor-checklist-add button").click();
      editor.querySelector(".pin-mails-editor-priority").value = "urgent";
      editor.querySelector(".pin-mails-editor-workflow").value = "waiting";
      editor.querySelector(".pin-mails-editor-group").value = [...editor.querySelector(".pin-mails-editor-group").options].at(-1).value;
      editor.querySelector(".pin-mails-editor-due").value = "2030-01-02T10:00";
      editor.querySelector(".pin-mails-editor-follow-up").value = "2030-01-01T09:00";
      editor.querySelector("form").requestSubmit();
      await sleep(250);
      functional.push("group-assign", "notes-checklist-priority-deadline-status-followup-editor");
    }
  }

  scope.value = "global";
  scope.dispatchEvent(new pane.Event("change", {bubbles:true}));
  await waitFor(() => count() === expected, "restore global scope");
  done({
    total: count(), initialCardCount, renderedCardCount: cards().length,
    panelRenderAndInteractionMs: performance.now() - started, searchMs, filterMs,
    scopeCounts, loadedAll, positionChecks, functional, functionalLimitations,
    liveText: panel.querySelector(".pin-mails-live")?.textContent || "",
    badText: /\b(?:null|undefined|NaN)\b/.test(panel.textContent),
  });
})().catch(error => done({__mailperchSmokeError: `${error?.name || "Error"}: ${error?.message || error}\n${error?.stack || ""}`}));
"""


SET_SELECTED_ACCOUNTS_SCRIPT = r"""
const done = arguments[arguments.length - 1];
const selectedAccountKeys = Array.isArray(arguments[0]) ? arguments[0] : [];
try {
  const raw = Services.prefs.getStringPref("extensions.pinMails.settings", "{}");
  const settings = JSON.parse(raw);
  settings.panelScope = "selectedAccounts";
  settings.selectedAccountKeys = selectedAccountKeys;
  Services.prefs.setStringPref("extensions.pinMails.settings", JSON.stringify(settings));
  const persisted = JSON.parse(Services.prefs.getStringPref("extensions.pinMails.settings", "{}"));
  done({
    panelScope: persisted.panelScope,
    selectedAccountKeys: persisted.selectedAccountKeys,
    prefHasUserValue: Services.prefs.prefHasUserValue("extensions.pinMails.settings"),
  });
} catch (error) {
  done({__mailperchSmokeError: `${error?.name || "Error"}: ${error?.message || error}`});
}
"""

PROFILE_STATE_SCRIPT = r"""
const done = arguments[arguments.length - 1];
(async () => {
  const { MailServices } = ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs");
  const { ExtensionStorage } = ChromeUtils.importESModule("resource://gre/modules/ExtensionStorage.sys.mjs");
  const { Sqlite } = ChromeUtils.importESModule("resource://gre/modules/Sqlite.sys.mjs");
  const { interfaces: Ci } = Components;
  const childFolders = folder => {
    try { return [...folder.subFolders]; } catch {}
    const result = [];
    const children = folder.subFolders;
    while (children?.hasMoreElements?.()) result.push(children.getNext().QueryInterface(Ci.nsIMsgFolder));
    return result;
  };
  const accounts = Array.from(MailServices.accounts.accounts || [])
    .map(account => ({account, server: account.incomingServer}))
    .filter(({server}) => /^mailperch-bench-[abc]$/i.test(String(server?.username || server?.userName || "")))
    .map(({account, server}) => {
      const folders = childFolders(server.rootFolder)
        .filter(folder => String(folder.prettyName || folder.name || "").startsWith("MailPerch Bench "))
        .map(folder => ({
          uri: String(folder.URI),
          messageCount: Number(folder.getTotalMessages(false)),
        }))
        .sort((left, right) => left.uri.localeCompare(right.uri));
      return {
        key: String(account.key || ""),
        serverKey: String(server.key || ""),
        username: String(server.username || server.userName || ""),
        folderUris: folders.map(folder => folder.uri),
        folderMessageCounts: folders.map(folder => folder.messageCount),
      };
    })
    .sort((left, right) => left.key.localeCompare(right.key));
  const settings = JSON.parse(Services.prefs.getStringPref("extensions.pinMails.settings", "{}"));
  const jsonFile = await ExtensionStorage.getFile("pin-mails@MailPerch.local");
  const installationMarker = jsonFile?.data?.get("mailperch.installation") || "";
  const profileDirectory = Services.dirsvc.get("ProfD", Ci.nsIFile);
  const databaseFile = profileDirectory.clone();
  databaseFile.append("pin-mails-v2.sqlite");
  let sqliteRefCount = null;
  let sqliteTables = [];
  if (databaseFile.exists()) {
    const database = await Sqlite.openConnection({path:"pin-mails-v2.sqlite", sharedMemoryCache:false});
    try {
      const rows = await database.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
      sqliteTables = rows.map(row => String(row.getResultByName("name")));
      if (sqliteTables.includes("refs")) {
        const refs = await database.execute("SELECT COUNT(*) AS count FROM refs");
        sqliteRefCount = Number(refs[0]?.getResultByName("count"));
      }
    } finally {
      await database.close();
    }
  }
  done({
    processId: Number(Services.appinfo.processID),
    profilePath: profileDirectory.path,
    accounts,
    folderUris: accounts.flatMap(account => account.folderUris).sort(),
    folderMessageCounts: accounts.flatMap(account => account.folderMessageCounts),
    totalMessageCount: accounts.flatMap(account => account.folderMessageCounts).reduce((sum, count) => sum + count, 0),
    settings: {panelScope: settings.panelScope, selectedAccountKeys: settings.selectedAccountKeys},
    settingsUserValue: Services.prefs.prefHasUserValue("extensions.pinMails.settings"),
    installationMarker,
    sqliteFileExists: databaseFile.exists(), sqliteTables, sqliteRefCount,
  });
})().catch(error => done({__mailperchSmokeError: `${error?.name || "Error"}: ${error?.message || error}\n${error?.stack || ""}`}));
"""

ACCOUNT_SCOPE_PANEL_SCRIPT = r"""
const done = arguments[arguments.length - 1];
const expectedCount = Number(arguments[0]);
const expectedScope = String(arguments[1]);
const includedAccounts = Array.isArray(arguments[2]) ? arguments[2] : [];
const excludedAccounts = Array.isArray(arguments[3]) ? arguments[3] : [];
(async () => {
  const win = Services.wm.getMostRecentWindow("mail:3pane");
  const pane = win?.document.getElementById("tabmail")?.currentAbout3Pane;
  const panel = pane?.document.getElementById("pin-mails-panel");
  if (!panel) throw new Error("MailPerch panel is unavailable");
  const sleep = ms => new Promise(resolve => win.setTimeout(resolve, ms));
  const count = () => Number(panel.querySelector(".pin-mails-count")?.textContent || -1);
  for (let attempt = 0; attempt < 300 && count() !== expectedCount; attempt++) await sleep(100);
  if (count() !== expectedCount) throw new Error(`Expected ${expectedCount} selected-account pins, observed ${count()}`);
  const cards = [...panel.querySelectorAll(".pin-mails-card")];
  const stableKeys = cards.map(card => String(card.dataset.stableKey || ""));
  const duplicateCount = stableKeys.length - new Set(stableKeys).size;
  if (cards.length !== expectedCount) throw new Error(`Expected ${expectedCount} rendered cards, observed ${cards.length}`);
  if (duplicateCount) throw new Error(`Duplicate selected-account cards: ${duplicateCount}`);
  for (const account of includedAccounts) {
    for (const key of account.representativeKeys || []) {
      if (!stableKeys.includes(key)) throw new Error(`Representative pin is missing for ${account.label}: ${key}`);
    }
  }
  for (const account of excludedAccounts) {
    if (stableKeys.some(key => key.startsWith(`${account.key}|`))) {
      throw new Error(`Excluded account ${account.label} is still rendered`);
    }
  }
  const settings = JSON.parse(Services.prefs.getStringPref("extensions.pinMails.settings", "{}"));
  if (settings.panelScope !== expectedScope) throw new Error(`Expected panelScope ${expectedScope}, observed ${settings.panelScope}`);
  done({
    count: count(), renderedCardCount: cards.length, duplicateCount,
    panelScope: settings.panelScope, selectedAccountKeys: settings.selectedAccountKeys,
    includedLabels: includedAccounts.map(account => account.label),
    excludedLabels: excludedAccounts.map(account => account.label),
    representativeKeysObserved: includedAccounts.flatMap(account => account.representativeKeys || []).filter(key => stableKeys.includes(key)),
  });
})().catch(error => done({__mailperchSmokeError: `${error?.name || "Error"}: ${error?.message || error}\n${error?.stack || ""}`}));
"""


OPEN_DASHBOARD_BENCH_SCRIPT = r"""
const done = arguments[arguments.length - 1];
(async () => {
  const { classes: Cc, interfaces: Ci } = Components;
  const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  const win = wm.getMostRecentWindow("mail:3pane");
  const tabmail = win?.document.getElementById("tabmail");
  const pane = tabmail?.currentAbout3Pane;
  const button = pane?.document.querySelector(".pin-mails-action-dashboard");
  if (!button) throw new Error("Dashboard button is unavailable");
  const started = performance.now();
  button.click();
  let tab = null;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    tab = Array.from(tabmail?.tabInfo || []).find(item => String(item.browser?.currentURI?.spec || item.chromeBrowser?.currentURI?.spec || "").includes("dashboard/dashboard.html"));
    if (tab) break;
    await new Promise(resolve => win.setTimeout(resolve, 100));
  }
  if (!tab) throw new Error("Dashboard tab did not open");
  tabmail.switchToTab(tab);
  done({dashboardButton:true, openingMs:performance.now() - started});
})().catch(error => done({__mailperchSmokeError: `${error?.name || "Error"}: ${error?.message || error}\n${error?.stack || ""}`}));
"""


DASHBOARD_CONTENT_SCRIPT = r"""
const done = arguments[arguments.length - 1];
const expected = Number(arguments[0]);
const fullFunctional = Boolean(arguments[1]);
(async () => {
  const doc = document;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline && !doc.getElementById("stats")?.children.length) await sleep(100);
  if (!doc.getElementById("stats")?.children.length) throw new Error("Dashboard content did not initialize");
  const stats = [...doc.querySelectorAll("#stats .stat")].map(node => node.textContent);
  const totalText = doc.getElementById("stats")?.textContent || "";
  if (!totalText.includes(String(expected))) throw new Error(`Dashboard total ${expected} is missing`);
  const checks = [];
  if (fullFunctional) {
    for (const view of ["today", "list", "kanban", "cases", "review", "history", "health"]) {
      doc.querySelector(`[data-view="${view}"]`).click(); await sleep(300);
      const sectionId = view === "list" ? "items" : view;
      if (doc.getElementById(sectionId)?.hidden) throw new Error(`Dashboard view ${view} stayed hidden`);
      checks.push(`view-${view}`);
    }
    doc.querySelector('[data-view="list"]').click(); await sleep(300);
    const search = doc.getElementById("search");
    search.value = `Needle-${expected - 1}`;
    search.dispatchEvent(new Event("input", {bubbles:true}));
    await sleep(500);
    if (!doc.getElementById("items")?.textContent.includes(`Needle-${expected - 1}`)) throw new Error("Dashboard search did not find the last item");
    search.value = ""; search.dispatchEvent(new Event("input", {bubbles:true})); await sleep(400);
    doc.querySelector('[data-smart-view="all"]')?.click(); await sleep(300);
    doc.querySelector("#saved-views [data-saved-view]")?.click(); await sleep(300);
    doc.getElementById("select-visible").click();
    if (doc.getElementById("selection-bar").hidden) throw new Error("Dashboard multi-selection bar stayed hidden");
    doc.getElementById("bulk-action").value = "priority";
    doc.getElementById("bulk-action").dispatchEvent(new Event("change", {bubbles:true}));
    doc.getElementById("bulk-priority").value = "high";
    doc.getElementById("apply").click(); await sleep(500);
    doc.getElementById("commands").click();
    if (!doc.getElementById("command-palette").open) throw new Error("Command palette did not open");
    doc.getElementById("command-close").click();
    doc.getElementById("refresh").click(); await sleep(300);
    checks.push("search", "smart-view", "saved-view", "multi-select", "bulk-priority", "command-palette", "refresh");
  }
  done({stats, checks, badText:/\b(?:null|undefined|NaN)\b/.test(doc.body.textContent)});
})().catch(error => done({__mailperchSmokeError: `${error?.name || "Error"}: ${error?.message || error}\n${error?.stack || ""}`}));
"""


SELECT_OPTIONS_BENCH_SCRIPT = r"""
const done = arguments[arguments.length - 1];
(async () => {
  const { classes: Cc, interfaces: Ci } = Components;
  const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  const win = wm.getMostRecentWindow("mail:3pane");
  const tabmail = win?.document.getElementById("tabmail");
  let tab = null;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    tab = Array.from(tabmail?.tabInfo || []).find(item => String(item.browser?.currentURI?.spec || item.chromeBrowser?.currentURI?.spec || "").includes("options/options.html"));
    if (tab) break;
    await new Promise(resolve => win.setTimeout(resolve, 100));
  }
  if (!tab) throw new Error("Options tab did not open");
  tabmail.switchToTab(tab);
  done({selected:true});
})().catch(error => done({__mailperchSmokeError: `${error?.name || "Error"}: ${error?.message || error}\n${error?.stack || ""}`}));
"""


OPTIONS_CONTENT_SCRIPT = r"""
const done = arguments[arguments.length - 1];
(async () => {
  const doc = document;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline && doc.body?.dataset.initializationState !== "ready") await sleep(100);
  if (doc.body?.dataset.initializationState !== "ready") throw new Error("Options content did not initialize");
  const groups = [...new Set([...doc.querySelectorAll("#settings-form > section[data-nav-group-i18n]")].map(node => node.dataset.navGroupI18n))];
  for (const expected of ["navEssential", "navAutomation", "navOrganization", "navAdvanced"]) {
    if (!groups.includes(expected)) throw new Error(`Options navigation group ${expected} is missing`);
  }
  const experience = doc.getElementById("settingsExperience");
  experience.value = "guided"; experience.dispatchEvent(new Event("change", {bubbles:true}));
  experience.value = "advanced"; experience.dispatchEvent(new Event("change", {bubbles:true}));
  const scope = doc.getElementById("panelScope");
  scope.value = "selectedAccounts"; scope.dispatchEvent(new Event("change", {bubbles:true}));
  if (doc.getElementById("selected-accounts-setting").hidden) throw new Error("Selected-account controls stayed hidden");
  const selectedAccounts = doc.querySelectorAll('#selected-accounts-list input[type="checkbox"]').length;
  const accountControl = doc.querySelector('#selected-accounts-list input[type="checkbox"]');
  if (!accountControl) throw new Error("No selected-account checkbox was rendered");
  accountControl.click();
  await sleep(50);
  if (doc.getElementById("save-all-floating").disabled) throw new Error("Options save did not become available");
  doc.getElementById("discard-changes").click(); await sleep(150);
  doc.querySelector('#selected-accounts-list input[type="checkbox"]')?.click(); await sleep(50);
  doc.getElementById("save-all-floating").click(); await sleep(300);
  doc.querySelector('#selected-accounts-list input[type="checkbox"]')?.click(); await sleep(50);
  doc.getElementById("save-all-floating").click(); await sleep(300);
  const search = doc.getElementById("settings-search");
  search.value = "calendar"; search.dispatchEvent(new Event("input", {bubbles:true})); await sleep(100);
  search.value = ""; search.dispatchEvent(new Event("input", {bubbles:true}));
  const paypalOnly = [...doc.querySelectorAll("[data-support-link]")].every(link => link.href.replace(/\/$/, "") === "https://paypal.me/ussmarinesdot");
  if (!paypalOnly) throw new Error("Unexpected support destination in Options");
  done({groups, selectedAccounts, guidedAndAdvanced:true, search:true, scope:true, saveCancel:true, tags:Boolean(doc.getElementById("enableThunderbirdTagSync")), agenda:Boolean(doc.getElementById("enableCalendarIntegration")), health:Boolean(doc.getElementById("health-info")), paypalOnly, badText:/\b(?:null|undefined|NaN)\b/.test(doc.body.textContent)});
})().catch(error => done({__mailperchSmokeError: `${error?.name || "Error"}: ${error?.message || error}\n${error?.stack || ""}`}));
"""


CONSOLE_ERRORS_SCRIPT = r"""
const done = arguments[arguments.length - 1];
(async () => {
  const messages = Services.console.getMessageArray?.() || [];
  done(messages.map(message => ({message:String(message.message || message.errorMessage || ""), category:String(message.category || ""), flags:Number(message.flags || 0)})).filter(item => /mailperch|pin-mails/i.test(`${item.category} ${item.message}`) && /error|exception|uncaught/i.test(item.message) && !/Unknown localization message/i.test(item.message)).slice(-100));
})().catch(error => done({__mailperchSmokeError: String(error)}));
"""


THEME_BENCH_SCRIPT = r"""
const done = arguments[arguments.length - 1];
const dark = Boolean(arguments[0]);
(async () => {
  const { classes: Cc, interfaces: Ci } = Components;
  const wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  const win = wm.getMostRecentWindow("mail:3pane");
  try { win?.document.querySelector("account-hub-container")?.modal?.close(); } catch {}
  const tabmail = win?.document.getElementById("tabmail");
  const mailTab = Array.from(tabmail?.tabInfo || []).find(tab =>
    tab.mode?.name === "mail3PaneTab" ||
    String(tab.browser?.currentURI?.spec || tab.chromeBrowser?.currentURI?.spec || "") === "about:3pane"
  );
  if (mailTab && typeof tabmail.switchToTab === "function") tabmail.switchToTab(mailTab);
  Services.prefs.setIntPref("ui.systemUsesDarkTheme", dark ? 1 : 0);
  await new Promise(resolve => win.setTimeout(resolve, 750));
  const pane = tabmail?.currentAbout3Pane;
  const panel = pane?.document.getElementById("pin-mails-panel");
  const cards = [...(panel?.querySelectorAll(".pin-mails-card") || [])];
  if (!panel || cards.length < 2) throw new Error("Two panel cards are not available for theme evidence");
  const listRect = panel.querySelector(".pin-mails-panel-list").getBoundingClientRect();
  const firstRect = cards[0].getBoundingClientRect();
  const secondRect = cards[1].getBoundingClientRect();
  const searchRect = panel.querySelector(".pin-mails-search").getBoundingClientRect();
  const filterRect = panel.querySelector(".pin-mails-smart-view-select").getBoundingClientRect();
  const pin = cards[0].querySelector(".pin-mails-card-pin");
  const pinStyle = pane.getComputedStyle(pin);
  const pinMask = pane.getComputedStyle(pin, "::before");
  const sameRow = Math.abs(searchRect.top - filterRect.top) <= 2;
  const sameColumn = Math.abs(searchRect.left - filterRect.left) <= 4 && Math.abs(searchRect.width - filterRect.width) <= 4;
  done({
    dark, cardCount:cards.length, twoCompleteCards:firstRect.height > 0 && secondRect.height > 0 && secondRect.bottom <= listRect.bottom + 1,
    controlsAligned:sameRow || sameColumn,
    noPanelClipping:firstRect.left >= listRect.left && firstRect.right <= listRect.right + 1 && secondRect.left >= listRect.left && secondRect.right <= listRect.right + 1,
    horizontalOverflowPx:Math.max(0, panel.scrollWidth - panel.clientWidth),
    controlGeometry:{search:{left:searchRect.left,width:searchRect.width,top:searchRect.top},filter:{left:filterRect.left,width:filterRect.width,top:filterRect.top}},
    pinColor:pinStyle.color, pinBackground:pinStyle.backgroundColor,
    pinMaskColor:pinMask.backgroundColor, pinMaskImage:pinMask.maskImage || pinMask.webkitMaskImage || "",
    dashboardVisible:!panel.querySelector(".pin-mails-action-dashboard").hidden,
  });
})().catch(error => done({__mailperchSmokeError: `${error?.name || "Error"}: ${error?.message || error}\n${error?.stack || ""}`}));
"""


def _validate_reused_profile(
    seed: dict[str, Any],
    session_one: dict[str, Any],
    session_two: dict[str, Any],
    profile: pathlib.Path,
    selected_account_keys: list[str],
    volume: int,
) -> None:
    expected_profile = os.path.normcase(os.path.realpath(profile))
    expected_account_keys = [account["key"] for account in seed["accounts"]]
    expected_folder_uris = sorted(seed["folderUris"])
    for label, state in (("Session 1", session_one), ("Session 2", session_two)):
        if os.path.normcase(os.path.realpath(state.get("profilePath", ""))) != expected_profile:
            raise SmokeFailure(f"{label} did not use the requested reusable profile: {state!r}")
        if [account.get("key") for account in state.get("accounts", [])] != expected_account_keys:
            raise SmokeFailure(f"{label} synthetic accounts were not preserved: {state!r}")
        if sorted(state.get("folderUris", [])) != expected_folder_uris:
            raise SmokeFailure(f"{label} synthetic folders were not preserved: {state!r}")
        if state.get("totalMessageCount") != volume + 1:
            raise SmokeFailure(f"{label} synthetic messages were not preserved: {state!r}")
        if state.get("sqliteRefCount") != volume:
            raise SmokeFailure(f"{label} MailPerch SQLite refs were not preserved: {state!r}")
        if state.get("installationMarker") != "mailperch-installation-v1":
            raise SmokeFailure(f"{label} MailPerch installation storage was not preserved: {state!r}")
        if not state.get("settingsUserValue"):
            raise SmokeFailure(f"{label} MailPerch settings preference is not persisted: {state!r}")
        settings = state.get("settings", {})
        if settings.get("panelScope") != "selectedAccounts" or settings.get("selectedAccountKeys") != selected_account_keys:
            raise SmokeFailure(f"{label} selected-account settings were not preserved: {state!r}")
    if session_one.get("folderMessageCounts") != session_two.get("folderMessageCounts"):
        raise SmokeFailure("Synthetic folder message counts changed between Thunderbird processes")
    if session_one.get("processId") == session_two.get("processId"):
        raise SmokeFailure("Thunderbird did not restart as a distinct process")


def _run_scope_case(
    args: argparse.Namespace,
    volume: int,
    output_dir: pathlib.Path,
    case_name: str,
    selected_labels: tuple[str, ...],
) -> dict[str, Any]:
    port = _free_port()
    client = WebDriverClient("127.0.0.1", port, timeout=max(30.0, args.timeout))
    safe_case_name = case_name.lower().replace("-and-", "-")
    log_path = output_dir / f"geckodriver-{volume}-{safe_case_name}.log"
    process: subprocess.Popen[str] | None = None
    result: dict[str, Any] = {
        "volume": volume,
        "scopeCase": case_name,
        "status": "failed",
        "checks": [],
        "timeouts": 0,
    }
    with tempfile.TemporaryDirectory(prefix=f"mailperch-scope-{safe_case_name}-") as profile_dir:
        profile = pathlib.Path(profile_dir).resolve()
        try:
            with log_path.open("w", encoding="utf-8") as log_handle:
                process = subprocess.Popen(
                    [str(args.geckodriver_path), "--host", "127.0.0.1", "--port", str(port), "--allow-system-access", "--log", "trace"],
                    stdout=log_handle, stderr=subprocess.STDOUT, text=True,
                )
                client.wait_ready(time.monotonic() + args.timeout)

                # Session 1 provisions the disposable profile and persists the
                # exact production preference consumed by MailPerch at startup.
                first_capabilities = _new_session_with_profile(client, args.binary_path, profile)
                client.request("POST", client._session_path("/timeouts"), {"script": int(args.timeout * 1000)})
                client.set_context("chrome")
                seed = client.execute_async(
                    SEED_DATASET_SCRIPT, [volume, list(selected_labels), "selectedAccounts"]
                )
                if not isinstance(seed, dict) or seed.get("pinnedCount") != volume:
                    raise SmokeFailure(f"Synthetic dataset count mismatch: {seed!r}")
                all_accounts = seed["accounts"]
                selected_accounts = [account for account in all_accounts if account["label"] in selected_labels]
                excluded_accounts = [account for account in all_accounts if account["label"] not in selected_labels]
                selected_account_keys = [account["key"] for account in selected_accounts]
                selected_count = sum(account["pinnedCount"] for account in selected_accounts)
                client.install_addon(args.xpi_path)
                _wait_for_state(client, _panel_is_ready, "MailPerch panel in Session 1", args.timeout)
                initial_panel = client.execute_async(
                    ACCOUNT_SCOPE_PANEL_SCRIPT,
                    [selected_count, "selectedAccounts", selected_accounts, excluded_accounts],
                )
                saved_settings = client.execute_async(SET_SELECTED_ACCOUNTS_SCRIPT, [selected_account_keys])
                if saved_settings != {
                    "panelScope": "selectedAccounts",
                    "selectedAccountKeys": selected_account_keys,
                    "prefHasUserValue": True,
                }:
                    raise SmokeFailure(f"Production settings persistence failed: {saved_settings!r}")
                first_state = client.execute_async(PROFILE_STATE_SCRIPT)
                result["session1"] = {
                    "capabilitiesProfile": first_capabilities.get("moz:profile"),
                    "profileState": first_state,
                    "selectedAccountsPanel": initial_panel,
                    "savedSettings": saved_settings,
                }
                result["checks"].extend([
                    "session-1-synthetic-profile",
                    "session-1-selected-account-runtime",
                    "production-settings-persisted",
                ])
                client.delete_session()

                # Session 2 starts a new Thunderbird process on the same exact
                # directory. Verify the persisted profile before reinstalling.
                second_capabilities = _new_session_with_profile(client, args.binary_path, profile)
                result["profileReused"] = True
                client.request("POST", client._session_path("/timeouts"), {"script": int(args.timeout * 1000)})
                client.set_context("chrome")
                second_state = client.execute_async(PROFILE_STATE_SCRIPT)
                _validate_reused_profile(
                    seed, first_state, second_state, profile, selected_account_keys, volume
                )
                result["checks"].append("same-profile-distinct-thunderbird-processes")

                client.install_addon(args.xpi_path)
                _wait_for_state(client, _panel_is_ready, "MailPerch panel in Session 2", args.timeout)
                selected_panel = client.execute_async(
                    ACCOUNT_SCOPE_PANEL_SCRIPT,
                    [selected_count, "selectedAccounts", selected_accounts, excluded_accounts],
                )
                result["session2"] = {
                    "capabilitiesProfile": second_capabilities.get("moz:profile"),
                    "profileStateBeforeInstall": second_state,
                    "selectedAccountsPanel": selected_panel,
                }
                result["checks"].append("selected-account-runtime-after-process-restart")
                if selected_labels == ("A", "C"):
                    result["selectedAccountsPersistence"] = "passed"
                    result["checks"].append("A-and-C-settings-and-render-persistence")
                result["jsExceptions"] = client.execute_async(CONSOLE_ERRORS_SCRIPT)
                if result["jsExceptions"]:
                    raise SmokeFailure(f"MailPerch JavaScript errors were recorded: {result['jsExceptions']!r}")
                result["finalPinnedCount"] = selected_panel["count"]
                result["status"] = "passed"
                return result
        except Exception as error:
            result["error"] = f"{type(error).__name__}: {error}"
            result["profileReused"] = result.get("profileReused", False)
            if result["profileReused"] and "SQLite refs were not preserved" in str(error):
                result["harnessLimit"] = (
                    "The exact profile reopened, but the temporary add-on shutdown did not preserve "
                    "the MailPerch structured SQLite store for Session 2."
                )
            if "Timeout" in str(error) or "timed out" in str(error).lower():
                result["timeouts"] += 1
            try:
                result["lastRuntimeState"] = client.execute_async(RUNTIME_STATE_SCRIPT)
            except Exception:
                pass
            return result
        finally:
            try:
                client.delete_session()
            except Exception:
                pass
            if process is not None:
                try:
                    process.terminate()
                    process.wait(timeout=10)
                except Exception:
                    try:
                        process.kill()
                    except Exception:
                        pass


def _prepare_manual_scope_validation(args: argparse.Namespace, output_dir: pathlib.Path) -> int:
    """Keep one seeded disposable profile open for a human scope validation."""
    port = _free_port()
    client = WebDriverClient("127.0.0.1", port, timeout=max(30.0, args.timeout))
    profile = pathlib.Path(tempfile.mkdtemp(prefix="mailperch-manual-scope-")).resolve()
    log_path = output_dir / "geckodriver-manual-scope.log"
    process: subprocess.Popen[str] | None = None
    try:
        with log_path.open("w", encoding="utf-8") as log_handle:
            process = subprocess.Popen(
                [str(args.geckodriver_path), "--host", "127.0.0.1", "--port", str(port), "--allow-system-access", "--log", "trace"],
                stdout=log_handle, stderr=subprocess.STDOUT, text=True,
            )
            client.wait_ready(time.monotonic() + args.timeout)
            _new_session_with_profile(client, args.binary_path, profile)
            client.request("POST", client._session_path("/timeouts"), {"script": int(args.timeout * 1000)})
            client.set_context("chrome")
            seed = client.execute_async(SEED_DATASET_SCRIPT, [50, []])
            if not isinstance(seed, dict) or seed.get("pinnedCount") != 50:
                raise SmokeFailure(f"Synthetic manual dataset count mismatch: {seed!r}")
            accounts = {account["label"]: account for account in seed["accounts"]}
            if [accounts[label]["pinnedCount"] for label in ("A", "B", "C")] != [18, 16, 16]:
                raise SmokeFailure(f"Manual account volumes are not the expected 18/16/16: {seed!r}")
            if seed.get("currentFolderPinnedCount") != 9:
                raise SmokeFailure(f"Manual current-folder volume is not 9: {seed!r}")
            client.install_addon(args.xpi_path)
            _wait_for_state(client, _panel_is_ready, "MailPerch panel for manual scope validation", args.timeout)
            print("\nMailPerch manual selected-account validation is ready.", flush=True)
            print(f"Disposable profile: {profile}", flush=True)
            print("A: account.key=account1; incomingServer.key=server1; 18 pins", flush=True)
            print("B: account.key=account2; incomingServer.key=server2; 16 pins", flush=True)
            print("C: account.key=account3; incomingServer.key=server3; 16 pins", flush=True)
            print("Total = 50 pins; two folders per account; offline only; no credentials or network.", flush=True)
            print("Manual checklist:", flush=True)
            print("1. This folder: choose a folder containing 9 pins; expected 9.", flush=True)
            print("2. All accounts: expected 50.", flush=True)
            print("3. Selected accounts: initially 0 selected and 0 pins; no unavailable-account warning.", flush=True)
            print("4. A only: save; expected 18.", flush=True)
            print("5. B only: expected 16.", flush=True)
            print("6. A + C: expected 34; A and C present, B absent.", flush=True)
            print("7. A + B + C: expected 50.", flush=True)
            print("8. Leave A + C selected. If the temporary add-on remains available after a normal reopen of this profile, verify A + C, 34, and B absent.", flush=True)
            input("Close Thunderbird when finished, then press Enter to stop the harness. The profile will be kept. ")
    finally:
        try:
            client.delete_session()
        except Exception:
            pass
        if process is not None:
            try:
                process.terminate()
                process.wait(timeout=10)
            except Exception:
                try:
                    process.kill()
                except Exception:
                    pass
        print(f"Profile retained: {profile}", flush=True)
        print("After Thunderbird is closed, remove it explicitly with:", flush=True)
        print(f"Remove-Item -LiteralPath '{profile}' -Recurse", flush=True)
    return 0


def _run_volume(args: argparse.Namespace, volume: int, output_dir: pathlib.Path, selected_labels: tuple[str, ...] = ("A", "B", "C")) -> dict[str, Any]:
    port = _free_port()
    client = WebDriverClient("127.0.0.1", port, timeout=max(30.0, args.timeout))
    log_path = output_dir / f"geckodriver-{volume}.log"
    process: subprocess.Popen[str] | None = None
    result: dict[str, Any] = {"volume": volume, "status": "failed", "checks": [], "timeouts": 0}
    try:
        with log_path.open("w", encoding="utf-8") as log_handle:
            process = subprocess.Popen(
                [str(args.geckodriver_path), "--host", "127.0.0.1", "--port", str(port), "--allow-system-access", "--log", "trace"],
                stdout=log_handle, stderr=subprocess.STDOUT, text=True,
            )
            client.wait_ready(time.monotonic() + args.timeout)
            client.new_session(args.binary_path)
            client.request("POST", client._session_path("/timeouts"), {"script": int(args.timeout * 1000)})
            client.set_context("chrome")
            seed = client.execute_async(SEED_DATASET_SCRIPT, [volume, list(selected_labels)])
            if not isinstance(seed, dict) or seed.get("pinnedCount") != volume:
                raise SmokeFailure(f"Synthetic dataset count mismatch: {seed!r}")
            result["seed"] = seed
            result["checks"].append("synthetic-local-dataset")
            client.install_addon(args.xpi_path)
            _wait_for_state(client, _panel_is_ready, "MailPerch panel", args.timeout)
            result["checks"].append("real-xpi-installed")
            full_functional = volume == min(args.volumes)
            selected_accounts = [account for account in seed["accounts"] if account["label"] in selected_labels]
            selected_account_keys = [account["key"] for account in selected_accounts]
            selected_count = sum(account["pinnedCount"] for account in selected_accounts)
            common_scope = {
                "currentInbox": seed["currentFolderPinnedCount"],
                "global": volume,
                "selectedAccounts": selected_count,
                "initial": volume,
                "selectedAccountKeys": selected_account_keys,
                "searchLabel": selected_accounts[0]["label"],
                "searchCount": selected_accounts[0]["pinnedCount"],
            }
            panel = client.execute_async(PANEL_BENCH_SCRIPT, [volume, full_functional, common_scope])
            if panel.get("total") != volume or panel.get("badText"):
                raise SmokeFailure(f"Panel validation failed: {panel!r}")
            result["panel"] = panel
            result["checks"].append("panel-functional-and-scale")
            dashboard_open = client.execute_async(OPEN_DASHBOARD_BENCH_SCRIPT)
            result["dashboard"] = dashboard_open
            result["checks"].append("dashboard-runtime")
            if full_functional:
                result.setdefault("runtimeLimitations", []).append(
                    "Thunderbird internal content tabs are not exposed as Marionette WebDriver content handles; Dashboard and Options DOM scenarios were not observed."
                )
                # Capture both real Thunderbird color-scheme variants and keep
                # machine-readable geometry/style observations beside them.
                light = client.execute_async(THEME_BENCH_SCRIPT, [False])
                image = client.full_screenshot()
                if image: (output_dir / "thunderbird-light.png").write_bytes(image)
                dark = client.execute_async(THEME_BENCH_SCRIPT, [True])
                image = client.full_screenshot()
                if image: (output_dir / "thunderbird-dark.png").write_bytes(image)
                result["themeEvidence"] = {"light": light, "dark": dark}
                result["screenshots"] = {"light": bool((output_dir / "thunderbird-light.png").is_file()), "dark": bool((output_dir / "thunderbird-dark.png").is_file())}
            else:
                client.set_context("chrome")
            result["jsExceptions"] = client.execute_async(CONSOLE_ERRORS_SCRIPT)
            if result["jsExceptions"]:
                raise SmokeFailure(f"MailPerch JavaScript errors were recorded: {result['jsExceptions']!r}")
            result["finalPinnedCount"] = panel["total"]
            if full_functional:
                client.uninstall_addon(ADDON_ID)
                _wait_for_state(client, _panel_is_cleaned, "MailPerch cleanup", args.timeout)
                client.install_addon(args.xpi_path)
                reinstalled = _wait_for_state(client, _panel_is_ready, "MailPerch clean reinstall", args.timeout)
                result["lifecycle"] = {
                    "cleanup": True,
                    "reinstall": True,
                    "panelCounts": [pane.get("panelCount") for pane in reinstalled.get("panes", [])],
                    "toggleCounts": [pane.get("toggleCount") for pane in reinstalled.get("panes", [])],
                }
                result["checks"].append("cleanup-and-clean-reinstall")
            result["status"] = "passed"
            return result
    except Exception as error:
        result["error"] = f"{type(error).__name__}: {error}"
        if "Timeout" in str(error) or "timed out" in str(error).lower():
            result["timeouts"] += 1
        try: result["lastRuntimeState"] = client.execute_async(RUNTIME_STATE_SCRIPT)
        except Exception: pass
        return result
    finally:
        try: client.delete_session()
        except Exception: pass
        if process is not None:
            try:
                process.terminate(); process.wait(timeout=10)
            except Exception:
                try: process.kill()
                except Exception: pass


def run(args: argparse.Namespace) -> int:
    args.binary_path = _validate_path(args.binary, "Thunderbird binary", executable=True)
    args.xpi_path = _validate_path(args.xpi, "MailPerch XPI")
    args.geckodriver_path = _validate_path(args.geckodriver, "geckodriver", executable=True)
    output_dir = pathlib.Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    if args.prepare_manual_scope_validation:
        return _prepare_manual_scope_validation(args, output_dir)
    started = time.time()
    results = []
    scope_cases = (("none", ()), ("A-only", ("A",)), ("B-only", ("B",)), ("A-and-C", ("A", "C")), ("A-B-C", ("A", "B", "C")))
    cases = scope_cases if args.scope_validation_only else (("scale", ("A", "B", "C")),)
    for case_name, selected_labels in cases:
        for volume in args.volumes:
            print(f"Thunderbird functional bench: starting {case_name} at {volume} pins", flush=True)
            item = (
                _run_scope_case(args, volume, output_dir, case_name, selected_labels)
                if args.scope_validation_only
                else _run_volume(args, volume, output_dir, selected_labels)
            )
            item["scopeCase"] = case_name
            results.append(item)
            print(
                f"Thunderbird functional bench: {case_name} at {volume} pins -> {item['status']}",
                flush=True,
            )
    report = {
        "status": "passed" if all(item["status"] == "passed" for item in results) else "failed",
        "volumes": list(args.volumes), "startedAt": int(started * 1000),
        "durationMs": int((time.time() - started) * 1000), "results": results,
        "limits": [
            "Visual contrast and clipping still require human inspection of the light/dark screenshots.",
            "Thunderbird internal Dashboard and Options tabs are not exposed as Marionette content handles; only real tab opening is observed externally.",
            "Thunderbird ignores untrusted synthetic XUL menuitem commands, so card-editor mutations remain manual runtime checks.",
            "Agenda actions are inspected only when Thunderbird exposes a writable local calendar; no network calendar is created.",
            "The selected-account scenario requires three offline synthetic POP accounts; it fails explicitly when Thunderbird cannot create them.",
            "The selected-account scenario reuses one exact disposable profile across two distinct Thunderbird processes; it fails explicitly if GeckoDriver substitutes another profile.",
        ],
    }
    _write_json(output_dir / "results.json", report)
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0 if report["status"] == "passed" else 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True)
    parser.add_argument("--xpi", required=True)
    parser.add_argument("--geckodriver", required=True)
    parser.add_argument("--output-dir", default="artifacts/thunderbird-bench")
    parser.add_argument("--timeout", type=float, default=180.0)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--scope-validation-only", action="store_true", help="Run only the real multi-account panel-scope scenario at volume 50.")
    modes.add_argument("--prepare-manual-scope-validation", action="store_true", help="Keep Thunderbird open with a disposable 50-pin, three-account profile for manual validation.")
    parser.add_argument("--volumes", default=",".join(map(str, SUPPORTED_VOLUMES)))
    args = parser.parse_args()
    try: args.volumes = tuple(int(value.strip()) for value in args.volumes.split(",") if value.strip())
    except ValueError as error: parser.error(f"invalid volume list: {error}")
    if not args.volumes or any(value not in SUPPORTED_VOLUMES for value in args.volumes):
        parser.error(f"volumes must be selected from {SUPPORTED_VOLUMES}")
    if args.scope_validation_only or args.prepare_manual_scope_validation:
        args.volumes = (50,)
    return args


if __name__ == "__main__":
    raise SystemExit(run(parse_args()))
