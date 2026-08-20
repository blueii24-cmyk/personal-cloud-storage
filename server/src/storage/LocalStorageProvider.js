import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import StorageProvider from "./StorageProvider.js";
import { StorageNotFoundError } from "./errors.js";

export default class LocalStorageProvider extends StorageProvider {
  constructor(basePath) {
    super();
    // Resolve once, up front, to an absolute path. Every key gets
    // checked against this later to block path traversal.
    this.basePath = path.resolve(basePath);
  }

  // Turns a caller-supplied key into a real, safe filesystem path.
  // This is the single choke point that prevents a key like
  // "../../../etc/passwd" from ever reaching outside this.basePath —
  // every method below routes through here before touching disk.
  #resolveSafePath(key) {
    if (typeof key !== "string" || key.length === 0) {
      throw new Error("Storage key must be a non-empty string");
    }

    const targetPath = path.resolve(this.basePath, key);
    const boundary = this.basePath + path.sep;

    if (!targetPath.startsWith(boundary)) {
      throw new Error(`Invalid storage key: "${key}" resolves outside the storage root`);
    }

    return targetPath;
  }

  async save(key, sourceStream) {
    const targetPath = this.#resolveSafePath(key);
    await fsp.mkdir(path.dirname(targetPath), { recursive: true });
    const writeStream = fs.createWriteStream(targetPath);
    await pipeline(sourceStream, writeStream);
  }

  async createReadStream(key) {
    const targetPath = this.#resolveSafePath(key);
    if (!(await this.exists(key))) {
      throw new StorageNotFoundError(key);
    }
    return fs.createReadStream(targetPath);
  }

  async delete(key) {
    const targetPath = this.#resolveSafePath(key);
    try {
      await fsp.unlink(targetPath);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
      // Already gone — not an error at this layer.
    }
  }

  async exists(key) {
    const targetPath = this.#resolveSafePath(key);
    try {
      await fsp.access(targetPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async move(oldKey, newKey) {
    const oldPath = this.#resolveSafePath(oldKey);
    const newPath = this.#resolveSafePath(newKey);
    await fsp.mkdir(path.dirname(newPath), { recursive: true });

    try {
      await fsp.rename(oldPath, newPath);
    } catch (err) {
      if (err.code === "EXDEV") {
        // Old and new paths are on different filesystems/devices —
        // rename() can't do this atomically there, so fall back to a
        // copy-then-delete.
        await fsp.copyFile(oldPath, newPath);
        await fsp.unlink(oldPath);
      } else {
        throw err;
      }
    }
  }
}
