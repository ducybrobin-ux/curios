/* auth.js — Authentification session organisateur
 *
 * Modèle simple : mot de passe → token aléatoire.
 * Les participants n'ont pas besoin d'auth.
 *
 * Endpoints protégés (organisateur uniquement) :
 *   /api/editor, /api/editor/images, /api/editor/image, /api/editor/reset
 *   /api/qr/export
 *   /api/report
 *   /api/validations/remove, /api/validations/team
 *   /api/server-mode POST
 *   /api/wifi POST, /api/wifi/detect
 *   /api/map POST
 *   /api/board POST (message, challenge, clear, logout)
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { hashPassword, verifyPassword, timingSafeEqualString } from "../../shared/src/password.js";

const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h
const HASH_PREFIX = "pbkdf2$";

export function createAuth(root) {
  const configFile = path.join(root, "data", "auth.json");
  const state = {
    password: null, // hash PBKDF2 au format "pbkdf2$salt$hash" ou null
    legacyClear: null, // mot de passe en clair obsolète (migration)
    sessions: new Map(), // token → { createdAt, ip }
  };

  // Charger le mot de passe depuis la config (gère la migration clair → hash)
  function loadPassword() {
    try {
      if (fs.existsSync(configFile)) {
        const data = JSON.parse(fs.readFileSync(configFile, "utf8"));
        if (typeof data.hash === "string" && typeof data.salt === "string") {
          state.password = HASH_PREFIX + data.salt + "$" + data.hash;
        } else if (typeof data.password === "string") {
          // Ancien format en clair : on le conserve uniquement pour l'authentifier
          // puis on le rechiffrera dès le prochain login réussi.
          state.legacyClear = data.password;
        }
      }
    } catch {}
  }

  // Sauvegarder la config (toujours hachée, jamais en clair)
  function savePassword(password) {
    const { salt, hash } = hashPassword(password);
    state.password = HASH_PREFIX + salt + "$" + hash;
    state.legacyClear = null;
    const dir = path.dirname(configFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(configFile, JSON.stringify({ salt, hash }), "utf8");
  }

  // Contrôler si un mot de passe correspond ; rehache automatiquement un
  // mot de passe encore au format clair hérité dès qu'il est vérifié.
  function checkPassword(password) {
    if (state.password && state.password.startsWith(HASH_PREFIX)) {
      const body = state.password.slice(HASH_PREFIX.length);
      const sep = body.indexOf("$");
      const salt = body.slice(0, sep);
      const expected = body.slice(sep + 1);
      if (!verifyPassword(password, salt, expected)) return false;
      return true;
    }
    if (state.legacyClear != null) {
      const ok = timingSafeEqualString(String(password), state.legacyClear);
      if (ok) {
        // Migration : on déplace le clair vers un hash persistant.
        savePassword(password);
      }
      return ok;
    }
    return false;
  }

  // Générer un token aléatoire
  function generateToken() {
    return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
  }

  // Créer une session
  function createSession(ip) {
    const token = generateToken();
    state.sessions.set(token, {
      createdAt: Date.now(),
      ip: ip || "unknown",
    });
    return token;
  }

  // Valider un token
  function validateToken(token) {
    if (!token) return false;
    const session = state.sessions.get(token);
    if (!session) return false;

    // Vérifier l'expiration
    if (Date.now() - session.createdAt > TOKEN_EXPIRY_MS) {
      state.sessions.delete(token);
      return false;
    }

    return true;
  }

  // Supprimer une session (logout)
  function destroySession(token) {
    state.sessions.delete(token);
  }

  // Nettoyer les sessions expirées
  function cleanupSessions() {
    const now = Date.now();
    for (const [token, session] of state.sessions) {
      if (now - session.createdAt > TOKEN_EXPIRY_MS) {
        state.sessions.delete(token);
      }
    }
  }

  // Extraire le token de la requête
  function extractToken(req) {
    // Header Authorization: Bearer <token>
    const auth = req.headers["authorization"];
    if (auth && auth.startsWith("Bearer ")) {
      return auth.slice(7);
    }
    return null;
  }

  // Middleware de vérification
  function requireAuth(req, res) {
    const token = extractToken(req);
    if (!validateToken(token)) {
      return false;
    }
    return true;
  }

  // Un mot de passe est-il défini (hash ou ancien clair en migration) ?
  function hasPassword() {
    return !!(state.password && state.password.startsWith(HASH_PREFIX)) || state.legacyClear != null;
  }

  loadPassword();

  return {
    state,
    hasPassword,
    loadPassword,
    savePassword,
    checkPassword,
    createSession,
    validateToken,
    destroySession,
    cleanupSessions,
    extractToken,
    requireAuth,
  };
}
