// The contract every storage provider must satisfy. LocalStorageProvider
// implements this against the filesystem; a future S3StorageProvider
// will implement the exact same methods against object storage.
//
// Nothing outside server/src/storage/ should ever import a concrete
// provider directly — always import the singleton from
// server/src/storage/index.js, so swapping providers never requires
// touching calling code.
//
// Keys are opaque strings (not real filesystem paths) — think of them
// the way S3 thinks of object keys. A typical key looks like:
//   users/<userId>/files/<uuid>.<ext>
// The database, not the storage provider, decides what a key "means"
// (which user owns it, what folder it's logically in, its display
// name). The provider just moves bytes around.

export default class StorageProvider {
  /**
   * Write a stream's contents to the given key. Overwrites if it
   * already exists. Creates any needed intermediate structure.
   * @param {string} key
   * @param {NodeJS.ReadableStream} sourceStream
   */
  async save(key, sourceStream) {
    throw new Error("save() not implemented");
  }

  /**
   * Get a readable stream of the bytes at `key`. Throws
   * StorageNotFoundError if the key doesn't exist.
   * @param {string} key
   * @returns {Promise<NodeJS.ReadableStream>}
   */
  async createReadStream(key) {
    throw new Error("createReadStream() not implemented");
  }

  /**
   * Permanently remove the bytes at `key`. Should NOT throw if the key
   * is already gone — deleting something twice isn't an error here.
   * @param {string} key
   */
  async delete(key) {
    throw new Error("delete() not implemented");
  }

  /**
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    throw new Error("exists() not implemented");
  }

  /**
   * Move/rename bytes from one key to another.
   * @param {string} oldKey
   * @param {string} newKey
   */
  async move(oldKey, newKey) {
    throw new Error("move() not implemented");
  }

  /**
   * Return a direct URL for downloading this key, if the provider can
   * offer one (e.g. an S3 pre-signed URL). Local storage never exposes
   * files directly (see README, "Do not expose the storage directory
   * directly through the web server") — downloads always go through
   * the authenticated /api/files/:id/download route instead — so the
   * default implementation returns null, and LocalStorageProvider
   * doesn't override it.
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async getUrl(key) {
    return null;
  }
}
