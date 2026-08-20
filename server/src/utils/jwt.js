import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET;
const EXPIRES_IN = "7d";

export const AUTH_COOKIE_NAME = "auth_token";
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — keep in sync with EXPIRES_IN above

export function signAuthToken(payload) {
  if (!SECRET) {
    throw new Error(
      "SESSION_SECRET is not set. Add one to your .env file (see .env.example)."
    );
  }
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, SECRET);
}
