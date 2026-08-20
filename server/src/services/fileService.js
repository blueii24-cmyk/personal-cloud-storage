import fs from "node:fs";
import fsp from "node:fs/promises";
import prisma from "../database/client.js";
import storage from "../storage/index.js";
import { generateStorageKey } from "../utils/storageKey.js";
import { sanitizeFileName } from "../utils/validation.js";

export async function listFiles({ userId, parentFolderId }) {
  return prisma.file.findMany({
    where: {
      ownerId: userId,
      parentFolderId: parentFolderId ?? null,
      deletedAt: null,
    },
    // Folders first, then alphabetical — matches how most file browsers sort.
    orderBy: [{ isFolder: "desc" }, { name: "asc" }],
  });
}

// Fetches a file/folder only if it exists, isn't in the trash, and is
// owned by this user. Every other function in this file (and the
// controller) uses this instead of prisma.file.findUnique directly, so
// there's exactly one place that enforces "you can only touch your own
// files."
export async function getOwnedFile(userId, fileId) {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file || file.ownerId !== userId || file.deletedAt) return null;
  return file;
}

export async function assertValidParentFolder(userId, parentFolderId) {
  if (!parentFolderId) return; // null/undefined = root, always valid
  const folder = await getOwnedFile(userId, parentFolderId);
  if (!folder || !folder.isFolder) {
    const err = new Error("Invalid parent folder");
    err.status = 400;
    throw err;
  }
}

// Moves an uploaded temp file into permanent storage and records it in
// the database. Always cleans up the temp file, even on failure.
export async function saveUploadedFile({
  userId,
  parentFolderId,
  tempPath,
  originalName,
  mimeType,
  size,
}) {
  const key = generateStorageKey(userId, originalName);

  try {
    const sourceStream = fs.createReadStream(tempPath);
    await storage.save(key, sourceStream);
  } finally {
    await fsp.unlink(tempPath).catch(() => {});
  }

  return prisma.file.create({
    data: {
      ownerId: userId,
      parentFolderId: parentFolderId || null,
      name: sanitizeFileName(originalName),
      storageKey: key,
      mimeType: mimeType || "application/octet-stream",
      size,
      isFolder: false,
    },
  });
}

// Soft delete: sets deletedAt. The bytes in storage are untouched —
// permanent deletion is a separate operation, added in Phase 9.
export async function softDeleteFile(userId, fileId) {
  const file = await getOwnedFile(userId, fileId);
  if (!file) return null;
  return prisma.file.update({
    where: { id: fileId },
    data: { deletedAt: new Date() },
  });
}
