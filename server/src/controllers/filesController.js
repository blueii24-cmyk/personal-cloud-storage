import * as fileService from "../services/fileService.js";
import storage from "../storage/index.js";
import { contentDispositionHeader } from "../utils/http.js";

export async function listFiles(req, res, next) {
  try {
    const parentFolderId = req.query.parentFolderId || null;
    const files = await fileService.listFiles({ userId: req.userId, parentFolderId });
    res.json({ files });
  } catch (err) {
    next(err);
  }
}

export async function uploadFiles(req, res, next) {
  try {
    const parentFolderId = req.body.parentFolderId || null;
    await fileService.assertValidParentFolder(req.userId, parentFolderId);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded (use the "files" field)' });
    }

    const created = [];
    for (const uploadedFile of req.files) {
      const record = await fileService.saveUploadedFile({
        userId: req.userId,
        parentFolderId,
        tempPath: uploadedFile.path,
        originalName: uploadedFile.originalname,
        mimeType: uploadedFile.mimetype,
        size: uploadedFile.size,
      });
      created.push(record);
    }

    res.status(201).json({ files: created });
  } catch (err) {
    next(err);
  }
}

export async function createFolder(req, res, next) {
  try {
    const parentFolderId = req.body.parentFolderId || null;
    const name = req.body.name;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Folder name is required" });
    }
    await fileService.assertValidParentFolder(req.userId, parentFolderId);
    const folder = await fileService.createFolder({ userId: req.userId, parentFolderId, name });
    res.status(201).json({ folder });
  } catch (err) {
    next(err);
  }
}

export async function renameFile(req, res, next) {
  try {
    const fileId = req.params.id;
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "New name is required" });
    }
    const updated = await fileService.renameFile({ userId: req.userId, fileId, newName: name });
    res.json({ file: updated });
  } catch (err) {
    next(err);
  }
}

export async function moveFile(req, res, next) {
  try {
    const fileId = req.params.id;
    const destinationParentId = req.body.destinationParentId || null;
    // destinationParentId may be null (root) or a folder id
    const updated = await fileService.moveFile({ userId: req.userId, fileId, destinationParentId });
    res.json({ file: updated });
  } catch (err) {
    next(err);
  }
}

export async function getFile(req, res, next) {
  try {
    const file = await fileService.getOwnedFile(req.userId, req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json({ file });
  } catch (err) {
    next(err);
  }
}

export async function downloadFile(req, res, next) {
  try {
    const file = await fileService.getOwnedFile(req.userId, req.params.id);
    if (!file || file.isFolder) {
      return res.status(404).json({ error: "File not found" });
    }

    const stream = await storage.createReadStream(file.storageKey);

    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", contentDispositionHeader(file.name));
    if (file.size) res.setHeader("Content-Length", String(file.size));

    // Stream straight to the response — the file is never fully loaded
    // into server memory, no matter how large it is.
    stream.on("error", next);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

export async function deleteFile(req, res, next) {
  try {
    const updated = await fileService.softDeleteFile(req.userId, req.params.id);
    if (!updated) return res.status(404).json({ error: "File not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
