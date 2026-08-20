// Small, dependency-free validators. Nothing fancy — just enough to
// reject obviously bad input before it reaches the database.

export function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUsername(username) {
  // 3-20 characters: letters, numbers, underscores only.
  return typeof username === "string" && /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8;
}

// Strips path separators/control characters from a user-supplied
// filename before it's stored as a display name in the database. This
// is separate from (and in addition to) the storage key, which never
// uses the original filename at all.
export function sanitizeFileName(name) {
  if (typeof name !== "string") return "untitled";
  const cleaned = name
    .replace(/[/\\]/g, "")
    .replace(/[\x00-\x1f]/g, "")
    .trim();
  return cleaned.slice(0, 255) || "untitled";
}
