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
  const sanitized = sanitizeFileName(originalName);

  // Enforce duplicate-name rule: no file/folder with same name under the
  // same parent may already exist.
  const existing = await prisma.file.findFirst({
    where: {
      ownerId: userId,
      parentFolderId: parentFolderId || null,
      name: sanitized,
      deletedAt: null,
    },
  });
  if (existing) {
    // Clean up temp file and return a user-friendly error.
    await fsp.unlink(tempPath).catch(() => {});
    const err = new Error("An item with that name already exists in the target folder");
    err.status = 409;
    throw err;
  }

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
      name: sanitized,
      storageKey: key,
      mimeType: mimeType || "application/octet-stream",
      size,
      isFolder: false,
    },
  });
}

// Creates a folder record. Parent validation must be done by caller.
export async function createFolder({ userId, parentFolderId, name }) {
  const sanitized = sanitizeFileName(name);
  const existing = await prisma.file.findFirst({
    where: {
      ownerId: userId,
      parentFolderId: parentFolderId || null,
      name: sanitized,
      deletedAt: null,
    },
  });
  if (existing) {
    const err = new Error("An item with that name already exists in the target folder");
    err.status = 409;
    throw err;
  }

  return prisma.file.create({
    data: {
      ownerId: userId,
      parentFolderId: parentFolderId || null,
      name: sanitized,
      isFolder: true,
    },
  });
}

// Renames a file or folder, enforcing duplicate-name and deleted-item rules.
export async function renameFile({ userId, fileId, newName }) {
  const file = await getOwnedFile(userId, fileId);
  if (!file) {
    const err = new Error("File not found");
    err.status = 404;
    throw err;
  }
  if (file.deletedAt) {
    const err = new Error("Cannot rename deleted items");
    err.status = 400;
    throw err;
  }

  const sanitized = sanitizeFileName(newName);
  // Duplicate check within same parent
  const existing = await prisma.file.findFirst({
    where: {
      ownerId: userId,
      parentFolderId: file.parentFolderId || null,
      name: sanitized,
      deletedAt: null,
      NOT: { id: fileId },
    },
  });
  if (existing) {
    const err = new Error("An item with that name already exists in the target folder");
    err.status = 409;
    throw err;
  }

  return prisma.file.update({ where: { id: fileId }, data: { name: sanitized } });
}

// Moves a file or folder to a different parent folder. Enforces ownership,
// duplicate-name rules, deleted-item rules, and prevents moving a folder
// into itself or one of its descendants.
export async function moveFile({ userId, fileId, destinationParentId }) {
  const file = await getOwnedFile(userId, fileId);
  if (!file) {
    const err = new Error("File not found");
    err.status = 404;
    throw err;
  }
  if (file.deletedAt) {
    const err = new Error("Cannot move deleted items");
    err.status = 400;
    throw err;
  }

  // Null destination means root
  const destId = destinationParentId || null;

  // Validate destination parent if provided (checks ownership and isFolder)
  await assertValidParentFolder(userId, destId);

  // Prevent moving into the same parent (no-op) — allow but return the updated record
  if (file.parentFolderId === destId) {
    return file;
  }

  // Duplicate name check in destination
  const existing = await prisma.file.findFirst({
    where: {
      ownerId: userId,
      parentFolderId: destId,
      name: file.name,
      deletedAt: null,
      NOT: { id: fileId },
    },
  });
  if (existing) {
    const err = new Error("An item with that name already exists in the target folder");
    err.status = 409;
    throw err;
  }

  // If moving a folder, ensure destination is not a descendant of it (would create a cycle)
  if (file.isFolder && destId) {
    let current = destId;
    while (current) {
      if (current === fileId) {
        const err = new Error("Cannot move a folder into itself or its descendant");
        err.status = 400;
        throw err;
      }
      const parent = await prisma.file.findUnique({ where: { id: current } });
      current = parent ? parent.parentFolderId : null;
    }
  }

  return prisma.file.update({ where: { id: fileId }, data: { parentFolderId: destId } });
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
