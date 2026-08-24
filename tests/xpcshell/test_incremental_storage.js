/* Thunderbird XPCShell blueprint for the privileged SQLite store. */
"use strict";

add_task(async function test_incremental_upsert_preserves_unmodified_rows() {
  const store = await createPinStructuredStoreForTest();
  await store.save(makeData({a:{subject:"A"},b:{subject:"B"}}), [], "seed");
  const before = await store.connection.execute("SELECT updated_at FROM refs WHERE stable_key='a'");
  await store.save(makeData({a:{subject:"A"},b:{subject:"B2"}}), [], "update-b");
  const after = await store.connection.execute("SELECT updated_at FROM refs WHERE stable_key='a'");
  Assert.equal(after[0].getResultByIndex(0), before[0].getResultByIndex(0), "unchanged row is not rewritten");
  Assert.ok((await store.integrityCheck()).ok, "database remains valid");
});
