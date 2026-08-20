import { registerUser, loginUser, getUserById } from "../services/authService.js";
import { isValidEmail, isValidUsername, isValidPassword } from "../utils/validation.js";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE_MS } from "../utils/jwt.js";

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true, // JavaScript in the browser can't read this — blocks token theft via XSS
    sameSite: "lax", // sent on normal navigation/same-site requests, blocks most CSRF vectors
    secure: process.env.NODE_ENV === "production", // HTTPS-only once deployed
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  });
}

export async function register(req, res, next) {
  try {
    const { email, username, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }
    if (!isValidUsername(username)) {
      return res
        .status(400)
        .json({ error: "Username must be 3-20 characters: letters, numbers, underscores" });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const { user, token } = await registerUser({ email, username, password });
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { user, token } = await loginUser({ email, password });
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.status(204).send();
}

export async function me(req, res, next) {
  try {
    const user = await getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
