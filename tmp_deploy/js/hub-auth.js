/* hub-auth.js — Authentification CURIOS Project Hub
 *
 * Login, logout, token management, role-based access.
 * Zero dependencies.
 */
(function () {
  "use strict";

  var TOKEN_KEY = "curios_hub_token";
  var USER_KEY = "curios_hub_user";
  var API = "/api/hub/auth";

  /* Utilisateur local par défaut : permet d'accéder au Hub sans backend.
     Si un compte réel existe (login/register via /api), il prend le dessus. */
  var LOCAL_USER = { name: "Organisateur local", email: "organisateur@curios.local", role: "ADMIN" };

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  }

  function setToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch {}
  }

  function clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  }

  function getUser() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return LOCAL_USER;
  }

  function setUser(user) {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch {}
  }

  function isAuthenticated() {
    return true;
  }

  function requireAuth() {
    if (!localStorage.getItem(USER_KEY)) setUser(LOCAL_USER);
    return true;
  }

  function hasRole(role) {
    var user = getUser();
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    return user.role === role;
  }

  function hasAnyRole(roles) {
    var user = getUser();
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    return roles.indexOf(user.role) !== -1;
  }

  function headers() {
    var token = getToken();
    return {
      "Content-Type": "application/json",
      Authorization: token ? "Bearer " + token : "",
    };
  }

  async function request(method, path, body) {
    var opts = { method: method, headers: headers() };
    if (body) opts.body = JSON.stringify(body);
    var res = await fetch(API + path, opts);
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || "request-failed");
    return data;
  }

  async function login(email, password) {
    var data = await request("POST", "/login", { email: email, password: password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    var data = await request("POST", "/register", {
      name: name,
      email: email,
      password: password,
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try { await request("POST", "/logout"); } catch {}
    clearToken();
    window.location.href = "login.html";
  }

  async function me() {
    var data = await request("GET", "/me");
    setUser(data.user);
    return data.user;
  }

  function getInitials(name) {
    if (!name) return "?";
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }

  window.HubAuth = {
    getToken: getToken,
    getUser: getUser,
    isAuthenticated: isAuthenticated,
    requireAuth: requireAuth,
    hasRole: hasRole,
    hasAnyRole: hasAnyRole,
    login: login,
    register: register,
    logout: logout,
    me: me,
    getInitials: getInitials,
  };
})();
