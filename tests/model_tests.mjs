import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scope = {Date, Math, String, Number, Boolean, Object, Array, Set, Map, JSON};
vm.createContext(scope);
for (const name of ["identity.js", "storage.js", "workflow.js", "rules.js", "calendar.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, "extension/api/pinInbox/modules", name), "utf8"), scope, {filename: name});
}

function header({messageId="", refs=[], threadId=0, gmThread="", subject="", author="a@example.test", date=1, size=10}={}) {
  return {
    messageId, numReferences: refs.length, threadId, date, messageSize: size,
    getStringReference(index){ return refs[index] || ""; },
    getStringProperty(name){
      if (name === "x-gm-thrid") return gmThread;
      if (name === "references") return refs.map(value => `<${value}>`).join(" ");
      return "";
    },
    subject, author
  };
}

const original = header({messageId:"root@example.test", threadId:7, subject:"Facture"});
const reply = header({messageId:"reply@example.test", refs:["root@example.test"], threadId:7, subject:"Re: Facture"});
const unrelated = header({messageId:"other@example.test", threadId:8, subject:"Facture"});
const sigOriginal = scope.PinIdentity.signature(original, "account1", original.subject, original.author);
const sigReply = scope.PinIdentity.signature(reply, "account1", reply.subject, reply.author);
const sigUnrelated = scope.PinIdentity.signature(unrelated, "account1", unrelated.subject, unrelated.author);
assert.equal(scope.PinIdentity.sameConversation(sigOriginal, sigReply), true, "References must link replies");
assert.equal(scope.PinIdentity.sameConversation(sigOriginal, sigUnrelated), false, "Distinct Message-ID/thread must not merge solely by subject");
const sameThreadMissingRefsA = header({messageId:"thread-a@example.test", threadId:99, subject:"Sujet"});
const sameThreadMissingRefsB = header({messageId:"thread-b@example.test", threadId:99, subject:"Re: Sujet"});
assert.equal(scope.PinIdentity.sameConversation(
  scope.PinIdentity.signature(sameThreadMissingRefsA,"account1",sameThreadMissingRefsA.subject,sameThreadMissingRefsA.author),
  scope.PinIdentity.signature(sameThreadMissingRefsB,"account1",sameThreadMissingRefsB.subject,sameThreadMissingRefsB.author)
), true, "Thunderbird threadId should link a thread even when References are unavailable");
assert.equal(scope.PinIdentity.conversationIdentity(reply, "account1", reply.subject), scope.PinIdentity.conversationIdentity(original, "account1", original.subject));

const gmailA = header({messageId:"a", gmThread:"999", subject:"A"});
const gmailB = header({messageId:"b", gmThread:"999", subject:"B"});
assert.equal(scope.PinIdentity.conversationIdentity(gmailA,"g",gmailA.subject), scope.PinIdentity.conversationIdentity(gmailB,"g",gmailB.subject));

const diff = scope.PinStorageHelpers.mapDiff({a:{x:1}, b:{x:2}}, {a:{x:1}, b:{x:3}, c:{x:4}});
assert.deepEqual(JSON.parse(JSON.stringify(diff.upsert)), [["b",{x:3}],["c",{x:4}]]);
assert.deepEqual(JSON.parse(JSON.stringify(diff.remove)), []);
assert.deepEqual(JSON.parse(JSON.stringify(scope.PinStorageHelpers.mapDiff({a:1},{b:2}).remove)), ["a"]);

const inheritedPrevious = Object.create({inherited: {x: 1}});
const inheritedDiff = scope.PinStorageHelpers.mapDiff(inheritedPrevious, {inherited: {x: 1}});
assert.deepEqual(
  JSON.parse(JSON.stringify(inheritedDiff.upsert)),
  [["inherited", {x: 1}]],
  "Inherited properties must never be treated as stored records"
);
const inheritedNext = Object.create({kept: 1});
assert.deepEqual(
  JSON.parse(JSON.stringify(scope.PinStorageHelpers.mapDiff({kept: 1}, inheritedNext).remove)),
  ["kept"],
  "Inherited properties in the next map must not suppress removals"
);
const envelope = scope.PinStorageHelpers.backupEnvelope({refs:{a:{x:1}}}, [], {schemaVersion:5});
assert.equal(scope.PinStorageHelpers.verifyBackupEnvelope(envelope), true);
envelope.data.refs.a.x = 2;
assert.equal(scope.PinStorageHelpers.verifyBackupEnvelope(envelope), false, "Backup checksum must detect corruption");

const monday = new Date("2026-08-03T10:00:00Z").getTime();
assert.equal(new Date(scope.PinWorkflow.nextOccurrence(monday,"weekly",2)).toISOString(), "2026-08-17T10:00:00.000Z");
assert.equal(new Date(scope.PinWorkflow.nextOccurrence(new Date("2026-08-07T10:00:00Z").getTime(),"weekdays",1)).toISOString(), "2026-08-10T10:00:00.000Z");
assert.equal(new Date(scope.PinWorkflow.nextOccurrence(new Date("2026-01-31T10:00:00Z").getTime(),"monthly",1)).getUTCMonth(), 1);
const oldDaily = new Date("2026-07-01T10:00:00Z").getTime();
const futureDaily = scope.PinWorkflow.nextFutureOccurrence(oldDaily,"daily",1,new Date("2026-07-30T10:00:00Z").getTime());
assert.equal(futureDaily > new Date("2026-07-30T10:00:00Z").getTime(), true, "Recurring work must advance beyond now");

const veryOldDaily = new Date("2010-01-01T10:00:00Z").getTime();
const currentDaily = new Date("2026-07-30T10:00:00Z").getTime();
assert.equal(
  scope.PinWorkflow.nextFutureOccurrence(veryOldDaily, "daily", 1, currentDaily) > currentDaily,
  true,
  "Fixed recurrences must jump beyond now even after more than 1000 occurrences"
);
const protectedArchive = scope.PinWorkflow.archiveRecord(
  {stableKey: "original", subject: "Subject", pinnedAt: 1},
  "completed",
  {id: "forged", stableKey: "forged", action: "forged", custom: "preserved"}
);
assert.notEqual(protectedArchive.id, "forged");
assert.equal(protectedArchive.stableKey, "original");
assert.equal(protectedArchive.action, "completed");
assert.equal(protectedArchive.custom, "preserved");

const rules = [
  {id:"b", enabled:true, priority:200, accountKey:"", folderURI:"", senderContains:"", subjectContains:"facture", tagKey:""},
  {id:"a", enabled:true, priority:100, accountKey:"acc", folderURI:"folder", senderContains:"client", subjectContains:"", tagKey:"important"}
];
assert.equal(scope.PinRules.ordered(rules)[0].id, "a");
assert.equal(scope.PinRules.matches({accountKey:"acc",folderURI:"folder",sender:"Client X",subject:"Bonjour",tags:["important"]}, rules[1]).matched, true);
assert.equal(scope.PinRules.matches({accountKey:"acc",folderURI:"other",sender:"Client X",subject:"Bonjour",tags:["important"]}, rules[1]).matched, false);
assert.equal(scope.PinRules.rateAllowed([1000,2000],2,3000).allowed, false);

const item = {getProperty(name){return name === "X-PIN-MAILS-STABLE-KEY" ? "stable" : name === "X-PIN-MAILS-CASE-ID" ? "case" : "";}, dueDate:{jsDate:new Date(1234)}, percentComplete:100};
assert.equal(scope.PinCalendarHelpers.itemStableKey(item), "stable");
assert.equal(scope.PinCalendarHelpers.itemCaseId(item), "case");
assert.equal(scope.PinCalendarHelpers.itemDueAt(item), 1234);
assert.equal(scope.PinCalendarHelpers.itemCompleted(item), true);

console.log("Model tests 3.2.5: OK");
