import LocalStorageProvider from "./LocalStorageProvider.js";

// Everywhere else in the app imports THIS file (never LocalStorageProvider
// or, later, S3StorageProvider directly). Which concrete provider you get
// is decided once, here, from an environment variable.

const providerType = process.env.STORAGE_PROVIDER || "local";

let storage;

if (providerType === "local") {
  storage = new LocalStorageProvider(process.env.LOCAL_STORAGE_PATH || "../storage");
} else if (providerType === "s3") {
  // Planned for Phase 13. Swapping in will look like:
  //   import S3StorageProvider from "./S3StorageProvider.js";
  //   storage = new S3StorageProvider({ ...S3 config from env... });
  // No other file in the app will need to change.
  throw new Error('STORAGE_PROVIDER=s3 is not implemented yet (planned for Phase 13).');
} else {
  throw new Error(`Unknown STORAGE_PROVIDER: "${providerType}"`);
}

export default storage;
