"""Black-box native candidate smoke in a disposable profile, never user data.

Chrome scripts only provision/observe the test client. Product operations use
native keyboard commands and the shipped page RPC, never a test-only API.
"""
from __future__ import annotations
import json
import hashlib
import pathlib
import subprocess
import tempfile
import time
from real_smoke import (ADDON_ID, WebDriverClient, SmokeFailure, _free_port, _validate_path,
    PROVISION_MAIL_VIEW_SCRIPT, RUNTIME_STATE_SCRIPT, _write_json)
from functional_bench import _new_session_with_profile

SEED = r"""
const done=arguments[arguments.length-1];
(async()=>{
 const {MailServices}=ChromeUtils.importESModule('resource:///modules/MailServices.sys.mjs');
 Services.io.offline=true;
 Services.prefs.setBoolPref('mailnews.mark_message_read.auto',false);
 Services.prefs.setBoolPref('network.manage-offline-status',false);
 const folder=MailServices.accounts.localFoldersServer.rootFolder.getChildNamed('MailPin Smoke');
 if(!folder.getTotalMessages(false)) {
  folder.QueryInterface(Components.interfaces.nsIMsgLocalMailFolder).addMessage([
   'From - Sat Oct 03 12:00:00 2026','X-Mozilla-Status: 0000','X-Mozilla-Status2: 00000000',
   'Message-ID: <mailpin-native-smoke@test.invalid>','From: Sender <sender@test.invalid>',
   'To: Owner <owner@test.invalid>','Date: Sat, 3 Oct 2026 12:00:00 +0200',
   'Subject: MailPin Native Smoke','Content-Type: text/plain; charset=utf-8','','Synthetic smoke message.',''
  ].join('\r\n'));
 }
 const win=Services.wm.getMostRecentWindow('mail:3pane');
 try{win.document.querySelector('account-hub-container')?.modal?.close();}catch{}
 const pane=win.document.getElementById('tabmail').currentAbout3Pane;
 pane.displayFolder(folder);
 await new Promise(resolve=>win.setTimeout(resolve,800));
 pane.threadTree.selectedIndex=0;
 pane.threadTree.focus();
 const hdr=Array.from(folder.messages)[0];
 done({messageId:hdr.messageId,read:hdr.isRead,total:folder.getTotalMessages(false),unread:folder.getNumUnread(false)});
})().catch(error=>done({__mailperchSmokeError:String(error.stack||error)}));
"""

OPEN_PAGE = r"""
const done=arguments[arguments.length-1];
(async()=>{
 const {ExtensionParent}=ChromeUtils.importESModule('resource://gre/modules/ExtensionParent.sys.mjs');
 const extension=ExtensionParent.GlobalManager.getExtension('ussmarines.mailpin@addons.thunderbird.net');
 if(!extension)throw new Error('Extension inactive');
 const win=Services.wm.getMostRecentWindow('mail:3pane');
 const tabmail=win.document.getElementById('tabmail');
 const path=typeof arguments[0]==='string'?arguments[0]:'dashboard/dashboard.html';
 const url=extension.baseURI.resolve(path);
 let tab=tabmail.tabInfo.find(tab=>tab.browser?.currentURI?.spec===url);
 if(!tab)tab=tabmail.openTab('contentTab',{url});
 tabmail.switchToTab(tab);
 const deadline=Date.now()+15000;
 while(Date.now()<deadline){
  const global=tab.browser.browsingContext?.currentWindowGlobal;
  if(global&&tab.browser.currentURI?.spec.split('#')[0]===url){
   const actor=global.getActor('MarionetteCommands');
   done(await actor.executeScript(arguments[1],[],{async:true,timeout:20000}));return;
  }
  await new Promise(r=>win.setTimeout(r,100));
 }
 throw new Error('Remote native page unavailable');
})().catch(error=>done({__mailperchSmokeError:String(error.message||error)+'\n'+String(error.stack||'')}));
"""

PAGE = r"""
const done=arguments[arguments.length-1];
(async()=>{
 const path=location.pathname;
 const deadline=Date.now()+15000;
 while(Date.now()<deadline){
  const page=window.wrappedJSObject || window;
  if(page?.MailPinNative){
   if(path.includes('options/')&&!page.document.body.hasAttribute('data-configuration-ready')) {await new Promise(r=>setTimeout(r,100));continue;}
   if(path.includes('dashboard/')&&page.document.body.hasAttribute('data-loading')) {await new Promise(r=>setTimeout(r,100));continue;}
   const data=await page.MailPinNative.getDashboardData(JSON.parse('{"filter":"all","view":"list","smartView":"all"}'));
   const config=await page.MailPinNative.getConfiguration();
   done({items:JSON.parse(JSON.stringify(data.items)),settings:JSON.parse(JSON.stringify(config.settings)),
    ready:page.document.readyState,optionsReady:page.document.body.hasAttribute('data-configuration-ready'),
    hasWorkbench:!!page.document.getElementById('import-file'),spaceCount:(await page.messenger.spaces.query({name:'MailPin',isSelfOwned:true})).length,
    fatalVisible:!!page.document.getElementById('fatal-error')&&!page.document.getElementById('fatal-error').hidden,
    text:page.document.body.textContent.slice(0,1000)});return;
  }
  await new Promise(r=>setTimeout(r,100));
 }
 throw new Error('Native page did not initialize: '+path);
})().catch(error=>done({__mailperchSmokeError:String(error.message||error)+'\n'+String(error.stack||'')}));
"""

SELECT_MAIL = r"""
const done=arguments[arguments.length-1];
const win=Services.wm.getMostRecentWindow('mail:3pane');
const tabmail=win.document.getElementById('tabmail');
const mail=tabmail.tabInfo.find(tab=>tab.mode?.name==='mail3PaneTab');
if(!mail){done({__mailperchSmokeError:'Mail tab missing'});}else{
 tabmail.switchToTab(mail); const pane=tabmail.currentAbout3Pane;
 pane.threadTree.selectedIndex=0;pane.threadTree.focus();done({selected:pane.threadTree.selectedIndex});
}
"""
COUNTERS = r"""
const done=arguments[arguments.length-1];
const {MailServices}=ChromeUtils.importESModule('resource:///modules/MailServices.sys.mjs');
const folder=MailServices.accounts.localFoldersServer.rootFolder.getChildNamed('MailPin Smoke');
const hdr=Array.from(folder.messages)[0];
done({read:hdr.isRead,total:folder.getTotalMessages(false),unread:folder.getNumUnread(false),keywords:hdr.getStringProperty('keywords')});
"""

WORKBENCH_IMPORT = r"""
const done=arguments[arguments.length-1];
(async()=>{
 const page=window.wrappedJSObject||window;
 const backup=await page.MailPinNative.exportConfiguration();
 const keys=Object.keys(backup.data.refs);
 if(keys.length!==1)throw new Error('Expected one synthetic reference');
 backup.data.refs[keys[0]].note='Native smoke migration note';
 backup.data.refs[keys[0]].updatedAt=Date.now()+1000;
 const transfer=new page.DataTransfer();
 transfer.items.add(new page.File([JSON.stringify(backup)],'smoke-backup.json',{type:'application/json'}));
 const input=page.document.getElementById('import-file');
 input.files=transfer.files;input.dispatchEvent(new page.Event('change',{bubbles:true}));
 const deadline=Date.now()+10000;
 while(page.document.getElementById('merge').disabled&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));
 if(page.document.getElementById('merge').disabled)throw new Error('Preview did not enable merge');
 page.document.getElementById('merge').click();
 while(!page.document.getElementById('merge').disabled&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));
 const after=await page.MailPinNative.exportConfiguration();
 if(after.data.refs[keys[0]].note!=='Native smoke migration note')throw new Error('Workbench roundtrip lost note');
 done({notePreserved:true,preview:JSON.parse(page.document.getElementById('preview').textContent).valid,
       automationDisabled:after.settings.enableAutomaticRules===false});
})().catch(error=>done({__mailperchSmokeError:String(error.message||error)}));
"""

OPEN_SPACE = r"""
const done=arguments[arguments.length-1];
(window.wrappedJSObject||window).document.getElementById('dashboard').click();
done({requested:true});
"""

SPACE_VISIBLE = r"""
const done=arguments[arguments.length-1];
(async()=>{
 const win=Services.wm.getMostRecentWindow('mail:3pane');
 const tabmail=win.document.getElementById('tabmail');
 const deadline=Date.now()+10000;
 while(Date.now()<deadline){
  const url=tabmail.currentTabInfo?.browser?.currentURI?.spec||'';
  if(url.includes('/dashboard/dashboard.html')){done({dashboardVisible:true});return;}
  await new Promise(r=>win.setTimeout(r,50));
 }
 done({__mailperchSmokeError:'Native Space did not become visible'});
})();
"""

RUNTIME_ERRORS = r"""
const done=arguments[arguments.length-1];
done(Services.console.getMessageArray().filter(item=>
 item instanceof Components.interfaces.nsIScriptError &&
 item.sourceName?.startsWith('moz-extension://') && !(item.flags&1)
).map(item=>({message:item.errorMessage,source:item.sourceName,line:item.lineNumber})));
"""

def key_pin(client):
    client.execute_async(SELECT_MAIL)
    client.request("POST", client._session_path("/actions"), {"actions": [{"type": "key", "id": "native-command",
        "actions": [{"type": "keyDown", "value": "\ue00a"}, {"type": "keyDown", "value": "p"},
                    {"type": "keyUp", "value": "p"}, {"type": "keyUp", "value": "\ue00a"}]}]})

def read_page(client, path="dashboard/dashboard.html", script=PAGE):
    client.set_context("chrome")
    return client.execute_async(OPEN_PAGE,[path,script])

def wait_page(client, count, timeout):
    deadline=time.monotonic()+timeout
    last=None
    while time.monotonic()<deadline:
        last=read_page(client)
        if len(last.get("items", []))==count:return last
        time.sleep(.3)
    raise SmokeFailure(f"Native pin count expected {count}, observed {last}")

def run(args):
    binary=_validate_path(args.binary,"Thunderbird", executable=True)
    xpi=_validate_path(args.xpi,"XPI")
    driver=_validate_path(args.geckodriver,"geckodriver", executable=True)
    output=pathlib.Path(args.output_dir).resolve();output.mkdir(parents=True,exist_ok=True)
    result={"status":"failed","architecture":"native-zero-experiment","checks":[],
            "xpiSha256":hashlib.sha256(xpi.read_bytes()).hexdigest()}
    port=_free_port();client=WebDriverClient("127.0.0.1",port,timeout=max(30,args.timeout))
    process=None
    with tempfile.TemporaryDirectory(prefix="mailpin-native-smoke-") as directory:
      profile=pathlib.Path(directory)/"profile";profile.mkdir()
      try:
       with (output/"geckodriver.log").open("w",encoding="utf-8") as log:
        process=subprocess.Popen([str(driver),"--host","127.0.0.1","--port",str(port),"--allow-system-access","--log","info"],stdout=log,stderr=subprocess.STDOUT)
        client.wait_ready(time.monotonic()+args.timeout)
        result["capabilities"]=_new_session_with_profile(client,binary,profile)
        assert result["capabilities"]["browserVersion"]=="157.0.1"
        client.set_context("chrome")
        client.execute_async(PROVISION_MAIL_VIEW_SCRIPT)
        result["before"]=client.execute_async(SEED)
        client.install_addon(xpi,temporary=False)
        first=wait_page(client,0,args.timeout)
        assert first["spaceCount"]==1 and not first["fatalVisible"]
        result["checks"].extend(["install-activate-native-MV3","one-native-space","dashboard-startup"])
        key_pin(client)
        result["pinned"]=wait_page(client,1,args.timeout)
        after=client.execute_async(COUNTERS)
        assert all(after[key]==result["before"][key] for key in ("read","total","unread")), (result["before"],after)
        assert "mailpin-native-followup" in after["keywords"]
        result["checks"].extend(["native-Alt-P-pin","read-and-counters-unchanged","native-tag-feedback"])
        result["options"]=read_page(client,"options/options.html")
        assert result["options"]["optionsReady"] is True
        read_page(client,"options/options.html",OPEN_SPACE)
        result["openedSpace"]=client.execute_async(SPACE_VISIBLE)
        assert result["openedSpace"]["dashboardVisible"]
        result["checks"].append("options-opens-native-space-via-background")
        result["workbench"]=read_page(client,"workbench/workbench.html")
        assert result["workbench"]["hasWorkbench"]
        result["checks"].extend(["options-initialized","workbench-initialized"])
        result["workbenchImport"]=read_page(client,"workbench/workbench.html",WORKBENCH_IMPORT)
        assert result["workbenchImport"]["notePreserved"] and result["workbenchImport"]["automationDisabled"]
        result["checks"].append("workbench-file-preview-merge-preserves-note")
        screenshot=client.full_screenshot()
        if screenshot:(output/"native-installed.png").write_bytes(screenshot)
        client.delete_session()
        _new_session_with_profile(client,binary,profile)
        client.set_context("chrome")
        result["restart"]=wait_page(client,1,args.timeout)
        assert result["restart"]["items"][0]["note"]=="Native smoke migration note"
        result["checks"].append("persistent-pin-after-real-process-restart")
        key_pin(client)
        wait_page(client,0,args.timeout)
        unpinned=client.execute_async(COUNTERS)
        assert "mailpin-native-followup" not in unpinned["keywords"]
        assert all(unpinned[key]==result["before"][key] for key in ("read","total","unread"))
        result["checks"].append("native-unpin-cleans-owned-tags-only")
        client.uninstall_addon(ADDON_ID)
        state=client.execute_async(RUNTIME_STATE_SCRIPT)
        assert not state.get("extensionInternals"),state
        result["checks"].append("uninstall-removes-extension-runtime")
        client.install_addon(xpi,temporary=False)
        reinstalled=wait_page(client,0,args.timeout)
        assert reinstalled["spaceCount"]==1
        result["checks"].append("clean-reinstall-with-no-duplicate-space")
        result["runtimeErrors"]=client.execute_async(RUNTIME_ERRORS)
        assert not result["runtimeErrors"],result["runtimeErrors"]
        result["checks"].append("no-extension-runtime-script-errors")
        result["status"]="passed"
        print("Real Thunderbird native smoke: PASS")
        return 0
      except Exception as error:
        result["error"]=f"{type(error).__name__}: {error}"
        try:result["lastRuntimeState"]=client.execute_async(RUNTIME_STATE_SCRIPT)
        except Exception:pass
        screenshot=client.full_screenshot()
        if screenshot:(output/"native-failure.png").write_bytes(screenshot)
        print("Real Thunderbird native smoke: FAIL",result["error"])
        return 1
      finally:
        _write_json(output/"result.json",result)
        try:client.delete_session()
        except Exception:pass
        if process:
          process.terminate()
          try:process.wait(timeout=10)
          except subprocess.TimeoutExpired:process.kill();process.wait()
