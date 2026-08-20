export class StorageNotFoundError extends Error {
  constructor(key) {
    super(`Storage key not found: ${key}`);
    this.name = "StorageNotFoundError";
    this.status = 404;
  }
}
