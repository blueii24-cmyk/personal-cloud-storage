// Manual sanity check for the storage provider — not part of the running
// app, just a quick way to confirm save/read/move/delete all work before
// we wire this into real upload/download endpoints in Phase 5.
//
// Run from inside server/:
//   npm run test:storage

import { Readable } from "node:stream";
import storage from "../src/storage/index.js";

async function main() {
  const key = "users/test-user/files/hello.txt";
  const movedKey = "users/test-user/files/hello-renamed.txt";

  console.log("1. Saving a test file...");
  await storage.save(key, Readable.from(["Hello from the storage provider!"]));
  console.log("   saved.");

  console.log("2. Checking it exists...");
  console.log("   exists:", await storage.exists(key));

  console.log("3. Reading it back...");
  const stream = await storage.createReadStream(key);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  console.log("   content:", Buffer.concat(chunks).toString());

  console.log("4. Moving it...");
  await storage.move(key, movedKey);
  console.log("   old key exists:", await storage.exists(key));
  console.log("   new key exists:", await storage.exists(movedKey));

  console.log("5. Rejecting a path-traversal key...");
  try {
    await storage.exists("../../etc/passwd");
    console.log("   PROBLEM: traversal key was not rejected!");
  } catch (err) {
    console.log("   correctly rejected:", err.message);
  }

  console.log("6. Deleting it...");
  await storage.delete(movedKey);
  console.log("   exists after delete:", await storage.exists(movedKey));

  console.log("\nAll storage provider checks passed.");
}

main().catch((err) => {
  console.error("Storage test failed:", err);
  process.exit(1);
});
