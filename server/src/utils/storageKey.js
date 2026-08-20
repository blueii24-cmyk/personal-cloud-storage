import { randomUUID } from "node:crypto";
import path from "node:path";

// The storage key is completely unrelated to the file's display name —
// that's what makes it safe to write to disk. We keep the extension
// (useful for debugging/inspecting the storage folder) but only if it
// looks like a normal extension; anything else is dropped rather than
// risking it in a filesystem path.
export function generateStorageKey(userId, originalFilename) {
  const rawExt = path.extname(originalFilename || "");
  const ext = /^\.[a-zA-Z0-9]{1,10}$/.test(rawExt) ? rawExt.toLowerCase() : "";
  return `users/${userId}/files/${randomUUID()}${ext}`;
}
