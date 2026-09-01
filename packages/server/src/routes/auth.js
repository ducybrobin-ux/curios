/* routes/auth.js — Endpoints /api/auth/login, /api/auth/logout, /api/auth/me
 *
 * Authentification de l'organisateur.
 */
import { sendJson, sendOk, sendError, readBody, parseJson } from "../http.js";

export function handleLogin(method, req, res, auth, state) {
  if (method !== "POST") return sendError(res, 405, "method-not-allowed");

  return handleLoginPost(req, res, auth, state);
}

async function handleLoginPost(req, res, auth, state) {
  const body = await readBody(req);
  const payload = parseJson(body);

  if (!payload || !payload.password) {
    return sendError(res, 400, "missing-password");
  }

  if (!auth.hasPassword()) {
    // Premier login : définir le mot de passe
    auth.savePassword(payload.password);
    const token = auth.createSession(req.socket.remoteAddress);
    return sendOk(res, { token, firstLogin: true });
  }

  if (!auth.checkPassword(payload.password)) {
    return sendError(res, 401, "invalid-password");
  }

  const token = auth.createSession(req.socket.remoteAddress);
  return sendOk(res, { token });
}

export function handleLogout(method, req, res, auth) {
  if (method !== "POST") return sendError(res, 405, "method-not-allowed");

  return handleLogoutPost(req, res, auth);
}

async function handleLogoutPost(req, res, auth) {
  const token = auth.extractToken(req);
  if (token) auth.destroySession(token);
  return sendOk(res);
}

export function handleMe(method, req, res, auth) {
  if (method !== "GET") return sendError(res, 405, "method-not-allowed");

  const token = auth.extractToken(req);
  if (!auth.validateToken(token)) {
    return sendError(res, 401, "unauthorized");
  }

  return sendOk(res, { authenticated: true });
}

export function handleSetup(method, req, res, auth) {
  if (method !== "POST") return sendError(res, 405, "method-not-allowed");

  return handleSetupPost(req, res, auth);
}

async function handleSetupPost(req, res, auth) {
  if (auth.hasPassword()) {
    return sendError(res, 409, "password-already-set");
  }

  const body = await readBody(req);
  const payload = parseJson(body);

  if (!payload || !payload.password || payload.password.length < 4) {
    return sendError(res, 400, "password-too-short");
  }

  auth.savePassword(payload.password);
  const token = auth.createSession(req.socket.remoteAddress);
  return sendOk(res, { token });
}
