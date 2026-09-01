/* routes/hub-auth.js — Multi-user auth for CURIOS Project Hub
 *
 * Register, login, me, logout with roles.
 * PBKDF2 hashing, JSON file storage.
 * Zero dependencies — Node.js crypto only.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { sendJson, sendOk, sendError, readBody, parseJson } from "../http.js";
import { hashPassword, verifyPassword } from "../../../shared/src/password.js";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const ROLES = ["ADMIN", "PROJECT_MANAGER", "PEDAGOGICAL_EDITOR", "CONTENT_VALIDATOR", "FORMATOR", "OBSERVER", "CLIENT", "PLAYER"];

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function createHubAuth(root) {
  const usersFile = path.join(root, "data", "hub-users.json");
  const sessionsFile = path.join(root, "data", "hub-sessions.json");
  const state = { users: [], sessions: new Map() };

  function load() {
    try {
      if (fs.existsSync(usersFile)) {
        state.users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
      }
    } catch { state.users = []; }
    try {
      if (fs.existsSync(sessionsFile)) {
        const arr = JSON.parse(fs.readFileSync(sessionsFile, "utf8"));
        state.sessions = new Map(arr.map(s => [s.token, s]));
      }
    } catch { state.sessions = new Map(); }
  }

  function saveUsers() {
    const dir = path.dirname(usersFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(usersFile, JSON.stringify(state.users, null, 2), "utf8");
  }

  function saveSessions() {
    const dir = path.dirname(sessionsFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const arr = [];
    for (const [token, session] of state.sessions) {
      arr.push({ token, ...session });
    }
    fs.writeFileSync(sessionsFile, JSON.stringify(arr, null, 2), "utf8");
  }

  function findUserByEmail(email) {
    return state.users.find(u => u.email === email);
  }

  function findUserById(id) {
    return state.users.find(u => u.id === id);
  }

  function createUser(name, email, password) {
    const { hash, salt } = hashPassword(password);
    const isFirst = state.users.length === 0;
    const user = {
      id: "u" + Date.now(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      hash,
      salt,
      role: isFirst ? "ADMIN" : "CLIENT",
      created: Date.now(),
    };
    state.users.push(user);
    saveUsers();
    return user;
  }

  function createSession(userId, ip) {
    const token = generateToken();
    state.sessions.set(token, {
      userId,
      createdAt: Date.now(),
      ip: ip || "unknown",
    });
    saveSessions();
    return token;
  }

  function validateToken(token) {
    if (!token) return null;
    const session = state.sessions.get(token);
    if (!session) return null;
    if (Date.now() - session.createdAt > TOKEN_TTL_MS) {
      state.sessions.delete(token);
      saveSessions();
      return null;
    }
    return session;
  }

  function destroySession(token) {
    state.sessions.delete(token);
    saveSessions();
  }

  function extractToken(req) {
    const auth = req.headers["authorization"];
    if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
    return null;
  }

  function cleanupSessions() {
    const now = Date.now();
    for (const [token, session] of state.sessions) {
      if (now - session.createdAt > TOKEN_TTL_MS) {
        state.sessions.delete(token);
      }
    }
    saveSessions();
  }

  function requireAuth(req, res) {
    const token = extractToken(req);
    const session = validateToken(token);
    if (!session) return null;
    const user = findUserById(session.userId);
    if (!user) return null;
    return user;
  }

  load();

  return {
    state,
    findUserByEmail,
    findUserById,
    createUser,
    createSession,
    validateToken,
    destroySession,
    extractToken,
    requireAuth,
    cleanupSessions,
    saveUsers,
  };
}

/* ---- Route handlers ---- */

export function handleHubRegister(method, req, res, hubAuth) {
  if (method !== "POST") return sendError(res, 405, "method-not-allowed");
  return handleRegisterPost(req, res, hubAuth);
}

async function handleRegisterPost(req, res, hubAuth) {
  const body = await readBody(req);
  const p = parseJson(body);
  if (!p || !p.name || !p.email || !p.password) {
    return sendError(res, 400, "missing-fields");
  }
  if (p.password.length < 6) {
    return sendError(res, 400, "password-too-short");
  }
  if (hubAuth.findUserByEmail(p.email)) {
    return sendError(res, 409, "email-already-used");
  }
  const user = hubAuth.createUser(p.name, p.email, p.password);
  const token = hubAuth.createSession(user.id, req.socket.remoteAddress);
  return sendOk(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export function handleHubLogin(method, req, res, hubAuth) {
  if (method !== "POST") return sendError(res, 405, "method-not-allowed");
  return handleLoginPost(req, res, hubAuth);
}

async function handleLoginPost(req, res, hubAuth) {
  const body = await readBody(req);
  const p = parseJson(body);
  if (!p || !p.email || !p.password) {
    return sendError(res, 400, "missing-fields");
  }
  const user = hubAuth.findUserByEmail(p.email);
  if (!user || !verifyPassword(p.password, user.salt, user.hash)) {
    return sendError(res, 401, "invalid-credentials");
  }
  const token = hubAuth.createSession(user.id, req.socket.remoteAddress);
  return sendOk(res, {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export function handleHubMe(method, req, res, hubAuth) {
  if (method !== "GET") return sendError(res, 405, "method-not-allowed");
  const user = hubAuth.requireAuth(req, res);
  if (!user) return sendError(res, 401, "unauthorized");
  return sendOk(res, {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export function handleHubLogout(method, req, res, hubAuth) {
  if (method !== "POST") return sendError(res, 405, "method-not-allowed");
  const token = hubAuth.extractToken(req);
  if (token) hubAuth.destroySession(token);
  return sendOk(res);
}
