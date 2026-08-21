import { api } from "./api.js";

export function register({ email, username, password }) {
  return api.post("/auth/register", { email, username, password });
}

export function login({ email, password }) {
  return api.post("/auth/login", { email, password });
}

export function logout() {
  return api.post("/auth/logout");
}

export function fetchCurrentUser() {
  return api.get("/auth/me");
}
