import bcrypt from "bcryptjs";
import prisma from "../database/client.js";
import { signAuthToken } from "../utils/jwt.js";

const SALT_ROUNDS = 12;

export async function registerUser({ email, username, password }) {
  // Check both fields separately so we can give a specific, useful error.
  // (Unlike login, telling someone "that email is taken" during
  // registration isn't a meaningful privacy leak.)
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    const err = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    const err = new Error("Username already in use");
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  });

  const token = signAuthToken({ userId: user.id });
  return { user: toPublicUser(user), token };
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Same error message whether the email doesn't exist or the password
  // is wrong — otherwise the endpoint would let someone probe which
  // emails are registered.
  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const token = signAuthToken({ userId: user.id });
  return { user: toPublicUser(user), token };
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? toPublicUser(user) : null;
}

// Strips passwordHash before anything gets sent to the client.
function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}
