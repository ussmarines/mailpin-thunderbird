import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const requests = [];
const permissions = [];
let permissionAllowed = true;
let fail = false;
const api = {
  runtime: {sendMessage: async request => { requests.push(request); return fail ? {ok: false, error: "quota"} : {ok: true, result: {ok: true}}; }},
  permissions: {request: async request => { permissions.push(request.permissions); return permissionAllowed; }}
};
const context = vm.createContext({messenger: api});
vm.runInContext(fs.readFileSync(new URL("../extension/native/client.js", import.meta.url), "utf8"), context);
await context.MailPinNative.getDashboardData({search: undefined, view: "list"});
assert.deepEqual(JSON.parse(JSON.stringify(requests.at(-1).args)), [{view: "list"}], "optional undefined fields cannot break startup");
assert.equal(permissions.length, 0, "local views request no optional permission");
await context.MailPinNative.performReferenceAction(["key"], "archive");
await context.MailPinNative.performReferenceAction(["key"], "reply");
await context.MailPinNative.performReferenceAction(["key"], "delete");
assert.deepEqual(JSON.parse(JSON.stringify(permissions)), [["messagesMove"], ["compose"], ["messagesDelete"]]);
permissionAllowed = false;
const before = requests.length;
await assert.rejects(context.MailPinNative.performReferenceAction(["key"], "delete"), /Permission refused/);
assert.equal(requests.length, before, "permission refusal never executes the action");
fail = true;
await assert.rejects(context.MailPinNative.getConfiguration(), /quota/);
assert.equal(context.MailPinNative.onMessages, undefined, "page client has no event injection method");
console.log("PASS native page RPC: optional fields, explicit action permissions/refusal, error propagation, event isolation");
