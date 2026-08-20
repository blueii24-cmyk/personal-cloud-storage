import { verifyAuthToken, AUTH_COOKIE_NAME } from "../utils/jwt.js";

// Attach this to any route that requires a logged-in user.
// On success it sets req.userId; on failure it responds 401 directly
// (the route handler never runs).
export function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = verifyAuthToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
